// Code→label mappings recovered from the legacy ColdFusion templates
// (the source database has no lookup tables for these — see MIGRATION.md).
// Grade and Race are stored padded (legacy nchar columns), so trim before
// looking up.

const RACE_LABELS: Record<string, string> = {
  "1": "American Indian and Alaska Native",
  "2": "Asian",
  "3": "Black/African American",
  "4": "Native Hawaiian and Other Pacific Islander",
  "5": "White",
};

export function formatRace(race: string | null, raceOther: string | null): string {
  const code = race?.trim();
  if (!code) return "—";
  if (code === "6") return raceOther ? `Other: ${raceOther}` : "Other";
  return RACE_LABELS[code] ?? code;
}

const GRADE_LABELS: Record<string, string> = {
  "1": "8th Grade",
  "2": "9th Grade (Freshman)",
  "3": "10th Grade (Sophomore)",
  "4": "11th Grade (Junior)",
  "5": "12th Grade (Senior)",
  "6": "Other (Out of School)",
};

export function formatGrade(grade: string | null): string {
  const code = grade?.trim();
  if (!code) return "—";
  return GRADE_LABELS[code] ?? code;
}
