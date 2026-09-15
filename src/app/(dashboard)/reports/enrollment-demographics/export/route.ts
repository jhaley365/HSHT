import { requireUser } from "@/lib/authz";
import { getEnrollmentDemographics } from "@/lib/legacy-reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const schoolYearIdParam = searchParams.get("schoolYearId");
  const { rows } = await getEnrollmentDemographics(schoolYearIdParam ? Number(schoolYearIdParam) : undefined);

  const buffer = await buildWorkbookBuffer(
    "Enrollment Demographics",
    [
      { header: "Item", key: "label", width: 32 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Percentage", key: "percent", width: 14 },
    ],
    rows.map((row) => ({
      label: row.label,
      amount: row.unavailable ? "N/A" : row.amount,
      percent: row.unavailable ? "N/A" : row.percent === null ? "" : `${row.percent.toFixed(1)}%`,
    }))
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("enrollment-demographics.xlsx") });
}
