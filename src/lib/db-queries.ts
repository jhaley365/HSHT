import { prisma } from "@/lib/prisma";
import type { TopSchool } from "@/lib/dashboard-data";

export async function getDashboardCounts() {
  const [students, schools, districts] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.school.count({ where: { active: true } }),
    prisma.district.count({ where: { active: true } }),
  ]);
  return { students, schools, districts };
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
