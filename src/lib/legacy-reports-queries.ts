// Data-fetching for reports migrated from the legacy ColdFusion "Reports"
// section (see reports-coordinator-activity-sum-2.cfm et al. in the legacy
// site export). Unlike the KPI-linked reports in reports-queries.ts, these
// aren't tied to a Home dashboard number — they support browsing any past
// school year, not just the current one, matching the legacy app's own
// School Year dropdown.
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { getQuarterRange, type Quarter } from "@/lib/reports/quarters";

export async function getSchoolYearOptions() {
  return prisma.schoolYear.findMany({ orderBy: { beginDate: "desc" } });
}

export type CoordinatorSummaryFilters = {
  schoolYearId?: number;
  quarter?: Quarter;
};

export type CoordinatorSummaryLineItem = {
  name: string;
  description: string;
  qty: number;
};

export type CoordinatorSummarySchoolGroup = {
  schoolId: number;
  schoolName: string;
  items: CoordinatorSummaryLineItem[];
};

export type CoordinatorSummaryGroup = {
  coordinatorId: number;
  coordinatorName: string;
  schools: CoordinatorSummarySchoolGroup[];
  total: number;
};

// Activity Summary by Coordinator — for each HSHT coordinator, each school
// they ran activities at, and each distinct (Activity.name,
// Activity.description) pairing logged there, how many students
// participated (QTY = count of non-deleted StudentActivity rows) in the
// selected school year/quarter.
//
// The legacy report's school list per coordinator wasn't scoped to the
// date filter (only the line items under it were), which could produce an
// empty school heading with nothing underneath for a school the
// coordinator only worked at in a different period. This version scopes
// everything to the same filter throughout, so a coordinator or school
// only appears when they actually have matching activity in the period.
export async function getActivityByCoordinatorSummary(filters: CoordinatorSummaryFilters = {}) {
  const schoolYear = filters.schoolYearId
    ? await prisma.schoolYear.findUnique({ where: { legacyId: filters.schoolYearId } })
    : await getCurrentSchoolYear();

  let activityDate = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    activityDate = { gte: range.start, lte: range.end };
  }

  const activities = await prisma.activity.findMany({
    where: { coordinatorId: { not: null }, deleted: false, activityDate },
    include: { school: true, studentActivities: { where: { deleted: false } } },
    orderBy: { legacyId: "asc" },
  });

  const coordinatorIds = [...new Set(activities.map((a) => a.coordinatorId as number))];
  const coordinators = await prisma.coordinator.findMany({ where: { legacyId: { in: coordinatorIds } } });
  const coordinatorById = new Map(coordinators.map((c) => [c.legacyId, c]));

  // coordinatorId -> schoolId -> Activity.description (the legacy grouping
  // key — see reports-coordinator-activity-sum-2.cfm's DISTINCT(description))
  // -> line item, accumulating QTY across every activity sharing that
  // description at that school for that coordinator.
  const byCoordinator = new Map<number, Map<number, Map<string, CoordinatorSummaryLineItem>>>();

  for (const activity of activities) {
    const coordinatorId = activity.coordinatorId;
    if (!coordinatorId) continue;
    const descriptionKey = activity.description ?? "";

    let schoolMap = byCoordinator.get(coordinatorId);
    if (!schoolMap) byCoordinator.set(coordinatorId, (schoolMap = new Map()));

    let itemMap = schoolMap.get(activity.schoolId);
    if (!itemMap) schoolMap.set(activity.schoolId, (itemMap = new Map()));

    const existing = itemMap.get(descriptionKey);
    if (existing) {
      existing.qty += activity.studentActivities.length;
    } else {
      itemMap.set(descriptionKey, { name: activity.name, description: descriptionKey, qty: activity.studentActivities.length });
    }
  }

  const schoolNameById = new Map(activities.map((a) => [a.schoolId, a.school.name]));

  const groups: CoordinatorSummaryGroup[] = [];
  for (const [coordinatorId, schoolMap] of byCoordinator) {
    const coordinator = coordinatorById.get(coordinatorId);
    const schools: CoordinatorSummarySchoolGroup[] = [];
    let total = 0;
    for (const [schoolId, itemMap] of schoolMap) {
      const items = Array.from(itemMap.values()).sort((a, b) => a.description.localeCompare(b.description));
      total += items.reduce((sum, item) => sum + item.qty, 0);
      schools.push({ schoolId, schoolName: schoolNameById.get(schoolId) ?? "Unknown School", items });
    }
    schools.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    groups.push({
      coordinatorId,
      coordinatorName: [coordinator?.firstName, coordinator?.lastName].filter(Boolean).join(" ") || "Unknown Coordinator",
      schools,
      total,
    });
  }
  groups.sort((a, b) => {
    const lastA = coordinatorById.get(a.coordinatorId)?.lastName ?? "";
    const lastB = coordinatorById.get(b.coordinatorId)?.lastName ?? "";
    return lastA.localeCompare(lastB);
  });

  return { groups, schoolYear };
}

