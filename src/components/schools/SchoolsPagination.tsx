import Link from "next/link";
import { buildSchoolsHref } from "@/lib/schools-url";
import type { SchoolSortKey, SortDir, SchoolStatusFilter } from "@/lib/schools-queries";

export function SchoolsPagination({
  page,
  totalPages,
  total,
  q,
  status,
  districtId,
  county,
  sort,
  dir,
}: {
  page: number;
  totalPages: number;
  total: number;
  q: string;
  status: SchoolStatusFilter;
  districtId?: number;
  county?: string;
  sort: SchoolSortKey;
  dir: SortDir;
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
      <span>
        {total} school{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-3">
        {page > 1 ? (
          <Link
            href={buildSchoolsHref({ q, status, districtId, county, sort, dir, page: page - 1 })}
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
            href={buildSchoolsHref({ q, status, districtId, county, sort, dir, page: page + 1 })}
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
