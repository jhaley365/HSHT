import { requireUser } from "@/lib/authz";
import { getActivityByCoordinatorSummary, getSchoolYearOptions } from "@/lib/legacy-reports-queries";
import { isQuarter, type Quarter } from "@/lib/reports/quarters";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { CoordinatorSummaryFilterBar } from "@/components/reports/CoordinatorSummaryFilterBar";
import { CollapseExpandControls } from "@/components/reports/CollapseExpandControls";

export const dynamic = "force-dynamic";

const BASE_PATH = "/reports/activity-by-coordinator";

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

export default async function ActivityByCoordinatorSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; quarter?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ groups, schoolYear }, schoolYears] = await Promise.all([
    getActivityByCoordinatorSummary(filters),
    getSchoolYearOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Activity Summary by Coordinator" xlsxHref={xlsxHref(filters, schoolYear?.legacyId)} />

      <div className="print:hidden flex items-center justify-between">
        <CoordinatorSummaryFilterBar schoolYears={schoolYears} currentSchoolYearId={schoolYear?.legacyId} basePath={BASE_PATH} />
        <CollapseExpandControls containerId="report-tree" />
      </div>

      <div className="print:block hidden text-[13px] font-bold">
        Activity Summary by Coordinator — {schoolYear?.label ?? ""}
        {filters.quarter ? ` — ${filters.quarter}` : ""}
      </div>

      <div id="report-tree" className="flex flex-col gap-3">
        {groups.length === 0 && (
          <div
            className="rounded-[14px] border px-5 py-10 text-center text-[13px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No coordinator activity for this school year.
          </div>
        )}

        {groups.map((group) => (
          <details
            key={group.coordinatorId}
            className="rounded-[14px] border print:break-inside-avoid"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <summary className="cursor-pointer px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
              {group.coordinatorName}{" "}
              <span className="font-normal" style={{ color: "var(--muted)" }}>
                — {group.schools.length} school{group.schools.length === 1 ? "" : "s"}, {group.total} student{group.total === 1 ? "" : "s"} served
              </span>
            </summary>

            <div className="flex flex-col gap-2 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
              {group.schools.map((school) => (
                <details key={school.schoolId} className="rounded-[10px] border ml-2 print:break-inside-avoid" style={{ borderColor: "var(--border)" }}>
                  <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-bold" style={{ color: "var(--text)" }}>
                    {school.schoolName}
                  </summary>
                  <div className="border-t" style={{ borderColor: "var(--border)" }}>
                    <div
                      className="grid px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
                      style={{ gridTemplateColumns: "1.4fr 2fr 70px", color: "var(--muted)" }}
                    >
                      <span>Activity</span>
                      <span>Description</span>
                      <span>Qty</span>
                    </div>
                    {school.items.map((item, i) => (
                      <div
                        key={i}
                        className="grid items-center px-4 py-1.5 text-[12.5px]"
                        style={{ gridTemplateColumns: "1.4fr 2fr 70px" }}
                      >
                        <span style={{ color: "var(--text)" }}>{item.name}</span>
                        <span style={{ color: "var(--muted)" }}>{item.description || "—"}</span>
                        <span style={{ color: "var(--muted)" }}>{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}

              <div className="flex justify-end pt-1 pr-1 text-[12.5px] font-bold" style={{ color: "var(--heading)" }}>
                {group.coordinatorName} Total Activity Participation: {group.total}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
