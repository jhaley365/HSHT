import { notFound } from "next/navigation";
import { getStudentProfile, getStudentHistory } from "@/lib/student-detail-queries";

export const dynamic = "force-dynamic";

const GRID_COLS = "140px 1fr";

export default async function StudentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const history = await getStudentHistory(student.legacyId);

  return (
    <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div
        className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
        style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
      >
        <span>Date</span>
        <span>Event</span>
      </div>

      {history.length === 0 && (
        <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
          No history on record.
        </div>
      )}

      {history.map((entry) => (
        <div
          key={entry.id}
          className="grid items-center border-t px-5 py-3 text-[13px]"
          style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
        >
          <span style={{ color: "var(--muted)" }}>{entry.historyDate.toLocaleDateString()}</span>
          <span style={{ color: "var(--text)" }}>{entry.historyEvent}</span>
        </div>
      ))}
    </div>
  );
}
