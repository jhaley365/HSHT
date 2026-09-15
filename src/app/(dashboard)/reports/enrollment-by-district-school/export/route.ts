import { requireUser } from "@/lib/authz";
import { getEnrollmentByDistrictSchool } from "@/lib/legacy-reports-queries";
import { isQuarter } from "@/lib/reports/quarters";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const schoolYearIdParam = searchParams.get("schoolYearId");
  const quarterParam = searchParams.get("quarter");
  const { groups } = await getEnrollmentByDistrictSchool({
    schoolYearId: schoolYearIdParam ? Number(schoolYearIdParam) : undefined,
    quarter: isQuarter(quarterParam) ? quarterParam : undefined,
  });

  const rows = groups.flatMap((group) =>
    group.schools.map((school) => ({
      district: group.districtName,
      school: school.schoolName,
      total: school.total,
    }))
  );

  const buffer = await buildWorkbookBuffer(
    "Enrollment by District-School",
    [
      { header: "School District", key: "district", width: 24 },
      { header: "School Name", key: "school", width: 28 },
      { header: "Students Enrolled", key: "total", width: 16 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("enrollment-by-district-school.xlsx") });
}
