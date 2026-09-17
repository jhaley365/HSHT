"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { nextLegacyId } from "@/lib/next-legacy-id";
import { recordAuditEvent } from "@/lib/audit";
import type { Program, Prisma } from "@/generated/prisma/client";

function parseProgram(value: FormDataEntryValue | null): Program {
  return value === "YTEP" ? "YTEP" : "HSHT";
}

function text(formData: FormData, name: string): string | null {
  return String(formData.get(name) ?? "").trim() || null;
}

function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

// Shared field set between create and update — MID is only ever meaningful
// for YTEP students (see Student.mid in schema.prisma), but there's no harm
// storing whatever the checkbox submitted since it's hidden from the HSHT
// form entirely.
function parseStudentFields(formData: FormData) {
  const birthDateRaw = String(formData.get("birthDate") ?? "");
  return {
    firstName: text(formData, "firstName"),
    middleName: text(formData, "middleName"),
    lastName: text(formData, "lastName"),
    birthDate: birthDateRaw ? new Date(birthDateRaw) : null,
    phone: text(formData, "phone"),
    emailAddress: text(formData, "emailAddress"),
    streetAddress: text(formData, "streetAddress"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    zip: text(formData, "zip"),
    county: text(formData, "county"),
    gender: text(formData, "gender"),
    race: text(formData, "race"),
    raceOther: text(formData, "raceOther"),
    ethnicHeritage: text(formData, "ethnicHeritage"),
    autism: bool(formData, "autism"),
    aspergers: bool(formData, "aspergers"),
    deaf: bool(formData, "deaf"),
    ebd: bool(formData, "ebd"),
    mid: bool(formData, "mid"),
    mobility: bool(formData, "mobility"),
    ohi: bool(formData, "ohi"),
    orthopedic: bool(formData, "orthopedic"),
    speech: bool(formData, "speech"),
    sld: bool(formData, "sld"),
    spinal: bool(formData, "spinal"),
    tbi: bool(formData, "tbi"),
    visual: bool(formData, "visual"),
    otherDisability: bool(formData, "otherDisability"),
    otherInfo: text(formData, "otherInfo"),
    section504: bool(formData, "section504"),
    grade: text(formData, "grade"),
    enterDate: text(formData, "enterDate"),
    eip: bool(formData, "eip"),
    vrc: text(formData, "vrc"),
    hshtCoordinator: text(formData, "hshtCoordinator"),
    receivedForm: bool(formData, "receivedForm"),
    vocationalRehab: bool(formData, "vocationalRehab"),
    vrCaseloadCheck: bool(formData, "vrCaseloadCheck"),
  } satisfies Prisma.StudentUpdateInput;
}

export async function createStudentAction(formData: FormData) {
  const session = await requireStaff();

  const program = parseProgram(formData.get("program"));
  const schoolId = Number(formData.get("schoolId"));
  const fields = parseStudentFields(formData);

  if (!fields.firstName) redirect(`/students/new?program=${program}&error=First name is required`);
  if (!fields.lastName) redirect(`/students/new?program=${program}&error=Last name is required`);
  if (!schoolId) redirect(`/students/new?program=${program}&error=School is required`);

  const student = await prisma.$transaction(async (tx) => {
    return tx.student.create({
      data: {
        legacyId: await nextLegacyId(tx, "student"),
        program,
        schoolId,
        ...fields,
      },
    });
  });

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "CREATE",
    entityType: "Student",
    entityId: student.id,
    summary: `Created ${program} student "${student.firstName} ${student.lastName}"`,
  });

  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function updateStudentAction(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) redirect("/students");

  // Program is locked once a student exists — it's set by which wizard
  // entry point created the row, not something the edit form exposes for
  // change (its hidden field always carries the student's current value).
  const program = parseProgram(formData.get("program"));
  const schoolId = Number(formData.get("schoolId"));
  const active = bool(formData, "active");
  const fields = parseStudentFields(formData);

  if (!fields.firstName) redirect(`/students/${id}/edit?error=First name is required`);
  if (!fields.lastName) redirect(`/students/${id}/edit?error=Last name is required`);
  if (!schoolId) redirect(`/students/${id}/edit?error=School is required`);

  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id },
      data: { program, schoolId, active, ...fields },
    });
  });

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "UPDATE",
    entityType: "Student",
    entityId: id,
    summary: `Updated student "${fields.firstName} ${fields.lastName}"`,
  });

  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
  redirect(`/students/${id}`);
}
