import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/authz";
import { getStudentProfile, getStudentOutcomes } from "@/lib/student-detail-queries";
import { saveStudentOutcomeAction } from "@/lib/actions/student-outcome-actions";

export const dynamic = "force-dynamic";

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function graduatedValue(graduated: boolean | null): string {
  if (graduated === true) return "yes";
  if (graduated === false) return "no";
  return "other";
}

export default async function EditStudentOutcomePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const [outcome] = await getStudentOutcomes(student.legacyId);

  return (
    <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="mb-4 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
        Outcome Edit
      </div>

      <form action={saveStudentOutcomeAction} className="flex flex-col gap-5">
        <input type="hidden" name="studentDbId" value={id} />
        <input type="hidden" name="studentId" value={student.legacyId} />
        <input type="hidden" name="existingId" value={outcome?.id ?? ""} />

        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
            Graduated?
          </span>
          <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
            <input type="radio" name="graduated" value="yes" defaultChecked={graduatedValue(outcome?.graduated ?? null) === "yes"} />
            Yes
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
            <input type="radio" name="graduated" value="no" defaultChecked={graduatedValue(outcome?.graduated ?? null) === "no"} />
            No
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
            <input type="radio" name="graduated" value="other" defaultChecked={graduatedValue(outcome?.graduated ?? null) === "other"} />
            Other
          </label>
          <input
            type="date"
            name="graduateDate"
            defaultValue={toDateInputValue(outcome?.graduateDate ?? null)}
            className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <div className="mb-3 border-b pb-2 text-[13px] font-bold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
            Employment
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                Employer
              </span>
              <input
                type="text"
                name="employment"
                defaultValue={outcome?.employment ?? ""}
                className="h-[38px] w-[280px] rounded-[9px] border px-3 text-[13px] outline-none"
                style={inputStyle}
              />
            </label>
            <input
              type="date"
              name="employmentDate"
              defaultValue={toDateInputValue(outcome?.employmentDate ?? null)}
              className="mt-[22px] h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <div className="mb-3 border-b pb-2 text-[13px] font-bold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
            Post-Secondary Education
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                School
              </span>
              <input
                type="text"
                name="postSecondary"
                defaultValue={outcome?.postSecondary ?? ""}
                className="h-[38px] w-[280px] rounded-[9px] border px-3 text-[13px] outline-none"
                style={inputStyle}
              />
            </label>
            <input
              type="date"
              name="postSecondaryDate"
              defaultValue={toDateInputValue(outcome?.postSecondaryDate ?? null)}
              className="mt-[22px] h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/students/${id}/outcome`}
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
  );
}