export type CoordinatorDetailRow = {
  activityLegacyId: number;
  activityDate: Date | null;
  detailDescription: string;
  activityDescription: string;
  qty: number;
};

export type CoordinatorDetailSchoolGroup = {
  schoolId: number;
  schoolName: string;
  rows: CoordinatorDetailRow[];
};

export type CoordinatorDetailGroup = {
  coordinatorId: number;
  coordinatorName: string;
  schools: CoordinatorDetailSchoolGroup[];
  total: number;
};

// Activity Detail by Coordinator — for each HSHT coordinator, each school,
// and each Activity they ran there, one row per checklist item logged
// against that activity (ActivityDetail, joined per
// reports-coordinator-activity-sum.cfm). QTY on each row is the activity's
// total participation (count of non-deleted StudentActivity rows), matching
// the legacy report's per-row query — so an activity with several checklist
// items shows that same participation count once per item, and the
// coordinator's "Total Activity Participation" sums across every item, not
// just every activity. That's how both the legacy HTML report and its PDF
// export (reports-coordinator-activity-sum-pdf.cfm) compute the total, so
// it's kept as-is rather than "corrected" — it reads as each checklist item
// being counted as its own unit of participation, not as a double-count bug.
export async function getActivityByCoordinatorDetails(filters: CoordinatorSummaryFilters = {}) {
  const schoolYear = filters.schoolYearId
    ? await prisma.schoolYear.findUnique({ where: { legacyId: filters.schoolYearId } })
    : await getCurrentSchoolYear();

  let activityDate = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    activityDate = { gte: range.start, lte: range.end };
  }

  const activities = await prisma.activity.findMany({
    where: { coordinatorId: { not: null }, deleted: false, activityDate },
    include: {
      school: true,
      details: { orderBy: { description: "asc" } },
      studentActivities: { where: { deleted: false } },
    },
    orderBy: { legacyId: "asc" },
  });

  const coordinatorIds = [...new Set(activities.map((a) => a.coordinatorId as number))];
  const coordinators = await prisma.coordinator.findMany({ where: { legacyId: { in: coordinatorIds } } });
  const coordinatorById = new Map(coordinators.map((c) => [c.legacyId, c]));

  const byCoordinator = new Map<number, Map<number, CoordinatorDetailRow[]>>();

  for (const activity of activities) {
    const coordinatorId = activity.coordinatorId;
    if (!coordinatorId || activity.details.length === 0) continue;
    const qty = activity.studentActivities.length;

    let schoolMap = byCoordinator.get(coordinatorId);
    if (!schoolMap) byCoordinator.set(coordinatorId, (schoolMap = new Map()));

    let rows = schoolMap.get(activity.schoolId);
    if (!rows) schoolMap.set(activity.schoolId, (rows = []));

    for (const detail of activity.details) {
      rows.push({
        activityLegacyId: activity.legacyId,
        activityDate: activity.activityDate,
        detailDescription: detail.description,
        activityDescription: activity.description ?? activity.name,
        qty,
      });
    }
  }

  const schoolNameById = new Map(activities.map((a) => [a.schoolId, a.school.name]));

  const groups: CoordinatorDetailGroup[] = [];
  for (const [coordinatorId, schoolMap] of byCoordinator) {
    const coordinator = coordinatorById.get(coordinatorId);
    const schools: CoordinatorDetailSchoolGroup[] = [];
    let total = 0;
    for (const [schoolId, rows] of schoolMap) {
      rows.sort((a, b) => {
        if (a.activityLegacyId !== b.activityLegacyId) return a.activityLegacyId - b.activityLegacyId;
        const dateA = a.activityDate?.getTime() ?? 0;
        const dateB = b.activityDate?.getTime() ?? 0;
        if (dateA !== dateB) return dateA - dateB;
        return a.detailDescription.localeCompare(b.detailDescription);
      });
      total += rows.reduce((sum, row) => sum + row.qty, 0);
      schools.push({ schoolId, schoolName: schoolNameById.get(schoolId) ?? "Unknown School", rows });
    }
    schools.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    groups.push({
      coordinatorId,
      coordinatorName: [coordinator?.firstName, coordinator?.lastName].filter(Boolean).join(" ") || "Unknown Coordinator",
      schools,
      total,
    });
  }
  groups.sort((a, b) => {
    const lastA = coordinatorById.get(a.coordinatorId)?.lastName ?? "";
    const lastB = coordinatorById.get(b.coordinatorId)?.lastName ?? "";
    return lastA.localeCompare(lastB);
  });

  return { groups, schoolYear };
}

