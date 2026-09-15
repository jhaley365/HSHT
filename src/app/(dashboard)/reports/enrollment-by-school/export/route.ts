import { requireUser } from "@/lib/authz";
import { getEnrollmentBySchool, type EnrollmentReportFilter } from "@/lib/legacy-reports-queries";
import { formatGrade } from "@/lib/legacy-codes";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

function parseReportFilter(value: string | null): EnrollmentReportFilter {
  return value === "HSHT" || value === "Reportable" ? value : "All";
}

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const report = parseReportFilter(searchParams.get("report"));
  const groups = await getEnrollmentBySchool(report);

  const rows = groups.flatMap((group) =>
    group.students.map((student) => ({
      district: group.districtName,
      school: group.schoolName,
      schoolCode: `${group.districtCode}-${group.schoolCode}`,
      lastName: student.lastName,
      firstName: student.firstName,
      grade: formatGrade(student.grade),
      reportable: student.reportableStudent ? "Reportable" : "HSHT",
      vr: student.vocationalRehab ? "YES" : "",
      pid: student.participationId ?? "",
    }))
  );

  const buffer = await buildWorkbookBuffer(
    "Enrollment by School",
    [
      { header: "District", key: "district", width: 22 },
      { header: "School", key: "school", width: 28 },
      { header: "School Code", key: "schoolCode", width: 14 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Grade", key: "grade", width: 20 },
      { header: "Type", key: "reportable", width: 12 },
      { header: "VR", key: "vr", width: 8 },
      { header: "PID", key: "pid", width: 10 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("enrollment-by-school.xlsx") });
}
