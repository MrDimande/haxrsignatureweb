/** Layout HTML partilhado — emails Resend (identidade HAXR). */

const BRAND = "HAXR Signature";
const GOLD = "#c9a962";
const BG = "#0a0a0a";
const PANEL = "#111111";
const BORDER = "#2a2418";
const TEXT = "#d4cfc6";
const MUTED = "#8a8478";

export type BrandEmailOptions = {
  title: string;
  preheader?: string;
  body: string;
  cta?: { label: string; href: string };
  footerNote?: string;
};

export function buildBrandEmailHtml({
  title,
  preheader,
  body,
  cta,
  footerNote,
}: BrandEmailOptions): string {
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>`
    : "";

  const ctaBlock = cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;"><tr><td style="background-color:${GOLD};"><a href="${cta.href}" style="display:inline-block;padding:14px 32px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;color:#0a0a0a;font-family:Arial,sans-serif;">${cta.label}</a></td></tr></table>`
    : "";

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
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:${PANEL};border:1px solid ${BORDER};">
<tr><td style="padding:40px 40px 28px;text-align:center;border-bottom:1px solid ${BORDER};">
<p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:${GOLD};">${BRAND}</p>
<h1 style="margin:16px 0 0;font-size:24px;font-weight:400;line-height:1.35;color:#f5f0e8;">${title}</h1>
</td></tr>
<tr><td style="padding:32px 40px 24px;font-size:16px;line-height:1.7;color:${TEXT};">
${body}
${ctaBlock}
</td></tr>
<tr><td style="padding:24px 40px 36px;border-top:1px solid ${BORDER};">
<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">Maputo, Moçambique</p>
${footerNote ? `<p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#5c574e;">${footerNote}</p>` : ""}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
