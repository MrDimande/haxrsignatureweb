import { escapeHtml } from "@/lib/brevo/html";

export type FunnelEmailKind =
  | "lead_welcome"
  | "lead_portfolio"
  | "lead_experiences"
  | "lead_meeting"
  | "lead_last_call"
  | "newsletter_welcome";

export type FunnelTemplateParams = {
  firstName: string;
};

type FunnelTemplate = {
  subject: string;
  previewText: string;
  html: (params: FunnelTemplateParams) => string;
};

function shell(title: string, body: string, footer?: string): string {
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAXR Signature</title></head><body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Georgia,'Times New Roman',serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #2a2418;"><tr><td style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid #2a2418;"><p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#c9a962;">HAXR Signature</p><h1 style="margin:16px 0 0;font-size:28px;font-weight:400;line-height:1.35;color:#f5f0e8;">${title}</h1></td></tr><tr><td style="padding:32px 40px 16px;">${body}</td></tr>${footer ? `<tr><td style="padding:24px 40px 40px;border-top:1px solid #2a2418;">${footer}</td></tr>` : ""}</table></td></tr></table></body></html>`;
}

function cta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 32px;"><tr><td style="background-color:#c9a962;"><a href="${href}" style="display:inline-block;padding:14px 32px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;color:#0a0a0a;font-family:Arial,sans-serif;">${label}</a></td></tr></table>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d4cfc6;">${text}</p>`;
}

