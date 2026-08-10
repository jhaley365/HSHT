import { requireUser } from "@/lib/authz";
import { getSchoolsEnrollmentReport } from "@/lib/reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const { schools } = await getSchoolsEnrollmentReport();

  const rows = schools.flatMap((school) =>
    school.students.map((s) => ({
      school: school.name,
      district: school.district.name,
      pid: s.legacyId,
      firstName: s.firstName ?? "",
      lastName: s.lastName ?? "",
      enrollDate: s.enrollDate ? s.enrollDate.toLocaleDateString() : "",
    }))
  );

  const buffer = await buildWorkbookBuffer(
    "Schools - Enrollment",
    [
      { header: "School", key: "school", width: 28 },
      { header: "District", key: "district", width: 26 },
      { header: "PID", key: "pid", width: 10 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "Enroll Date", key: "enrollDate", width: 14 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("schools-enrollment-report.xlsx") });
}
