import Link from "next/link";

function buildHref(params: { q: string; status: string; page: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/students?${qs}` : "/students";
}

export function StudentsPagination({
  page,
  totalPages,
  total,
  q,
  status,
}: {
  page: number;
  totalPages: number;
  total: number;
  q: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
      <span>
        {total} student{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-3">
        {page > 1 ? (
          <Link href={buildHref({ q, status, page: page - 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
            Previous
          </Link>
        ) : (
          <span className="opacity-40">Previous</span>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={buildHref({ q, status, page: page + 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
            Next
          </Link>
        ) : (
          <span className="opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}
