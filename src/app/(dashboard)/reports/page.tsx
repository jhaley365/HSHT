import Link from "next/link";
import { requireUser } from "@/lib/authz";

const REPORTS = [
  {
    href: "/reports/students",
    title: "Students",
    description: "Students enrolled in the current school year, with a Quarter filter. Exportable to PDF and XLSX.",
  },
  {
    href: "/reports/districts-enrollment",
    title: "Districts — Enrollment",
    description: "Districts with enrolled students, drilled down into their schools and students.",
  },
  {
    href: "/reports/schools-enrollment",
    title: "Schools — Enrollment",
    description: "Schools with enrolled students, drilled down into their students.",
  },
  {
    href: "/reports/districts-activities",
    title: "Districts — Activities",
    description: "Districts with completed activities, drilled down into each activity's school and assigned students.",
  },
  {
    href: "/reports/schools-activities",
    title: "Schools — Activities",
    description: "Schools with completed activities, drilled down into each activity's assigned students.",
  },
];

export default async function ReportsPage() {
  await requireUser();

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
        Reports based on the Home dashboard KPI cards. Each report can be exported to PDF (via Print) or XLSX.
      </div>

      <div className="grid grid-cols-2 gap-4">
        {REPORTS.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="rounded-[14px] border p-5 transition-colors"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-[14.5px] font-extrabold" style={{ color: "var(--heading)" }}>
              {report.title}
            </div>
            <div className="mt-1.5 text-[12.5px]" style={{ color: "var(--muted)" }}>
              {report.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
