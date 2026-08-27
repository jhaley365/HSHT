import { requireUser } from "@/lib/authz";
import { getStudentsReport, getDistrictOptions } from "@/lib/reports-queries";
import { getSchoolOptions } from "@/lib/activity-queries";
import { isQuarter, type Quarter } from "@/lib/reports/quarters";
import { formatGrade, formatGender, GRADE_LABELS, GENDER_LABELS } from "@/lib/legacy-codes";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { StudentsFilterBar } from "@/components/reports/StudentsFilterBar";

export const dynamic = "force-dynamic";

const GRID_COLS = "50px 90px 1.3fr 1.3fr 1.3fr 130px 90px 110px";

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
  return qs ? `/reports/students/export?${qs}` : "/reports/students/export";
}

export default async function StudentsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string; schoolId?: string; districtId?: string; grade?: string; gender?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ students, schoolYear }, schools, districts] = await Promise.all([
    getStudentsReport(filters),
    getSchoolOptions(),
    getDistrictOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportToolbar title="Students Report" xlsxHref={xlsxHref(filters)} />

      <div className="print:hidden flex flex-col gap-3">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {schoolYear ? `Showing the ${schoolYear.label} school year` : "No current school year on file"}
        </div>
        <StudentsFilterBar schools={schools} districts={districts} gradeOptions={GRADE_OPTIONS} genderOptions={GENDER_OPTIONS} />
      </div>

      <div className="print:block hidden text-[13px] font-bold">
        Students Report — {schoolYear?.label ?? ""}
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
