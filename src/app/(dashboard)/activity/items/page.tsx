import { requireUser } from "@/lib/authz";
import { getActivityItemsGrouped } from "@/lib/activity-queries";

export const dynamic = "force-dynamic";

const GRID_COLS = "1.2fr 1.6fr 220px";

export default async function ActivityItemsPage() {
  await requireUser();
  const groups = await getActivityItemsGrouped();

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Activity Items
        </div>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>Group</span>
          <span>Activity Item</span>
          <span>Billing Code</span>
        </div>

        {groups.flatMap((g) => g.items).map((item) => (
          <div
            key={item.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{item.group}</span>
            <span style={{ color: "var(--text)" }}>{item.description}</span>
            <span style={{ color: "var(--muted)" }}>{item.billingCode ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
