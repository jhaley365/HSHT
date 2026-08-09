export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="grid items-center gap-6 border-t py-2 text-[13px] first:border-t-0"
      style={{ gridTemplateColumns: "260px 1fr", borderColor: "var(--border)" }}
    >
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}
