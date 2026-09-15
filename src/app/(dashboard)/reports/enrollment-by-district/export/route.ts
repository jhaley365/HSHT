import { requireUser } from "@/lib/authz";
import { getEnrollmentByDistrict } from "@/lib/legacy-reports-queries";
import { formatGrade } from "@/lib/legacy-codes";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const groups = await getEnrollmentByDistrict();

  const rows = groups.flatMap((group) =>
    group.schools.flatMap((school) =>
      school.students.map((student) => ({
        district: group.districtName,
        county: group.county,
        school: school.schoolName,
        lastName: student.lastName,
        firstName: student.firstName,
        grade: formatGrade(student.grade),
        reportable: student.reportableStudent ? "Reportable" : "HSHT",
        vr: student.vocationalRehab ? "YES" : "",
      }))
    )
  );

  const buffer = await buildWorkbookBuffer(
    "Enrollment by District",
    [
      { header: "District", key: "district", width: 22 },
      { header: "County", key: "county", width: 16 },
      { header: "School", key: "school", width: 28 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Grade", key: "grade", width: 20 },
      { header: "Type", key: "reportable", width: 12 },
      { header: "VR", key: "vr", width: 8 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("enrollment-by-district.xlsx") });
}
