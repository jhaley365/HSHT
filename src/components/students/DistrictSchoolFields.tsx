"use client";

import { useState } from "react";

type SchoolOption = { legacyId: number; name: string; districtId: number };
type DistrictOption = { legacyId: number; name: string };

const selectStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

// Plain form fields (not auto-submitting) so they combine with the rest of
// the Students search form via its existing "Find" button — but the School
// options still narrow live to the selected District, without a page
// round-trip, using ordinary client-side state.
export function DistrictSchoolFields({
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
  // Only honor the URL's schoolId if the District hasn't been changed since
  // page load — once the user picks a different District, a previously
  // selected School (from a different district) no longer applies.
  const schoolDefaultValue = districtId === initialDistrictId && defaultSchoolId ? String(defaultSchoolId) : "";

  return (
    <>
      <div>
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
          District
        </label>
        <select
          name="districtId"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
          style={selectStyle}
        >
          <option value="">All</option>
          {districts.map((d) => (
            <option key={d.legacyId} value={d.legacyId}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
          School
        </label>
        {/* key={districtId} remounts this select when the District changes,
            resetting an out-of-scope School selection back to "All". */}
        <select
          key={districtId}
          name="schoolId"
          defaultValue={schoolDefaultValue}
          className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
          style={selectStyle}
        >
          <option value="">All</option>
          {visibleSchools.map((s) => (
            <option key={s.legacyId} value={s.legacyId}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
