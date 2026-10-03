import "server-only";

import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import { getAdminRoleLabel, type AdminUserRole } from "@/lib/admin/admin-user";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c] ?? c,
  );
}

export function isEmailDeliveryAvailable(): boolean {
  return isResendConfigured();
}

export async function sendAdminInviteEmail(input: {
  email: string;
  role: AdminUserRole;
  rawToken: string;
  origin: string;
}): Promise<{ delivered: boolean; reason?: string }> {
  if (!isResendConfigured()) {
    return { delivered: false, reason: "resend_not_configured" };
  }

  const inviteUrl = new URL("/admin/accept-invite", input.origin);
  inviteUrl.searchParams.set("token", input.rawToken);

  const roleLabel = getAdminRoleLabel(input.role);

  const result = await sendHaxrEmail({
    channel: "noreply",
    to: input.email,
    subject: "Convite de Acesso Administrativo — HAXR Signature",
    html: `
      <p>Exmo(a). Utilizador(a),</p>
      <p>Foi convidado(a) a aceder ao painel administrativo da <strong>HAXR Signature</strong> com a função de <strong>${escapeHtml(roleLabel)}</strong>.</p>
      <p>Para definir a sua palavra-passe individual e activar a sua conta, utilize a ligação segura abaixo:</p>
      <p><a href="${escapeHtml(inviteUrl.toString())}" style="display:inline-block;padding:12px 24px;background-color:#B88A2A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;">Activar Conta Administrativa</a></p>
      <p style="font-size:12px;color:#888;">Esta ligação expira em 7 dias e só pode ser utilizada uma única vez.</p>
      <p style="font-size:12px;color:#888;">Se não reconhece este convite, por favor ignore esta mensagem.</p>
    `,
  });

  return { delivered: result.ok, reason: result.error };
}

export async function sendAdminPasswordResetEmail(input: {
  email: string;
  rawToken: string;
  origin: string;
}): Promise<{ delivered: boolean; reason?: string }> {
  if (!isResendConfigured()) {
    return { delivered: false, reason: "resend_not_configured" };
  }

  const resetUrl = new URL("/admin/reset-password", input.origin);
  resetUrl.searchParams.set("token", input.rawToken);

  const result = await sendHaxrEmail({
    channel: "noreply",
    to: input.email,
    subject: "Recuperação de Palavra-passe — HAXR Signature",
    html: `
      <p>Exmo(a). Utilizador(a),</p>
      <p>Recebemos um pedido para redefinir a palavra-passe do seu acesso administrativo na <strong>HAXR Signature</strong>.</p>
      <p>Para definir uma nova palavra-passe, utilize a ligação segura abaixo:</p>
      <p><a href="${escapeHtml(resetUrl.toString())}" style="display:inline-block;padding:12px 24px;background-color:#B88A2A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;">Redefinir Palavra-passe</a></p>
      <p style="font-size:12px;color:#888;">Esta ligação expira em 1 hora e só pode ser utilizada uma única vez.</p>
      <p style="font-size:12px;color:#888;">Se não solicitou esta alteração, proteja a sua conta informando imediatamente o proprietário.</p>
    `,
  });

  return { delivered: result.ok, reason: result.error };
}
