import Link from "next/link";
import {
  getDistrictsList,
  type DistrictStatusFilter,
  type DistrictSortKey,
  type SortDir,
} from "@/lib/districts-queries";
import { getSchoolOptions } from "@/lib/activity-queries";
import { getCountyOptions } from "@/lib/schools-queries";
import { DEFAULT_SORT, DEFAULT_DIR } from "@/lib/districts-url";
import { DistrictsPagination } from "@/components/districts/DistrictsPagination";
import { DistrictSortableHeader } from "@/components/districts/DistrictSortableHeader";
import { CountySchoolFields } from "@/components/districts/CountySchoolFields";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const GRID_COLS = "110px 2fr 1.2fr";

function parseStatus(value: string | undefined): DistrictStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

function parseSort(value: string | undefined): DistrictSortKey {
  return value === "name" || value === "county" ? value : DEFAULT_SORT;
}

function parseDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : DEFAULT_DIR;
}

export default async function DistrictsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; schoolId?: string; county?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = parseStatus(params.status);
  const schoolId = params.schoolId ? Number(params.schoolId) : undefined;
  const county = params.county || undefined;
  const sort = parseSort(params.sort);
  const dir = parseDir(params.dir);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [{ districts, total }, schools, counties] = await Promise.all([
    getDistrictsList({ q, status, schoolId, county, sort, dir, page, pageSize: PAGE_SIZE }),
    getSchoolOptions(),
    getCountyOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <form className="flex flex-wrap items-end gap-3" action="/districts" method="get">
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Search by district name or county
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

          <CountySchoolFields counties={counties} schools={schools} defaultCounty={county} defaultSchoolId={schoolId} />

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
          <DistrictSortableHeader label="Code" sortKey="code" currentSort={sort} currentDir={dir} q={q} status={status} schoolId={schoolId} county={county} />
          <DistrictSortableHeader label="District" sortKey="name" currentSort={sort} currentDir={dir} q={q} status={status} schoolId={schoolId} county={county} />
          <DistrictSortableHeader label="County" sortKey="county" currentSort={sort} currentDir={dir} q={q} status={status} schoolId={schoolId} county={county} />
        </div>

        {districts.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No school districts found.
          </div>
        )}

        {districts.map((district) => (
          <Link
            key={district.id}
            href={`/districts/${district.id}`}
            className="grid items-center border-t px-5 py-3 text-[13px] transition-colors hover:[background:var(--surface-2)]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{district.code}</span>
            <span style={{ color: "var(--text)" }}>{district.name}</span>
            <span style={{ color: "var(--text)" }}>{district.county}</span>
          </Link>
        ))}
      </div>

      <DistrictsPagination page={page} totalPages={totalPages} total={total} q={q} status={status} schoolId={schoolId} county={county} sort={sort} dir={dir} />
    </div>
  );
}
