import { escapeHtml } from "@/lib/brevo/html";
import { getBrevoSender } from "@/lib/email/email-config";
import { renderEmailBrandHeader } from "@/lib/brand/logo-url";

/** Paleta premium — ivory/cream com acentos champagne */
const CREAM_BG = "#f3efe6";
const IVORY = "#faf8f4";
const CARD = "#ffffff";
const CHARCOAL = "#1a1814";
const TEXT = "#2c2820";
const MUTED = "#6d665c";
const GOLD = "#b89b5e";
const BORDER = "#e8e0d2";
const DIVIDER = "#d9cfbe";

const BRAND = "HAXR Signature";
const SITE = "https://www.haxrsignature.com";

export type MarketingEmailVariant = "consent" | "cold_outreach";

export type RenderMarketingEmailInput = {
  headline: string;
  preheader: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
  variant?: MarketingEmailVariant;
  includeUnsubscribe?: boolean;
};

export function paragraph(text: string): string {
  return `<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:${TEXT};font-family:Georgia,'Times New Roman',serif;">${text}</p>`;
}

export function mutedParagraph(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:${MUTED};font-family:Georgia,'Times New Roman',serif;">${text}</p>`;
}

export function bullets(items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:0 12px 10px 0;vertical-align:top;color:${GOLD};font-size:14px;line-height:1.6;">✦</td><td style="padding:0 0 10px;font-size:15px;line-height:1.65;color:${TEXT};font-family:Georgia,'Times New Roman',serif;">${item}</td></tr>`
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;width:100%;">${rows}</table>`;
}

export function divider(): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 28px;"><tr><td style="height:1px;background:linear-gradient(to right,transparent,${DIVIDER},transparent);font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

export function cta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px auto 32px;"><tr><td style="background-color:${GOLD};border-radius:2px;"><a href="${href}" style="display:inline-block;padding:15px 36px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;color:${CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-weight:600;">${escapeHtml(label)}</a></td></tr></table>`;
}

export function greeting(firstName: string): string {
  return paragraph(`Olá ${escapeHtml(firstName)},`);
}

const CONSENT_UNSUBSCRIBE =
  "Recebeu este email porque subscreveu, solicitou informação ou deu consentimento para comunicações da HAXR Signature. Pode cancelar a subscrição a qualquer momento através do link de descadastro abaixo.";

const COLD_OPT_OUT =
  "Se preferir não receber comunicações da HAXR, pode responder a este email com «remover» ou usar o link de descadastro abaixo.";

/**
 * Cold outreach: usar apenas para contactos seleccionados e relevantes.
 * Nunca listas compradas ou aleatórias.
 */
export function coldOutreachNotice(): string {
  return mutedParagraph(
    "Contactámos porque o vosso perfil ou referência parece alinhado com o tipo de eventos que a HAXR Signature acompanha. Se não for o momento certo, compreendemos perfeitamente."
  );
}

export function renderMarketingEmail(input: RenderMarketingEmailInput): string {
  const sender = getBrevoSender();
  const variant = input.variant ?? "consent";
  const showUnsubscribe = input.includeUnsubscribe !== false;

  const preheaderBlock = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(input.preheader)}</div>`
    : "";

  const footerParts = [
    divider(),
    `<p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${MUTED};font-family:Georgia,'Times New Roman',serif;">Com os melhores cumprimentos,</p>`,
    `<p style="margin:0 0 4px;font-size:14px;letter-spacing:0.12em;color:${GOLD};font-family:Georgia,'Times New Roman',serif;">Equipa HAXR Signature</p>`,
    `<p style="margin:16px 0 0;font-size:12px;line-height:1.65;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">Maputo, Moçambique · <a href="mailto:${escapeHtml(sender.email)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(sender.email)}</a> · <a href="${SITE}" style="color:${MUTED};text-decoration:none;">haxrsignature.com</a></p>`,
  ];

  if (showUnsubscribe) {
    const note = variant === "cold_outreach" ? COLD_OPT_OUT : CONSENT_UNSUBSCRIBE;
    footerParts.push(
      `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${BORDER};font-size:11px;line-height:1.65;color:#8a8478;font-family:Arial,Helvetica,sans-serif;">${note}</p>`,
      `<p style="margin:8px 0 0;font-size:10px;line-height:1.5;color:#a8a196;font-family:Arial,Helvetica,sans-serif;">{{ unsubscribe }}</p>`
    );
  }

  const ctaBlock = input.cta ? cta(input.cta.href, input.cta.label) : "";
  const brandHeader = renderEmailBrandHeader({ shell: "marketing" });

  return `<!DOCTYPE html><html lang="pt-MZ"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(BRAND)}</title></head><body style="margin:0;padding:0;background-color:${CREAM_BG};font-family:Georgia,'Times New Roman',serif;">${preheaderBlock}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${CREAM_BG};"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:${CARD};border:1px solid ${BORDER};box-shadow:0 2px 24px rgba(26,24,20,0.06);"><tr><td style="padding:0;background-color:${CHARCOAL};"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:36px 40px 32px;text-align:center;">${brandHeader}<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 18px;"><tr><td style="width:56px;height:1px;background:linear-gradient(to right,transparent,${GOLD},transparent);font-size:0;">&nbsp;</td></tr></table><h1 style="margin:0;font-size:26px;font-weight:400;line-height:1.35;color:${IVORY};font-family:Georgia,'Times New Roman',serif;">${escapeHtml(input.headline)}</h1></td></tr></table></td></tr><tr><td style="padding:36px 40px 12px;background-color:${IVORY};">${input.bodyHtml}${ctaBlock}</td></tr><tr><td style="padding:8px 40px 36px;background-color:${IVORY};">${footerParts.join("")}</td></tr></table></td></tr></table></body></html>`;
}

/** Constrói versão plain-text para deliverability */
export function buildPlainTextEmail(input: {
  firstName: string;
  headline: string;
  paragraphs: string[];
  bullets?: string[];
  cta?: { label: string; href: string };
  variant?: MarketingEmailVariant;
}): string {
  const sender = getBrevoSender();
  const lines = [
    BRAND,
    input.headline,
    "",
    `Olá ${input.firstName},`,
    "",
    ...input.paragraphs,
  ];

  if (input.bullets?.length) {
    lines.push("", ...input.bullets.map((b) => `• ${b.replace(/<[^>]+>/g, "")}`));
  }

  if (input.cta) {
    lines.push("", `${input.cta.label}: ${input.cta.href}`);
  }

  lines.push(
    "",
    "Com os melhores cumprimentos,",
    "Equipa HAXR Signature",
    `Maputo, Moçambique · ${sender.email}`,
    ""
  );

  if (input.variant === "cold_outreach") {
    lines.push(COLD_OPT_OUT);
  } else {
    lines.push(CONSENT_UNSUBSCRIBE);
  }

  return lines.join("\n");
}

export { SITE as HAXR_SITE_URL };
