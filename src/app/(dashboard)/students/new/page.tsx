import { requireStaff } from "@/lib/authz";
import { getDistrictOptions } from "@/lib/reports-queries";
import { getSchoolOptions } from "@/lib/activity-queries";
import { createStudentAction } from "@/lib/actions/student-actions";
import { StudentFormFields } from "@/components/students/StudentFormFields";
import type { Program } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function parseProgram(value: string | undefined): Program {
  return value === "YTEP" ? "YTEP" : "HSHT";
}

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; error?: string }>;
}) {
  await requireStaff();
  const { program: programParam, error } = await searchParams;
  const program = parseProgram(programParam);

  const [districts, schools] = await Promise.all([getDistrictOptions(), getSchoolOptions()]);

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

      <form action={createStudentAction} className="flex flex-col gap-5">
        <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          New {program} Student
        </div>

        <StudentFormFields program={program} districts={districts} schools={schools} />

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--positive)" }}>
            Submit
          </button>
          <button type="reset" className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--primary)" }}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
