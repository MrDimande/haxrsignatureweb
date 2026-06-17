import { getNotifyInbox } from "@/lib/email/addresses";
import { isResendConfigured, resolveFrom, sendHaxrEmail } from "@/lib/email/resend";
import { projectTypeLabels, siteContact } from "@/lib/site-config";
import type { ContactInquiry } from "@/lib/contact/types";

const BRAND = "HAXR Signature";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

function projectLabel(projectType: string): string {
  return projectTypeLabels[projectType] ?? projectType;
}

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111;border:1px solid #2a2a2a;">
        <tr><td style="padding:28px 32px;border-bottom:1px solid #2a2a2a;">
          <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#b8965a;">${BRAND}</p>
          <h1 style="margin:12px 0 0;font-size:20px;font-weight:300;color:#f5f5f5;">${title}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#c8c8c8;font-size:15px;line-height:1.7;">
          ${body}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2a;">
          <p style="margin:0;font-family:monospace;font-size:9px;letter-spacing:0.2em;color:#666;text-transform:uppercase;">Maputo · Moçambique</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildTeamNotificationHtml(inquiry: ContactInquiry): string {
  const tipo = projectLabel(inquiry.projectType);
  const pacote = inquiry.packageLabel?.trim() || "Não especificado";
  const marketing = inquiry.marketingOptIn ? "Sim" : "Não";

  const rows = [
    ["Nome", inquiry.name],
    ["Email", `<a href="mailto:${inquiry.email}" style="color:#b8965a;">${inquiry.email}</a>`],
    ["Tipo de projecto", tipo],
    ["Pacote", pacote],
    ["Mensagem", inquiry.message.replace(/\n/g, "<br>")],
    ["Newsletter", marketing],
    ["Recebido em", formatDate(inquiry.createdAt)],
    ["ID", inquiry.id],
  ];

  const table = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #222;font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#888;vertical-align:top;width:38%;">${label}</td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid #222;color:#e8e8e8;">${value}</td>
        </tr>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 20px;color:#aaa;">Novo pedido de contacto no website oficial.</p>
    <table width="100%" cellpadding="0" cellspacing="0">${table}</table>
    <p style="margin:24px 0 0;">
      <a href="mailto:${inquiry.email}" style="display:inline-block;padding:12px 24px;border:1px solid #b8965a;color:#b8965a;text-decoration:none;font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Responder ao cliente</a>
    </p>`;

  return emailShell("Novo contacto · " + tipo, body);
}

function buildAutoReplyHtml(inquiry: ContactInquiry): string {
  const tipo = projectLabel(inquiry.projectType);

  const body = `
    <p style="margin:0 0 16px;">Olá <strong style="color:#f0f0f0;font-weight:400;">${inquiry.name}</strong>,</p>
    <p style="margin:0 0 16px;">Recebemos o seu pedido sobre <em style="color:#b8965a;">${tipo}</em>. A nossa equipa irá analisar a sua mensagem e responder em breve com uma proposta personalizada.</p>
    <p style="margin:0 0 16px;color:#999;font-size:14px;">Se preferir falar connosco de imediato, pode contactar-nos pelo WhatsApp <a href="${siteContact.whatsapp.href}" style="color:#b8965a;">${siteContact.whatsapp.display}</a> ou email <a href="mailto:${siteContact.email}" style="color:#b8965a;">${siteContact.email}</a>.</p>
    <p style="margin:24px 0 0;font-style:italic;color:#888;">Com apreço,<br>Equipa ${BRAND}</p>`;

  return emailShell("Recebemos o seu pedido", body);
}

export async function sendContactEmails(
  inquiry: ContactInquiry
): Promise<{ teamSent: boolean; autoReplySent: boolean }> {
  if (!isResendConfigured()) {
    console.warn("[contact] RESEND_API_KEY não configurada — emails não enviados.");
    return { teamSent: false, autoReplySent: false };
  }

  const notifyEmail = getNotifyInbox();
  const tipo = projectLabel(inquiry.projectType);
  const subjectParts = [`[${BRAND}]`, "Novo contacto", tipo];
  if (inquiry.packageLabel) subjectParts.push(inquiry.packageLabel);

  const teamResult = await sendHaxrEmail({
    channel: "noreply",
    to: notifyEmail,
    replyTo: inquiry.email,
    subject: subjectParts.join(" · "),
    html: buildTeamNotificationHtml(inquiry),
  });

  if (!teamResult.ok) {
    console.error("[contact] Falha email equipa:", teamResult.error);
  }

  const replyResult = await sendHaxrEmail({
    channel: "hello",
    to: inquiry.email,
    replyTo: notifyEmail,
    subject: `${BRAND} · Recebemos o seu pedido`,
    html: buildAutoReplyHtml(inquiry),
  });

  if (!replyResult.ok) {
    console.error("[contact] Falha auto-reply:", replyResult.error);
  }

  return {
    teamSent: teamResult.ok,
    autoReplySent: replyResult.ok,
  };
}

export { isResendConfigured } from "@/lib/email/resend";
