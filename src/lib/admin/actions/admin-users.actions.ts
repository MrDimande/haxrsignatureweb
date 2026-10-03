"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { requireOwnerAdminIdentity, requireActiveAdminIdentity } from "@/lib/admin/admin-identity.server";
import {
  findAdminUserById,
  updateAdminUserRoleAndStatus,
} from "@/lib/admin/admin-users.repository";
import {
  createAdminInvite,
  revokeAdminInvite,
  listPendingAdminInvites,
  findValidInviteByToken,
  acceptAdminInvite,
} from "@/lib/admin/admin-invites.repository";
import {
  createAdminPasswordResetToken,
  validatePasswordResetToken,
  executePasswordResetWithToken,
} from "@/lib/admin/admin-password-resets.repository";
import {
  createAdminSession,
  revokeAdminSession,
  revokeAllAdminSessionsForUser,
} from "@/lib/admin/admin-sessions.repository";
import {
  ADMIN_SESSION_COOKIE,
  getSessionMaxAge,
} from "@/lib/admin/auth";
import {
  hashPassword,
  validatePassword,
} from "@/lib/security/password";
import {
  sendAdminInviteEmail,
  sendAdminPasswordResetEmail,
} from "@/lib/admin/admin-email.service";
import {
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  type AdminPermission,
  type AdminUserRole,
  type AdminUserStatus,
} from "@/lib/admin/admin-user";

export type AdminActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getRequestOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function inviteAdminUserAction(input: {
  email: string;
  role: AdminUserRole;
  permissions?: AdminPermission[];
}): Promise<AdminActionResult<{ inviteId: string; emailSent: boolean }>> {
  try {
    const owner = await requireOwnerAdminIdentity();

    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      return { success: false, error: "Endereço de email inválido." };
    }

    if (!ADMIN_USER_ROLES.includes(input.role)) {
      return { success: false, error: "Função administrativa inválida." };
    }

    const { invite, rawToken } = await createAdminInvite({
      email: input.email.trim(),
      role: input.role,
      permissions: input.permissions,
      actorUserId: owner.id,
    });

    const origin = await getRequestOrigin();
    const { delivered } = await sendAdminInviteEmail({
      email: invite.email,
      role: invite.role,
      rawToken,
      origin,
    });

    revalidatePath("/admin/users");
    return {
      success: true,
      data: { inviteId: invite.id, emailSent: delivered },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao criar convite.",
    };
  }
}

export async function updateAdminUserAction(input: {
  targetUserId: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  permissions?: AdminPermission[];
}): Promise<AdminActionResult> {
  try {
    const owner = await requireOwnerAdminIdentity();

    if (input.role && !ADMIN_USER_ROLES.includes(input.role)) {
      return { success: false, error: "Função administrativa inválida." };
    }

    if (input.status && !ADMIN_USER_STATUSES.includes(input.status)) {
      return { success: false, error: "Estado administrativo inválido." };
    }

    await updateAdminUserRoleAndStatus({
      targetUserId: input.targetUserId,
      role: input.role,
      status: input.status,
      permissions: input.permissions,
      actorUserId: owner.id,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${input.targetUserId}`);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao actualizar utilizador.",
    };
  }
}

export async function reissueAdminInviteAction(
  inviteId: string,
): Promise<AdminActionResult<{ emailSent: boolean }>> {
  try {
    const owner = await requireOwnerAdminIdentity();

    const pending = await listPendingAdminInvites();
    const targetInvite = pending.find((i) => i.id === inviteId);

    if (!targetInvite) {
      return { success: false, error: "Convite não encontrado ou já expirado." };
    }

    const { invite, rawToken } = await createAdminInvite({
      email: targetInvite.email,
      role: targetInvite.role,
      permissions: targetInvite.permissions,
      actorUserId: owner.id,
    });

    const origin = await getRequestOrigin();
    const { delivered } = await sendAdminInviteEmail({
      email: invite.email,
      role: invite.role,
      rawToken,
      origin,
    });

    revalidatePath("/admin/users");
    return { success: true, data: { emailSent: delivered } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao reemitir convite.",
    };
  }
}

export async function revokeAdminInviteAction(
  inviteId: string,
): Promise<AdminActionResult> {
  try {
    const owner = await requireOwnerAdminIdentity();
    await revokeAdminInvite(inviteId, owner.id);
    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao revogar convite.",
    };
  }
}

export async function initiateAdminPasswordResetAction(
  targetUserId: string,
): Promise<AdminActionResult<{ emailSent: boolean }>> {
  try {
    const owner = await requireOwnerAdminIdentity();

    const targetUser = await findAdminUserById(targetUserId);
    if (!targetUser) {
      return { success: false, error: "Utilizador não encontrado." };
    }

    const { rawToken } = await createAdminPasswordResetToken(
      targetUser.id,
      owner.id,
    );

    const origin = await getRequestOrigin();
    const { delivered } = await sendAdminPasswordResetEmail({
      email: targetUser.email,
      rawToken,
      origin,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${targetUserId}`);
    return { success: true, data: { emailSent: delivered } };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Falha ao iniciar recuperação.",
    };
  }
}

