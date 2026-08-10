import Link from "next/link";
import { Building2, Network, User } from "lucide-react";
import type { Kpi } from "@/lib/dashboard-data";

const ICONS = {
  building: Building2,
  "org-tree": Network,
  person: User,
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = ICONS[kpi.icon];

  return (
    <Link
      href={kpi.href}
      className="block rounded-[14px] border p-[18px] pb-4 transition-shadow hover:shadow-md"
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
    </Link>
  );
}
