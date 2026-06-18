import { buildBrandEmailHtml } from "@/lib/email/brand-shell";
import { getNotifyInbox } from "@/lib/email/addresses";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
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

function buildTeamNotificationHtml(inquiry: ContactInquiry): string {
  const tipo = projectLabel(inquiry.projectType);
  const pacote = inquiry.packageLabel?.trim() || "Não especificado";
  const marketing = inquiry.marketingOptIn ? "Sim" : "Não";

  const rows = [
    ["Nome", inquiry.name],
    [
      "Email",
      `<a href="mailto:${inquiry.email}" style="color:#c9a962;">${inquiry.email}</a>`,
    ],
    ["Tipo de projecto", tipo],
    ["Pacote", pacote],
    ["O que pretende", inquiry.intent.replace(/\n/g, "<br>")],
    ...(inquiry.message.trim()
      ? [["Detalhes", inquiry.message.replace(/\n/g, "<br>")] as const]
      : []),
    ["Newsletter", marketing],
    ["Recebido em", formatDate(inquiry.createdAt)],
    ["ID", inquiry.id],
  ];

  const table = rows
    .map(
      ([label, value]) =>
        `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;"><tr>
          <td style="padding:8px 0;border-bottom:1px solid #2a2418;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8478;vertical-align:top;width:38%;">${label}</td>
          <td style="padding:8px 0 8px 12px;border-bottom:1px solid #2a2418;color:#e8e4dc;">${value}</td>
        </tr></table>`
    )
    .join("");

  return buildBrandEmailHtml({
    title: "Novo contacto · " + tipo,
    preheader: `Novo pedido de ${inquiry.name} via website.`,
    body: `<p style="margin:0 0 20px;color:#8a8478;">Novo pedido de contacto no website oficial.</p>${table}`,
    cta: {
      label: "Responder ao cliente",
      href: `mailto:${inquiry.email}`,
    },
  });
}

function buildAutoReplyHtml(inquiry: ContactInquiry): string {
  const tipo = projectLabel(inquiry.projectType);

  return buildBrandEmailHtml({
    title: "Recebemos o seu pedido",
    preheader: "A equipa HAXR irá responder em breve com atenção personalizada.",
    body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${inquiry.name}</strong>,</p>
<p style="margin:0 0 16px;">Recebemos o seu pedido sobre <em style="color:#c9a962;">${tipo}</em>. A nossa equipa irá analisar a sua mensagem e responder em breve com uma proposta personalizada.</p>
<p style="margin:0 0 16px;color:#8a8478;font-size:14px;">Se preferir falar connosco de imediato, pode contactar-nos pelo WhatsApp <a href="${siteContact.whatsapp.href}" style="color:#c9a962;">${siteContact.whatsapp.display}</a> ou email <a href="mailto:${siteContact.email}" style="color:#c9a962;">${siteContact.email}</a>.</p>
<p style="margin:24px 0 0;font-style:italic;color:#8a8478;">Com apreço,<br>Equipa ${BRAND}</p>`,
    cta: {
      label: "Visitar website",
      href: "https://www.haxrsignature.com",
    },
  });
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
