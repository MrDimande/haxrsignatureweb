"use server";

import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import { requireActiveAdminIdentity } from "@/lib/admin/admin-identity.server";

export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(token))) {
    throw new Error("Não autorizado.");
  }

  await requireActiveAdminIdentity();
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function runAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return { success: false, error: message };
  }
}
