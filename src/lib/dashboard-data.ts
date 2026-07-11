// Static sample data for the Home dashboard, matching the design handoff's
// mock figures (design_handoff_enrollment_dashboard/README.md). Replace each
// getter with a real query once the data layer is wired up — the shapes here
// are the contract the UI components expect.

export type Trend = { direction: "up" | "down" | "flat"; percent: number; caption: string };

export type Kpi = {
  label: string;
  sublabel: string;
  value: string;
  icon: "person" | "pulse" | "building" | "org-tree";
  color: "c1" | "c2" | "c3" | "c4";
  trend: Trend;
};

export function getKpis(): Kpi[] {
  return [
    { label: "Students", sublabel: "Total enrolled", value: "1,847", icon: "person", color: "c1", trend: { direction: "up", percent: 12.4, caption: "vs last month" } },
    { label: "Activities", sublabel: "Total year to date", value: "342", icon: "pulse", color: "c2", trend: { direction: "up", percent: 6.1, caption: "vs last month" } },
    { label: "Schools", sublabel: "Total active", value: "293", icon: "building", color: "c3", trend: { direction: "up", percent: 2.0, caption: "vs last month" } },
    { label: "Districts", sublabel: "Total active", value: "156", icon: "org-tree", color: "c4", trend: { direction: "flat", percent: 0, caption: "no change" } },
  ];
}

export type EnrollmentPoint = { x: number; y: number };

export function getEnrollmentSeries(): { points: EnrollmentPoint[]; xLabels: string[] } {
  return {
    points: [
      { x: 30, y: 157.5 },
      { x: 96.2, y: 144 },
      { x: 162.3, y: 138 },
      { x: 228.5, y: 142.5 },
      { x: 294.6, y: 133.5 },
      { x: 360.8, y: 126 },
      { x: 426.9, y: 132 },
      { x: 493.1, y: 124.5 },
      { x: 559.2, y: 118.5 },
      { x: 625.4, y: 121.5 },
      { x: 691.5, y: 126 },
      { x: 757.7, y: 109.5 },
      { x: 823.8, y: 100.5 },
      { x: 890, y: 82.5 },
    ],
    xLabels: ["13/07", "16/07", "19/07", "22/07", "25/07", "28/07", "31/07"],
  };
}

export type MiniMetric = {
  label: string;
  value: string;
  deltaPercent: number;
  sparkline: "bar" | "line";
  color: "c1" | "c2" | "c3";
  bars?: number[];
};

export function getMiniMetrics(): MiniMetric[] {
  return [
    { label: "Total Students", value: "1,847", deltaPercent: 8.2, sparkline: "bar", color: "c1", bars: [46, 62, 40, 68, 52, 78, 58, 50, 72, 64, 44, 80, 56, 70] },
    { label: "Total Invoicing", value: "$48,250", deltaPercent: 5.1, sparkline: "line", color: "c2" },
    { label: "Total Enrollment", value: "2,190", deltaPercent: 11.0, sparkline: "bar", color: "c3", bars: [56, 48, 66, 54, 74, 60, 50, 68, 62, 78, 52, 70, 58, 82] },
  ];
}

export type TopSchool = { name: string; county: string; students: number; color: "c1" | "c2" | "c3" | "c4" };

export function getTopEnrollment(): TopSchool[] {
  return [
    { name: "Pierce County High School", county: "Pierce County", students: 24, color: "c1" },
    { name: "Fannin County High School", county: "Fannin County", students: 20, color: "c2" },
    { name: "Richmond Hill High School", county: "Bryan County", students: 16, color: "c3" },
    { name: "Bacon County High School", county: "Bacon County", students: 11, color: "c4" },
    { name: "Valdosta High School", county: "Lowndes County", students: 10, color: "c1" },
  ];
}

export type ActivityRow = {
  date: string;
  activity: string;
  school: string;
  description: string;
  status: "Active" | "Pending" | "Closed";
};

export function getActivitySchedule(): ActivityRow[] {
  return [
    { date: "Jul 08", activity: "Robotics Club", school: "Pierce County HS", description: "Regional qualifier prep", status: "Active" },
    { date: "Jul 07", activity: "Debate Team", school: "Valdosta HS", description: "Weekly practice session", status: "Active" },
    { date: "Jul 05", activity: "Marching Band", school: "Richmond Hill HS", description: "Summer camp enrollment", status: "Pending" },
    { date: "Jul 03", activity: "Track & Field", school: "Fannin County HS", description: "Meet registration", status: "Active" },
    { date: "Jul 01", activity: "Science Olympiad", school: "Bacon County HS", description: "Team roster update", status: "Closed" },
  ];
}

export function getWeeklyActivityBars(): number[] {
  return [52, 68, 45, 74, 58, 86, 60, 50, 78, 66, 44, 82, 56, 72, 54, 88, 48, 64, 79, 52, 92, 60, 70, 55, 80, 63, 49, 74];
}
