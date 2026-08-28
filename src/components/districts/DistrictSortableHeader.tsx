import Link from "next/link";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { buildDistrictsHref } from "@/lib/districts-url";
import type { DistrictSortKey, SortDir, DistrictStatusFilter } from "@/lib/districts-queries";

export function DistrictSortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  q,
  status,
  schoolId,
  county,
}: {
  label: string;
  sortKey: DistrictSortKey;
  currentSort: DistrictSortKey;
  currentDir: SortDir;
  q: string;
  status: DistrictStatusFilter;
  schoolId?: number;
  county?: string;
}) {
  const active = currentSort === sortKey;
  const nextDir: SortDir = active && currentDir === "asc" ? "desc" : "asc";
  const href = buildDistrictsHref({ q, status, schoolId, county, sort: sortKey, dir: nextDir, page: 1 });

  return (
    <Link
      href={href}
      className="flex items-center gap-1"
      style={{ color: active ? "var(--text)" : "var(--muted)" }}
    >
      {label}
      {active ? (
        currentDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ChevronsUpDown size={12} style={{ opacity: 0.5 }} />
      )}
    </Link>
  );
}
