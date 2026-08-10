// Presentation-shape adapter for the Home dashboard KPI cards. The actual
// numbers come from db-queries.ts#getCoverageStats — this just picks
// labels/icons/colors for each one.

export type Kpi = {
  label: string;
  sublabel: string;
  value: string;
  icon: "org-tree" | "building" | "person";
  color: "c1" | "c2" | "c3" | "c4";
};

export function getKpis(
  stats: {
    totalDistricts: number;
    totalSchools: number;
    districtsWithStudents: number;
    schoolsWithStudents: number;
    districtsWithCompletedActivities: number;
    schoolsWithCompletedActivities: number;
  },
  totalEnrolledThisYear: number
): Kpi[] {
  return [
    {
      label: "Students",
      sublabel: "Enrolled this school year",
      value: totalEnrolledThisYear.toLocaleString(),
      icon: "person",
      color: "c1",
    },
    {
      label: "Districts",
      sublabel: "Have enrolled students",
      value: `${stats.districtsWithStudents} / ${stats.totalDistricts}`,
      icon: "org-tree",
      color: "c2",
    },
    {
      label: "Schools",
      sublabel: "Have enrolled students",
      value: `${stats.schoolsWithStudents} / ${stats.totalSchools}`,
      icon: "building",
      color: "c3",
    },
    {
      label: "Districts",
      sublabel: "Have completed activities",
      value: `${stats.districtsWithCompletedActivities} / ${stats.totalDistricts}`,
      icon: "org-tree",
      color: "c4",
    },
    {
      label: "Schools",
      sublabel: "Have completed activities",
      value: `${stats.schoolsWithCompletedActivities} / ${stats.totalSchools}`,
      icon: "building",
      color: "c1",
    },
  ];
}

// Real data now — see src/lib/db-queries.ts#getTopEnrollmentSchools.
export type TopSchool = { name: string; county: string; students: number; color: "c1" | "c2" | "c3" | "c4" };