export type DistrictSchoolRow = {
  activityLegacyId: number;
  activityDate: Date | null;
  detailDescription: string;
  qty: number;
  students: { firstName: string | null; lastName: string | null }[];
};

export type DistrictSchoolGroupSchools = {
  schoolId: number;
  schoolName: string;
  rows: DistrictSchoolRow[];
};

export type DistrictSchoolGroup = {
  districtId: number;
  districtName: string;
  schools: DistrictSchoolGroupSchools[];
  total: number;
};

// Activity by District/School — every school's activity, one row per
// checklist item logged against it (per reports-district-schools-activity-
// sum.cfm), with the participating students' names attached to each row.
// This backs both "Activity by District/School" (which doesn't render the
// student names) and "Activity by District/School (Details)" (which does).
// The legacy site actually had THREE separate pages here —
// reports-district-schools-activity-sum.cfm (no student names),
// -details.cfm and -details-with-students.cfm — but the latter two ran the
// identical query and only differed in cosmetic text formatting (one wrote
// "(id) description", the other "[First Last]" with brackets); there was no
// second, more-detailed report to preserve. They're consolidated into one
// "(Details)" page here rather than shipped as two near-duplicates.
//
// Like the coordinator reports, QTY is the activity's total participation
// count, shown once per checklist item — see getActivityByCoordinatorDetails
// for why that's kept rather than "corrected". Unlike the coordinator
// reports, the legacy query here didn't filter out deleted activities; this
// version does, for consistency with every other report in the app.
export async function getActivityByDistrictSchool(filters: CoordinatorSummaryFilters = {}) {
  const schoolYear = filters.schoolYearId
    ? await prisma.schoolYear.findUnique({ where: { legacyId: filters.schoolYearId } })
    : await getCurrentSchoolYear();

  let activityDate = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    activityDate = { gte: range.start, lte: range.end };
  }

  const activities = await prisma.activity.findMany({
    where: { deleted: false, activityDate },
    include: {
      school: { include: { district: true } },
      details: true,
      studentActivities: { where: { deleted: false }, include: { student: true } },
    },
    orderBy: { legacyId: "asc" },
  });

  const byDistrict = new Map<number, Map<number, DistrictSchoolRow[]>>();

  for (const activity of activities) {
    if (activity.details.length === 0) continue;
    const districtId = activity.school.districtId;
    const qty = activity.studentActivities.length;
    const students = activity.studentActivities
      .filter((sa) => sa.student.schoolId === activity.schoolId)
      .map((sa) => ({ firstName: sa.student.firstName, lastName: sa.student.lastName }))
      .sort((a, b) => (a.firstName ?? "").localeCompare(b.firstName ?? "") || (a.lastName ?? "").localeCompare(b.lastName ?? ""));

    let schoolMap = byDistrict.get(districtId);
    if (!schoolMap) byDistrict.set(districtId, (schoolMap = new Map()));

    let rows = schoolMap.get(activity.schoolId);
    if (!rows) schoolMap.set(activity.schoolId, (rows = []));

    for (const detail of activity.details) {
      rows.push({
        activityLegacyId: activity.legacyId,
        activityDate: activity.activityDate,
        detailDescription: detail.description,
        qty,
        students,
      });
    }
  }

  const schoolInfoById = new Map(activities.map((a) => [a.schoolId, { name: a.school.name, districtName: a.school.district.name }]));

  const groups: DistrictSchoolGroup[] = [];
  for (const [districtId, schoolMap] of byDistrict) {
    const schools: DistrictSchoolGroupSchools[] = [];
    let total = 0;
    for (const [schoolId, rows] of schoolMap) {
      rows.sort((a, b) => a.detailDescription.localeCompare(b.detailDescription) || a.activityLegacyId - b.activityLegacyId);
      total += rows.reduce((sum, row) => sum + row.qty, 0);
      schools.push({ schoolId, schoolName: schoolInfoById.get(schoolId)?.name ?? "Unknown School", rows });
    }
    schools.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    const districtName = [...schoolMap.keys()].map((id) => schoolInfoById.get(id)?.districtName).find(Boolean) ?? "Unknown District";
    groups.push({ districtId, districtName, schools, total });
  }
  groups.sort((a, b) => a.districtName.localeCompare(b.districtName));

  return { groups, schoolYear };
}

