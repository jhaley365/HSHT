import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type SchoolStatusFilter = "all" | "active" | "inactive";
export type SchoolSortKey = "code" | "name" | "type" | "county";
export type SortDir = "asc" | "desc";

function buildOrderBy(sort: SchoolSortKey, dir: SortDir): Prisma.SchoolOrderByWithRelationInput[] {
  const primary: Prisma.SchoolOrderByWithRelationInput =
    sort === "name"
      ? { name: dir }
      : sort === "type"
        ? { schoolType: dir }
        : sort === "county"
          ? { district: { county: dir } }
          : { district: { code: dir } };

  // Stable secondary ordering so rows with equal primary values don't jump
  // around between page loads.
  if (sort === "code") return [primary, { schoolCode: "asc" }];
  return [primary, { district: { code: "asc" } }, { schoolCode: "asc" }];
}

export async function getSchoolsList({
  q,
  status,
  sort,
  dir,
  page,
  pageSize,
}: {
  q: string;
  status: SchoolStatusFilter;
  sort: SchoolSortKey;
  dir: SortDir;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.SchoolWhereInput = {};
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { district: { county: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where,
      include: { district: true },
      orderBy: buildOrderBy(sort, dir),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.school.count({ where }),
  ]);

  return { schools, total };
}

// cache() dedupes this if a future detail page adds more sections that also
// need the school profile within the same request.
export const getSchoolProfile = cache(async (id: string) => {
  return prisma.school.findUnique({
    where: { id },
    include: { district: true },
  });
});
