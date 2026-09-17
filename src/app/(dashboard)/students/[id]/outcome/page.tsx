import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getStudentProfile, getStudentOutcomes } from "@/lib/student-detail-queries";
import { InfoRow } from "@/components/InfoRow";

export const dynamic = "force-dynamic";

export default async function StudentOutcomePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const outcomes = await getStudentOutcomes(student.legacyId);

  return (
    <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Outcome
        </div>
        {canManage && (
          <Link
            href={`/students/${id}/outcome/edit`}
            className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white"
            style={{ background: "#f59e0b" }}
          >
            Edit Outcome
          </Link>
        )}
      </div>

      {outcomes.length === 0 ? (
        <div className="py-6 text-center text-[13px]" style={{ color: "var(--muted)" }}>
          No outcome recorded.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {outcomes.map((outcome) => (
            <div key={outcome.id}>
              <InfoRow label="Graduated" value={outcome.graduated === null ? "—" : outcome.graduated ? "Yes" : "No"} />
              <InfoRow label="Graduate Date" value={outcome.graduateDate ? outcome.graduateDate.toLocaleDateString() : "—"} />
              <InfoRow label="Employment" value={outcome.employment ?? "—"} />
              <InfoRow label="Employment Date" value={outcome.employmentDate ? outcome.employmentDate.toLocaleDateString() : "—"} />
              <InfoRow label="Post-Secondary" value={outcome.postSecondary ?? "—"} />
              <InfoRow label="Post-Secondary Date" value={outcome.postSecondaryDate ? outcome.postSecondaryDate.toLocaleDateString() : "—"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
