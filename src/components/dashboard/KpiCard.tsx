import Link from "next/link";
import { Building2, Network, User } from "lucide-react";
import type { Kpi } from "@/lib/dashboard-data";

const ICONS = {
  building: Building2,
  "org-tree": Network,
  person: User,
};

// Ratio-style values (e.g. "2,286 / 3,412") can run much longer than a
// plain count ("1 / 1") — shrink the font as needed so the value always
// fits on one line and every card in the row stays the same height.
function valueFontSize(value: string): number {
  if (value.length > 13) return 19;
  if (value.length > 9) return 23;
  return 30;
}

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
            className="whitespace-nowrap font-extrabold leading-none tracking-[-0.02em]"
            style={{ color: "var(--heading)", fontSize: valueFontSize(kpi.value) }}
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
