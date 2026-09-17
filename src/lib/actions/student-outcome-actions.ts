"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { nextLegacyId } from "@/lib/next-legacy-id";
import { recordAuditEvent } from "@/lib/audit";

function text(formData: FormData, name: string): string | null {
  return String(formData.get(name) ?? "").trim() || null;
}

function date(formData: FormData, name: string): Date | null {
  const raw = String(formData.get(name) ?? "");
  return raw ? new Date(raw) : null;
}

// "Other" on the legacy Graduated? radio maps to null — the same "not yes,
// not confirmed no" meaning StudentOutcome.graduated already carries as a
// nullable boolean, so no schema change was needed for it.
function graduated(formData: FormData): boolean | null {
  const value = formData.get("graduated");
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

// One StudentOutcome per student, upserted in place — matches the legacy
// "Outcome Edit" page, which always edits a single record rather than
// listing history.
export async function saveStudentOutcomeAction(formData: FormData) {
  const session = await requireStaff();
  const studentDbId = String(formData.get("studentDbId") ?? "");
  const studentId = Number(formData.get("studentId"));
  const existingId = String(formData.get("existingId") ?? "") || null;

  const data = {
    graduated: graduated(formData),
    graduateDate: date(formData, "graduateDate"),
    employment: text(formData, "employment"),
    employmentDate: date(formData, "employmentDate"),
    postSecondary: text(formData, "postSecondary"),
    postSecondaryDate: date(formData, "postSecondaryDate"),
  };

  await prisma.$transaction(async (tx) => {
    if (existingId) {
      await tx.studentOutcome.update({ where: { id: existingId }, data });
    } else {
      await tx.studentOutcome.create({
        data: { legacyId: await nextLegacyId(tx, "studentOutcome"), studentId, ...data },
      });
    }
  });

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: existingId ? "UPDATE" : "CREATE",
    entityType: "StudentOutcome",
    entityId: studentDbId,
    summary: `${existingId ? "Updated" : "Recorded"} outcome for student`,
  });

  revalidatePath(`/students/${studentDbId}/outcome`);
  redirect(`/students/${studentDbId}/outcome`);
}