const templates: Record<FunnelEmailKind, FunnelTemplate> = {
  lead_welcome: {
    subject: "Recebemos o seu pedido — HAXR Signature",
    previewText: "Em breve entramos em contacto para desenhar a sua experiência.",
    html: ({ firstName }) =>
      shell(
        "Obrigado pelo seu contacto.",
        `${paragraph(`Olá ${escapeHtml(firstName)},`)}
${paragraph("Recebemos o seu pedido através do nosso website. A nossa equipa irá analisar os detalhes e entrar em contacto consigo em breve para compreender a visão do seu evento.")}
${paragraph("Na HAXR Signature, cada experiência é desenhada com rigor editorial — convites digitais, identidade visual e coordenação de eventos com assinatura própria.")}
${cta("https://www.haxrsignature.com", "Visitar o website")}`,
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#8a8478;">Com os melhores cumprimentos,</p>
<p style="margin:0;font-size:14px;color:#c9a962;">Equipa HAXR Signature</p>
<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#5c574e;">Maputo, Moçambique · <a href="mailto:hello@haxrsignature.com" style="color:#8a8478;">hello@haxrsignature.com</a></p>`
      ),
  },
  lead_portfolio: {
    subject: "Qual pacote combina com o seu evento?",
    previewText:
      "Essencial, Signature e Royal — descubra qual experiência combina com o seu evento.",
    html: ({ firstName }) =>
      shell(
        "Três níveis. Uma assinatura.",
        `${paragraph(`Olá ${escapeHtml(firstName)},`)}
${paragraph("Cada evento pede um nível de detalhe diferente. Na HAXR Signature desenhamos experiências em três pacotes — do essencial ao royal — sempre com rigor editorial e identidade visual coerente.")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;border:1px solid #2a2418;"><tr><td style="padding:20px 24px;"><p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a962;">01 · Essencial</p><p style="margin:0;font-size:15px;line-height:1.6;color:#d4cfc6;">Convite digital elegante, RSVP e presença digital impecável.</p></td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;border:1px solid #3d3528;"><tr><td style="padding:20px 24px;"><p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a962;">02 · Signature</p><p style="margin:0;font-size:15px;line-height:1.6;color:#d4cfc6;">Identidade visual completa, save the date e coordenação editorial.</p></td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border:1px solid #2a2418;"><tr><td style="padding:20px 24px;"><p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a962;">03 · Royal</p><p style="margin:0;font-size:15px;line-height:1.6;color:#d4cfc6;">Experiência integral — convite, gestão de convidados e dia do evento.</p></td></tr></table>
${cta("https://www.haxrsignature.com/#convites", "Ver portfólio")}`,
        `<p style="margin:0 0 8px;font-size:13px;color:#8a8478;">Respondemos com prazer a qualquer dúvida.</p>
<p style="margin:0;font-size:14px;color:#c9a962;">Equipa HAXR Signature</p>`
      ),
  },
  lead_experiences: {
    subject: "Experiências que definem a nossa assinatura",
    previewText:
      "Casamentos, corporativos e celebrações — histórias reais com curadoria HAXR.",
    html: ({ firstName }) =>
      shell(
        "Histórias que inspiram.",
        `${paragraph(`Olá ${escapeHtml(firstName)},`)}
${paragraph("Cada evento HAXR nasce de um desafio concreto — e termina numa memória que os convidados ainda comentam semanas depois.")}
${paragraph("Convites digitais com narrativa imersiva, save the dates editoriais, identidade visual coerente e operações de convidados conduzidas com discrição: este é o universo que construímos para quem não aceita o genérico.")}
${cta("https://www.haxrsignature.com/portfolio", "Explorar experiências")}`,
        `<p style="margin:0;font-size:14px;color:#c9a962;">Equipa HAXR Signature</p>`
      ),
  },
  lead_meeting: {
    subject: "Podemos agendar uma conversa sobre o seu evento?",
    previewText:
      "Uma reunião discreta para compreender a visão do seu evento — sem compromisso.",
    html: ({ firstName }) =>
      shell(
        "Uma conversa com intenção.",
        `${paragraph(`Olá ${escapeHtml(firstName)},`)}
${paragraph("Gostaríamos de compreender melhor a história que pretende contar — data, dimensão, nível de acompanhamento e o que mais valoriza numa assessoria de alto padrão.")}
${paragraph("Se fizer sentido para si, podemos agendar uma conversa por videochamada, telefone ou presencialmente em Maputo. Respondemos com discrição e sem pressão comercial.")}
${cta("https://www.haxrsignature.com/contacto", "Pedir reunião")}`,
        `<p style="margin:0;font-size:14px;color:#c9a962;">Equipa HAXR Signature</p>
<p style="margin:12px 0 0;font-size:12px;color:#5c574e;">hello@haxrsignature.com · Maputo</p>`
      ),
  },
  lead_last_call: {
    subject: "Ainda podemos ajudar com o seu evento?",
    previewText: "Se ainda pretende avançar, estamos à disposição — sem pressão.",
    html: ({ firstName }) =>
      shell(
        "Ainda podemos ajudar?",
        `${paragraph(`Olá ${escapeHtml(firstName)},`)}
${paragraph("Há alguns dias recebemos o seu contacto e gostaríamos de saber se ainda pretende avançar com a planificação do seu evento.")}
${paragraph("Se o timing mudou, sem problema — estamos disponíveis quando fizer sentido para si. Se quiser retomar a conversa, basta responder a este email ou solicitar uma chamada.")}
${cta("https://www.haxrsignature.com/contacto", "Retomar contacto")}
<p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:#8a8478;text-align:center;">Sem pressão — apenas à disposição.</p>`,
        `<p style="margin:0;font-size:14px;color:#c9a962;">Equipa HAXR Signature</p>
<p style="margin:12px 0 0;font-size:12px;color:#5c574e;">hello@haxrsignature.com · Maputo</p>`
      ),
  },
  newsletter_welcome: {
    subject: "Bem-vindo à newsletter HAXR Signature",
    previewText:
      "Inspiração editorial, convites e tendências de eventos — directamente na sua caixa de entrada.",
    html: ({ firstName }) =>
      shell(
        "Bem-vindo à nossa newsletter.",
        `${paragraph(`Olá ${escapeHtml(firstName)},`)}
${paragraph("Obrigado por subscrever. A partir de agora receberá novidades sobre convites digitais, tendências de eventos e inspiração editorial — sempre com o rigor visual que define a HAXR Signature.")}
${paragraph("Enquanto isso, explore o nosso portfólio de experiências e save the dates assinados.")}
${cta("https://www.haxrsignature.com", "Explorar HAXR")}`,
        `<p style="margin:0 0 8px;font-size:13px;color:#8a8478;">Com apreço,</p>
<p style="margin:0;font-size:14px;color:#c9a962;">Equipa HAXR Signature</p>
<p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:#5c574e;">Pode cancelar a subscrição a qualquer momento através do link no rodapé dos nossos emails.</p>`
      ),
  },
};

export function getFunnelTemplate(kind: FunnelEmailKind): FunnelTemplate {
  return templates[kind];
}
