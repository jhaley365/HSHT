import { requireUser } from "@/lib/authz";
import { getSchoolsEnrollmentReport } from "@/lib/reports-queries";
import { ReportToolbar } from "@/components/reports/ReportToolbar";

export const dynamic = "force-dynamic";

export default async function SchoolsEnrollmentReportPage() {
  await requireUser();
  const { schools, schoolYear } = await getSchoolsEnrollmentReport();

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Schools — Enrollment Report" xlsxHref="/reports/schools-enrollment/export" />

      <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
        {schoolYear ? `Showing the ${schoolYear.label} school year` : "No current school year on file"} — {schools.length} school
        {schools.length === 1 ? "" : "s"} with enrolled students
      </div>

      <div className="flex flex-col gap-3">
        {schools.length === 0 && (
          <div
            className="rounded-[14px] border px-5 py-10 text-center text-[13px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No schools with enrolled students for this school year.
          </div>
        )}

        {schools.map((school) => (
          <details
            key={school.id}
            open
            className="rounded-[14px] border print:break-inside-avoid"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <summary className="cursor-pointer px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
              {school.name}{" "}
              <span className="font-normal" style={{ color: "var(--muted)" }}>
                ({school.district.name}) — {school.students.length} student{school.students.length === 1 ? "" : "s"}
              </span>
            </summary>
            <div className="border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
              {school.students.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-1 text-[12.5px]">
                  <span className="w-6 text-right" style={{ color: "var(--muted)" }}>
                    {i + 1}.
                  </span>
                  <span style={{ color: "var(--text)" }}>
                    {s.firstName} {s.lastName}
                  </span>
                  <span style={{ color: "var(--muted)" }}>PID {s.legacyId}</span>
                  <span style={{ color: "var(--muted)" }}>{s.enrollDate ? s.enrollDate.toLocaleDateString() : "—"}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
