import { KpiCard } from "@/components/dashboard/KpiCard";
import { EnrollmentChart } from "@/components/dashboard/EnrollmentChart";
import { TopEnrollmentPanel } from "@/components/dashboard/TopEnrollmentPanel";
import { ActivitySchedule } from "@/components/dashboard/ActivitySchedule";
import { getKpis } from "@/lib/dashboard-data";

export default function Home() {
  const kpis = getKpis();

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="flex items-stretch gap-5">
        <EnrollmentChart />
        <TopEnrollmentPanel />
      </div>

      <ActivitySchedule />
    </>
  );
}
