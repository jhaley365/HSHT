import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type ActivityStatusFilter = "open" | "closed";

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

export async function getActivityItemsGrouped() {
  const items = await prisma.activityItem.findMany({
    where: { enabled: true },
    orderBy: [{ group: "asc" }, { description: "asc" }],
  });

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([group, groupItems]) => ({ group, items: groupItems }));
}

export async function getSchoolOptions() {
  return prisma.school.findMany({
    where: { active: true },
    select: { legacyId: true, name: true, schoolCode: true, district: { select: { code: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCoordinatorOptions() {
  return prisma.coordinator.findMany({
    where: { active: true },
    select: { legacyId: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });
}

export async function getVendorOptions() {
  return prisma.vendor.findMany({
    select: { legacyId: true, vendorCode: true, name: true },
    orderBy: { vendorCode: "asc" },
  });
}

const ACTIVITY_PAGE_SIZE = 25;

export async function getActivitiesList({ status, page }: { status: ActivityStatusFilter; page: number }) {
  const where: Prisma.ActivityWhereInput = { deleted: false, closed: status === "closed" };

  // "Open" means currently active — scope it to the current school year so
  // legacy rows that were simply never marked closed (some go back to
  // 2018) don't clutter the list. "Closed" stays unscoped since browsing
  // closed activities across all years is legitimate historical lookup.
  let schoolYear = null;
  if (status === "open") {
    schoolYear = await getCurrentSchoolYear();
    if (schoolYear) {
      where.activityDate = { gte: schoolYear.beginDate ?? undefined, lte: schoolYear.endDate ?? undefined };
    }
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: { school: true },
      orderBy: { activityDate: "desc" },
      skip: (page - 1) * ACTIVITY_PAGE_SIZE,
      take: ACTIVITY_PAGE_SIZE,
    }),
    prisma.activity.count({ where }),
  ]);
  return { activities, total, pageSize: ACTIVITY_PAGE_SIZE, schoolYear };
}

export async function getActivityById(id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      school: { include: { district: true } },
      details: { include: { activityItem: true }, orderBy: { legacyId: "asc" } },
    },
  });
  if (!activity) return null;

  const [coordinator, vendors] = await Promise.all([
    activity.coordinatorId
      ? prisma.coordinator.findUnique({ where: { legacyId: activity.coordinatorId } })
      : Promise.resolve(null),
    prisma.vendor.findMany({ select: { vendorCode: true, name: true } }),
  ]);
  const vendorNameByCode = new Map(vendors.filter((v) => v.vendorCode).map((v) => [v.vendorCode as string, v.name]));

  return { activity, coordinator, vendorNameByCode };
}

// Full active roster at the activity's school, flagged with whether each
// student already has a (non-deleted) StudentActivity row for this
// activity — backs the "Students Assigned" checklist on the detail page.
export async function getSchoolRosterWithAssignment(activityLegacyId: number, schoolId: number) {
  const [students, assignments] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId, active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.studentActivity.findMany({
      where: { activityId: activityLegacyId, deleted: false },
      select: { studentId: true },
    }),
  ]);
  const assignedIds = new Set(assignments.map((a) => a.studentId));
  return students.map((s) => ({ ...s, assigned: assignedIds.has(s.legacyId) }));
}

// Just the assigned students, in sign-in-sheet order — used by the
// printable sheet, which doesn't need the rest of the school roster.
export async function getAssignedStudentsForSignIn(activityLegacyId: number) {
  const assignments = await prisma.studentActivity.findMany({
    where: { activityId: activityLegacyId, deleted: false },
    include: { student: true },
  });
  return assignments
    .map((a) => a.student)
    .sort(
      (a, b) => (a.lastName ?? "").localeCompare(b.lastName ?? "") || (a.firstName ?? "").localeCompare(b.firstName ?? "")
    );
}

export async function getVendorsList() {
  return prisma.vendor.findMany({ orderBy: { vendorCode: "asc" } });
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({ where: { id } });
}
