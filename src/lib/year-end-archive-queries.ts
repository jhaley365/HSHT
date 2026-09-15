import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear, archiveYearKey } from "@/lib/school-year";

export type SchoolYearArchiveStatus = {
  legacyId: number;
  label: string;
  archiveYearKey: string;
  archivedCount: number;
  isArchived: boolean;
  isCurrent: boolean;
};

// One row per school year, with its StudentArchive status — the same
// "Archive Years" table from the legacy Utility page
// (students-archive-eoy.cfm), minus the leftover Recheck link that page
// showed when an archive was incomplete: this app's archive action is
// transactional, so that partial state can't happen here.
export async function getSchoolYearArchiveStatus(): Promise<SchoolYearArchiveStatus[]> {
  const [schoolYears, currentSchoolYear] = await Promise.all([
    prisma.schoolYear.findMany({ orderBy: { beginDate: "desc" } }),
    getCurrentSchoolYear(),
  ]);

  const results: SchoolYearArchiveStatus[] = [];
  for (const sy of schoolYears) {
    const key = archiveYearKey(sy);
    if (!key) continue;
    const archivedCount = await prisma.studentArchive.count({ where: { schoolYear: key } });
    results.push({
      legacyId: sy.legacyId,
      label: sy.label,
      archiveYearKey: key,
      archivedCount,
      isArchived: archivedCount > 0,
      isCurrent: sy.legacyId === currentSchoolYear?.legacyId,
    });
  }
  return results;
}

export async function getActiveStudentCount() {
  return prisma.student.count({ where: { active: true } });
}
