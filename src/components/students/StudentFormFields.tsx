import { GENDER_LABELS, RACE_LABELS, ETHNIC_HERITAGE_LABELS, GRADE_LABELS } from "@/lib/legacy-codes";
import { StudentSchoolFields } from "@/components/students/StudentSchoolFields";
import type { Program } from "@/generated/prisma/client";
import type { getDistrictOptions } from "@/lib/reports-queries";
import type { getSchoolOptions } from "@/lib/activity-queries";

type Districts = Awaited<ReturnType<typeof getDistrictOptions>>;
type Schools = Awaited<ReturnType<typeof getSchoolOptions>>;

const GENDER_OPTIONS = Object.entries(GENDER_LABELS);
const RACE_OPTIONS = Object.entries(RACE_LABELS);
const ETHNIC_HERITAGE_OPTIONS = Object.entries(ETHNIC_HERITAGE_LABELS);
const GRADE_OPTIONS = Object.entries(GRADE_LABELS);

// Every legacy disability flag except MID, which only ever appears on the
// YTEP wizard (see legacyId comment on Student.mid in schema.prisma).
const DISABILITY_CHECKBOXES: [string, string][] = [
  ["autism", "Autism"],
  ["aspergers", "Asperger's"],
  ["deaf", "Deaf"],
  ["ebd", "Emotional/Behavioral Disorder"],
  ["mobility", "Mobility"],
  ["ohi", "Other Health Impairment"],
  ["orthopedic", "Orthopedic"],
  ["speech", "Speech"],
  ["sld", "Specific Learning Disability"],
  ["spinal", "Spinal"],
  ["tbi", "Traumatic Brain Injury"],
  ["visual", "Visual"],
];

export type StudentFormDefaults = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string; // yyyy-mm-dd, matches <input type="date">
  phone?: string;
  emailAddress?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  gender?: string;
  race?: string;
  raceOther?: string;
  ethnicHeritage?: string;
  autism?: boolean;
  aspergers?: boolean;
  deaf?: boolean;
  ebd?: boolean;
  mid?: boolean;
  mobility?: boolean;
  ohi?: boolean;
  orthopedic?: boolean;
  speech?: boolean;
  sld?: boolean;
  spinal?: boolean;
  tbi?: boolean;
  visual?: boolean;
  otherDisability?: boolean;
  otherInfo?: string;
  grade?: string;
  enterDate?: string;
  eip?: boolean;
  section504?: boolean;
  receivedForm?: boolean;
  vrCaseloadCheck?: boolean;
  vocationalRehab?: boolean;
  vrc?: string;
  hshtCoordinator?: string;
  active?: boolean;
};

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" } as const;

