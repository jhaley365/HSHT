import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/authz";
import { getStudentProfile } from "@/lib/student-detail-queries";
import { createStudentEquipmentAction } from "@/lib/actions/student-equipment-actions";

export const dynamic = "force-dynamic";

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

// Fixed set recovered from the legacy "New Equipment" dropdown — the source
// database has no lookup table for this (see legacy-codes.ts for the same
// pattern with Grade/Race/etc).
const EQUIPMENT_TYPES = ["Personal Computer", "Tablet Computer"];

export default async function NewStudentEquipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const student = await getStudentProfile(id);
  if (!student) notFound();

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

      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-4 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          New Equipment
        </div>

        <form action={createStudentEquipmentAction} className="flex flex-col gap-4">
          <input type="hidden" name="studentDbId" value={id} />
          <input type="hidden" name="studentId" value={student.legacyId} />

          <label className="flex max-w-[320px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Equipment Type
            </span>
            <select name="equipmentType" required className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="flex max-w-[320px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Model Number
            </span>
            <input type="text" name="modelNumber" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex max-w-[320px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Serial Number
            </span>
            <input type="text" name="serialNumber" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex max-w-[320px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Date Issued
            </span>
            <input type="date" name="dateIssued" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex max-w-[320px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Assistive Technology
            </span>
            <input type="text" name="assistiveTechnology" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <div className="flex items-center gap-3">
            <Link
              href={`/students/${id}/equipment`}
              className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white"
              style={{ background: "#f59e0b" }}
            >
              Cancel
            </Link>
            <button type="submit" className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--positive)" }}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
