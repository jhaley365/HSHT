import { requireUser } from "@/lib/authz";
import { getActivityByPreets, getSchoolYearOptions } from "@/lib/legacy-reports-queries";
import { getDistrictOptions } from "@/lib/reports-queries";
import { isQuarter, type Quarter } from "@/lib/reports/quarters";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { PreetsFilterBar } from "@/components/reports/PreetsFilterBar";
import { CollapseExpandControls } from "@/components/reports/CollapseExpandControls";

export const dynamic = "force-dynamic";

const BASE_PATH = "/reports/activity-by-preets";

type Filters = { schoolYearId?: number; quarter?: Quarter; districtId?: number };

function parseFilters(params: { schoolYearId?: string; quarter?: string; districtId?: string }): Filters {
  return {
    schoolYearId: params.schoolYearId ? Number(params.schoolYearId) : undefined,
    quarter: isQuarter(params.quarter) ? params.quarter : undefined,
    districtId: params.districtId ? Number(params.districtId) : undefined,
  };
}

function xlsxHref(filters: Filters, resolvedSchoolYearId?: number) {
  const sp = new URLSearchParams();
  const schoolYearId = filters.schoolYearId ?? resolvedSchoolYearId;
  if (schoolYearId) sp.set("schoolYearId", String(schoolYearId));
  if (filters.quarter) sp.set("quarter", filters.quarter);
  if (filters.districtId) sp.set("districtId", String(filters.districtId));
  const qs = sp.toString();
  return qs ? `${BASE_PATH}/export?${qs}` : `${BASE_PATH}/export`;
}

export default async function ActivityByPreetsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; quarter?: string; districtId?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ groups, otherItems, otherTotal, grandTotal, schoolYear }, schoolYears, districts] = await Promise.all([
    getActivityByPreets(filters),
    getSchoolYearOptions(),
    getDistrictOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Activity by PREETS" xlsxHref={xlsxHref(filters, schoolYear?.legacyId)} />

      <div className="print:hidden flex items-center justify-between">
        <PreetsFilterBar schoolYears={schoolYears} districts={districts} currentSchoolYearId={schoolYear?.legacyId} basePath={BASE_PATH} />
        <CollapseExpandControls containerId="report-tree" />
      </div>

      <div className="print:block hidden text-[13px] font-bold">
        Activity by PREETS — {schoolYear?.label ?? ""}
        {filters.quarter ? ` — ${filters.quarter}` : ""}
      </div>

      <div id="report-tree" className="flex flex-col gap-3">
        {groups.length === 0 && otherTotal === 0 && (
          <div
            className="rounded-[14px] border px-5 py-10 text-center text-[13px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No PREETS activity for this school year.
          </div>
        )}

        {groups.map((group) => (
          <details
            key={group.group}
            className="rounded-[14px] border print:break-inside-avoid"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <summary className="cursor-pointer px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
              {group.group} <span className="font-normal" style={{ color: "var(--muted)" }}>— {group.qty} students</span>
            </summary>
            <div className="flex flex-col border-t" style={{ borderColor: "var(--border)" }}>
              {group.items.map((item, i) => (
                <div key={i} className="grid items-center px-5 py-1.5 text-[12.5px]" style={{ gridTemplateColumns: "1fr 70px" }}>
                  <span style={{ color: "var(--text)" }}>{item.description}</span>
                  <span style={{ color: "var(--muted)" }}>{item.qty}</span>
                </div>
              ))}
            </div>
          </details>
        ))}

        {otherTotal > 0 && (
          <details className="rounded-[14px] border print:break-inside-avoid" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <summary className="cursor-pointer px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
              (F) Other <span className="font-normal" style={{ color: "var(--muted)" }}>— {otherTotal} students</span>
            </summary>
            <div className="flex flex-col border-t" style={{ borderColor: "var(--border)" }}>
              {otherItems.map((item, i) => (
                <div key={i} className="grid items-center px-5 py-1.5 text-[12.5px]" style={{ gridTemplateColumns: "1fr 70px" }}>
                  <span style={{ color: "var(--text)" }}>{item.label}</span>
                  <span style={{ color: "var(--muted)" }}>{item.qty}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <div
          className="flex justify-between rounded-[14px] border px-5 py-3 text-[13px] font-extrabold"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--heading)" }}
        >
          <span>Grand Total</span>
          <span>{grandTotal}</span>
        </div>
      </div>
    </div>
  );
}
