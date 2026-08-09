import { signIn } from "@/auth";
import { AuthError } from "next-auth";

async function sendMagicLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  try {
    await signIn("email", { email, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error("Couldn't send the sign-in link. Check the email address and try again.");
    }
    throw error;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--app-bg)" }}
    >
      <div
        className="w-full max-w-[400px] rounded-[16px] border p-8"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-[9px] text-[13px] font-extrabold text-white"
          style={{ background: "var(--primary)" }}
        >
          H
        </div>
        <h1 className="mt-4 text-[19px] font-extrabold" style={{ color: "var(--heading)" }}>
          Sign in to HSHT
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          Enter your email and we&apos;ll send you a sign-in link.
        </p>

        <form action={sendMagicLink} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Email address
            </span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="you@haley365.com"
              className="h-[42px] rounded-[9px] border px-3 text-[14px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </label>
          <button
            type="submit"
            className="mt-1 h-[42px] rounded-[10px] text-[14px] font-bold text-white transition-[filter] hover:brightness-110"
            style={{ background: "var(--primary)" }}
          >
            Send sign-in link
          </button>
        </form>
      </div>
    </div>
  );
}
