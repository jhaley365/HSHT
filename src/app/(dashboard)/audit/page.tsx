import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { getAuditEventsList, type AuditActionFilter } from "@/lib/audit-queries";
import { buildAuditListHref, DEFAULT_AUDIT_ACTION } from "@/lib/audit-url";

export const dynamic = "force-dynamic";

const GRID_COLS = "150px 1fr 90px 2fr";

const ACTION_FILTERS: AuditActionFilter[] = ["ALL", "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE"];

const ACTION_LABEL: Record<AuditActionFilter, string> = {
  ALL: "All",
  LOGIN: "Login",
  LOGOUT: "Logout",
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
};

const ACTION_COLOR: Record<string, string> = {
  LOGIN: "var(--positive)",
  LOGOUT: "var(--muted)",
  CREATE: "var(--positive)",
  UPDATE: "var(--c2)",
  DELETE: "#ef4444",
};

function parseAction(value: string | undefined): AuditActionFilter {
  return (ACTION_FILTERS as string[]).includes(value ?? "") ? (value as AuditActionFilter) : DEFAULT_AUDIT_ACTION;
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const action = parseAction(params.action);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { events, total, pageSize } = await getAuditEventsList({ action, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          A record of logins and key changes made by users — new activity going forward only.
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>
            Action:
          </span>
          <div
            className="flex items-center gap-1 rounded-[9px] border p-1"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            {ACTION_FILTERS.map((option) => {
              const active = action === option;
              return (
                <Link
                  key={option}
                  href={buildAuditListHref({ action: option, page: 1 })}
                  className="rounded-[7px] px-[11px] py-[5px] text-[12.5px]"
                  style={{
                    fontWeight: active ? 700 : 600,
                    background: active ? "var(--surface)" : "transparent",
                    color: active ? "var(--text)" : "var(--muted)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,.16)" : "none",
                  }}
                >
                  {ACTION_LABEL[option]}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Audit Log
        </div>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>Date/Time</span>
          <span>Actor</span>
          <span>Action</span>
          <span>Summary</span>
        </div>

        {events.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No audit events yet.
          </div>
        )}

        {events.map((e) => (
          <div
            key={e.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{formatDateTime(e.createdAt)}</span>
            <span style={{ color: "var(--text)" }}>{e.actorName || e.actorEmail || "System"}</span>
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: ACTION_COLOR[e.action] }}>
              <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: ACTION_COLOR[e.action] }} />
              {ACTION_LABEL[e.action]}
            </span>
            <span style={{ color: "var(--muted)" }}>{e.summary}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
        <span>
          {total} event{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-3">
          {page > 1 ? (
            <Link href={buildAuditListHref({ action, page: page - 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
              Previous
            </Link>
          ) : (
            <span className="opacity-40">Previous</span>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildAuditListHref({ action, page: page + 1 })} className="font-bold" style={{ color: "var(--accent)" }}>
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