export type PreetsFilters = { schoolYearId?: number; quarter?: Quarter; districtId?: number };
export type PreetsSubItem = { description: string; qty: number };
export type PreetsGroup = { group: string; qty: number; items: PreetsSubItem[] };
export type PreetsOtherItem = { label: string; qty: number };

// Activity by PREETS — for each ActivityItem "group" (a PREETS category),
// the total participation count and a breakdown by ActivityDetail
// description, per reports-activity-preets-sum.cfm. Three specific
// ActivityItem natural-key IDs (27 Transportation, 28 Mentoring, 38 Driver
// Training) are pulled out of their normal group into a fixed "(F) Other"
// bucket, matching the legacy report exactly.
//
// The legacy site's District filter actually links to a DIFFERENT page
// (reports-activity-preets-sum-details.cfm) that groups by Activity.preets
// instead of ActivityItem.group — an inconsistency with the main report,
// and Activity.preets' meaning isn't confirmed against any other report in
// this app. Rather than carry that inconsistency forward, the District
// filter here narrows the same ActivityItem.group-based aggregation used by
// the "All" view.
//
// QTY follows the same per-checklist-item participation counting used by
// the coordinator/district reports (see getActivityByCoordinatorDetails).
export async function getActivityByPreets(filters: PreetsFilters = {}) {
  const schoolYear = filters.schoolYearId
    ? await prisma.schoolYear.findUnique({ where: { legacyId: filters.schoolYearId } })
    : await getCurrentSchoolYear();

  let activityDate = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    activityDate = { gte: range.start, lte: range.end };
  }

  const details = await prisma.activityDetail.findMany({
    where: {
      activity: {
        deleted: false,
        activityDate,
        ...(filters.districtId ? { school: { districtId: filters.districtId } } : {}),
      },
    },
    include: {
      activityItem: true,
      activity: { include: { studentActivities: { where: { deleted: false } } } },
    },
  });

  const OTHER_LABELS: Record<number, string> = { 38: "Driver Training", 28: "Mentoring", 27: "Transportation" };
  const groupMap = new Map<string, Map<string, number>>();
  const otherTotals = new Map<number, number>([[38, 0], [28, 0], [27, 0]]);

  for (const detail of details) {
    const qty = detail.activity.studentActivities.length;
    if (detail.activityItemId in OTHER_LABELS) {
      otherTotals.set(detail.activityItemId, (otherTotals.get(detail.activityItemId) ?? 0) + qty);
      continue;
    }
    const group = detail.activityItem.group ?? "Uncategorized";
    let descMap = groupMap.get(group);
    if (!descMap) groupMap.set(group, (descMap = new Map()));
    descMap.set(detail.description, (descMap.get(detail.description) ?? 0) + qty);
  }

  const groups: PreetsGroup[] = [...groupMap.entries()]
    .map(([group, descMap]) => {
      const items = [...descMap.entries()]
        .map(([description, qty]) => ({ description, qty }))
        .sort((a, b) => a.description.localeCompare(b.description));
      const qty = items.reduce((sum, item) => sum + item.qty, 0);
      return { group, qty, items };
    })
    .sort((a, b) => a.group.localeCompare(b.group));

  const otherItems: PreetsOtherItem[] = [38, 28, 27].map((id) => ({ label: OTHER_LABELS[id], qty: otherTotals.get(id) ?? 0 }));
  const otherTotal = otherItems.reduce((sum, item) => sum + item.qty, 0);
  const grandTotal = groups.reduce((sum, group) => sum + group.qty, 0) + otherTotal;

  return { groups, otherItems, otherTotal, grandTotal, schoolYear };
}

