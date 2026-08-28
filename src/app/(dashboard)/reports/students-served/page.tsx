import { requireUser } from "@/lib/authz";
import { getStudentsServedReport, getDistrictOptions } from "@/lib/reports-queries";
import { getSchoolOptions } from "@/lib/activity-queries";
import { isQuarter, type Quarter } from "@/lib/reports/quarters";
import { formatGrade, formatGender, GRADE_LABELS, GENDER_LABELS } from "@/lib/legacy-codes";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { StudentsFilterBar } from "@/components/reports/StudentsFilterBar";

export const dynamic = "force-dynamic";

const GRID_COLS = "50px 90px 1.2fr 1.2fr 1.2fr 120px 80px 1.3fr 110px";

const GRADE_OPTIONS = Object.entries(GRADE_LABELS) as [string, string][];
const GENDER_OPTIONS = Object.entries(GENDER_LABELS) as [string, string][];

type Filters = { quarter?: Quarter; schoolId?: number; districtId?: number; grade?: string; gender?: string };

function parseFilters(params: { quarter?: string; schoolId?: string; districtId?: string; grade?: string; gender?: string }): Filters {
  return {
    quarter: isQuarter(params.quarter) ? params.quarter : undefined,
    schoolId: params.schoolId ? Number(params.schoolId) : undefined,
    districtId: params.districtId ? Number(params.districtId) : undefined,
    grade: params.grade || undefined,
    gender: params.gender || undefined,
  };
}

function xlsxHref(filters: Filters) {
  const sp = new URLSearchParams();
  if (filters.quarter) sp.set("quarter", filters.quarter);
  if (filters.schoolId) sp.set("schoolId", String(filters.schoolId));
  if (filters.districtId) sp.set("districtId", String(filters.districtId));
  if (filters.grade) sp.set("grade", filters.grade);
  if (filters.gender) sp.set("gender", filters.gender);
  const qs = sp.toString();
  return qs ? `/reports/students-served/export?${qs}` : "/reports/students-served/export";
}

export default async function StudentsServedReportPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string; schoolId?: string; districtId?: string; grade?: string; gender?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ participations, schoolYear }, schools, districts] = await Promise.all([
    getStudentsServedReport(filters),
    getSchoolOptions(),
    getDistrictOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Students Served Report" xlsxHref={xlsxHref(filters)} />

      <div className="print:hidden flex flex-col gap-3">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {schoolYear ? `Showing the ${schoolYear.label} school year` : "No current school year on file"} — one row per
          activity a student participated in, so a student in multiple completed activities appears more than once.
        </div>
        <StudentsFilterBar
          schools={schools}
          districts={districts}
          gradeOptions={GRADE_OPTIONS}
          genderOptions={GENDER_OPTIONS}
          basePath="/reports/students-served"
        />
      </div>

      <div className="print:block hidden text-[13px] font-bold">
        Students Served Report — {schoolYear?.label ?? ""}
        {filters.quarter ? ` — ${filters.quarter}` : ""}
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
          <span>Activity</span>
          <span>Activity Date</span>
        </div>

        {participations.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No students found for this filter.
          </div>
        )}

        {participations.map((p, i) => (
          <div
            key={p.id}
            className="grid items-center border-t px-5 py-2.5 text-[13px] print:text-black"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{i + 1}</span>
            <span style={{ color: "var(--muted)" }}>{p.student.legacyId}</span>
            <span style={{ color: "var(--text)" }}>
              {p.student.firstName} {p.student.lastName}
            </span>
            <span style={{ color: "var(--muted)" }}>{p.student.school.name}</span>
            <span style={{ color: "var(--muted)" }}>{p.student.school.district.name}</span>
            <span style={{ color: "var(--muted)" }}>{formatGrade(p.student.grade)}</span>
            <span style={{ color: "var(--muted)" }}>{formatGender(p.student.gender)}</span>
            <span style={{ color: "var(--muted)" }}>{p.activity.name}</span>
            <span style={{ color: "var(--muted)" }}>{p.activity.activityDate ? p.activity.activityDate.toLocaleDateString() : "—"}</span>
          </div>
        ))}
      </div>

      <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
        {participations.length} student{participations.length === 1 ? "" : "s"} served
      </div>
    </div>
  );
}
