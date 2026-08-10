import { prisma } from "@/lib/prisma";

export type ActivityStatusFilter = "open" | "closed";

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
  const where = { deleted: false, closed: status === "closed" };
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
  return { activities, total, pageSize: ACTIVITY_PAGE_SIZE };
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

export async function getVendorsList() {
  return prisma.vendor.findMany({ orderBy: { vendorCode: "asc" } });
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({ where: { id } });
}
