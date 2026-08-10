"use client";

import { useState } from "react";

type RosterStudent = { legacyId: number; firstName: string | null; lastName: string | null; assigned: boolean };

export function StudentsAssignedChecklist({ students }: { students: RosterStudent[] }) {
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(students.filter((s) => s.assigned).map((s) => s.legacyId))
  );
  const allChecked = students.length > 0 && checked.size === students.length;

  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(students.map((s) => s.legacyId)));
  }

  function toggleOne(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className="flex items-center gap-2 border-b pb-2 text-[13px] font-bold"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      >
        <input type="checkbox" checked={allChecked} onChange={toggleAll} />
        Check All
      </label>
      <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pt-1">
        {students.map((s) => {
          const isChecked = checked.has(s.legacyId);
          return (
            <label
              key={s.legacyId}
              className="flex items-center gap-2 text-[13px]"
              style={{ color: isChecked ? "var(--positive)" : "var(--text)", fontWeight: isChecked ? 700 : 500 }}
            >
              <input type="checkbox" name="studentId" value={s.legacyId} checked={isChecked} onChange={() => toggleOne(s.legacyId)} />
              {s.lastName}, {s.firstName}
            </label>
          );
        })}
      </div>
    </div>
  );
}
