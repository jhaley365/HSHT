// Data-fetching for reports migrated from the legacy ColdFusion "Reports"
// section (see reports-coordinator-activity-sum-2.cfm et al. in the legacy
// site export). Unlike the KPI-linked reports in reports-queries.ts, these
// aren't tied to a Home dashboard number — they support browsing any past
// school year, not just the current one, matching the legacy app's own
// School Year dropdown.
import { prisma } from "@/lib/prisma";
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
