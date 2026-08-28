"use client";

import { useState } from "react";

type SchoolOption = { legacyId: number; name: string; district: { county: string } };

const selectStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

// Plain form fields (not auto-submitting) so they combine with the rest of
// the School Districts search form via its existing "Find" button — but
// the School options still narrow live to the selected County, without a
// page round-trip. Same pattern as CountyDistrictFields on the Schools page.
export function CountySchoolFields({
  counties,
  schools,
  defaultCounty,
  defaultSchoolId,
}: {
  counties: string[];
  schools: SchoolOption[];
  defaultCounty?: string;
  defaultSchoolId?: number;
}) {
  const initialCounty = defaultCounty ?? "";
  const [county, setCounty] = useState(initialCounty);
  const visibleSchools = county ? schools.filter((s) => s.district.county === county) : schools;
  // Only honor the URL's schoolId if County hasn't been changed since page
  // load — once the user picks a different County, a previously selected
  // School from a different county no longer applies.
  const schoolDefaultValue = county === initialCounty && defaultSchoolId ? String(defaultSchoolId) : "";

  return (
    <>
      <div>
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
          County
        </label>
        <select
          name="county"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
          style={selectStyle}
        >
          <option value="">All</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
          School
        </label>
        {/* key={county} remounts this select when County changes, resetting
            an out-of-scope School selection back to "All". */}
        <select
          key={county}
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
