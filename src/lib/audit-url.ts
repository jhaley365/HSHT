import type { AuditActionFilter } from "@/lib/audit-queries";

export const DEFAULT_AUDIT_ACTION: AuditActionFilter = "ALL";

export function buildAuditListHref(params: { action: AuditActionFilter; page: number }) {
  const sp = new URLSearchParams();
  if (params.action !== DEFAULT_AUDIT_ACTION) sp.set("action", params.action);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/audit?${qs}` : "/audit";
}
