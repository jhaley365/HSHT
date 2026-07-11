export function ComingSoon({ title }: { title: string }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[14px] border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
        {title}
      </div>
      <div className="text-[13px]" style={{ color: "var(--muted)" }}>
        This section is under construction.
      </div>
    </div>
  );
}
