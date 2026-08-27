import { KpiCard } from "@/components/dashboard/KpiCard";
import { EnrollmentChart } from "@/components/dashboard/EnrollmentChart";
import { TopEnrollmentPanel } from "@/components/dashboard/TopEnrollmentPanel";
import { ActivitySchedule } from "@/components/dashboard/ActivitySchedule";
import { getKpis } from "@/lib/dashboard-data";
import { getCoverageStats, getTopEnrollmentSchools, getEnrollmentTrend } from "@/lib/db-queries";
import { getUpcomingOpenActivities } from "@/lib/activity-queries";

// Queries the database, so this can't be statically generated at build time
// (no DATABASE_URL / network access to Postgres during the Docker build).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [coverage, topSchools, trend, upcomingActivities] = await Promise.all([
    getCoverageStats(),
    getTopEnrollmentSchools(),
    getEnrollmentTrend(),
    getUpcomingOpenActivities(),
  ]);
  const kpis = getKpis(coverage);

  return (
    <>
      {coverage.schoolYearLabel && (
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          All figures below reflect the {coverage.schoolYearLabel} school year
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} kpi={kpi} />
        ))}
      </div>

      <div className="flex items-stretch gap-5">
        <EnrollmentChart trend={trend} />
        <TopEnrollmentPanel schools={topSchools} />
      </div>

      <ActivitySchedule activities={upcomingActivities} schoolYearLabel={trend.schoolYearLabel} />
    </>
  );
}
