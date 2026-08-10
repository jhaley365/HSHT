import { requireUser } from "@/lib/authz";
import { getDistrictsActivitiesReport } from "@/lib/reports-queries";
import { buildWorkbookBuffer, xlsxResponseHeaders } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const { districts } = await getDistrictsActivitiesReport();

  const rows = districts.flatMap((district) =>
    district.schools.flatMap((school) =>
      school.activities.flatMap((activity) => {
        const base = {
          district: district.name,
          county: district.county,
          school: school.name,
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
    )
  );

  const buffer = await buildWorkbookBuffer(
    "Districts - Activities",
    [
      { header: "District", key: "district", width: 26 },
      { header: "County", key: "county", width: 16 },
      { header: "School", key: "school", width: 28 },
      { header: "Activity", key: "activity", width: 28 },
      { header: "Activity Date", key: "activityDate", width: 14 },
      { header: "PID", key: "pid", width: 10 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
    ],
    rows
  );

  return new Response(buffer, { headers: xlsxResponseHeaders("districts-activities-report.xlsx") });
}
