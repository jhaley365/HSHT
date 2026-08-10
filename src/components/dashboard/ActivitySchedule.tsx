import Link from "next/link";
import type { getUpcomingOpenActivities } from "@/lib/activity-queries";

type Activities = Awaited<ReturnType<typeof getUpcomingOpenActivities>>;

const GRID_COLS = "36px 92px 1.1fr 1.2fr 1.4fr 88px";

export function ActivitySchedule({ activities, schoolYearLabel }: { activities: Activities; schoolYearLabel: string | null }) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between px-[22px] pb-[14px] pt-[18px]">
        <div>
          <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
            Activity Schedule
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
            {schoolYearLabel ? `Upcoming open activities, ${schoolYearLabel} school year` : "Upcoming open activities"}
          </div>
        </div>
        <Link href="/activity/list" className="text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>
          View all
        </Link>
      </div>

      <div className="px-2 pb-2">
        <div
          className="grid px-3.5 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>#</span>
          <span>Date</span>
          <span>Activity</span>
          <span>School</span>
          <span>Description</span>
          <span className="text-right">Status</span>
        </div>

        {activities.length === 0 && (
          <div className="px-3.5 py-8 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No open activities scheduled.
          </div>
        )}

        {activities.map((activity, i) => (
          <Link
            key={activity.id}
            href={`/activity/${activity.id}`}
            className="grid items-center border-t px-3.5 py-[11px] text-[12.5px] transition-colors hover:[background:var(--surface-2)]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span className="font-bold" style={{ color: "var(--muted)" }}>
              {i + 1}
            </span>
            <span style={{ color: "var(--muted)" }}>
              {activity.activityDate?.toLocaleDateString(undefined, { month: "short", day: "2-digit" }) ?? "—"}
            </span>
            <span className="truncate font-bold" style={{ color: "var(--text)" }}>
              {activity.name}
            </span>
            <span className="truncate" style={{ color: "var(--text)" }}>
              {activity.school.name}
            </span>
            <span className="truncate" style={{ color: "var(--muted)" }}>
              {activity.description}
            </span>
            <span className="text-right">
              <span
                className="rounded-full px-[9px] py-[3px] text-[10.5px] font-extrabold"
                style={{ color: "var(--positive)", background: "var(--positive-soft)" }}
              >
                Open
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
