import { requireUser } from "@/lib/authz";
import { getEnrollmentByDistrictSchool, getSchoolYearOptions } from "@/lib/legacy-reports-queries";
import { isQuarter, type Quarter } from "@/lib/reports/quarters";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { CoordinatorSummaryFilterBar } from "@/components/reports/CoordinatorSummaryFilterBar";
import { CollapseExpandControls } from "@/components/reports/CollapseExpandControls";

export const dynamic = "force-dynamic";

const BASE_PATH = "/reports/enrollment-by-district-school";

type Filters = { schoolYearId?: number; quarter?: Quarter };

function parseFilters(params: { schoolYearId?: string; quarter?: string }): Filters {
  return {
    schoolYearId: params.schoolYearId ? Number(params.schoolYearId) : undefined,
    quarter: isQuarter(params.quarter) ? params.quarter : undefined,
  };
}

function xlsxHref(filters: Filters, resolvedSchoolYearId?: number) {
  const sp = new URLSearchParams();
  const schoolYearId = filters.schoolYearId ?? resolvedSchoolYearId;
  if (schoolYearId) sp.set("schoolYearId", String(schoolYearId));
  if (filters.quarter) sp.set("quarter", filters.quarter);
  const qs = sp.toString();
  return qs ? `${BASE_PATH}/export?${qs}` : `${BASE_PATH}/export`;
}

export default async function EnrollmentByDistrictSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; quarter?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ groups, schoolYear }, schoolYears] = await Promise.all([
    getEnrollmentByDistrictSchool(filters),
    getSchoolYearOptions(),
  ]);

  const grandTotal = groups.reduce((sum, group) => sum + group.total, 0);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Enrollment by District/School" xlsxHref={xlsxHref(filters, schoolYear?.legacyId)} />

      <div className="print:hidden flex items-center justify-between">
        <CoordinatorSummaryFilterBar schoolYears={schoolYears} currentSchoolYearId={schoolYear?.legacyId} basePath={BASE_PATH} />
        <CollapseExpandControls containerId="report-tree" />
      </div>

      <div className="print:block hidden text-[13px] font-bold">
        Enrollment by District/School — {schoolYear?.label ?? ""}
        {filters.quarter ? ` — ${filters.quarter}` : ""}
      </div>

      <div id="report-tree" className="flex flex-col gap-3">
        {groups.length === 0 && (
          <div
            className="rounded-[14px] border px-5 py-10 text-center text-[13px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No enrolled students for this school year.
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
                — {group.districtName} ({group.schools.length} school{group.schools.length === 1 ? "" : "s"})
              </span>
            </summary>
            <div className="border-t" style={{ borderColor: "var(--border)" }}>
              {group.schools.map((school) => (
                <div key={school.schoolId} className="grid items-center px-5 py-1.5 text-[12.5px]" style={{ gridTemplateColumns: "1fr 70px" }}>
                  <span style={{ color: "var(--text)" }}>{school.schoolName}</span>
                  <span style={{ color: "var(--muted)" }}>{school.total}</span>
                </div>
              ))}
              <div className="flex justify-end px-5 py-2 text-[12.5px] font-bold" style={{ color: "var(--heading)" }}>
                {group.districtName} Total Enrolled: {group.total}
              </div>
            </div>
          </details>
        ))}

        {groups.length > 0 && (
          <div
            className="flex justify-between rounded-[14px] border px-5 py-3 text-[13px] font-extrabold"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--heading)" }}
          >
            <span>Grand Total</span>
            <span>{grandTotal}</span>
          </div>
        )}
      </div>
    </div>
  );
}
