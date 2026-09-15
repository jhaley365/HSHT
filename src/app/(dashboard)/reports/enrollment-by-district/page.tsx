import { requireUser } from "@/lib/authz";
import { getEnrollmentByDistrict } from "@/lib/legacy-reports-queries";
import { formatGrade } from "@/lib/legacy-codes";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { CollapseExpandControls } from "@/components/reports/CollapseExpandControls";

export const dynamic = "force-dynamic";

export default async function EnrollmentByDistrictPage() {
  await requireUser();
  const groups = await getEnrollmentByDistrict();

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Enrollment by District" xlsxHref="/reports/enrollment-by-district/export" />

      <div className="print:hidden flex items-center justify-end">
        <CollapseExpandControls containerId="report-tree" />
      </div>

      <div className="print:block hidden text-[13px] font-bold">Enrollment by District</div>

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
            key={group.districtId}
            className="rounded-[14px] border print:break-inside-avoid"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <summary className="cursor-pointer px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
              {group.total}{" "}
              <span className="font-normal" style={{ color: "var(--muted)" }}>
                — {group.districtName} ({group.county} County)
              </span>
            </summary>

            <div className="flex flex-col gap-2 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
              {group.schools.map((school) => (
                <details key={school.schoolId} className="rounded-[10px] border ml-2 print:break-inside-avoid" style={{ borderColor: "var(--border)" }}>
                  <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-bold" style={{ color: "var(--text)" }}>
                    {school.schoolName} <span className="font-normal" style={{ color: "var(--muted)" }}>— {school.students.length} students</span>
                  </summary>
                  <div className="border-t" style={{ borderColor: "var(--border)" }}>
                    <div
                      className="grid px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
                      style={{ gridTemplateColumns: "1.4fr 1fr 60px", color: "var(--muted)" }}
                    >
                      <span>Student</span>
                      <span>Grade</span>
                      <span>VR</span>
                    </div>
                    {school.students.map((student) => (
                      <div
                        key={student.legacyId}
                        className="grid items-center px-4 py-1.5 text-[12.5px]"
                        style={{ gridTemplateColumns: "1.4fr 1fr 60px" }}
                      >
                        <span style={{ color: "var(--text)" }}>
                          {student.lastName}, {student.firstName}{" "}
                          <span className="text-[11px] font-semibold" style={{ color: student.reportableStudent ? "var(--positive)" : "var(--accent)" }}>
                            {student.reportableStudent ? "●" : "○"}
                          </span>
                        </span>
                        <span style={{ color: "var(--muted)" }}>{formatGrade(student.grade)}</span>
                        <span style={{ color: "var(--muted)" }}>{student.vocationalRehab ? "YES" : ""}</span>
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
