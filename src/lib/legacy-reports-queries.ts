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
