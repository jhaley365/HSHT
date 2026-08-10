import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");
  return session;
}

export async function requireStaff() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) redirect("/");
  return session;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session;
}
