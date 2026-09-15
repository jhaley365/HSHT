import { requireUser } from "@/lib/authz";
import { getActivityByCoordinatorSummary } from "@/lib/legacy-reports-queries";
import { isQuarter } from "@/lib/reports/quarters";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const schoolYearIdParam = searchParams.get("schoolYearId");
  const quarterParam = searchParams.get("quarter");
  const { groups } = await getActivityByCoordinatorSummary({
    schoolYearId: schoolYearIdParam ? Number(schoolYearIdParam) : undefined,
    quarter: isQuarter(quarterParam) ? quarterParam : undefined,
  });

  const rows = groups.flatMap((group) =>
    group.schools.flatMap((school) =>
      school.items.map((item) => ({
        coordinator: group.coordinatorName,
        school: school.schoolName,
        activity: item.name,
        description: item.description,
        qty: item.qty,
      }))
    )
  );

  const buffer = await buildWorkbookBuffer(
    "Activity by Coordinator",
    [
      { header: "HSHT Coordinator", key: "coordinator", width: 22 },
      { header: "School", key: "school", width: 28 },
      { header: "Activity", key: "activity", width: 28 },
      { header: "Description", key: "description", width: 32 },
      { header: "Qty", key: "qty", width: 8 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("activity-by-coordinator-summary.xlsx") });
}
