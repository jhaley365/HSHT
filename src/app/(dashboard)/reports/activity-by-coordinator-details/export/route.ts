import { requireUser } from "@/lib/authz";
import { getActivityByCoordinatorDetails } from "@/lib/legacy-reports-queries";
import { isQuarter } from "@/lib/reports/quarters";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).format(date);
}

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const schoolYearIdParam = searchParams.get("schoolYearId");
  const quarterParam = searchParams.get("quarter");
  const { groups } = await getActivityByCoordinatorDetails({
    schoolYearId: schoolYearIdParam ? Number(schoolYearIdParam) : undefined,
    quarter: isQuarter(quarterParam) ? quarterParam : undefined,
  });

  const rows = groups.flatMap((group) =>
    group.schools.flatMap((school) =>
      school.rows.map((row) => ({
        coordinator: group.coordinatorName,
        school: school.schoolName,
        activityId: row.activityLegacyId,
        activityDate: formatDate(row.activityDate),
        activity: row.activityDescription,
        item: row.detailDescription,
        qty: row.qty,
      }))
    )
  );

  const buffer = await buildWorkbookBuffer(
    "Activity Detail by Coordinator",
    [
      { header: "HSHT Coordinator", key: "coordinator", width: 22 },
      { header: "School", key: "school", width: 28 },
      { header: "Activity ID", key: "activityId", width: 12 },
      { header: "Activity Date", key: "activityDate", width: 14 },
      { header: "Activity", key: "activity", width: 32 },
      { header: "Item", key: "item", width: 32 },
      { header: "Qty", key: "qty", width: 8 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("activity-by-coordinator-details.xlsx") });
}
