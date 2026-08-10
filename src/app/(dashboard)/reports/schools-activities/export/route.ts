import { requireUser } from "@/lib/authz";
import { getSchoolsActivitiesReport } from "@/lib/reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const { schools } = await getSchoolsActivitiesReport();

  const rows = schools.flatMap((school) =>
    school.activities.flatMap((activity) => {
      const base = {
        school: school.name,
        district: school.district.name,
        activity: activity.name,
        activityDate: activity.activityDate ? activity.activityDate.toLocaleDateString() : "",
      };
      if (activity.studentActivities.length === 0) {
        return [{ ...base, pid: "", firstName: "", lastName: "" }];
      }
      return activity.studentActivities.map((sa) => ({
        ...base,
        pid: String(sa.student.legacyId),
        firstName: sa.student.firstName ?? "",
        lastName: sa.student.lastName ?? "",
      }));
    })
  );

  const buffer = await buildWorkbookBuffer(
    "Schools - Activities",
    [
      { header: "School", key: "school", width: 28 },
      { header: "District", key: "district", width: 26 },
      { header: "Activity", key: "activity", width: 28 },
      { header: "Activity Date", key: "activityDate", width: 14 },
      { header: "PID", key: "pid", width: 10 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("schools-activities-report.xlsx") });
}
