import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/student-detail-queries";
import { getSchoolOptions } from "@/lib/activity-queries";
import { updateStudentAction } from "@/lib/actions/student-actions";
import { StudentFormFields, type StudentFormDefaults } from "@/components/students/StudentFormFields";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date | null): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const schools = await getSchoolOptions();

  const defaults: StudentFormDefaults = {
    firstName: student.firstName ?? undefined,
    middleName: student.middleName ?? undefined,
    lastName: student.lastName ?? undefined,
    birthDate: toDateInputValue(student.birthDate),
    phone: student.phone ?? undefined,
    emailAddress: student.emailAddress ?? undefined,
    streetAddress: student.streetAddress ?? undefined,
    city: student.city ?? undefined,
    state: student.state ?? undefined,
    zip: student.zip ?? undefined,
    county: student.county ?? undefined,
    gender: student.gender ?? undefined,
    race: student.race ?? undefined,
    raceOther: student.raceOther ?? undefined,
    ethnicHeritage: student.ethnicHeritage ?? undefined,
    autism: student.autism,
    aspergers: student.aspergers,
    deaf: student.deaf,
    ebd: student.ebd,
    mid: student.mid,
    mobility: student.mobility,
    ohi: student.ohi,
    orthopedic: student.orthopedic,
    speech: student.speech,
    sld: student.sld,
    spinal: student.spinal,
    tbi: student.tbi,
    visual: student.visual,
    otherDisability: student.otherDisability,
    otherInfo: student.otherInfo ?? undefined,
    section504: student.section504,
    grade: student.grade?.trim() ?? undefined,
    enterDate: student.enterDate ?? undefined,
    eip: student.eip,
    vrc: student.vrc ?? undefined,
    hshtCoordinator: student.hshtCoordinator ?? undefined,
    receivedForm: student.receivedForm,
    vocationalRehab: student.vocationalRehab,
    vrCaseloadCheck: student.vrCaseloadCheck,
    active: student.active,
  };

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

      <form action={updateStudentAction} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={id} />
        <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Edit Student
        </div>

        <StudentFormFields
          program={student.program}
          schools={schools}
          defaultSchoolId={student.schoolId}
          defaults={defaults}
          showActiveToggle
        />

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
