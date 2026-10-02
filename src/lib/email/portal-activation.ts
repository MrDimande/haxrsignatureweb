import "server-only";

import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

/** Sends an opaque activation URL through the already-approved Resend transport. Never log the URL. */
export async function sendPortalActivationEmail(input: {
  email: string;
  token: string;
  expiresAt: Date;
  origin: string;
}): Promise<{ delivery: "sent" | "not_configured" | "failed" }> {
  if (!isResendConfigured()) return { delivery: "not_configured" };
  const activationUrl = new URL("/activate-account", input.origin);
  activationUrl.searchParams.set("token", input.token);
  const expires = input.expiresAt.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" });
  const result = await sendHaxrEmail({
    channel: "noreply",
    to: input.email,
    subject: "Active o seu acesso HAXR Signature",
    html: `<p>Olá,</p><p>Use o link seguro abaixo para definir uma nova palavra-passe e activar o seu Painel HAXR.</p><p><a href="${escapeHtml(activationUrl.toString())}">Activar acesso</a></p><p>Este link expira em ${escapeHtml(expires)} e só pode ser utilizado uma vez.</p><p>Se não pediu este acesso, ignore esta mensagem.</p>`,
  });
  return { delivery: result.ok ? "sent" : "failed" };
}
