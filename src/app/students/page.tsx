import { getStudentsList, type StudentStatusFilter } from "@/lib/students-queries";
import { StudentsPagination } from "@/components/students/StudentsPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const GRID_COLS = "110px 1fr 1fr 1.4fr";

function parseStatus(value: string | undefined): StudentStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = parseStatus(params.status);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { students, total } = await getStudentsList({ q, status, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <form className="flex flex-wrap items-end gap-3" action="/students" method="get">
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
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Status
            </label>
            <select
              name="status"
              defaultValue={status}
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
          <span>Type</span>
          <span>First Name</span>
          <span>Last Name</span>
          <span>School</span>
        </div>

        {students.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No students found.
          </div>
        )}

        {students.map((student) => (
          <div
            key={student.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{student.reportableStudent ? "Reportable" : "HS/HT"}</span>
            <span style={{ color: "var(--text)" }}>{student.firstName}</span>
            <span style={{ color: "var(--text)" }}>{student.lastName}</span>
            <span style={{ color: "var(--text)" }}>{student.school.name}</span>
          </div>
        ))}
      </div>

      <StudentsPagination page={page} totalPages={totalPages} total={total} q={q} status={status} />
    </div>
  );
}
