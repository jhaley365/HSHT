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

export async function createStudentEquipmentAction(formData: FormData) {
  const session = await requireStaff();
  const studentDbId = String(formData.get("studentDbId") ?? "");
  const studentId = Number(formData.get("studentId"));
  const equipmentType = text(formData, "equipmentType");
  const dateIssuedRaw = String(formData.get("dateIssued") ?? "");

  if (!equipmentType) redirect(`/students/${studentDbId}/equipment/new?error=Equipment type is required`);

  const equipment = await prisma.$transaction(async (tx) => {
    return tx.studentEquipment.create({
      data: {
        legacyId: await nextLegacyId(tx, "studentEquipment"),
        studentId,
        equipmentType,
        modelNumber: text(formData, "modelNumber"),
        serialNumber: text(formData, "serialNumber"),
        dateIssued: dateIssuedRaw ? new Date(dateIssuedRaw) : null,
        assistiveTechnology: text(formData, "assistiveTechnology"),
      },
    });
  });

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "CREATE",
    entityType: "StudentEquipment",
    entityId: equipment.id,
    summary: `Added ${equipmentType} for student`,
  });

  revalidatePath(`/students/${studentDbId}/equipment`);
  redirect(`/students/${studentDbId}/equipment`);
}
