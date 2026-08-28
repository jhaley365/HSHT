import Link from "next/link";
import {
  getSchoolsList,
  getCountyOptions,
  type SchoolStatusFilter,
  type SchoolSortKey,
  type SortDir,
} from "@/lib/schools-queries";
import { getDistrictOptions } from "@/lib/reports-queries";
import { DEFAULT_SORT, DEFAULT_DIR } from "@/lib/schools-url";
import { SchoolsPagination } from "@/components/schools/SchoolsPagination";
import { SchoolSortableHeader } from "@/components/schools/SchoolSortableHeader";
import { CountyDistrictFields } from "@/components/schools/CountyDistrictFields";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const GRID_COLS = "110px 1.4fr 140px 1.6fr 1fr";

function parseStatus(value: string | undefined): SchoolStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

function parseSort(value: string | undefined): SchoolSortKey {
  return value === "name" || value === "type" || value === "county" ? value : DEFAULT_SORT;
}

function parseDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : DEFAULT_DIR;
}

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; districtId?: string; county?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = parseStatus(params.status);
  const districtId = params.districtId ? Number(params.districtId) : undefined;
  const county = params.county || undefined;
  const sort = parseSort(params.sort);
  const dir = parseDir(params.dir);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [{ schools, total }, districts, counties] = await Promise.all([
    getSchoolsList({ q, status, districtId, county, sort, dir, page, pageSize: PAGE_SIZE }),
    getDistrictOptions(),
    getCountyOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <form className="flex flex-wrap items-end gap-3" action="/schools" method="get">
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Search by school name or county
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

          <CountyDistrictFields counties={counties} districts={districts} defaultCounty={county} defaultDistrictId={districtId} />

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
          <SchoolSortableHeader label="ID" sortKey="code" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} county={county} />
          <SchoolSortableHeader label="School" sortKey="name" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} county={county} />
          <SchoolSortableHeader label="Type" sortKey="type" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} county={county} />
          <span>Address</span>
          <SchoolSortableHeader label="County" sortKey="county" currentSort={sort} currentDir={dir} q={q} status={status} districtId={districtId} county={county} />
        </div>

        {schools.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No schools found.
          </div>
        )}

        {schools.map((school) => (
          <Link
            key={school.id}
            href={`/schools/${school.id}`}
            className="grid items-center border-t px-5 py-3 text-[13px] transition-colors hover:[background:var(--surface-2)]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>
              {school.district.code}-{school.schoolCode}
            </span>
            <span style={{ color: "var(--text)" }}>{school.name}</span>
            <span style={{ color: "var(--muted)" }}>{school.schoolType ?? "—"}</span>
            <span style={{ color: "var(--muted)" }}>{school.streetAddress}</span>
            <span style={{ color: "var(--text)" }}>{school.district.county}</span>
          </Link>
        ))}
      </div>

      <SchoolsPagination page={page} totalPages={totalPages} total={total} q={q} status={status} districtId={districtId} county={county} sort={sort} dir={dir} />
    </div>
  );
}
