import NextAuth from "next-auth";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
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
});
