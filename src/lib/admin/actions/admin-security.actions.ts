"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireActiveAdminIdentity } from "@/lib/admin/admin-identity.server";
import {
  getAdminCredentialsByUserId,
  setAdminPassword,
} from "@/lib/admin/admin-credentials.repository";
import {
  createAdminSession,
  revokeAdminSession,
  revokeAllAdminSessionsForUser,
} from "@/lib/admin/admin-sessions.repository";
import {
  ADMIN_SESSION_COOKIE,
  getAdminAuthMode,
  getSessionMaxAge,
} from "@/lib/admin/auth";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/security/password";
import type { AdminActionResult } from "@/lib/admin/actions/admin-users.actions";

export async function claimOrChangeOwnPasswordAction(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<AdminActionResult<{ version: number }>> {
  try {
    const identity = await requireActiveAdminIdentity();
    if (!identity.isPersisted || !identity.id) {
      return { success: false, error: "Identidade administrativa não persistida na base de dados." };
    }

    const validationError = validatePassword(input.newPassword);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const existingCreds = await getAdminCredentialsByUserId(identity.id);

    if (existingCreds) {
      // User has existing password: current password is required and must match
      if (!input.currentPassword) {
        return { success: false, error: "A palavra-passe actual é obrigatória." };
      }
      const matches = await verifyPassword(input.currentPassword, existingCreds.passwordHash);
      if (!matches) {
        return { success: false, error: "A palavra-passe actual está incorrecta." };
      }
    } else {
      // User is claiming their first individual database password
      // In hybrid or legacy mode, verify current password against ADMIN_PASSWORD if provided
      const mode = getAdminAuthMode();
      if (mode === "hybrid" || mode === "legacy_environment") {
        const envPassword = process.env.ADMIN_PASSWORD?.trim();
        if (input.currentPassword && envPassword && input.currentPassword !== envPassword) {
          return { success: false, error: "A palavra-passe de ambiente actual está incorrecta." };
        }
      }
    }

    const newHash = await hashPassword(input.newPassword);
    const { credentialVersion } = await setAdminPassword(
      identity.id,
      newHash,
      identity.id,
    );

    // Issue a fresh v2 database session for the user
    const { token } = await createAdminSession(identity.id);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSessionMaxAge(),
    });

    revalidatePath("/admin/security");
    revalidatePath("/admin/profile");
    return { success: true, data: { version: credentialVersion } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao definir palavra-passe.",
    };
  }
}

export async function revokeOwnSessionAction(sessionId: string): Promise<AdminActionResult> {
  try {
    const identity = await requireActiveAdminIdentity();
    await revokeAdminSession(sessionId, identity.id);
    revalidatePath("/admin/security");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao revogar sessão.",
    };
  }
}

export async function logoutAllOwnSessionsAction(): Promise<AdminActionResult<{ count: number }>> {
  try {
    const identity = await requireActiveAdminIdentity();
    const count = await revokeAllAdminSessionsForUser(identity.id, identity.id);

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    revalidatePath("/admin");
    return { success: true, data: { count } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao terminar sessões.",
    };
  }
}
