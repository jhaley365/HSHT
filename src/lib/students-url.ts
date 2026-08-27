import type { StudentStatusFilter, StudentSortKey, SortDir } from "@/lib/students-queries";

export const DEFAULT_SORT: StudentSortKey = "lastName";
export const DEFAULT_DIR: SortDir = "asc";

export function buildStudentsHref(params: {
  q: string;
  status: StudentStatusFilter;
  districtId?: number;
  schoolId?: number;
  grade?: string;
  gender?: string;
  sort: StudentSortKey;
  dir: SortDir;
  page: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.districtId) sp.set("districtId", String(params.districtId));
  if (params.schoolId) sp.set("schoolId", String(params.schoolId));
  if (params.grade) sp.set("grade", params.grade);
  if (params.gender) sp.set("gender", params.gender);
  if (params.sort !== DEFAULT_SORT) sp.set("sort", params.sort);
  if (params.dir !== DEFAULT_DIR) sp.set("dir", params.dir);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/students?${qs}` : "/students";
}
