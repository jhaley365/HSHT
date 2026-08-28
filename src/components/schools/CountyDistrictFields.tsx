"use client";

import { useState } from "react";

type DistrictOption = { legacyId: number; name: string; county: string };

const selectStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

// Plain form fields (not auto-submitting) so they combine with the rest of
// the Schools search form via its existing "Find" button — but the
// District options still narrow live to the selected County, without a
// page round-trip, using ordinary client-side state. Same pattern as
// DistrictSchoolFields on the Students page.
export function CountyDistrictFields({
  counties,
  districts,
  defaultCounty,
  defaultDistrictId,
}: {
  counties: string[];
  districts: DistrictOption[];
  defaultCounty?: string;
  defaultDistrictId?: number;
}) {
  const initialCounty = defaultCounty ?? "";
  const [county, setCounty] = useState(initialCounty);
  const visibleDistricts = county ? districts.filter((d) => d.county === county) : districts;
  // Only honor the URL's districtId if County hasn't been changed since
  // page load — once the user picks a different County, a previously
  // selected District from a different county no longer applies.
  const districtDefaultValue = county === initialCounty && defaultDistrictId ? String(defaultDistrictId) : "";

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
          District
        </label>
        {/* key={county} remounts this select when County changes, resetting
            an out-of-scope District selection back to "All". */}
        <select
          key={county}
          name="districtId"
          defaultValue={districtDefaultValue}
          className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
          style={selectStyle}
        >
          <option value="">All</option>
          {visibleDistricts.map((d) => (
            <option key={d.legacyId} value={d.legacyId}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
