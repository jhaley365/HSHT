import type { DistrictStatusFilter, DistrictSortKey, SortDir } from "@/lib/districts-queries";

export const DEFAULT_SORT: DistrictSortKey = "code";
export const DEFAULT_DIR: SortDir = "asc";

export function buildDistrictsHref(params: {
  q: string;
  status: DistrictStatusFilter;
  schoolId?: number;
  county?: string;
  sort: DistrictSortKey;
  dir: SortDir;
  page: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.schoolId) sp.set("schoolId", String(params.schoolId));
  if (params.county) sp.set("county", params.county);
  if (params.sort !== DEFAULT_SORT) sp.set("sort", params.sort);
  if (params.dir !== DEFAULT_DIR) sp.set("dir", params.dir);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/districts?${qs}` : "/districts";
}
