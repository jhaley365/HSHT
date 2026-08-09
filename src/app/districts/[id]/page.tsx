import Link from "next/link";
import { notFound } from "next/navigation";
import { getDistrictProfile } from "@/lib/districts-queries";
import { Section } from "@/components/Section";
import { InfoRow } from "@/components/InfoRow";

export const dynamic = "force-dynamic";

export default async function DistrictDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const district = await getDistrictProfile(id);
  if (!district) notFound();

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <Section title="School District Information">
        <InfoRow
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: district.active ? "var(--positive)" : "var(--muted)" }}
              />
              {district.active ? "Active" : "Inactive"}
            </span>
          }
        />
        <InfoRow label="District ID" value={district.code} />
        <InfoRow label="District Name" value={district.name} />
        <InfoRow label="County" value={district.county} />
        <InfoRow label="HSHT Coordinator" value={district.coordinator ?? "—"} />
        <InfoRow label="VR Quadrant" value={district.vrQuadrant ?? "—"} />
        <InfoRow label="HSHT Service Area" value={district.serviceArea ?? "—"} />
        <InfoRow label="Notes" value={district.notes ?? "—"} />
      </Section>

      <Section title="Schools">
        {district.schools.length === 0 ? (
          <p className="py-2 text-[13px]" style={{ color: "var(--muted)" }}>
            No schools on record for this district.
          </p>
        ) : (
          <div className="flex flex-col">
            {district.schools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.id}`}
                className="border-t py-2 text-[13px] transition-colors hover:[background:var(--surface-2)] first:border-t-0"
                style={{ borderColor: "var(--border)" }}
              >
                <span style={{ color: "var(--muted)" }}>
                  ({district.code}-{school.schoolCode})
                </span>{" "}
                <span style={{ color: "var(--text)" }}>{school.name}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
