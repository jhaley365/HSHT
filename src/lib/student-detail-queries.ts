import { cache } from "react";
import { prisma } from "@/lib/prisma";

// cache() dedupes this within a single request — the layout and the active
// tab's page both need the student profile, without fetching it twice.
export const getStudentProfile = cache(async (id: string) => {
  return prisma.student.findUnique({
    where: { id },
    include: {
      school: { include: { district: true } },
      programCodes: true,
      notes: { orderBy: { noteDate: "desc" } },
    },
  });
});

export async function getStudentActivities(legacyId: number) {
  return prisma.studentActivity.findMany({
    where: { studentId: legacyId },
    include: { activity: true },
    orderBy: { createDate: "desc" },
  });
}

export async function getStudentEquipment(legacyId: number) {
  return prisma.studentEquipment.findMany({
    where: { studentId: legacyId },
    orderBy: { dateIssued: "desc" },
  });
}

export async function getStudentOutcomes(legacyId: number) {
  return prisma.studentOutcome.findMany({ where: { studentId: legacyId } });
}

export async function getStudentHistory(legacyId: number) {
  return prisma.studentHistoryEntry.findMany({
    where: { studentId: legacyId },
    orderBy: { historyDate: "desc" },
  });
}
