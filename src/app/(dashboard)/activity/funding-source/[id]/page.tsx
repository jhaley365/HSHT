import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getVendorById } from "@/lib/activity-queries";

export const dynamic = "force-dynamic";

const FIELD_STYLE = { color: "var(--muted)" } as const;

export default async function FundingSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const vendor = await getVendorById(id);
  if (!vendor) notFound();

  const rows: [string, string | null][] = [
    ["Code", vendor.vendorCode],
    ["Name", vendor.name],
    ["Address", vendor.address],
    ["City", vendor.city],
    ["State", vendor.state],
    ["Zip", vendor.zip],
    ["Phone", vendor.phone],
    ["Email", vendor.email],
    ["Contact", vendor.contact],
    ["Notes", vendor.notes],
  ];

  return (
    <div className="flex max-w-[560px] flex-1 flex-col gap-5">
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-4 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          {vendor.name}
        </div>
        <div className="flex flex-col gap-2.5 text-[13px]">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[110px_1fr]">
              <span style={FIELD_STYLE}>{label}</span>
              <span style={{ color: "var(--text)" }}>{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/activity/funding-source"
        className="w-fit rounded-[9px] px-5 py-2 text-[13px] font-bold"
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      >
        Back to list
      </Link>
    </div>
  );
}
