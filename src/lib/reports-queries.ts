// Data-fetching for the Reports feature. Each function mirrors the exact
// filters used by its corresponding Home dashboard KPI card (see
// db-queries.ts#getCoverageStats) so the report's row/group count always
// matches the number the user clicked through from.
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { getQuarterRange, type Quarter } from "@/lib/reports/quarters";

export type StudentsReportFilters = {
  quarter?: Quarter;
  schoolId?: number;
  districtId?: number;
  grade?: string;
  gender?: string;
};

async function currentSchoolYearDateFilter() {
  const schoolYear = await getCurrentSchoolYear();
  const dateFilter = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  return { schoolYear, dateFilter };
}

// Report 1: Students enrolled in the current school year, matching the
// Students KPI. `quarter` further narrows enrollDate to one of the four
// quarters of that school year (Q1=Jul-Sep ... Q4=Apr-Jun). School/
// district/grade/gender narrow the roster further via the filter bar.
export async function getStudentsReport(filters: StudentsReportFilters = {}) {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  let enrollDate = dateFilter;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    enrollDate = { gte: range.start, lte: range.end };
  }

  const where: Prisma.StudentWhereInput = { active: true, enrollDate };
  if (filters.schoolId) where.schoolId = filters.schoolId;
  if (filters.districtId) where.school = { districtId: filters.districtId };
  // Grade/gender are legacy nchar columns and may carry trailing padding
  // (see legacy-codes.ts) — startsWith tolerates that without needing a
  // raw-SQL trim, and is unambiguous since every code is a single digit.
  if (filters.grade) where.grade = { startsWith: filters.grade };
  if (filters.gender) where.gender = { startsWith: filters.gender };

  const students = await prisma.student.findMany({
    where,
    include: { school: { include: { district: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return { students, schoolYear };
}

// Report 1b: Students served — one row per (non-unique) participation in a
// completed activity this school year, matching the "Students Served" KPI
// numerator exactly (see db-queries.ts#getCoverageStats' studentsServed).
// `quarter` narrows by the ACTIVITY's date, not enrollDate, since this
// report is about when the service happened, not when the student
// enrolled. School/district/grade/gender filter the student side.
export async function getStudentsServedReport(filters: StudentsReportFilters = {}) {
  const { schoolYear, dateFilter } = await currentSchoolYearDateFilter();
  let activityDate = dateFilter;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    activityDate = { gte: range.start, lte: range.end };
  }

  // Left unset entirely (not even active:true) when no student-side filter
  // is applied, so the unfiltered count matches the KPI's numerator, which
  // has no student-level filter at all.
  const studentFilter: Prisma.StudentWhereInput = {};
  if (filters.schoolId) studentFilter.schoolId = filters.schoolId;
  if (filters.districtId) studentFilter.school = { districtId: filters.districtId };
  if (filters.grade) studentFilter.grade = { startsWith: filters.grade };
  if (filters.gender) studentFilter.gender = { startsWith: filters.gender };

  const where: Prisma.StudentActivityWhereInput = {
    deleted: false,
    activity: { closed: true, deleted: false, activityDate },
  };
  if (Object.keys(studentFilter).length > 0) where.student = studentFilter;

  const participations = await prisma.studentActivity.findMany({
    where,
    include: {
      student: { include: { school: { include: { district: true } } } },
      activity: true,
    },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
  });

  return { participations, schoolYear };
}

// Filter-bar options for the Students report — every active district, used
// alongside getSchoolOptions() (activity-queries.ts) for the School filter.
export async function getDistrictOptions() {
  return prisma.district.findMany({
    where: { active: true },
    select: { legacyId: true, name: true, county: true },
    orderBy: { name: "asc" },
  });
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
