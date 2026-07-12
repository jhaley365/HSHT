import Link from "next/link";
import { buildStudentsHref } from "@/lib/students-url";
import type { StudentSortKey, SortDir, StudentStatusFilter } from "@/lib/students-queries";

export function StudentsPagination({
  page,
  totalPages,
  total,
  q,
  status,
  sort,
  dir,
}: {
  page: number;
  totalPages: number;
  total: number;
  q: string;
  status: StudentStatusFilter;
  sort: StudentSortKey;
  dir: SortDir;
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
      <span>
        {total} student{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-3">
        {page > 1 ? (
          <Link href={buildStudentsHref({ q, status, sort, dir, page: page - 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
            Previous
          </Link>
        ) : (
          <span className="opacity-40">Previous</span>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={buildStudentsHref({ q, status, sort, dir, page: page + 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
            Next
          </Link>
        ) : (
          <span className="opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}