export type EnrollmentReportFilter = "All" | "HSHT" | "Reportable";

export type SchoolEnrollmentStudent = {
  legacyId: number;
  firstName: string | null;
  lastName: string | null;
  grade: string | null;
  vocationalRehab: boolean;
  reportableStudent: boolean;
  participationId: number | null;
};

export type SchoolEnrollmentGroup = {
  schoolId: number;
  schoolName: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
  streetAddress: string;
  city: string;
  students: SchoolEnrollmentStudent[];
};

// Enrollment by School — every active student's school, per
// reports-school-enrollment.cfm, with the "Report" toggle (All / HSHT /
// Reportable) filtering on Student.reportableStudent exactly like the
// legacy page. The legacy report's "View" link opened a separate details
// page (reports-school-enrollment-details.cfm) listing that school's
// students one at a time; here the student list is fetched up front and
// shown as an expandable drill-down instead of a second page-load.
export async function getEnrollmentBySchool(reportFilter: EnrollmentReportFilter = "All") {
  const where: Prisma.StudentWhereInput = { active: true };
  if (reportFilter === "HSHT") where.reportableStudent = false;
  if (reportFilter === "Reportable") where.reportableStudent = true;

  const students = await prisma.student.findMany({
    where,
    include: { school: { include: { district: true } } },
    orderBy: { lastName: "asc" },
  });

  const participations = await prisma.studentParticipation.findMany({
    where: { studentId: { in: students.map((s) => s.legacyId) } },
  });
  const participationByStudent = new Map(participations.map((p) => [p.studentId, p.participationId]));

  const bySchool = new Map<number, SchoolEnrollmentGroup>();
  for (const student of students) {
    let group = bySchool.get(student.schoolId);
    if (!group) {
      group = {
        schoolId: student.schoolId,
        schoolName: student.school.name,
        schoolCode: student.school.schoolCode,
        districtCode: student.school.district.code,
        districtName: student.school.district.name,
        streetAddress: student.school.streetAddress,
        city: student.school.city,
        students: [],
      };
      bySchool.set(student.schoolId, group);
    }
    group.students.push({
      legacyId: student.legacyId,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      vocationalRehab: student.vocationalRehab,
      reportableStudent: student.reportableStudent,
      participationId: participationByStudent.get(student.legacyId) ?? null,
    });
  }

  return [...bySchool.values()].sort((a, b) => b.students.length - a.students.length);
}

export type DistrictEnrollmentStudent = {
  legacyId: number;
  firstName: string | null;
  lastName: string | null;
  grade: string | null;
  vocationalRehab: boolean;
  reportableStudent: boolean;
};

export type DistrictEnrollmentSchoolGroup = {
  schoolId: number;
  schoolName: string;
  students: DistrictEnrollmentStudent[];
};

export type DistrictEnrollmentGroup = {
  districtId: number;
  districtName: string;
  county: string;
  schools: DistrictEnrollmentSchoolGroup[];
  total: number;
};

