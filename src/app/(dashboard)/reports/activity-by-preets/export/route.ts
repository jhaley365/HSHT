import { requireUser } from "@/lib/authz";
import { getActivityByPreets } from "@/lib/legacy-reports-queries";
import { isQuarter } from "@/lib/reports/quarters";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const schoolYearIdParam = searchParams.get("schoolYearId");
  const quarterParam = searchParams.get("quarter");
  const districtIdParam = searchParams.get("districtId");
  const { groups, otherItems, otherTotal, grandTotal } = await getActivityByPreets({
    schoolYearId: schoolYearIdParam ? Number(schoolYearIdParam) : undefined,
    quarter: isQuarter(quarterParam) ? quarterParam : undefined,
    districtId: districtIdParam ? Number(districtIdParam) : undefined,
  });

  const rows = [
    ...groups.flatMap((group) => group.items.map((item) => ({ group: group.group, item: item.description, qty: item.qty }))),
    ...(otherTotal > 0 ? otherItems.map((item) => ({ group: "(F) Other", item: item.label, qty: item.qty })) : []),
    { group: "", item: "Grand Total", qty: grandTotal },
  ];

  const buffer = await buildWorkbookBuffer(
    "Activity by PREETS",
    [
      { header: "PREETS", key: "group", width: 28 },
      { header: "Item", key: "item", width: 32 },
      { header: "Qty", key: "qty", width: 8 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("activity-by-preets.xlsx") });
}
