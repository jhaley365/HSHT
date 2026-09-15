import { requireUser } from "@/lib/authz";
import { getStudentActivityParticipated, getSchoolYearOptions } from "@/lib/legacy-reports-queries";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { CoordinatorSummaryFilterBar } from "@/components/reports/CoordinatorSummaryFilterBar";

export const dynamic = "force-dynamic";

const BASE_PATH = "/reports/student-activity-participated";

function xlsxHref(schoolYearId?: number, resolvedSchoolYearId?: number) {
  const id = schoolYearId ?? resolvedSchoolYearId;
  return id ? `${BASE_PATH}/export?schoolYearId=${id}` : `${BASE_PATH}/export`;
}

export default async function StudentActivityParticipatedPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const schoolYearId = params.schoolYearId ? Number(params.schoolYearId) : undefined;

  const [{ rows, schoolYear }, schoolYears] = await Promise.all([
    getStudentActivityParticipated({ schoolYearId }),
    getSchoolYearOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Student Activity Participated" xlsxHref={xlsxHref(schoolYearId, schoolYear?.legacyId)} />

      <div className="print:hidden flex items-center justify-between">
        <CoordinatorSummaryFilterBar schoolYears={schoolYears} currentSchoolYearId={schoolYear?.legacyId} basePath={BASE_PATH} hideQuarter />
      </div>

      <div className="text-[13px] font-bold">
        Student Activity Participated — {schoolYear?.label ?? ""}
      </div>

      <div className="rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: "70px 1fr 1fr 1.4fr", color: "var(--muted)" }}
        >
          <span>ID</span>
          <span>Last Name</span>
          <span>First Name</span>
          <span>School</span>
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No students participated in an activity this school year.
          </div>
        )}
        {rows.map((row) => (
          <div
            key={row.studentLegacyId}
            className="grid items-center border-t px-5 py-1.5 text-[12.5px]"
            style={{ gridTemplateColumns: "70px 1fr 1fr 1.4fr", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{row.studentLegacyId}</span>
            <span style={{ color: "var(--text)" }}>{row.lastName}</span>
            <span style={{ color: "var(--text)" }}>{row.firstName}</span>
            <span style={{ color: "var(--muted)" }}>
              {row.schoolName} ({row.schoolId})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
