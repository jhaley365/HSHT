import NextAuth from "next-auth";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSessionUser;
  }
}

// Minimal re-declaration of next-auth's default session user shape, since
// we're augmenting rather than replacing it.
type DefaultSessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// next-auth's AdapterUser type doesn't know about our custom `role`/`active`
// columns; PrismaAdapter returns them at runtime (they're plain fields on
// the User model) but we have to assert the shape ourselves.
type AppAdapterUser = { id: string; role: UserRole; active: boolean };

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Self-hosted behind Caddy (not Vercel), so Auth.js can't infer a trusted
  // host from platform env vars — without this it rejects every request
  // with "UntrustedHost" (Caddy already terminates TLS and only forwards
  // traffic for HSHT_DOMAIN, so there's no untrusted-host risk here).
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
  },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 25),
        secure: false,
        // Auth.js's Nodemailer provider deep-merges this over a default
        // that includes `auth: { user: "", pass: "" }` — that object is
        // still truthy, so without this override nodemailer tries to
        // authenticate with blank credentials and fails with "Missing
        // credentials for PLAIN". `auth: false` is what actually disables
        // it (confirmed against the SMTP2GO no-auth relay in production).
        auth: false,
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return (user as unknown as AppAdapterUser).active !== false;
    },
    async session({ session, user }) {
      const appUser = user as unknown as AppAdapterUser;
      session.user.id = appUser.id;
      session.user.role = appUser.role;
      return session;
    },
  },
  events: {
    // Side-effect only — doesn't affect the sign-in decision (that's
    // callbacks.signIn above), so an audit-write failure here can never
    // lock someone out.
    async signIn({ user }) {
      const appUser = user as unknown as { id: string; email?: string | null; name?: string | null };
      await recordAuditEvent({
        actorId: appUser.id,
        actorEmail: appUser.email ?? null,
        actorName: appUser.name ?? null,
        action: "LOGIN",
        entityType: "User",
        entityId: appUser.id,
        summary: `${appUser.name || appUser.email} logged in`,
      });
    },
    async signOut(message) {
      // Database-strategy sessions report `{ session }` (the deleted
      // Session row, which only has userId) rather than `{ token }` — look
      // the user up for a readable summary.
      const userId = "session" in message ? message.session?.userId : undefined;
      if (!userId) return;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;
      await recordAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.name,
        action: "LOGOUT",
        entityType: "User",
        entityId: user.id,
        summary: `${user.name || user.email} logged out`,
      });
    },
  },
});
