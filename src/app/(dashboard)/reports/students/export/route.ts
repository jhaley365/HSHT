import { requireUser } from "@/lib/authz";
import { getStudentsReport } from "@/lib/reports-queries";
import { isQuarter } from "@/lib/reports/quarters";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";
import { formatGrade, formatGender } from "@/lib/legacy-codes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const quarterParam = searchParams.get("quarter");
  const quarter = isQuarter(quarterParam) ? quarterParam : undefined;
  const { students } = await getStudentsReport(quarter);

  const buffer = await buildWorkbookBuffer(
    "Students",
    [
      { header: "PID", key: "pid", width: 10 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "School", key: "school", width: 28 },
      { header: "District", key: "district", width: 24 },
      { header: "Grade", key: "grade", width: 22 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Enroll Date", key: "enrollDate", width: 14 },
    ],
    students.map((s) => ({
      pid: s.legacyId,
      firstName: s.firstName ?? "",
      lastName: s.lastName ?? "",
      school: s.school.name,
      district: s.school.district.name,
      grade: formatGrade(s.grade),
      gender: formatGender(s.gender),
      enrollDate: s.enrollDate ? s.enrollDate.toLocaleDateString() : "",
    }))
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("students-report.xlsx") });
}
