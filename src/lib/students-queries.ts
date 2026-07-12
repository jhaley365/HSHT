import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type StudentStatusFilter = "all" | "active" | "inactive";
export type StudentSortKey = "type" | "firstName" | "lastName" | "school";
export type SortDir = "asc" | "desc";

function buildOrderBy(sort: StudentSortKey, dir: SortDir): Prisma.StudentOrderByWithRelationInput[] {
  const primary: Prisma.StudentOrderByWithRelationInput =
    sort === "type"
      ? { reportableStudent: dir }
      : sort === "firstName"
        ? { firstName: dir }
        : sort === "school"
          ? { school: { name: dir } }
          : { lastName: dir };

  // Stable secondary ordering so rows with equal primary values don't jump
  // around between page loads.
  if (sort === "lastName") return [primary, { firstName: "asc" }];
  return [primary, { lastName: "asc" }, { firstName: "asc" }];
}

export async function getStudentsList({
  q,
  status,
  sort,
  dir,
  page,
  pageSize,
}: {
  q: string;
  status: StudentStatusFilter;
  sort: StudentSortKey;
  dir: SortDir;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.StudentWhereInput = {};
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { school: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { school: true },
      orderBy: buildOrderBy(sort, dir),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total };
}
