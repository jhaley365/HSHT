import type { SchoolStatusFilter, SchoolSortKey, SortDir } from "@/lib/schools-queries";

export const DEFAULT_SORT: SchoolSortKey = "code";
export const DEFAULT_DIR: SortDir = "asc";

export function buildSchoolsHref(params: {
  q: string;
  status: SchoolStatusFilter;
  districtId?: number;
  county?: string;
  sort: SchoolSortKey;
  dir: SortDir;
  page: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.districtId) sp.set("districtId", String(params.districtId));
  if (params.county) sp.set("county", params.county);
  if (params.sort !== DEFAULT_SORT) sp.set("sort", params.sort);
  if (params.dir !== DEFAULT_DIR) sp.set("dir", params.dir);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/schools?${qs}` : "/schools";
}
