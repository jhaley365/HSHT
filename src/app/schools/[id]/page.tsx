import { notFound } from "next/navigation";
import { getSchoolProfile } from "@/lib/schools-queries";
import { Section } from "@/components/Section";
import { InfoRow } from "@/components/InfoRow";

export const dynamic = "force-dynamic";

function formatPhone(phone: string | null, ext: string | null) {
  if (!phone) return "—";
  return ext ? `${phone} ext. ${ext}` : phone;
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchoolProfile(id);
  if (!school) notFound();

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <Section title="School Information">
        <InfoRow
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: school.active ? "var(--positive)" : "var(--muted)" }}
              />
              {school.active ? "Active" : "Inactive"}
            </span>
          }
        />
        <InfoRow label="School Name" value={school.name} />
        <InfoRow label="School District" value={school.district.name} />
        <InfoRow label="School Code" value={`${school.district.code}-${school.schoolCode}`} />
        <InfoRow label="School Type" value={school.schoolType ?? "—"} />
        <InfoRow label="Street Address" value={school.streetAddress} />
        <InfoRow label="City" value={school.city} />
        <InfoRow label="State" value={school.state} />
        <InfoRow label="Zip Code" value={school.zip ?? "—"} />
      </Section>

      <Section title="Mailing Address">
        <InfoRow label="Street Address" value={school.mailingAddress ?? "—"} />
        <InfoRow label="City" value={school.mailingCity ?? "—"} />
        <InfoRow label="State" value={school.mailingState} />
        <InfoRow label="Zip Code" value={school.mailingZip ?? "—"} />
      </Section>

      <Section title="VR Counselor">
        <InfoRow label="First Name" value={school.vrFirstName ?? "—"} />
        <InfoRow label="Last Name" value={school.vrLastName ?? "—"} />
        <InfoRow label="Office" value={school.vrOffice ?? "—"} />
        <InfoRow label="Email Address" value={school.vrEmail ?? "—"} />
      </Section>

      {/* legacy "LN" fields, confirmed against the legacy UI to be the
          HSHT Liaison contact — see MIGRATION.md. */}
      <Section title="HSHT Liaison">
        <InfoRow label="First Name" value={school.lnFirstName ?? "—"} />
        <InfoRow label="Last Name" value={school.lnLastName ?? "—"} />
        <InfoRow label="Office Phone" value={formatPhone(school.lnOfficePhone, school.lnOfficePhoneExt)} />
        <InfoRow label="Mobile Phone" value={school.lnMobilePhone ?? "—"} />
        <InfoRow label="Email Address" value={school.lnEmail ?? "—"} />
      </Section>

      {/* legacy "SSL" fields, confirmed against the legacy UI to be the
          System Site Liaison contact — see MIGRATION.md. "Site Sponsor"
          (likely SS1-SS4) isn't shown yet — meaning unconfirmed. */}
      <Section title="System Site Liaison">
        <InfoRow label="First Name" value={school.sslFirstName ?? "—"} />
        <InfoRow label="Last Name" value={school.sslLastName ?? "—"} />
        <InfoRow label="Office Phone" value={formatPhone(school.sslOfficePhone, school.sslOfficePhoneExt)} />
        <InfoRow label="Mobile Phone" value={school.sslMobilePhone ?? "—"} />
        <InfoRow label="Email Address" value={school.sslEmail ?? "—"} />
      </Section>
    </div>
  );
}
