import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";

export type CheckinAuthVerificationResult =
  | { authorized: true }
  | {
      authorized: false;
      error: "unauthorized" | "forbidden";
      status: 401 | 403;
      message: string;
    };

export async function verifyCheckinSession(): Promise<CheckinAuthVerificationResult> {
  let sessionToken: string | undefined;
  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  } catch {
    // Fora de contexto de cookies do Next.js
  }

  if (!sessionToken || !(await isValidSession(sessionToken))) {
    return {
      authorized: false,
      error: "unauthorized",
      status: 401,
      message: "Sessão não autorizada para realizar check-in.",
    };
  }

  const identity = await getCurrentAdminIdentity();
  if (!identity || identity.status !== "active") {
    return {
      authorized: false,
      error: "forbidden",
      status: 403,
      message: "Identidade administrativa inactiva ou suspensa.",
    };
  }

  return { authorized: true };
}
