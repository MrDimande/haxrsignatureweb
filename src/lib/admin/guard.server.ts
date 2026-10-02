import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import {
  AdminIdentityAccessError,
  requireActiveAdminIdentity,
  requireOwnerAdminIdentity,
} from "@/lib/admin/admin-identity.server";

export async function enforceAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!(await isValidSession(token))) {
    redirect("/admin");
  }

  try {
    await requireActiveAdminIdentity();
  } catch (error) {
    if (error instanceof AdminIdentityAccessError) {
      redirect("/admin");
    }
    throw error;
  }
}

export async function enforceAdminOwner(): Promise<void> {
  await enforceAdminAuth();

  try {
    await requireOwnerAdminIdentity();
  } catch (error) {
    if (error instanceof AdminIdentityAccessError) {
      redirect("/admin/dashboard");
    }
    throw error;
  }
}
