"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/client";

const ROLES: UserRole[] = ["VIEWER", "STAFF", "ADMIN"];

function parseRole(value: FormDataEntryValue | null): UserRole {
  return ROLES.includes(value as UserRole) ? (value as UserRole) : "VIEWER";
}

export async function createUserAction(formData: FormData) {
  const session = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = parseRole(formData.get("role"));
  if (!email) redirect("/users?error=Email is required");

  let created;
  try {
    created = await prisma.user.create({ data: { email, name, role } });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      redirect(`/users?error=${encodeURIComponent(`${email} already exists`)}`);
    }
    throw err;
  }

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "CREATE",
    entityType: "User",
    entityId: created.id,
    summary: `Created user ${email} (role ${role})`,
  });

  revalidatePath("/users");
  redirect("/users");
}

// Editing your own account never touches role/active, no matter what the
// form submits — safer than trying to validate/reject a self-demotion,
// since there's still no way to recover access besides direct SQL.
export async function updateUserAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const isSelf = id === session.user.id;

  const before = await prisma.user.findUnique({ where: { id } });
  const data = isSelf
    ? { name }
    : { name, role: parseRole(formData.get("role")), active: formData.get("active") === "on" };

  const updated = await prisma.user.update({ where: { id }, data });

  const changes: string[] = [];
  if (before && !isSelf) {
    if (before.role !== updated.role) changes.push(`role ${before.role} → ${updated.role}`);
    if (before.active !== updated.active) changes.push(updated.active ? "reactivated" : "deactivated");
  }
  if (before && before.name !== updated.name) changes.push("name changed");
  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    summary: changes.length
      ? `Updated user ${updated.email} (${changes.join(", ")})`
      : `Updated user ${updated.email}`,
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id === session.user.id) {
    redirect(`/users/${id}?error=${encodeURIComponent("You can't delete your own account")}`);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  await prisma.user.delete({ where: { id } });

  await recordAuditEvent({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    action: "DELETE",
    entityType: "User",
    entityId: id,
    summary: `Deleted user ${target?.email ?? id}`,
  });

  revalidatePath("/users");
  redirect("/users");
}
