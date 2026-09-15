import Link from "next/link";
import { requireUser } from "@/lib/authz";

const REPORTS = [
  {
    href: "/reports/students",
    title: "Students",
    description: "Students enrolled in the current school year, with a Quarter filter. Exportable to PDF and XLSX.",
  },
  {
    href: "/reports/students-served",
    title: "Students Served",
    description: "Every student's participation in a completed activity this school year, with District/School/Grade/Gender filters.",
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

// Reports migrated from the legacy ColdFusion app's own Reports section —
// not tied to a Home dashboard KPI, and support browsing any past school
// year rather than just the current one.
const LEGACY_REPORTS = [
  {
    href: "/reports/activity-by-coordinator",
    title: "Activity Summary by Coordinator",
    description: "Each HSHT coordinator's activity, by school, with the number of students served — any school year, with a Quarter filter.",
  },
  {
    href: "/reports/activity-by-coordinator-details",
    title: "Activity Detail by Coordinator",
    description: "Each HSHT coordinator's activity, by school and individual activity item, with the number of students served — any school year, with a Quarter filter.",
  },
  {
    href: "/reports/activity-by-district-school",
    title: "Activity by District/School",
    description: "Every district's schools and their activity items, with the number of students served — any school year, with a Quarter filter.",
  },
  {
    href: "/reports/activity-by-district-school-details",
    title: "Activity by District/School (Details)",
    description: "Same as Activity by District/School, drilled down further into the names of participating students for each activity item.",
  },
  {
    href: "/reports/activity-by-preets",
    title: "Activity by PREETS",
    description: "Student participation grouped by PREETS category and activity item, with a District filter — any school year, with a Quarter filter.",
  },
];

export default async function ReportsPage() {
  await requireUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
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

      <div className="flex flex-col gap-5">
        <div className="text-[13px] font-extrabold" style={{ color: "var(--heading)" }}>
          Legacy Reports
        </div>

        <div className="grid grid-cols-2 gap-4">
          {LEGACY_REPORTS.map((report) => (
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
    </div>
  );
}
