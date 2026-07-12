import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type StudentStatusFilter = "all" | "active" | "inactive";

export async function getStudentsList({
  q,
  status,
  page,
  pageSize,
}: {
  q: string;
  status: StudentStatusFilter;
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
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total };
}
