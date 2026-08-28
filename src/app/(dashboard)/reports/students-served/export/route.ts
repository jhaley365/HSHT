import { requireUser } from "@/lib/authz";
import { getStudentsServedReport } from "@/lib/reports-queries";
import { isQuarter } from "@/lib/reports/quarters";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";
import { formatGrade, formatGender } from "@/lib/legacy-codes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const quarterParam = searchParams.get("quarter");
  const schoolIdParam = searchParams.get("schoolId");
  const districtIdParam = searchParams.get("districtId");
  const { participations } = await getStudentsServedReport({
    quarter: isQuarter(quarterParam) ? quarterParam : undefined,
    schoolId: schoolIdParam ? Number(schoolIdParam) : undefined,
    districtId: districtIdParam ? Number(districtIdParam) : undefined,
    grade: searchParams.get("grade") || undefined,
    gender: searchParams.get("gender") || undefined,
  });

  const buffer = await buildWorkbookBuffer(
    "Students Served",
    [
      { header: "PID", key: "pid", width: 10 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "School", key: "school", width: 28 },
      { header: "District", key: "district", width: 24 },
      { header: "Grade", key: "grade", width: 22 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Activity", key: "activity", width: 28 },
      { header: "Activity Date", key: "activityDate", width: 14 },
    ],
    participations.map((p) => ({
      pid: p.student.legacyId,
      firstName: p.student.firstName ?? "",
      lastName: p.student.lastName ?? "",
      school: p.student.school.name,
      district: p.student.school.district.name,
      grade: formatGrade(p.student.grade),
      gender: formatGender(p.student.gender),
      activity: p.activity.name,
      activityDate: p.activity.activityDate ? p.activity.activityDate.toLocaleDateString() : "",
    }))
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("students-served-report.xlsx") });
}
