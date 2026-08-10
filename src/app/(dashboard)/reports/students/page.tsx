import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getStudentsReport } from "@/lib/reports-queries";
import { QUARTERS, QUARTER_LABELS, isQuarter, type Quarter } from "@/lib/reports/quarters";
import { formatGrade, formatGender } from "@/lib/legacy-codes";
import { ReportToolbar } from "@/components/reports/ReportToolbar";

export const dynamic = "force-dynamic";

const GRID_COLS = "50px 90px 1.3fr 1.3fr 1.3fr 130px 90px 110px";

function buildHref(quarter?: Quarter) {
  return quarter ? `/reports/students?quarter=${quarter}` : "/reports/students";
}

export default async function StudentsReportPage({ searchParams }: { searchParams: Promise<{ quarter?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const quarter = isQuarter(params.quarter) ? params.quarter : undefined;
  const { students, schoolYear } = await getStudentsReport(quarter);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Students Report" xlsxHref={`/reports/students/export${quarter ? `?quarter=${quarter}` : ""}`} />

      <div className="print:hidden flex items-center justify-between">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {schoolYear ? `Showing the ${schoolYear.label} school year` : "No current school year on file"}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>
            Quarter:
          </span>
          <div className="flex items-center gap-1 rounded-[9px] border p-1" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <Link
              href={buildHref()}
              className="rounded-[7px] px-[11px] py-[5px] text-[12.5px]"
              style={{
                fontWeight: !quarter ? 700 : 600,
                background: !quarter ? "var(--surface)" : "transparent",
                color: !quarter ? "var(--text)" : "var(--muted)",
                boxShadow: !quarter ? "0 1px 3px rgba(0,0,0,.16)" : "none",
              }}
            >
              All
            </Link>
            {QUARTERS.map((q) => {
              const active = quarter === q;
              return (
                <Link
                  key={q}
                  href={buildHref(q)}
                  className="rounded-[7px] px-[11px] py-[5px] text-[12.5px]"
                  title={QUARTER_LABELS[q]}
                  style={{
                    fontWeight: active ? 700 : 600,
                    background: active ? "var(--surface)" : "transparent",
                    color: active ? "var(--text)" : "var(--muted)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,.16)" : "none",
                  }}
                >
                  {q}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="print:block hidden text-[13px] font-bold">
        Students Report — {schoolYear?.label ?? ""}
        {quarter ? ` — ${QUARTER_LABELS[quarter]}` : ""}
      </div>

      <div className="overflow-hidden rounded-[14px] border print:border-0 print:rounded-none" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em] print:text-black"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>#</span>
          <span>PID</span>
          <span>Name</span>
          <span>School</span>
          <span>District</span>
          <span>Grade</span>
          <span>Gender</span>
          <span>Enroll Date</span>
        </div>

        {students.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No students found for this filter.
          </div>
        )}

        {students.map((s, i) => (
          <div
            key={s.id}
            className="grid items-center border-t px-5 py-2.5 text-[13px] print:text-black"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{i + 1}</span>
            <span style={{ color: "var(--muted)" }}>{s.legacyId}</span>
            <span style={{ color: "var(--text)" }}>
              {s.firstName} {s.lastName}
            </span>
            <span style={{ color: "var(--muted)" }}>{s.school.name}</span>
            <span style={{ color: "var(--muted)" }}>{s.school.district.name}</span>
            <span style={{ color: "var(--muted)" }}>{formatGrade(s.grade)}</span>
            <span style={{ color: "var(--muted)" }}>{formatGender(s.gender)}</span>
            <span style={{ color: "var(--muted)" }}>{s.enrollDate ? s.enrollDate.toLocaleDateString() : "—"}</span>
          </div>
        ))}
      </div>

      <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
        {students.length} student{students.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
