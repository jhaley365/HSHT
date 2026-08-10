import type { ActivityStatusFilter } from "@/lib/activity-queries";

export const DEFAULT_STATUS: ActivityStatusFilter = "open";

export function buildActivityListHref(params: { status: ActivityStatusFilter; page: number }) {
  const sp = new URLSearchParams();
  if (params.status !== DEFAULT_STATUS) sp.set("status", params.status);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/activity/list?${qs}` : "/activity/list";
}
