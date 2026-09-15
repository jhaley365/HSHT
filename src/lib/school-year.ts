import { prisma } from "@/lib/prisma";

// The legacy SchoolYear table is a fixed, non-overlapping July 1 - June 30
// sequence (confirmed against real data). "Current" is whichever row's
// range contains today; if today falls outside every synced range (e.g.
// the sync is stale), fall back to the most recent one rather than
// scoping to nothing.
export async function getCurrentSchoolYear() {
  const now = new Date();
  const current = await prisma.schoolYear.findFirst({
    where: { beginDate: { lte: now }, endDate: { gte: now } },
  });
  if (current) return current;
  return prisma.schoolYear.findFirst({ orderBy: { beginDate: "desc" } });
}

// StudentArchive.schoolYear (and the legacy dbo.StudentArchive it was
// synced from) stores a literal "YYYY-YYYY" string keyed off the begin/end
// calendar years — NOT SchoolYear.legacyId, which is just a sequential row
// ID (confirmed against production, where id 10 is school year
// "2025-2026"). Every StudentArchive lookup by school year needs this same
// string, so it's centralized here rather than reconstructed per call site.
export function archiveYearKey(schoolYear: { beginDate: Date | null; endDate: Date | null }): string | null {
  if (!schoolYear.beginDate || !schoolYear.endDate) return null;
  return `${schoolYear.beginDate.getFullYear()}-${schoolYear.endDate.getFullYear()}`;
}
