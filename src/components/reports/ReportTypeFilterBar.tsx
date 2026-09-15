"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "All", label: "All" },
  { value: "HSHT", label: "HSHT" },
  { value: "Reportable", label: "Reportable" },
];

export function ReportTypeFilterBar({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const report = searchParams.get("report") ?? "All";

  function navigate(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === "All") sp.delete("report");
    else sp.set("report", value);
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="print:hidden flex items-center gap-2">
      <span className="text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>
        Report:
      </span>
      <select
        value={report}
        onChange={(e) => navigate(e.target.value)}
        className="rounded-[9px] border px-3 py-[7px] text-[12.5px] outline-none"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
