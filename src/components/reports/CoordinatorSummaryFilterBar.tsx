"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { QUARTERS, QUARTER_LABELS, type Quarter } from "@/lib/reports/quarters";

type SchoolYearOption = { legacyId: number; label: string };

const selectStyle = {
  background: "var(--surface)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

export function CoordinatorSummaryFilterBar({
  schoolYears,
  currentSchoolYearId,
  basePath,
  hideQuarter,
}: {
  schoolYears: SchoolYearOption[];
  currentSchoolYearId?: number;
  basePath: string;
  hideQuarter?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const quarter = searchParams.get("quarter") ?? "";
  const schoolYearId = searchParams.get("schoolYearId") ?? (currentSchoolYearId ? String(currentSchoolYearId) : "");

  function navigate(overrides: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>
        School Year:
      </span>
      <select
        value={schoolYearId}
        onChange={(e) => navigate({ schoolYearId: e.target.value })}
        className="rounded-[9px] border px-3 py-[7px] text-[12.5px] outline-none"
        style={selectStyle}
      >
        {schoolYears.map((sy) => (
          <option key={sy.legacyId} value={sy.legacyId}>
            {sy.label}
          </option>
        ))}
      </select>

      {!hideQuarter && (
        <div className="ml-2 flex items-center gap-1 rounded-[9px] border p-1" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => navigate({ quarter: "" })}
            className="rounded-[7px] px-[11px] py-[5px] text-[12.5px]"
            style={{
              fontWeight: !quarter ? 700 : 600,
              background: !quarter ? "var(--surface)" : "transparent",
              color: !quarter ? "var(--text)" : "var(--muted)",
              boxShadow: !quarter ? "0 1px 3px rgba(0,0,0,.16)" : "none",
            }}
          >
            All
          </button>
          {QUARTERS.map((q: Quarter) => {
            const active = quarter === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => navigate({ quarter: q })}
                className="rounded-[7px] px-[11px] py-[5px] text-[12.5px]"
                title={QUARTER_LABELS[q]}
                style={{
                  fontWeight: active ? 700 : 600,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--text)" : "var(--muted)",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,.16)" : "none",
                }}
              >
                {q}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
