import { requireUser } from "@/lib/authz";
import { getEnrollmentDemographics } from "@/lib/legacy-reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const { rows } = await getEnrollmentDemographics();

  const buffer = await buildWorkbookBuffer(
    "Enrollment Demographics",
    [
      { header: "Item", key: "label", width: 32 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Percentage", key: "percent", width: 14 },
    ],
    rows.map((row) => ({ label: row.label, amount: row.amount, percent: row.percent === null ? "" : `${row.percent.toFixed(1)}%` }))
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("enrollment-demographics.xlsx") });
}
