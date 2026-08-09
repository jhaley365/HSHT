import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type DistrictStatusFilter = "all" | "active" | "inactive";
export type DistrictSortKey = "code" | "name" | "county";
export type SortDir = "asc" | "desc";

function buildOrderBy(sort: DistrictSortKey, dir: SortDir): Prisma.DistrictOrderByWithRelationInput[] {
  const primary: Prisma.DistrictOrderByWithRelationInput =
    sort === "name" ? { name: dir } : sort === "county" ? { county: dir } : { code: dir };

  // Stable secondary ordering so rows with equal primary values don't jump
  // around between page loads.
  if (sort === "code") return [primary, { name: "asc" }];
  return [primary, { code: "asc" }];
}

export async function getDistrictsList({
  q,
  status,
  sort,
  dir,
  page,
  pageSize,
}: {
  q: string;
  status: DistrictStatusFilter;
  sort: DistrictSortKey;
  dir: SortDir;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.DistrictWhereInput = {};
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { county: { contains: q, mode: "insensitive" } },
    ];
  }

  const [districts, total] = await Promise.all([
    prisma.district.findMany({
      where,
      orderBy: buildOrderBy(sort, dir),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.district.count({ where }),
  ]);

  return { districts, total };
}

// cache() dedupes this if a future detail page adds more sections that also
// need the district profile within the same request.
export const getDistrictProfile = cache(async (id: string) => {
  return prisma.district.findUnique({
    where: { id },
    include: { schools: { orderBy: { schoolCode: "asc" } } },
  });
});
