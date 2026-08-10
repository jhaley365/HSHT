// Quarter filter for the Students report. The HSHT school year runs
// Jul 1 - Jun 30, so quarters are anchored to that: Q1/Q2 fall in the
// school year's begin calendar year, Q3/Q4 in the following one.
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: "Q1 (Jul 1 – Sep 30)",
  Q2: "Q2 (Oct 1 – Dec 31)",
  Q3: "Q3 (Jan 1 – Mar 31)",
  Q4: "Q4 (Apr 1 – Jun 30)",
};

export function isQuarter(value: string | undefined | null): value is Quarter {
  return value === "Q1" || value === "Q2" || value === "Q3" || value === "Q4";
}

export function getQuarterRange(schoolYear: { beginDate: Date | null }, quarter: Quarter): { start: Date; end: Date } {
  const beginYear = (schoolYear.beginDate ?? new Date()).getUTCFullYear();
  switch (quarter) {
    case "Q1":
      return { start: new Date(Date.UTC(beginYear, 6, 1)), end: new Date(Date.UTC(beginYear, 8, 30, 23, 59, 59)) };
    case "Q2":
      return { start: new Date(Date.UTC(beginYear, 9, 1)), end: new Date(Date.UTC(beginYear, 11, 31, 23, 59, 59)) };
    case "Q3":
      return { start: new Date(Date.UTC(beginYear + 1, 0, 1)), end: new Date(Date.UTC(beginYear + 1, 2, 31, 23, 59, 59)) };
    case "Q4":
      return { start: new Date(Date.UTC(beginYear + 1, 3, 1)), end: new Date(Date.UTC(beginYear + 1, 5, 30, 23, 59, 59)) };
  }
}
