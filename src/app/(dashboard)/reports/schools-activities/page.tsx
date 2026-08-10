import { requireUser } from "@/lib/authz";
import { getSchoolsActivitiesReport } from "@/lib/reports-queries";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { CollapseExpandControls } from "@/components/reports/CollapseExpandControls";

export const dynamic = "force-dynamic";

export default async function SchoolsActivitiesReportPage() {
  await requireUser();
  const { schools, schoolYear } = await getSchoolsActivitiesReport();

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Schools — Activities Report" xlsxHref="/reports/schools-activities/export" />

      <div className="flex items-center justify-between">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {schoolYear ? `Showing the ${schoolYear.label} school year` : "No current school year on file"} — {schools.length} school
          {schools.length === 1 ? "" : "s"} with completed activities
        </div>
        <CollapseExpandControls containerId="report-tree" />
      </div>

      <div id="report-tree" className="flex flex-col gap-3">
        {schools.length === 0 && (
          <div
            className="rounded-[14px] border px-5 py-10 text-center text-[13px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No schools with completed activities for this school year.
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
                ({school.district.name}) — {school.activities.length} completed activit{school.activities.length === 1 ? "y" : "ies"}
              </span>
            </summary>

            <div className="flex flex-col gap-2 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
              {school.activities.map((activity) => (
                <details key={activity.id} open className="rounded-[10px] border ml-2 print:break-inside-avoid" style={{ borderColor: "var(--border)" }}>
                  <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-bold" style={{ color: "var(--text)" }}>
                    {activity.name}{" "}
                    <span className="font-normal" style={{ color: "var(--muted)" }}>
                      — {activity.activityDate ? activity.activityDate.toLocaleDateString() : "no date"} — {activity.studentActivities.length} student
                      {activity.studentActivities.length === 1 ? "" : "s"}
                    </span>
                  </summary>
                  <div className="border-t px-4 py-2" style={{ borderColor: "var(--border)" }}>
                    {activity.studentActivities.length === 0 && (
                      <div className="py-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
                        No students assigned.
                      </div>
                    )}
                    {activity.studentActivities.map((sa, i) => (
                      <div key={sa.id} className="flex items-center gap-3 py-1 text-[12.5px]">
                        <span className="w-6 text-right" style={{ color: "var(--muted)" }}>
                          {i + 1}.
                        </span>
                        <span style={{ color: "var(--text)" }}>
                          {sa.student.firstName} {sa.student.lastName}
                        </span>
                        <span style={{ color: "var(--muted)" }}>PID {sa.student.legacyId}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
