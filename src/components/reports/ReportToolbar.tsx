import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

// Shared header for every report page: back to the Reports landing page,
// export controls (browser Print -> Save as PDF, and an XLSX download),
// hidden entirely when printing so only the report content shows.
export function ReportToolbar({ title, xlsxHref }: { title: string; xlsxHref: string }) {
  return (
    <div className="print:hidden flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          className="rounded-[9px] px-4 py-2 text-[13px] font-bold"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        >
          Back to Reports
        </Link>
        <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          {title}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={xlsxHref}
          download
          className="rounded-[9px] px-5 py-2 text-[13px] font-bold text-white"
          style={{ background: "var(--positive)" }}
        >
          Export XLSX
        </a>
        <PrintButton />
      </div>
    </div>
  );
}
