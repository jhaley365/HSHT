"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";
import { getCurrentSchoolYear, archiveYearKey } from "@/lib/school-year";

const BASE_PATH = "/year-end-archive";

function fail(message: string): never {
  redirect(`${BASE_PATH}?error=${encodeURIComponent(message)}`);
}

// Archive Current Year — copies every active student's full record into
// StudentArchive tagged with the current school year, then deactivates
// them, per the legacy students-archive-eoy_update.cfm. Wrapped in one
// transaction so there's no partial-archive state the way the legacy
// version could end up in.
export async function archiveCurrentYearAction() {
  const session = await requireAdmin();
  const schoolYear = await getCurrentSchoolYear();
  const yearKey = schoolYear ? archiveYearKey(schoolYear) : null;
  if (!schoolYear || !yearKey) fail("No current school year is configured.");

  const existing = await prisma.studentArchive.count({ where: { schoolYear: yearKey } });
  if (existing > 0) fail(`School year ${yearKey} has already been archived.`);

  const students = await prisma.student.findMany({ where: { active: true } });
  if (students.length === 0) fail("There are no active students to archive.");

  const maxLegacyId = (await prisma.studentArchive.aggregate({ _max: { legacyId: true } }))._max.legacyId ?? 0;

  await prisma.$transaction([
    prisma.studentArchive.createMany({
      data: students.map((s, i) => ({
        legacyId: maxLegacyId + i + 1,
        studentId: s.legacyId,
        schoolYear: yearKey,
        schoolId: s.schoolId,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        birthDate: s.birthDate,
        phone: s.phone,
        emailAddress: s.emailAddress,
        streetAddress: s.streetAddress,
        city: s.city,
        state: s.state,
        zip: s.zip,
        county: s.county,
        active: s.active,
        gender: s.gender,
        race: s.race,
        raceOther: s.raceOther,
        ethnicHeritage: s.ethnicHeritage,
        grade: s.grade,
        enterDate: s.enterDate,
        enrollDate: s.enrollDate,
        autism: s.autism,
        aspergers: s.aspergers,
        deaf: s.deaf,
        ebd: s.ebd,
        mobility: s.mobility,
        ohi: s.ohi,
        orthopedic: s.orthopedic,
        speech: s.speech,
        sld: s.sld,
        spinal: s.spinal,
        tbi: s.tbi,
        visual: s.visual,
        otherDisability: s.otherDisability,
        otherInfo: s.otherInfo,
        section504: s.section504,
        eip: s.eip,
        vrc: s.vrc,
        hshtCoordinator: s.hshtCoordinator,
        reportableStudent: s.reportableStudent,
        receivedForm: s.receivedForm,
        vocationalRehab: s.vocationalRehab,
        reportableCheck: s.reportableCheck,
        vrCaseloadCheck: s.vrCaseloadCheck,
        graduated: s.graduated,
        graduateDate: s.graduateDate,
      })),
    }),
    prisma.student.updateMany({ where: { legacyId: { in: students.map((s) => s.legacyId) } }, data: { active: false } }),
  ]);

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "UPDATE",
    entityType: "StudentArchive",
    entityId: yearKey,
    summary: `Archived ${students.length} active students into StudentArchive for school year ${yearKey} and deactivated them`,
  });

  revalidatePath(BASE_PATH);
  redirect(BASE_PATH);
}

// Undo — reactivates the archived students and removes the snapshot rows
// this app created for them, so archive-undo-archive works cleanly. The
// legacy Undo only reactivated students and left the archive rows behind,
// which meant redoing it after an undo always failed. Only the current
// school year can be undone (matching the legacy page, which only ever
// showed the Undo link for the most recent year) — reactivating an older
// cohort wouldn't make operational sense.
export async function undoCurrentYearArchiveAction(formData: FormData) {
  const session = await requireAdmin();
  const yearKey = String(formData.get("schoolYear") ?? "");
  if (!yearKey) fail("Missing school year.");

  const schoolYear = await getCurrentSchoolYear();
  const currentYearKey = schoolYear ? archiveYearKey(schoolYear) : null;
  if (yearKey !== currentYearKey) fail("Only the current school year's archive can be undone.");

  const archived = await prisma.studentArchive.findMany({ where: { schoolYear: yearKey }, select: { studentId: true } });
  if (archived.length === 0) fail(`No archive found for school year ${yearKey}.`);

  const studentIds = archived.map((a) => a.studentId);

  await prisma.$transaction([
    prisma.studentArchive.deleteMany({ where: { schoolYear: yearKey } }),
    prisma.student.updateMany({ where: { legacyId: { in: studentIds } }, data: { active: true } }),
  ]);

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "DELETE",
    entityType: "StudentArchive",
    entityId: yearKey,
    summary: `Undid the year-end archive for school year ${yearKey}: reactivated ${archived.length} students and removed their archive snapshot`,
  });

  revalidatePath(BASE_PATH);
  redirect(BASE_PATH);
}