function CheckboxLabel({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function StudentFormFields({
  program,
  districts,
  schools,
  defaultDistrictId,
  defaultSchoolId,
  defaults = {},
  showActiveToggle = false,
}: {
  program: Program;
  districts: Districts;
  schools: Schools;
  defaultDistrictId?: number;
  defaultSchoolId?: number;
  defaults?: StudentFormDefaults;
  showActiveToggle?: boolean;
}) {
  return (
    <>
      <input type="hidden" name="program" value={program} />

      <div className="rounded-[14px] border p-5" style={cardStyle}>
        <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
            School Selection
          </div>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ background: "var(--surface-2)", color: program === "YTEP" ? "var(--accent)" : "var(--muted)" }}
          >
            {program} Student
          </span>
        </div>
        <div className="grid max-w-[560px] gap-3">
          <StudentSchoolFields districts={districts} schools={schools} defaultDistrictId={defaultDistrictId} defaultSchoolId={defaultSchoolId} />
        </div>
      </div>

      <div className="rounded-[14px] border p-5" style={cardStyle}>
        <div className="mb-3 border-b pb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Student Information
        </div>
        <div className="grid max-w-[560px] gap-3">
          {showActiveToggle && <CheckboxLabel name="active" label="Active" defaultChecked={defaults.active ?? true} />}

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              First Name
            </span>
            <input type="text" name="firstName" required defaultValue={defaults.firstName} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Middle Name
            </span>
            <input type="text" name="middleName" defaultValue={defaults.middleName} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Last Name
            </span>
            <input type="text" name="lastName" required defaultValue={defaults.lastName} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Date of Birth
            </span>
            <input type="date" name="birthDate" defaultValue={defaults.birthDate} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Gender
            </span>
            <select name="gender" defaultValue={defaults.gender ?? ""} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
              <option value="">—</option>
              {GENDER_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Phone
            </span>
            <input type="text" name="phone" defaultValue={defaults.phone} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Email Address
            </span>
            <input type="email" name="emailAddress" defaultValue={defaults.emailAddress} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Street Address
            </span>
            <input type="text" name="streetAddress" defaultValue={defaults.streetAddress} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              City
            </span>
            <input type="text" name="city" defaultValue={defaults.city} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              State
            </span>
            <input type="text" name="state" defaultValue={defaults.state} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Zip
            </span>
            <input type="text" name="zip" defaultValue={defaults.zip} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              County
            </span>
            <input type="text" name="county" defaultValue={defaults.county} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>
        </div>
      </div>

      <div className="rounded-[14px] border p-5" style={cardStyle}>
        <div className="mb-3 border-b pb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Classification
        </div>
        <div className="grid max-w-[560px] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Race
            </span>
            <select name="race" defaultValue={defaults.race ?? ""} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
              <option value="">—</option>
              {RACE_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
              <option value="6">Other</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Race — Other (if selected above)
            </span>
            <input type="text" name="raceOther" defaultValue={defaults.raceOther} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Ethnic Heritage
            </span>
            <select name="ethnicHeritage" defaultValue={defaults.ethnicHeritage ?? ""} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
              <option value="">—</option>
              {ETHNIC_HERITAGE_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[14px] border p-5" style={cardStyle}>
        <div className="mb-3 border-b pb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Disability
        </div>
        <div className="flex flex-wrap gap-4">
          {DISABILITY_CHECKBOXES.map(([name, label]) => (
            <CheckboxLabel key={name} name={name} label={label} defaultChecked={defaults[name as keyof StudentFormDefaults] as boolean | undefined} />
          ))}
          {/* MID only ever appeared on the YTEP wizard — see Student.mid in schema.prisma. */}
          {program === "YTEP" && <CheckboxLabel name="mid" label="MID" defaultChecked={defaults.mid} />}
        </div>
        <div className="mt-3 grid max-w-[560px] gap-3">
          <CheckboxLabel name="otherDisability" label="Other" defaultChecked={defaults.otherDisability} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Other Disability — Details (if selected above)
            </span>
            <input type="text" name="otherInfo" defaultValue={defaults.otherInfo} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
          </label>
        </div>
      </div>

      <div className="rounded-[14px] border p-5" style={cardStyle}>
        <div className="mb-3 border-b pb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Education
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            {GRADE_OPTIONS.filter(([code]) => program === "YTEP" || code !== "5.5").map(([code, label]) => (
              <label key={code} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
                <input type="radio" name="grade" value={code} defaultChecked={defaults.grade === code} />
                {label}
              </label>
            ))}
          </div>
          <label className="flex max-w-[280px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Enter School Date
            </span>
            <input
              type="text"
              name="enterDate"
              placeholder="e.g. 8/15/2024"
              defaultValue={defaults.enterDate}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </label>
        </div>
      </div>

      <div className="rounded-[14px] border p-5" style={cardStyle}>
        <div className="mb-3 border-b pb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
          Internal Use
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            <CheckboxLabel name="eip" label="Do you have an IEP?" defaultChecked={defaults.eip} />
            <CheckboxLabel name="section504" label="504" defaultChecked={defaults.section504} />
            <CheckboxLabel name="receivedForm" label="Received Reportable Form?" defaultChecked={defaults.receivedForm} />
            <CheckboxLabel name="vrCaseloadCheck" label="VR Caseload?" defaultChecked={defaults.vrCaseloadCheck} />
            <CheckboxLabel name="vocationalRehab" label="Vocational Rehabilitation?" defaultChecked={defaults.vocationalRehab} />
          </div>
          <div className="grid max-w-[560px] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                Vocational Rehabilitation Counselor
              </span>
              <input type="text" name="vrc" defaultValue={defaults.vrc} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                HS / HT Coordinator
              </span>
              <input type="text" name="hshtCoordinator" defaultValue={defaults.hshtCoordinator} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
