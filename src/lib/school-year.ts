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