// Enrollment by District — every active student's district and school, per
// reports-district-enrollment.cfm / -details.cfm. Unlike the Districts
// (Enrollment) KPI report in reports-queries.ts, the legacy page here has
// no school-year scoping at all — it's a straight count of every currently
// active student, so it's kept unscoped to match rather than folded into
// that other report.
export async function getEnrollmentByDistrict() {
  const students = await prisma.student.findMany({
    where: { active: true },
    include: { school: { include: { district: true } } },
    orderBy: [{ school: { name: "asc" } }, { lastName: "asc" }],
  });

  const byDistrict = new Map<number, DistrictEnrollmentGroup>();
  for (const student of students) {
    const districtId = student.school.districtId;
    let group = byDistrict.get(districtId);
    if (!group) {
      group = {
        districtId,
        districtName: student.school.district.name,
        county: student.school.district.county,
        schools: [],
        total: 0,
      };
      byDistrict.set(districtId, group);
    }
    let schoolGroup = group.schools.find((s) => s.schoolId === student.schoolId);
    if (!schoolGroup) {
      schoolGroup = { schoolId: student.schoolId, schoolName: student.school.name, students: [] };
      group.schools.push(schoolGroup);
    }
    schoolGroup.students.push({
      legacyId: student.legacyId,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      vocationalRehab: student.vocationalRehab,
      reportableStudent: student.reportableStudent,
    });
    group.total += 1;
  }

  return [...byDistrict.values()].sort((a, b) => b.total - a.total);
}

export type DistrictSchoolEnrollmentSchoolGroup = {
  schoolId: number;
  schoolName: string;
  total: number;
};

export type DistrictSchoolEnrollmentGroup = {
  districtId: number;
  districtName: string;
  schools: DistrictSchoolEnrollmentSchoolGroup[];
  total: number;
};

