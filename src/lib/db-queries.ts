import { prisma } from "@/lib/prisma";
import type { TopSchool } from "@/lib/dashboard-data";
import { getCurrentSchoolYear } from "@/lib/school-year";

// "Reach" metrics for the Home dashboard KPI row — how many districts/
// schools actually have enrolled students or a completed activity, not
// just raw totals (that's what the client asked to see instead of totals).
// Scoped to the current school year throughout, same as the Enrollment
// Summary chart and the Activity List's Open filter: "enrolled" means
// Student.enrollDate falls in this school year, "completed" means a
// closed Activity whose activityDate falls in this school year.
export async function getCoverageStats() {
  const schoolYear = await getCurrentSchoolYear();
  const dateFilter = schoolYear?.beginDate
    ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined }
    : undefined;

  const [
    totalStudents,
    studentsServed,
    totalDistricts,
    totalSchools,
    districtsWithStudents,
    schoolsWithStudents,
    districtsWithCompletedActivities,
    schoolsWithCompletedActivities,
  ] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    // Non-unique — a student assigned to 3 completed activities this school
    // year counts 3 times, matching what the client asked for ("Students
    // served" tracks total service instances, not distinct students).
    prisma.studentActivity.count({
      where: { deleted: false, activity: { closed: true, deleted: false, activityDate: dateFilter } },
    }),
    prisma.district.count({ where: { active: true } }),
    prisma.school.count({ where: { active: true } }),
    prisma.district.count({
      where: { active: true, schools: { some: { students: { some: { active: true, enrollDate: dateFilter } } } } },
    }),
    prisma.school.count({
      where: { active: true, students: { some: { active: true, enrollDate: dateFilter } } },
    }),
    prisma.district.count({
      where: {
        active: true,
        schools: { some: { activities: { some: { closed: true, deleted: false, activityDate: dateFilter } } } },
      },
    }),
    prisma.school.count({
      where: { active: true, activities: { some: { closed: true, deleted: false, activityDate: dateFilter } } },
    }),
  ]);

  return {
    totalStudents,
    studentsServed,
    totalDistricts,
    totalSchools,
    districtsWithStudents,
    schoolsWithStudents,
    districtsWithCompletedActivities,
    schoolsWithCompletedActivities,
    schoolYearLabel: schoolYear?.label ?? null,
  };
}

export type EnrollmentTrend = {
  weekLabels: string[];
  cumulativeCounts: number[];
  weeklyNewCounts: number[];
  totalEnrolled: number;
  schoolYearLabel: string | null;
};

// Cumulative count of students enrolled (by Student.enrollDate) within the
// current school year, bucketed by week — what the "Enrollment Summary"
// chart on the Home dashboard actually tracks.
export async function getEnrollmentTrend(): Promise<EnrollmentTrend> {
  const schoolYear = await getCurrentSchoolYear();
  if (!schoolYear?.beginDate) {
    return { weekLabels: [], cumulativeCounts: [], weeklyNewCounts: [], totalEnrolled: 0, schoolYearLabel: null };
  }

  const begin = schoolYear.beginDate;
  const now = new Date();
  const end = schoolYear.endDate && schoolYear.endDate < now ? schoolYear.endDate : now;

  const students = await prisma.student.findMany({
    where: { active: true, enrollDate: { gte: begin, lte: end } },
    select: { enrollDate: true },
  });
  const enrollTimes = students
    .map((s) => s.enrollDate?.getTime())
    .filter((t): t is number => t !== undefined)
    .sort((a, b) => a - b);

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const weekStarts: number[] = [];
  for (let t = begin.getTime(); t <= end.getTime(); t += WEEK_MS) weekStarts.push(t);
  if (weekStarts.length === 0) weekStarts.push(begin.getTime());

  let idx = 0;
  const cumulativeCounts = weekStarts.map((weekStart) => {
    const cutoff = weekStart + WEEK_MS;
    while (idx < enrollTimes.length && enrollTimes[idx] < cutoff) idx++;
    return idx;
  });
  const weeklyNewCounts = cumulativeCounts.map((c, i) => (i === 0 ? c : c - cumulativeCounts[i - 1]));

  const weekLabels = weekStarts.map((t) => {
    const d = new Date(t);
    return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  });

  return {
    weekLabels,
    cumulativeCounts,
    weeklyNewCounts,
    totalEnrolled: cumulativeCounts[cumulativeCounts.length - 1] ?? 0,
    schoolYearLabel: schoolYear.label,
  };
}

const TOP_ENROLLMENT_COLORS = ["c1", "c2", "c3", "c4"] as const;

export async function getTopEnrollmentSchools(limit = 5): Promise<TopSchool[]> {
  const grouped = await prisma.student.groupBy({
    by: ["schoolId"],
    where: { active: true },
    _count: { _all: true },
    orderBy: { _count: { schoolId: "desc" } },
    take: limit,
  });

  const schools = await prisma.school.findMany({
    where: { legacyId: { in: grouped.map((g) => g.schoolId) } },
    include: { district: true },
  });
  const schoolByLegacyId = new Map(schools.map((s) => [s.legacyId, s]));

  return grouped.map((g, i) => {
    const school = schoolByLegacyId.get(g.schoolId);
    return {
      name: school?.name ?? "Unknown school",
      county: school?.district.county ?? "",
      students: g._count._all,
      color: TOP_ENROLLMENT_COLORS[i % TOP_ENROLLMENT_COLORS.length],
    };
  });
}
