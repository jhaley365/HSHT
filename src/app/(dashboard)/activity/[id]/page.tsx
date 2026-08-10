import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getActivityById, getSchoolRosterWithAssignment } from "@/lib/activity-queries";
import { deleteActivityAction, toggleActivityClosedAction, saveAssignedStudentsAction } from "@/lib/actions/activity-actions";
import { StudentsAssignedChecklist } from "@/components/activity/StudentsAssignedChecklist";

export const dynamic = "force-dynamic";

const actionButtonStyle = { color: "white" } as const;

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const { id } = await params;
  const result = await getActivityById(id);
  if (!result) notFound();
  const { activity, coordinator, vendorNameByCode } = result;
  const roster = await getSchoolRosterWithAssignment(activity.legacyId, activity.schoolId);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/activity/${activity.id}/edit`} className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold" style={{ ...actionButtonStyle, background: "#f59e0b" }}>
            Edit Activity
          </Link>
          <Link href={`/activity/${activity.id}/sign-in-sheet`} className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold" style={{ ...actionButtonStyle, background: "#22c55e" }}>
            Sign In Sheet
          </Link>
          <form action={toggleActivityClosedAction}>
            <input type="hidden" name="id" value={activity.id} />
            <button type="submit" className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold" style={{ ...actionButtonStyle, background: "#2563eb" }}>
              {activity.closed ? "Reopen Activity" : "Close Activity"}
            </button>
          </form>
          {!activity.deleted && (
            <form action={deleteActivityAction}>
              <input type="hidden" name="id" value={activity.id} />
              <button type="submit" className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold" style={{ ...actionButtonStyle, background: "#ef4444" }}>
                Delete Activity
              </button>
            </form>
          )}
        </div>
      )}

      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-4 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Activity Information
        </div>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-[13px]">
          <Row label="ID" value={String(activity.legacyId)} />
          <Row
            label="Status"
            value={
              <span className="flex items-center gap-1.5" style={{ color: activity.closed ? "var(--muted)" : "var(--positive)" }}>
                <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: activity.closed ? "var(--muted)" : "var(--positive)" }} />
                {activity.closed ? "Closed" : "Open"}
              </span>
            }
          />
          <Row label="PRE-ETS" value={activity.preets ?? "—"} />
          <Row label="Name" value={activity.name} />
          <Row label="Description" value={activity.description ?? "—"} />
          <Row label="Scheduled Date" value={activity.activityDate ? activity.activityDate.toLocaleDateString() : "—"} />
          <Row label="School" value={activity.school.name} />
          <Row label="HSHT Coordinator" value={coordinator ? `${coordinator.firstName} ${coordinator.lastName}` : "—"} />
          <Row
            label="Billing Status"
            value={
              <span className="flex items-center gap-1.5" style={{ color: activity.billed ? "var(--positive)" : "var(--muted)" }}>
                <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: activity.billed ? "var(--positive)" : "var(--muted)" }} />
                {activity.billed ? "Complete" : "Incomplete"}
              </span>
            }
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Details
        </div>
        {activity.details.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No checklist items recorded for this activity.
          </div>
        )}
        {activity.details.map((d) => (
          <div key={d.id} className="grid grid-cols-[1fr_100px_180px] items-center gap-4 border-t px-5 py-3 text-[13px]" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text)" }}>{d.description}</span>
            <span style={{ color: "var(--muted)" }}>{d.hsht ? "HS/HT" : "Other"}</span>
            <span style={{ color: "var(--muted)" }}>
              {d.other && d.otherDetail ? vendorNameByCode.get(d.otherDetail) ?? d.otherDetail : d.hshtCoordinator ?? "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Students Assigned
        </div>
        {roster.length === 0 && (
          <div className="py-6 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No active students at this school.
          </div>
        )}
        {roster.length > 0 &&
          (canManage ? (
            <form action={saveAssignedStudentsAction} className="flex flex-col gap-4">
              <input type="hidden" name="activityDbId" value={activity.id} />
              <StudentsAssignedChecklist students={roster} />
              <button type="submit" className="w-fit rounded-[9px] px-6 py-2 text-[13px] font-bold text-white" style={{ background: "var(--positive)" }}>
                Submit
              </button>
            </form>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto">
              {roster.map((s) => (
                <div
                  key={s.legacyId}
                  className="text-[13px]"
                  style={{ color: s.assigned ? "var(--positive)" : "var(--muted)", fontWeight: s.assigned ? 700 : 500 }}
                >
                  {s.lastName}, {s.firstName}
                </div>
              ))}
            </div>
          ))}
      </div>

      <Link href="/activity/list" className="w-fit rounded-[9px] px-5 py-2 text-[13px] font-bold" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
        Back to list
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr]">
      <span className="font-semibold" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}
