import { User, Activity as ActivityIcon, Building2, Network } from "lucide-react";
import type { Kpi } from "@/lib/dashboard-data";

const ICONS = {
  person: User,
  pulse: ActivityIcon,
  building: Building2,
  "org-tree": Network,
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = ICONS[kpi.icon];
  const positive = kpi.trend.direction === "up";

  return (
    <div
      className="rounded-[14px] border p-[18px] pb-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-[30px] font-extrabold leading-none tracking-[-0.02em]"
            style={{ color: "var(--heading)" }}
          >
            {kpi.value}
          </div>
          <div className="mt-[9px] text-[13.5px] font-bold" style={{ color: "var(--text)" }}>
            {kpi.label}
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
            {kpi.sublabel}
          </div>
        </div>
        <div
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px]"
          style={{ background: `var(--${kpi.color}s)`, color: `var(--${kpi.color})` }}
        >
          <Icon size={22} strokeWidth={1.9} />
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5">
        <span
          className="rounded-full px-2 py-[3px] text-[11.5px] font-extrabold"
          style={
            positive
              ? { color: "var(--positive)", background: "var(--positive-soft)" }
              : { color: "var(--muted)", background: "var(--surface-2)" }
          }
        >
          {positive ? "▲" : "—"} {kpi.trend.percent.toFixed(1)}%
        </span>
        <span className="text-[11.5px]" style={{ color: "var(--muted)" }}>
          {kpi.trend.caption}
        </span>
      </div>
    </div>
  );
}
