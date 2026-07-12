/** Layout HTML partilhado — emails Resend (identidade HAXR). */

import { renderEmailBrandHeader } from "@/lib/brand/logo-url";

const BRAND = "HAXR Signature";
const PRODUCT = "HAXR Signature Edition";
const GOLD = "#c9a962";
const GOLD_SOFT = "#a8893f";
const BG = "#0a0a0a";
const PANEL = "#111111";
const PANEL_INNER = "#0d0d0d";
const BORDER = "#2a2418";
const BORDER_SOFT = "#1e1a14";
const TEXT = "#d4cfc6";
const MUTED = "#8a8478";
const HEADING = "#f5f0e8";

export type BrandEmailOptions = {
  title: string;
  subtitle?: string;
  editionTag?: string;
  preheader?: string;
  body: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  footerNote?: string;
  signature?: boolean;
};

function buildSignatureBlock(): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
<tr><td style="padding-top:20px;border-top:1px solid ${BORDER};">
<p style="margin:0;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:${GOLD};">${BRAND}</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:${MUTED};font-style:italic;">Luxury Digital Experience Studio</p>
<p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#5c574e;">
<a href="mailto:hello@haxrsignature.com" style="color:${GOLD_SOFT};text-decoration:none;">hello@haxrsignature.com</a>
&nbsp;·&nbsp; Maputo, Moçambique
</p>
</td></tr>
</table>`;
}

export function buildBrandEmailHtml({
  title,
  subtitle,
  editionTag,
  preheader,
  body,
  cta,
  secondaryCta,
  footerNote,
  signature = false,
}: BrandEmailOptions): string {
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>`
    : "";

  const editionBlock = editionTag
    ? `<p style="margin:0 0 12px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:${GOLD_SOFT};">${editionTag}</p>`
    : "";

  const subtitleBlock = subtitle
    ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:${MUTED};font-weight:400;">${subtitle}</p>`
    : "";

  const ctaBlock =
    cta || secondaryCta
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:${secondaryCta ? "32px" : "28px"} auto 0;">
${cta ? `<tr><td align="center" style="padding-bottom:${secondaryCta ? "12px" : "0"};">
<a href="${cta.href}" style="display:inline-block;padding:14px 36px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;color:#0a0a0a;font-family:Georgia,'Times New Roman',serif;background-color:${GOLD};border:1px solid ${GOLD};">${cta.label}</a>
</td></tr>` : ""}
${secondaryCta ? `<tr><td align="center">
<a href="${secondaryCta.href}" style="display:inline-block;padding:12px 28px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;color:${GOLD};font-family:Georgia,'Times New Roman',serif;border:1px solid ${BORDER};">${secondaryCta.label}</a>
</td></tr>` : ""}
</table>`
      : "";

  const footerExtra = footerNote
    ? `<p style="margin:16px 0 0;font-size:10px;line-height:1.6;color:#4a463e;letter-spacing:0.04em;">${footerNote}</p>`
    : "";

  const signatureBlock = signature ? buildSignatureBlock() : "";

  const headerPadding = editionTag || subtitle ? "44px 44px 32px" : "40px 40px 28px";
  const titleSize = editionTag || subtitle ? "26px" : "24px";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:Georgia,'Times New Roman',serif;">
${preheaderBlock}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BG};">
<tr><td align="center" style="padding:${signature ? "48px" : "40px"} 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:${PANEL};border:1px solid ${BORDER};">
<tr><td style="padding:${headerPadding};text-align:center;border-bottom:1px solid ${BORDER};">
${editionBlock}
${renderEmailBrandHeader({ shell: "transactional" })}
${editionTag || subtitle ? `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:20px auto 0;"><tr><td style="width:48px;height:1px;background:linear-gradient(to right,transparent,${GOLD},transparent);font-size:0;line-height:0;">&nbsp;</td></tr></table>` : ""}
<h1 style="margin:${editionTag || subtitle ? "20px" : "16px"} 0 0;font-size:${titleSize};font-weight:400;line-height:1.35;color:${HEADING};">${title}</h1>
${subtitleBlock}
</td></tr>
<tr><td style="padding:${signature ? "36px 44px 28px" : "32px 40px 24px"};font-size:16px;line-height:1.7;color:${TEXT};">
${body}
${ctaBlock}
</td></tr>
<tr><td style="padding:${signature ? "28px 44px 40px" : "24px 40px 36px"};border-top:1px solid ${BORDER};">
${signatureBlock}
${!signature ? `<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">Maputo, Moçambique</p>` : ""}
${footerExtra}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildEmailDetailCard(
  rows: ReadonlyArray<readonly [string, string]>
): string {
  const innerRows = rows
    .map(
      ([label, value], index) =>
        `<tr>
<td style="padding:${index === 0 ? "0" : "14px"} 0 14px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};vertical-align:top;width:36%;border-bottom:1px solid ${BORDER_SOFT};">${label}</td>
<td style="padding:${index === 0 ? "0" : "14px"} 0 14px 16px;color:${HEADING};vertical-align:top;border-bottom:1px solid ${BORDER_SOFT};">${value}</td>
</tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;background-color:${PANEL_INNER};border:1px solid ${BORDER};">
<tr><td style="padding:24px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${innerRows}</table>
</td></tr>
</table>`;
}

export function buildEmailStatusHero(
  attending: boolean,
  guestName: string,
  summary: string
): string {
  const accent = attending ? GOLD : "#6b6560";
  const label = attending ? "Presença confirmada" : "Impossibilidade registada";
  const icon = attending ? "✦" : "—";

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;">
<tr><td style="padding:28px 24px;background-color:${PANEL_INNER};border:1px solid ${BORDER};border-left:3px solid ${accent};">
<p style="margin:0;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};">${icon}&nbsp; ${label}</p>
<p style="margin:14px 0 0;font-size:22px;font-weight:400;line-height:1.35;color:${HEADING};">${guestName}</p>
<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">${summary}</p>
</td></tr>
</table>`;
}

export { PRODUCT as HAXR_EDITION_PRODUCT };
