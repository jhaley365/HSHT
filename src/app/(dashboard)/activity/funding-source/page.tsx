import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getVendorsList } from "@/lib/activity-queries";
import { createFundingSourceAction } from "@/lib/actions/activity-actions";

export const dynamic = "force-dynamic";

const GRID_COLS = "110px 1.4fr 1.4fr 160px 90px";

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

export default async function FundingSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const { error } = await searchParams;
  const vendors = await getVendorsList();

  return (
    <div className="flex flex-1 flex-col gap-5">
      {error && (
        <div
          className="rounded-[10px] border px-4 py-3 text-[13px]"
          style={{ borderColor: "#f87171", color: "#f87171", background: "rgba(248,113,113,0.08)" }}
        >
          {error}
        </div>
      )}

      {canManage && (
        <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
            Add Funding Source
          </div>
          <form action={createFundingSourceAction} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[100px]">
              <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
                Code
              </label>
              <input type="text" name="vendorCode" className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={inputStyle} />
            </div>
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
                Name
              </label>
              <input type="text" name="name" required className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={inputStyle} />
            </div>
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
                Address
              </label>
              <input type="text" name="address" className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={inputStyle} />
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
                Phone
              </label>
              <input type="text" name="phone" className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none" style={inputStyle} />
            </div>
            <button type="submit" className="rounded-[9px] px-5 py-2 text-[13px] font-bold text-white" style={{ background: "var(--positive)" }}>
              Add Funding Source
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-5 py-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Funding Source List
        </div>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>ID</span>
          <span>Name</span>
          <span>Address</span>
          <span>Phone</span>
          <span></span>
        </div>

        {vendors.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No funding sources yet.
          </div>
        )}

        {vendors.map((v) => (
          <div
            key={v.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--muted)" }}>{v.vendorCode ?? "—"}</span>
            <span style={{ color: "var(--text)" }}>{v.name}</span>
            <span style={{ color: "var(--muted)" }}>{v.address ?? "—"}</span>
            <span style={{ color: "var(--muted)" }}>{v.phone ?? "—"}</span>
            <Link
              href={`/activity/funding-source/${v.id}`}
              className="justify-self-end rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
