import { requireUser } from "@/lib/authz";
import { getDistrictsEnrollmentReport } from "@/lib/reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const { districts } = await getDistrictsEnrollmentReport();

  const rows = districts.flatMap((district) =>
    district.schools.flatMap((school) =>
      school.students.map((s) => ({
        district: district.name,
        county: district.county,
        school: school.name,
        pid: s.legacyId,
        firstName: s.firstName ?? "",
        lastName: s.lastName ?? "",
        enrollDate: s.enrollDate ? s.enrollDate.toLocaleDateString() : "",
      }))
    )
  );

  const buffer = await buildWorkbookBuffer(
    "Districts - Enrollment",
    [
      { header: "District", key: "district", width: 26 },
      { header: "County", key: "county", width: 16 },
      { header: "School", key: "school", width: 28 },
      { header: "PID", key: "pid", width: 10 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "Enroll Date", key: "enrollDate", width: 14 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("districts-enrollment-report.xlsx") });
}
