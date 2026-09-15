import { requireUser } from "@/lib/authz";
import { getEnrollmentBySchool, type EnrollmentReportFilter } from "@/lib/legacy-reports-queries";
import { formatGrade } from "@/lib/legacy-codes";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { ReportTypeFilterBar } from "@/components/reports/ReportTypeFilterBar";
import { CollapseExpandControls } from "@/components/reports/CollapseExpandControls";

export const dynamic = "force-dynamic";

const BASE_PATH = "/reports/enrollment-by-school";

function parseReportFilter(value?: string): EnrollmentReportFilter {
  return value === "HSHT" || value === "Reportable" ? value : "All";
}

function xlsxHref(report: EnrollmentReportFilter) {
  return report === "All" ? `${BASE_PATH}/export` : `${BASE_PATH}/export?report=${report}`;
}

export default async function EnrollmentBySchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const report = parseReportFilter(params.report);

  const groups = await getEnrollmentBySchool(report);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Enrollment by School" xlsxHref={xlsxHref(report)} />

      <div className="print:hidden flex items-center justify-between">
        <ReportTypeFilterBar basePath={BASE_PATH} />
        <CollapseExpandControls containerId="report-tree" />
      </div>

      <div className="print:block hidden text-[13px] font-bold">Enrollment by School — {report}</div>

      <div id="report-tree" className="flex flex-col gap-3">
        {groups.length === 0 && (
          <div
            className="rounded-[14px] border px-5 py-10 text-center text-[13px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No enrolled students.
          </div>
        )}

        {groups.map((group) => (
          <details
            key={group.schoolId}
            className="rounded-[14px] border print:break-inside-avoid"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <summary className="cursor-pointer px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
              {group.students.length}{" "}
              <span className="font-normal" style={{ color: "var(--muted)" }}>
                — {group.districtCode}-{group.schoolCode} {group.schoolName} ({group.districtName}, {group.streetAddress}, {group.city})
              </span>
            </summary>

            <div className="flex flex-col border-t" style={{ borderColor: "var(--border)" }}>
              <div
                className="grid px-5 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
                style={{ gridTemplateColumns: "1.4fr 1fr 60px 80px", color: "var(--muted)" }}
              >
                <span>Student</span>
                <span>Grade</span>
                <span>VR</span>
                <span>PID</span>
              </div>
              {group.students.map((student) => (
                <div
                  key={student.legacyId}
                  className="grid items-center px-5 py-1.5 text-[12.5px]"
                  style={{ gridTemplateColumns: "1.4fr 1fr 60px 80px" }}
                >
                  <span style={{ color: "var(--text)" }}>
                    {student.lastName}, {student.firstName}{" "}
                    <span className="text-[11px] font-semibold" style={{ color: student.reportableStudent ? "var(--positive)" : "var(--accent)" }}>
                      {student.reportableStudent ? "●" : "○"}
                    </span>
                  </span>
                  <span style={{ color: "var(--muted)" }}>{formatGrade(student.grade)}</span>
                  <span style={{ color: "var(--muted)" }}>{student.vocationalRehab ? "YES" : ""}</span>
                  <span style={{ color: "var(--muted)" }}>{student.participationId ?? ""}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
