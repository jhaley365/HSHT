import { notFound } from "next/navigation";
import { getStudentProfile, getStudentOutcomes } from "@/lib/student-detail-queries";

export const dynamic = "force-dynamic";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t py-2 text-[13px] first:border-t-0" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-right" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

export default async function StudentOutcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const outcomes = await getStudentOutcomes(student.legacyId);

  return (
    <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
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
