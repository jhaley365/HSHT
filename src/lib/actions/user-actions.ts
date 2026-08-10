"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import type { UserRole } from "@/generated/prisma/client";

const ROLES: UserRole[] = ["VIEWER", "STAFF", "ADMIN"];

function parseRole(value: FormDataEntryValue | null): UserRole {
  return ROLES.includes(value as UserRole) ? (value as UserRole) : "VIEWER";
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = parseRole(formData.get("role"));
  if (!email) redirect("/users?error=Email is required");

  try {
    await prisma.user.create({ data: { email, name, role } });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      redirect(`/users?error=${encodeURIComponent(`${email} already exists`)}`);
    }
    throw err;
  }

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

  await prisma.user.update({
    where: { id },
    data: isSelf
      ? { name }
      : { name, role: parseRole(formData.get("role")), active: formData.get("active") === "on" },
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

  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect("/users");
}
