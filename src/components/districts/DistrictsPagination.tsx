import Link from "next/link";
import { buildDistrictsHref } from "@/lib/districts-url";
import type { DistrictSortKey, SortDir, DistrictStatusFilter } from "@/lib/districts-queries";

export function DistrictsPagination({
  page,
  totalPages,
  total,
  q,
  status,
  schoolId,
  county,
  sort,
  dir,
}: {
  page: number;
  totalPages: number;
  total: number;
  q: string;
  status: DistrictStatusFilter;
  schoolId?: number;
  county?: string;
  sort: DistrictSortKey;
  dir: SortDir;
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
      <span>
        {total} district{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-3">
        {page > 1 ? (
          <Link
            href={buildDistrictsHref({ q, status, schoolId, county, sort, dir, page: page - 1 })}
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Previous
          </Link>
        ) : (
          <span className="opacity-40">Previous</span>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildDistrictsHref({ q, status, schoolId, county, sort, dir, page: page + 1 })}
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Next
          </Link>
        ) : (
          <span className="opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}
