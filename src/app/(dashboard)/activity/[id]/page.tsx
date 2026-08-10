import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getActivityById } from "@/lib/activity-queries";
import { deleteActivityAction } from "@/lib/actions/activity-actions";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const { id } = await params;
  const result = await getActivityById(id);
  if (!result) notFound();
  const { activity, coordinator, vendorNameByCode } = result;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[16px] font-extrabold" style={{ color: "var(--heading)" }}>
            {activity.name}
          </div>
          <span
            className="flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: activity.closed ? "var(--muted)" : "var(--positive)" }}
          >
            <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: activity.closed ? "var(--muted)" : "var(--positive)" }} />
            {activity.closed ? "Closed" : "Open"}
          </span>
        </div>
        <div className="text-[13px]" style={{ color: "var(--muted)" }}>
          {activity.description}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4 text-[13px]">
          <div>
            <div className="text-[11px] font-semibold uppercase" style={{ color: "var(--muted)" }}>
              ID
            </div>
            <div style={{ color: "var(--text)" }}>{activity.legacyId}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase" style={{ color: "var(--muted)" }}>
              Date
            </div>
            <div style={{ color: "var(--text)" }}>{activity.activityDate ? activity.activityDate.toLocaleDateString() : "—"}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase" style={{ color: "var(--muted)" }}>
              School
            </div>
            <div style={{ color: "var(--text)" }}>{activity.school.name}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase" style={{ color: "var(--muted)" }}>
              HSHT Coordinator
            </div>
            <div style={{ color: "var(--text)" }}>{coordinator ? `${coordinator.lastName}, ${coordinator.firstName}` : "—"}</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Activity Details
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

      <div className="flex items-center gap-3">
        <Link href="/activity/list" className="rounded-[9px] px-5 py-2 text-[13px] font-bold" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
          Back to list
        </Link>
        {canManage && !activity.deleted && (
          <form action={deleteActivityAction}>
            <input type="hidden" name="id" value={activity.id} />
            <button type="submit" className="rounded-[9px] px-5 py-2 text-[13px] font-bold text-white" style={{ background: "#ef4444" }}>
              Delete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
