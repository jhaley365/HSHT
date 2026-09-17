import Link from "next/link";
import { requireUser } from "@/lib/authz";
import {
  getStudentsList,
  type StudentStatusFilter,
  type StudentSortKey,
  type SortDir,
} from "@/lib/students-queries";
import { getDistrictOptions } from "@/lib/reports-queries";
import { getSchoolOptions } from "@/lib/activity-queries";
import { GRADE_LABELS, GENDER_LABELS } from "@/lib/legacy-codes";
import { DEFAULT_SORT, DEFAULT_DIR } from "@/lib/students-url";
import { StudentsPagination } from "@/components/students/StudentsPagination";
import { SortableHeader } from "@/components/students/SortableHeader";
import { DistrictSchoolFields } from "@/components/students/DistrictSchoolFields";
import type { Program } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const GRID_COLS = "110px 90px 1fr 1fr 1.4fr";

const GRADE_OPTIONS = Object.entries(GRADE_LABELS) as [string, string][];
const GENDER_OPTIONS = Object.entries(GENDER_LABELS) as [string, string][];
const PROGRAM_OPTIONS: Program[] = ["HSHT", "YTEP"];

const selectStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

function parseStatus(value: string | undefined): StudentStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

function parseSort(value: string | undefined): StudentSortKey {
  return value === "type" || value === "firstName" || value === "school" ? value : DEFAULT_SORT;
}

function parseProgram(value: string | undefined): Program | undefined {
  return value === "HSHT" || value === "YTEP" ? value : undefined;
}

function parseDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : DEFAULT_DIR;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    districtId?: string;
    schoolId?: string;
    grade?: string;
    gender?: string;
    program?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";

  const params = await searchParams;
  const q = params.q ?? "";
  const status = parseStatus(params.status);
  const districtId = params.districtId ? Number(params.districtId) : undefined;
  const schoolId = params.schoolId ? Number(params.schoolId) : undefined;
  const grade = params.grade && GRADE_LABELS[params.grade] ? params.grade : undefined;
  const gender = params.gender && GENDER_LABELS[params.gender] ? params.gender : undefined;
  const program = parseProgram(params.program);
  const sort = parseSort(params.sort);
  const dir = parseDir(params.dir);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [{ students, total }, districts, schools] = await Promise.all([
    getStudentsList({ q, status, districtId, schoolId, grade, gender, program, sort, dir, page, pageSize: PAGE_SIZE }),
    getDistrictOptions(),
    getSchoolOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-1 flex-col gap-5">
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/students/new?program=HSHT"
            className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            New HS/HT Student
          </Link>
          <Link
            href="/students/new?program=YTEP"
            className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            New YTEP Student
          </Link>
        </div>
      )}

      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <form className="flex flex-wrap items-end gap-3" action="/students" method="get">
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Search by name or school
            </label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Enter search term"
              className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={selectStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Status
            </label>
            <select name="status" defaultValue={status} className="rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={selectStyle}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <DistrictSchoolFields districts={districts} schools={schools} defaultDistrictId={districtId} defaultSchoolId={schoolId} />

          <div>
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Grade
            </label>
            <select name="grade" defaultValue={grade ?? ""} className="rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={selectStyle}>
              <option value="">All</option>
              {GRADE_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Gender
            </label>
            <select name="gender" defaultValue={gender ?? ""} className="rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={selectStyle}>
              <option value="">All</option>
              {GENDER_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Program
            </label>
            <select name="program" defaultValue={program ?? ""} className="rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={selectStyle}>
              <option value="">All</option>
              {PROGRAM_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-[9px] px-5 py-2 text-[13px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            Find
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <SortableHeader label="Type" sortKey="type" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} schoolId={schoolId} grade={grade} gender={gender} program={program} />
          <span>Program</span>
          <SortableHeader label="First Name" sortKey="firstName" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} schoolId={schoolId} grade={grade} gender={gender} program={program} />
          <SortableHeader label="Last Name" sortKey="lastName" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} schoolId={schoolId} grade={grade} gender={gender} program={program} />
          <SortableHeader label="School" sortKey="school" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} schoolId={schoolId} grade={grade} gender={gender} program={program} />
        </div>

        {students.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No students found.
          </div>
        )}

        {students.map((student) => (
          <Link
            key={student.id}
            href={`/students/${student.id}`}
            className="grid items-center border-t px-5 py-3 text-[13px] transition-colors hover:[background:var(--surface-2)]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{student.reportableStudent ? "Reportable" : "HS/HT"}</span>
            <span style={{ color: student.program === "YTEP" ? "var(--accent)" : "var(--muted)" }}>{student.program}</span>
            <span style={{ color: "var(--text)" }}>{student.firstName}</span>
            <span style={{ color: "var(--text)" }}>{student.lastName}</span>
            <span style={{ color: "var(--text)" }}>{student.school.name}</span>
          </Link>
        ))}
      </div>

      <StudentsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        q={q}
        status={status}
        districtId={districtId}
        schoolId={schoolId}
        grade={grade}
        gender={gender}
        program={program}
        sort={sort}
        dir={dir}
      />
    </div>
  );
}
