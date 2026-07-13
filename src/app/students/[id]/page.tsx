import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/student-detail-queries";

export const dynamic = "force-dynamic";

const DISABILITY_FIELDS = [
  ["autism", "Autism"],
  ["aspergers", "Asperger's"],
  ["deaf", "Deaf"],
  ["ebd", "Emotional/Behavioral Disorder"],
  ["mobility", "Mobility"],
  ["ohi", "Other Health Impairment"],
  ["orthopedic", "Orthopedic"],
  ["speech", "Speech"],
  ["sld", "Specific Learning Disability"],
  ["spinal", "Spinal"],
  ["tbi", "Traumatic Brain Injury"],
  ["visual", "Visual"],
] as const;

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0" style={{ borderColor: "var(--border)" }}>
      <div className="mb-1 text-[13px] font-extrabold" style={{ color: "var(--heading)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

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

export default async function StudentInformationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const disabilities: string[] = DISABILITY_FIELDS.filter(([key]) => student[key]).map(([, label]) => label);
  if (student.otherDisability && student.otherInfo) disabilities.push(`Other: ${student.otherInfo}`);

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <Section title="Classification">
        <InfoRow label="Gender" value={student.gender ?? "—"} />
        <InfoRow label="Race" value={student.race ?? "—"} />
        <InfoRow label="Ethnic Heritage" value={student.ethnicHeritage ?? "—"} />
      </Section>

      <Section title="Disability">
        {disabilities.length ? (
          <div className="flex flex-wrap gap-2 py-2">
            {disabilities.map((d) => (
              <span
                key={d}
                className="rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: "var(--surface-2)", color: "var(--text)" }}
              >
                {d}
              </span>
            ))}
          </div>
        ) : (
          <div className="py-2 text-[13px]" style={{ color: "var(--muted)" }}>
            None reported
          </div>
        )}
      </Section>

      <Section title="Education">
        <InfoRow label="Grade" value={student.grade ?? "—"} />
        <InfoRow label="Enter School Date" value={student.enterDate ?? "—"} />
      </Section>

      <Section title="Internal Use">
        {/* Legacy UI labels this "Do you have an IEP?" but the underlying
            column is EIP (a distinct GA early-intervention program) — flagged
            for confirmation, see MIGRATION.md open questions. */}
        <InfoRow label="EIP" value={yesNo(student.eip)} />
        <InfoRow label="504" value={yesNo(student.section504)} />
        <InfoRow label="Received Reportable Form?" value={yesNo(student.receivedForm)} />
        <InfoRow label="VR Caseload?" value={yesNo(student.vrCaseloadCheck)} />
        <InfoRow label="Vocational Rehabilitation?" value={yesNo(student.vocationalRehab)} />
        <InfoRow label="Vocational Rehabilitation Counselor" value={student.vrc ?? "—"} />
        <InfoRow label="HS / HT Coordinator" value={student.hshtCoordinator ?? "—"} />
        <InfoRow
          label="Program Codes"
          value={student.programCodes.length ? student.programCodes.map((p) => p.programCode).join(", ") : "—"}
        />
      </Section>

      <Section title="Notes">
        {student.notes.length === 0 ? (
          <div className="py-2 text-[13px]" style={{ color: "var(--muted)" }}>
            No notes yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {student.notes.map((note) => (
              <div key={note.id} className="rounded-[9px] border p-3 text-[13px]" style={{ borderColor: "var(--border)" }}>
                <div className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>
                  {note.noteDate.toLocaleDateString()}
                </div>
                <div style={{ color: "var(--text)" }}>{note.note}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
