import { notFound } from "next/navigation";
import { getStudentProfile, getStudentActivities } from "@/lib/student-detail-queries";

export const dynamic = "force-dynamic";

const GRID_COLS = "1.4fr 1fr 100px 100px";

export default async function StudentActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const activities = await getStudentActivities(student.legacyId);

  return (
    <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div
        className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
        style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
      >
        <span>Activity</span>
        <span>Date</span>
        <span>Billed</span>
        <span>Status</span>
      </div>

      {activities.length === 0 && (
        <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
          No activity participation on record.
        </div>
      )}

      {activities.map((sa) => (
        <div
          key={sa.id}
          className="grid items-center border-t px-5 py-3 text-[13px]"
          style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
        >
          <span style={{ color: "var(--text)" }}>{sa.activity.name}</span>
          <span style={{ color: "var(--muted)" }}>
            {sa.activity.activityDate ? sa.activity.activityDate.toLocaleDateString() : "—"}
          </span>
          <span style={{ color: "var(--muted)" }}>{sa.billed ? "Yes" : "No"}</span>
          <span style={{ color: sa.deleted ? "var(--muted)" : "var(--positive)" }}>
            {sa.deleted ? "Deleted" : "Active"}
          </span>
        </div>
      ))}
    </div>
  );
}
