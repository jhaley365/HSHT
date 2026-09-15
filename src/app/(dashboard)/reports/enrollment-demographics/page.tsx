import { requireUser } from "@/lib/authz";
import { getEnrollmentDemographics } from "@/lib/legacy-reports-queries";
import { ReportToolbar } from "@/components/reports/ReportToolbar";

export const dynamic = "force-dynamic";

export default async function EnrollmentDemographicsPage() {
  await requireUser();
  const { schoolYear, rows } = await getEnrollmentDemographics();

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Enrollment Demographics" xlsxHref="/reports/enrollment-demographics/export" />

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
            <span style={{ color: "var(--muted)" }}>{row.amount}</span>
            <span style={{ color: "var(--muted)" }}>{row.percent === null ? "" : `${row.percent.toFixed(1)}%`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
