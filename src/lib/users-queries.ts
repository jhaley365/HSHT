import { prisma } from "@/lib/prisma";

export async function getUsersList() {
  return prisma.user.findMany({
    orderBy: [{ active: "desc" }, { email: "asc" }],
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
