export default function VerifyRequestPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--app-bg)" }}
    >
      <div
        className="w-full max-w-[400px] rounded-[16px] border p-8 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h1 className="text-[19px] font-extrabold" style={{ color: "var(--heading)" }}>
          Check your email
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
          We sent a sign-in link to your email address. Open it on this device to finish signing in.
        </p>
      </div>
    </div>
  );
}
