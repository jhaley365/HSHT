import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/generated/prisma/client";

// Records a row in the app's own audit trail (see prisma/schema.prisma's
// AuditEvent model for why this is separate from the legacy AuditLog).
// Swallows its own errors — an audit write failing must never break the
// action it's recording (a login, a delete, etc.).
export async function recordAuditEvent(params: {
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  summary: string;
}) {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        actorName: params.actorName ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        summary: params.summary,
      },
    });
  } catch (err) {
    console.error("Failed to record audit event:", err);
  }
}
