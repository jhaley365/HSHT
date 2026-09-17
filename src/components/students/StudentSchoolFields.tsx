"use client";

import { useState } from "react";

type SchoolOption = { legacyId: number; name: string; districtId: number };
type DistrictOption = { legacyId: number; name: string };

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

// Required District→School pair for the student create/edit form — unlike
// StudentsPagination's DistrictSchoolFields (a search filter with "All"
// options), a student must belong to exactly one School.
export function StudentSchoolFields({
  districts,
  schools,
  defaultDistrictId,
  defaultSchoolId,
}: {
  districts: DistrictOption[];
  schools: SchoolOption[];
  defaultDistrictId?: number;
  defaultSchoolId?: number;
}) {
  const initialDistrictId = defaultDistrictId ? String(defaultDistrictId) : "";
  const [districtId, setDistrictId] = useState(initialDistrictId);
  const visibleSchools = districtId ? schools.filter((s) => String(s.districtId) === districtId) : schools;
  const schoolDefaultValue = districtId === initialDistrictId && defaultSchoolId ? String(defaultSchoolId) : "";

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
          District
        </span>
        <select
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
          style={inputStyle}
        >
          <option value="">Select a district</option>
          {districts.map((d) => (
            <option key={d.legacyId} value={d.legacyId}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
          School
        </span>
        {/* key={districtId} remounts this select when the District changes,
            resetting an out-of-scope School selection. */}
        <select
          key={districtId}
          name="schoolId"
          required
          defaultValue={schoolDefaultValue}
          className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
          style={inputStyle}
        >
          <option value="" disabled>
            Select a school
          </option>
          {visibleSchools.map((s) => (
            <option key={s.legacyId} value={s.legacyId}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
