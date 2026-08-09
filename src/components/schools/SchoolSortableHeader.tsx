import Link from "next/link";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { buildSchoolsHref } from "@/lib/schools-url";
import type { SchoolSortKey, SortDir, SchoolStatusFilter } from "@/lib/schools-queries";

export function SchoolSortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  q,
  status,
}: {
  label: string;
  sortKey: SchoolSortKey;
  currentSort: SchoolSortKey;
  currentDir: SortDir;
  q: string;
  status: SchoolStatusFilter;
}) {
  const active = currentSort === sortKey;
  const nextDir: SortDir = active && currentDir === "asc" ? "desc" : "asc";
  const href = buildSchoolsHref({ q, status, sort: sortKey, dir: nextDir, page: 1 });

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
