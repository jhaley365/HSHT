import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getStudentProfile, getStudentEquipment } from "@/lib/student-detail-queries";

export const dynamic = "force-dynamic";

const GRID_COLS = "1.2fr 1fr 1fr 120px";

export default async function StudentEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const equipment = await getStudentEquipment(student.legacyId);

  return (
    <div className="flex flex-col gap-3">
      {canManage && (
        <div>
          <Link
            href={`/students/${id}/equipment/new`}
            className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white"
            style={{ background: "var(--positive)" }}
          >
            Add Equipment
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>Equipment Type</span>
          <span>Model Number</span>
          <span>Serial Number</span>
          <span>Date Issued</span>
        </div>

        {equipment.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No equipment issued on record.
          </div>
        )}

        {equipment.map((item) => (
          <div
            key={item.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text)" }}>{item.equipmentType ?? "—"}</span>
            <span style={{ color: "var(--muted)" }}>{item.modelNumber ?? "—"}</span>
            <span style={{ color: "var(--muted)" }}>{item.serialNumber ?? "—"}</span>
            <span style={{ color: "var(--muted)" }}>{item.dateIssued ? item.dateIssued.toLocaleDateString() : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
