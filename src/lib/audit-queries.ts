import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@/generated/prisma/client";

const AUDIT_PAGE_SIZE = 50;

export type AuditActionFilter = AuditAction | "ALL";

export async function getAuditEventsList({ action, page }: { action: AuditActionFilter; page: number }) {
  const where: Prisma.AuditEventWhereInput = action === "ALL" ? {} : { action };

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return { events, total, pageSize: AUDIT_PAGE_SIZE };
}