// Enrollment by District/School — every district's schools with the count
// of students enrolled there, per reports-district-schools-enrollment.cfm.
// The legacy page let a past school year fall back to a separate
// StudentArchive table (with a "quartercount" variable that was always 0 —
// dead code), and its Quarter narrowing had an off-by-one bug that widened
// Quarters 1-3 to always run through the end of the school year. Rather
// than replicate that, this scopes strictly to Student.enrollDate within
// the selected school year/quarter, matching every other report's
// enrollment counting (see getStudentsReport in reports-queries.ts).
export async function getEnrollmentByDistrictSchool(filters: CoordinatorSummaryFilters = {}) {
  const schoolYear = filters.schoolYearId
    ? await prisma.schoolYear.findUnique({ where: { legacyId: filters.schoolYearId } })
    : await getCurrentSchoolYear();

  let enrollDate = schoolYear?.beginDate ? { gte: schoolYear.beginDate, lte: schoolYear.endDate ?? undefined } : undefined;
  if (filters.quarter && schoolYear) {
    const range = getQuarterRange(schoolYear, filters.quarter);
    enrollDate = { gte: range.start, lte: range.end };
  }

  const districts = await prisma.district.findMany({
    where: { active: true, schools: { some: { students: { some: { active: true, enrollDate } } } } },
    include: {
      schools: {
        where: { active: true, students: { some: { active: true, enrollDate } } },
        include: { _count: { select: { students: { where: { active: true, enrollDate } } } } },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const groups: DistrictSchoolEnrollmentGroup[] = districts.map((district) => {
    const schools = district.schools.map((school) => ({
      schoolId: school.legacyId,
      schoolName: school.name,
      total: school._count.students,
    }));
    return {
      districtId: district.legacyId,
      districtName: district.name,
      schools,
      total: schools.reduce((sum, school) => sum + school.total, 0),
    };
  });

  return { groups, schoolYear };
}

export type DemographicsRow = {
  label: string;
  amount: number;
  percent: number | null;
};

function pct(count: number, total: number): number {
  return total === 0 ? 0 : (count / total) * 100;
}

// Enrollment Demographics — a broad snapshot of the current school year's
// active students, per reports-percentages-new.cfm / -queries.cfm.
//
// The legacy report also let you browse past school years, computing the
// same breakdown from a StudentArchive snapshot table instead of the live
// Students table. This app's StudentArchive only carries the fields the
// legacy archive itself carried forward (name, race, gender, grade,
// birthDate, county) — not the disability flags, VR/EIP/504 flags, or
// reportable/HSHT split the rest of this report needs — so a past-year
// view here would silently show 0 for most rows instead of a real number.
// Rather than ship that, this is scoped to the current school year only,
// matching the legacy page's own default (no year selected) view.
export async function getEnrollmentDemographics(): Promise<{ schoolYear: Awaited<ReturnType<typeof getCurrentSchoolYear>>; rows: DemographicsRow[] }> {
  const schoolYear = await getCurrentSchoolYear();
  if (!schoolYear?.beginDate || !schoolYear.endDate) {
    return { schoolYear, rows: [] };
  }
  const dateRange = { gte: schoolYear.beginDate, lte: schoolYear.endDate };

  const students = await prisma.student.findMany({
    where: { active: true },
    select: {
      legacyId: true,
      gender: true,
      race: true,
      grade: true,
      birthDate: true,
      reportableStudent: true,
      autism: true,
      aspergers: true,
      deaf: true,
      ebd: true,
      mobility: true,
      ohi: true,
      orthopedic: true,
      speech: true,
      sld: true,
      spinal: true,
      tbi: true,
      visual: true,
      otherDisability: true,
      section504: true,
      eip: true,
      vocationalRehab: true,
      school: { select: { districtId: true } },
    },
  });
  // Grade/gender/race are legacy nchar columns and may carry trailing
  // padding (see legacy-codes.ts) — trim before comparing against a code.
  for (const s of students) {
    s.gender = s.gender?.trim() ?? s.gender;
    s.race = s.race?.trim() ?? s.race;
    s.grade = s.grade?.trim() ?? s.grade;
  }
  const total = students.length;

  const districtIds = new Set(students.map((s) => s.school.districtId));
  const [totalSchools, districts] = await Promise.all([
    prisma.school.count(),
    prisma.district.findMany({ where: { legacyId: { in: [...districtIds] } }, select: { county: true } }),
  ]);
  const totalCounties = new Set(districts.map((d) => d.county)).size;

  const activityDetails = await prisma.activityDetail.findMany({
    where: { activity: { deleted: false, activityDate: dateRange } },
    include: { activity: { include: { studentActivities: { where: { deleted: false } } } } },
  });
  const totalTransitionServices = activityDetails.reduce((sum, detail) => sum + detail.activity.studentActivities.length, 0);

  const schoolYearBeginDate = schoolYear.beginDate;
  const schoolYearEndDate = schoolYear.endDate;
  function ageRangeYearsAgo(years: number) {
    const shift = (d: Date) => {
      const shifted = new Date(d);
      shifted.setFullYear(shifted.getFullYear() - years);
      return shifted;
    };
    return { start: shift(schoolYearBeginDate), end: shift(schoolYearEndDate) };
  }
  function countAge(minExclusive: Date | null, maxInclusive: Date) {
    return students.filter((s) => s.birthDate && s.birthDate > (minExclusive ?? new Date(0)) && s.birthDate <= maxInclusive).length;
  }
  const under14Cutoff = ageRangeYearsAgo(14).end;
  const under14 = students.filter((s) => s.birthDate && s.birthDate > under14Cutoff).length;

  const studentIds = students.map((s) => s.legacyId);
  const twelfthGrade = students.filter((s) => s.grade === "5").length;
  const [graduated, postSecondary] = await Promise.all([
    // Unlike every other row here, the legacy query doesn't scope this to
    // active students — a student who graduated may since be marked
    // inactive, and this is meant to count them anyway.
    prisma.studentOutcome.count({
      where: { graduated: true, graduateDate: dateRange },
    }),
    prisma.studentOutcome.count({
      where: { postSecondary: { not: "" }, studentId: { in: studentIds } },
    }),
  ]);

  const grade = (code: string) => students.filter((s) => s.grade === code).length;

  const rows: DemographicsRow[] = [
    { label: "Total Students", amount: total, percent: null },
    { label: "Total Students (HSHT)", amount: students.filter((s) => !s.reportableStudent).length, percent: null },
    { label: "Total Students (Reportable)", amount: students.filter((s) => s.reportableStudent).length, percent: null },
    { label: "Total High Schools", amount: totalSchools, percent: null },
    { label: "Total Counties", amount: totalCounties, percent: null },
    { label: "Total School Systems", amount: districtIds.size, percent: null },
    { label: "Total Transition Services", amount: totalTransitionServices, percent: null },
    { label: "Male", amount: students.filter((s) => s.gender === "1").length, percent: pct(students.filter((s) => s.gender === "1").length, total) },
    { label: "Female", amount: students.filter((s) => s.gender === "0").length, percent: pct(students.filter((s) => s.gender === "0").length, total) },
    { label: "Black", amount: students.filter((s) => s.race === "3").length, percent: pct(students.filter((s) => s.race === "3").length, total) },
    { label: "White", amount: students.filter((s) => s.race === "5").length, percent: pct(students.filter((s) => s.race === "5").length, total) },
    {
      label: "Multiracial or Other",
      amount: students.filter((s) => s.race !== "3" && s.race !== "5").length,
      percent: pct(students.filter((s) => s.race !== "3" && s.race !== "5").length, total),
    },
    { label: "8th Grade", amount: grade("1"), percent: pct(grade("1"), total) },
    { label: "9th Grade", amount: grade("2"), percent: pct(grade("2"), total) },
    { label: "10th Grade", amount: grade("3"), percent: pct(grade("3"), total) },
    { label: "11th Grade", amount: grade("4"), percent: pct(grade("4"), total) },
    { label: "12th Grade", amount: grade("5"), percent: pct(grade("5"), total) },
    { label: "Other (Out of School)", amount: grade("6"), percent: pct(grade("6"), total) },
    { label: "Under 14 years", amount: under14, percent: pct(under14, total) },
    ...[14, 15, 16, 17, 18, 19, 20, 21, 22].map((age) => {
      const range = ageRangeYearsAgo(age);
      const count = countAge(range.start, range.end);
      return { label: `${age} years`, amount: count, percent: pct(count, total) };
    }),
    { label: "Autism", amount: students.filter((s) => s.autism).length, percent: pct(students.filter((s) => s.autism).length, total) },
    { label: "Asperger's", amount: students.filter((s) => s.aspergers).length, percent: pct(students.filter((s) => s.aspergers).length, total) },
    { label: "Deaf/hard of hearing", amount: students.filter((s) => s.deaf).length, percent: pct(students.filter((s) => s.deaf).length, total) },
    { label: "Emotional Behavioral Disorder", amount: students.filter((s) => s.ebd).length, percent: pct(students.filter((s) => s.ebd).length, total) },
    { label: "Mobility", amount: students.filter((s) => s.mobility).length, percent: pct(students.filter((s) => s.mobility).length, total) },
    { label: "Orthopedic impairment", amount: students.filter((s) => s.orthopedic).length, percent: pct(students.filter((s) => s.orthopedic).length, total) },
    { label: "Other", amount: students.filter((s) => s.otherDisability).length, percent: pct(students.filter((s) => s.otherDisability).length, total) },
    { label: "Other health impairment", amount: students.filter((s) => s.ohi).length, percent: pct(students.filter((s) => s.ohi).length, total) },
    { label: "Specific learning disability", amount: students.filter((s) => s.sld).length, percent: pct(students.filter((s) => s.sld).length, total) },
    { label: "Speech or language impairment", amount: students.filter((s) => s.speech).length, percent: pct(students.filter((s) => s.speech).length, total) },
    { label: "Spinal cord injury", amount: students.filter((s) => s.spinal).length, percent: pct(students.filter((s) => s.spinal).length, total) },
    { label: "Traumatic brain injury", amount: students.filter((s) => s.tbi).length, percent: pct(students.filter((s) => s.tbi).length, total) },
    { label: "Visual impairment", amount: students.filter((s) => s.visual).length, percent: pct(students.filter((s) => s.visual).length, total) },
    {
      label: "Vocational Rehabilitation",
      amount: students.filter((s) => s.vocationalRehab).length,
      percent: pct(students.filter((s) => s.vocationalRehab).length, total),
    },
    { label: "Have EIP", amount: students.filter((s) => s.eip).length, percent: pct(students.filter((s) => s.eip).length, total) },
    { label: "Have 504", amount: students.filter((s) => s.section504).length, percent: pct(students.filter((s) => s.section504).length, total) },
    { label: `Graduated (${schoolYear.label})`, amount: graduated, percent: pct(graduated, twelfthGrade) },
    { label: "Post Secondary", amount: postSecondary, percent: pct(postSecondary, total) },
  ];

  return { schoolYear, rows };
}
