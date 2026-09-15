import { requireUser } from "@/lib/authz";
import { getStudentActivityParticipated } from "@/lib/legacy-reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const schoolYearIdParam = searchParams.get("schoolYearId");
  const { rows } = await getStudentActivityParticipated({
    schoolYearId: schoolYearIdParam ? Number(schoolYearIdParam) : undefined,
  });

  const buffer = await buildWorkbookBuffer(
    "Student Activity Participated",
    [
      { header: "ID", key: "studentLegacyId", width: 10 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "School", key: "schoolName", width: 28 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("student-activity-participated.xlsx") });
}
