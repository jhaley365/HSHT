// Data-fetching for the Reports feature. Each function mirrors the exact
// filters used by its corresponding Home dashboard KPI card (see
// db-queries.ts#getCoverageStats) so the report's row/group count always
// matches the number the user clicked through from.
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { getQuarterRange, type Quarter } from "@/lib/reports/quarters";

async function currentSchoolYearDateFilter() {
  const schoolYear = await getCurrentSchoolYear();
  const dateFilter = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  return { schoolYear, dateFilter };
}

// Report 1: Students enrolled in the current school year, matching the
// Students KPI. `quarter` further narrows enrollDate to one of the four
// quarters of that school year (Q1=Jul-Sep ... Q4=Apr-Jun).
export async function getStudentsReport(quarter?: Quarter) {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  let enrollDate = dateFilter;
  if (quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, quarter);
    enrollDate = { gte: range.start, lte: range.end };
  }

  const students = await prisma.student.findMany({
    where: { active: true, enrollDate },
    include: { school: { include: { district: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return { students, schoolYear };
}

// Report 2: Districts with enrolled students -> Schools -> Students,
// matching the "Districts have enrolled students" KPI.
export async function getDistrictsEnrollmentReport() {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  const districts = await prisma.district.findMany({
    where: { active: true, schools: { some: { students: { some: { active: true, enrollDate: dateFilter } } } } },
    include: {
      schools: {
        where: { active: true, students: { some: { active: true, enrollDate: dateFilter } } },
        include: { students: { where: { active: true, enrollDate: dateFilter }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] } },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return { districts, schoolYear };
}

// Report 3: Schools with enrolled students -> Students, matching the
// "Schools have enrolled students" KPI.
export async function getSchoolsEnrollmentReport() {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  const schools = await prisma.school.findMany({
    where: { active: true, students: { some: { active: true, enrollDate: dateFilter } } },
    include: {
      district: true,
      students: { where: { active: true, enrollDate: dateFilter }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
    },
    orderBy: { name: "asc" },
  });
  return { schools, schoolYear };
}

// Report 4: Districts with completed activities -> Activities (each with
// its school + assigned students), matching the "Districts have completed
// activities" KPI.
export async function getDistrictsActivitiesReport() {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  const districts = await prisma.district.findMany({
    where: { active: true, schools: { some: { activities: { some: { closed: true, deleted: false, activityDate: dateFilter } } } } },
    include: {
      schools: {
        include: {
          activities: {
            where: { closed: true, deleted: false, activityDate: dateFilter },
            include: { studentActivities: { where: { deleted: false }, include: { student: true } } },
            orderBy: { activityDate: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    districts: districts.map((d) => ({ ...d, schools: d.schools.filter((s) => s.activities.length > 0) })),
    schoolYear,
  };
}

// Report 5: Schools with completed activities -> Activities -> assigned
// students, matching the "Schools have completed activities" KPI.
export async function getSchoolsActivitiesReport() {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  const schools = await prisma.school.findMany({
    where: { active: true, activities: { some: { closed: true, deleted: false, activityDate: dateFilter } } },
    include: {
      district: true,
      activities: {
        where: { closed: true, deleted: false, activityDate: dateFilter },
        include: { studentActivities: { where: { deleted: false }, include: { student: true } } },
        orderBy: { activityDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return { schools, schoolYear };
}
