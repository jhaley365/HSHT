import Link from "next/link";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { buildStudentsHref } from "@/lib/students-url";
import type { StudentSortKey, SortDir, StudentStatusFilter } from "@/lib/students-queries";

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  q,
  status,
}: {
  label: string;
  sortKey: StudentSortKey;
  currentSort: StudentSortKey;
  currentDir: SortDir;
  q: string;
  status: StudentStatusFilter;
}) {
  const active = currentSort === sortKey;
  const nextDir: SortDir = active && currentDir === "asc" ? "desc" : "asc";
  const href = buildStudentsHref({ q, status, sort: sortKey, dir: nextDir, page: 1 });

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