export async function revokeAdminSessionAction(
  sessionId: string,
): Promise<AdminActionResult> {
  try {
    const actor = await requireActiveAdminIdentity();
    await revokeAdminSession(sessionId, actor.id);
    revalidatePath("/admin/users");
    revalidatePath("/admin/security");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao revogar sessão.",
    };
  }
}

export async function revokeAllAdminSessionsAction(
  targetUserId: string,
): Promise<AdminActionResult<{ revokedCount: number }>> {
  try {
    const actor = await requireActiveAdminIdentity();
    const isSelf = actor.id === targetUserId;
    if (!isSelf && (!actor.isPersisted || actor.role !== "OWNER")) {
      return {
        success: false,
        error: "Apenas o proprietário pode revogar sessões de outros utilizadores.",
      };
    }

    const count = await revokeAllAdminSessionsForUser(targetUserId, actor.id);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${targetUserId}`);
    revalidatePath("/admin/security");
    return { success: true, data: { revokedCount: count } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao revogar sessões.",
    };
  }
}

export async function validateInviteTokenAction(rawToken: string): Promise<
  AdminActionResult<{ email: string; role: string }>
> {
  try {
    const invite = await findValidInviteByToken(rawToken);
    if (!invite) {
      return { success: false, error: "Convite inválido, expirado ou já utilizado." };
    }
    return { success: true, data: { email: invite.email, role: invite.role } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao validar convite.",
    };
  }
}

export async function acceptInviteAction(input: {
  rawToken: string;
  name: string;
  password: string;
}): Promise<AdminActionResult> {
  try {
    const validationError = validatePassword(input.password);
    if (validationError) {
      return { success: false, error: validationError };
    }

    if (!input.name?.trim()) {
      return { success: false, error: "O nome é obrigatório." };
    }

    const passwordHash = await hashPassword(input.password);
    const user = await acceptAdminInvite({
      rawToken: input.rawToken,
      name: input.name,
      passwordHash,
    });

    // Automatically issue database session cookie for smooth onboarding
    const { token } = await createAdminSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSessionMaxAge(),
    });

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao aceitar convite.",
    };
  }
}

export async function validatePasswordResetTokenAction(rawToken: string): Promise<
  AdminActionResult<{ valid: boolean }>
> {
  try {
    const res = await validatePasswordResetToken(rawToken);
    if (!res.valid) {
      return { success: false, error: "Ligação de recuperação inválida ou expirada." };
    }
    return { success: true, data: { valid: true } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao validar ligação de recuperação.",
    };
  }
}

export async function completePasswordResetAction(input: {
  rawToken: string;
  newPassword: string;
}): Promise<AdminActionResult> {
  try {
    const validationError = validatePassword(input.newPassword);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const passwordHash = await hashPassword(input.newPassword);
    const result = await executePasswordResetWithToken(input.rawToken, passwordHash);

    // Issue a fresh database session cookie
    const { token } = await createAdminSession(result.adminUserId);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSessionMaxAge(),
    });

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao redefinir palavra-passe.",
    };
  }
}

