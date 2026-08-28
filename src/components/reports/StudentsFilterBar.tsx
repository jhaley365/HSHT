"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { QUARTERS, QUARTER_LABELS, type Quarter } from "@/lib/reports/quarters";

type SchoolOption = { legacyId: number; name: string; districtId: number };
type DistrictOption = { legacyId: number; name: string };

const selectStyle = {
  background: "var(--surface)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

export function StudentsFilterBar({
  schools,
  districts,
  gradeOptions,
  genderOptions,
  basePath = "/reports/students",
}: {
  schools: SchoolOption[];
  districts: DistrictOption[];
  gradeOptions: [string, string][];
  genderOptions: [string, string][];
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const quarter = searchParams.get("quarter") ?? "";
  const districtId = searchParams.get("districtId") ?? "";
  const schoolId = searchParams.get("schoolId") ?? "";
  const grade = searchParams.get("grade") ?? "";
  const gender = searchParams.get("gender") ?? "";

  function navigate(overrides: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  // Scope the School dropdown to the selected District, if any, and clear
  // a previously-selected School that no longer belongs to it.
  const visibleSchools = districtId ? schools.filter((s) => String(s.districtId) === districtId) : schools;

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-[9px] border p-1" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
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

      <select
        value={districtId}
        onChange={(e) => navigate({ districtId: e.target.value, schoolId: "" })}
        className="rounded-[9px] border px-3 py-[7px] text-[12.5px] outline-none"
        style={selectStyle}
      >
        <option value="">All Districts</option>
        {districts.map((d) => (
          <option key={d.legacyId} value={d.legacyId}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={schoolId}
        onChange={(e) => navigate({ schoolId: e.target.value })}
        className="rounded-[9px] border px-3 py-[7px] text-[12.5px] outline-none"
        style={selectStyle}
      >
        <option value="">All Schools</option>
        {visibleSchools.map((s) => (
          <option key={s.legacyId} value={s.legacyId}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={grade}
        onChange={(e) => navigate({ grade: e.target.value })}
        className="rounded-[9px] border px-3 py-[7px] text-[12.5px] outline-none"
        style={selectStyle}
      >
        <option value="">All Grades</option>
        {gradeOptions.map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={gender}
        onChange={(e) => navigate({ gender: e.target.value })}
        className="rounded-[9px] border px-3 py-[7px] text-[12.5px] outline-none"
        style={selectStyle}
      >
        <option value="">All Genders</option>
        {genderOptions.map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
