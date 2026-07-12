import { KpiCard } from "@/components/dashboard/KpiCard";
import { EnrollmentChart } from "@/components/dashboard/EnrollmentChart";
import { TopEnrollmentPanel } from "@/components/dashboard/TopEnrollmentPanel";
import { ActivitySchedule } from "@/components/dashboard/ActivitySchedule";
import { getKpis } from "@/lib/dashboard-data";
import { getDashboardCounts, getTopEnrollmentSchools } from "@/lib/db-queries";

// Queries the database, so this can't be statically generated at build time
// (no DATABASE_URL / network access to Postgres during the Docker build).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [counts, topSchools] = await Promise.all([getDashboardCounts(), getTopEnrollmentSchools()]);
  const kpis = getKpis(counts);

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="flex items-stretch gap-5">
        <EnrollmentChart />
        <TopEnrollmentPanel schools={topSchools} />
      </div>

      <ActivitySchedule />
    </>
  );
}
