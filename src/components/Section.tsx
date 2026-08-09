export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0" style={{ borderColor: "var(--border)" }}>
      <div className="mb-1 text-[13px] font-extrabold" style={{ color: "var(--heading)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
