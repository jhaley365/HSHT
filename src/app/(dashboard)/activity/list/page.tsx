import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getActivitiesList, type ActivityStatusFilter } from "@/lib/activity-queries";
import { buildActivityListHref, DEFAULT_STATUS } from "@/lib/activity-url";
import { deleteActivityAction } from "@/lib/actions/activity-actions";

export const dynamic = "force-dynamic";

const GRID_COLS = "70px 90px 90px 110px 1fr 1.3fr 150px";

function parseStatus(value: string | undefined): ActivityStatusFilter {
  return value === "closed" ? "closed" : DEFAULT_STATUS;
}

export default async function ActivityListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const params = await searchParams;
  const status = parseStatus(params.status);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { activities, total, pageSize, schoolYear } = await getActivitiesList({ status, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {status === "open" && schoolYear && `Showing the ${schoolYear.label} school year`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>
            Status:
          </span>
          <div
            className="flex items-center gap-1 rounded-[9px] border p-1"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            {(["open", "closed"] as const).map((option) => {
              const active = status === option;
              return (
                <Link
                  key={option}
                  href={buildActivityListHref({ status: option, page: 1 })}
                  className="rounded-[7px] px-[11px] py-[5px] text-[12.5px] capitalize"
                  style={{
                    fontWeight: active ? 700 : 600,
                    background: active ? "var(--surface)" : "transparent",
                    color: active ? "var(--text)" : "var(--muted)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,.16)" : "none",
                  }}
                >
                  {option}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Activity List
        </div>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>#</span>
          <span>ID</span>
          <span>Status</span>
          <span>Date</span>
          <span>Activity</span>
          <span>School</span>
          <span></span>
        </div>

        {activities.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No {status} activities.
          </div>
        )}

        {activities.map((a, i) => (
          <div
            key={a.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{(page - 1) * pageSize + i + 1}</span>
            <span style={{ color: "var(--muted)" }}>{a.legacyId}</span>
            <span className="flex items-center gap-1.5" style={{ color: a.closed ? "var(--muted)" : "var(--positive)" }}>
              <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: a.closed ? "var(--muted)" : "var(--positive)" }} />
              {a.closed ? "Closed" : "Open"}
            </span>
            <span style={{ color: "var(--muted)" }}>{a.activityDate ? a.activityDate.toLocaleDateString() : "—"}</span>
            <span style={{ color: "var(--text)" }}>{a.name}</span>
            <span style={{ color: "var(--muted)" }}>{a.school.name}</span>
            <div className="flex justify-end gap-2">
              <Link
                href={`/activity/${a.id}`}
                className="rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                View
              </Link>
              {canManage && (
                <form action={deleteActivityAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-white"
                    style={{ background: "#ef4444" }}
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
        <span>
          {total} activit{total === 1 ? "y" : "ies"}
        </span>
        <div className="flex items-center gap-3">
          {page > 1 ? (
            <Link href={buildActivityListHref({ status, page: page - 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
              Previous
            </Link>
          ) : (
            <span className="opacity-40">Previous</span>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildActivityListHref({ status, page: page + 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
              Next
            </Link>
          ) : (
            <span className="opacity-40">Next</span>
          )}
        </div>
      </div>
    </div>
  );
}
