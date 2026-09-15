import { requireUser } from "@/lib/authz";
import { getEnrollmentDemographics, getSchoolYearOptions } from "@/lib/legacy-reports-queries";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { CoordinatorSummaryFilterBar } from "@/components/reports/CoordinatorSummaryFilterBar";

export const dynamic = "force-dynamic";

const BASE_PATH = "/reports/enrollment-demographics";

function xlsxHref(schoolYearId?: number, resolvedSchoolYearId?: number) {
  const id = schoolYearId ?? resolvedSchoolYearId;
  return id ? `${BASE_PATH}/export?schoolYearId=${id}` : `${BASE_PATH}/export`;
}

export default async function EnrollmentDemographicsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const schoolYearId = params.schoolYearId ? Number(params.schoolYearId) : undefined;

  const [{ schoolYear, rows }, schoolYears] = await Promise.all([
    getEnrollmentDemographics(schoolYearId),
    getSchoolYearOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Enrollment Demographics" xlsxHref={xlsxHref(schoolYearId, schoolYear?.legacyId)} />

      <div className="print:hidden flex items-center justify-between">
        <CoordinatorSummaryFilterBar schoolYears={schoolYears} currentSchoolYearId={schoolYear?.legacyId} basePath={BASE_PATH} hideQuarter />
      </div>

      <div className="text-[13px] font-bold">Enrollment Demographics — {schoolYear?.label ?? "current school year"}</div>

      <div className="rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: "1.6fr 100px 100px", color: "var(--muted)" }}
        >
          <span>Item</span>
          <span>Amount</span>
          <span>Percentage</span>
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid items-center border-t px-5 py-1.5 text-[12.5px]"
            style={{ gridTemplateColumns: "1.6fr 100px 100px", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text)" }}>{row.label}</span>
            <span style={{ color: row.unavailable ? "var(--muted)" : "var(--text)" }}>{row.unavailable ? "N/A" : row.amount}</span>
            <span style={{ color: "var(--muted)" }}>{row.unavailable || row.percent === null ? (row.unavailable ? "N/A" : "") : `${row.percent.toFixed(1)}%`}</span>
          </div>
        ))}
      </div>

      {rows.some((row) => row.unavailable) && (
        <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
          Rows marked N/A aren&apos;t tracked in the archived data for past school years.
        </div>
      )}
    </div>
  );
}
