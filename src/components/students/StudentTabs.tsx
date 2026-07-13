"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Information", segment: "" },
  { label: "Activity", segment: "/activity" },
  { label: "Equipment", segment: "/equipment" },
  { label: "Outcome", segment: "/outcome" },
  { label: "History", segment: "/history" },
];

export function StudentTabs({ studentId }: { studentId: string }) {
  const pathname = usePathname();
  const base = `/students/${studentId}`;

  return (
    <div
      className="flex w-fit items-center gap-1 rounded-[11px] border p-1"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      {TABS.map((tab) => {
        const href = `${base}${tab.segment}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className="rounded-[8px] px-4 py-2 text-[13px] transition-colors"
            style={{
              fontWeight: active ? 700 : 600,
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--text)" : "var(--muted)",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,.16)" : "none",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
