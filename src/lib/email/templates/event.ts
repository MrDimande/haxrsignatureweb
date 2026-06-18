import { buildBrandEmailHtml } from "@/lib/email/brand-shell";
import { siteContact } from "@/lib/site-config";

export type EventEmailContext = {
  guestName: string;
  eventTitle: string;
  eventDate?: string;
  eventUrl?: string;
  seatLabel?: string;
  tableLabel?: string;
};

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${name}</strong>,</p>`;
}

function eventRef(ctx: EventEmailContext): string {
  return `<p style="margin:0 0 16px;">Referente a <em style="color:#c9a962;">${ctx.eventTitle}</em>${ctx.eventDate ? ` · ${ctx.eventDate}` : ""}.</p>`;
}

export function buildRsvpConfirmedEmail(ctx: EventEmailContext): string {
  return buildBrandEmailHtml({
    title: "Presença confirmada",
    preheader: `A sua presença em ${ctx.eventTitle} foi registada.`,
    body: `${greeting(ctx.guestName)}
${eventRef(ctx)}
<p style="margin:0 0 16px;">A sua confirmação foi recebida com apreço. Guardámos o seu lugar e partilharemos novidades relevantes à medida que a data se aproximar.</p>
<p style="margin:0;font-style:italic;color:#8a8478;">Com os melhores cumprimentos,<br>Equipa HAXR Signature</p>`,
    cta: ctx.eventUrl
      ? { label: "Ver convite", href: ctx.eventUrl }
      : undefined,
  });
}

export function buildRsvpDeclinedEmail(ctx: EventEmailContext): string {
  return buildBrandEmailHtml({
    title: "Resposta registada",
    preheader: `Recebemos a sua resposta sobre ${ctx.eventTitle}.`,
    body: `${greeting(ctx.guestName)}
${eventRef(ctx)}
<p style="margin:0 0 16px;">Recebemos a sua resposta e agradecemos que nos tenha informado. Será sempre bem-vindo se as circunstâncias mudarem.</p>
<p style="margin:0;font-style:italic;color:#8a8478;">Com apreço,<br>Equipa HAXR Signature</p>`,
  });
}

export function buildRsvpUpdatedEmail(ctx: EventEmailContext): string {
  return buildBrandEmailHtml({
    title: "Confirmação actualizada",
    preheader: `A sua resposta sobre ${ctx.eventTitle} foi actualizada.`,
    body: `${greeting(ctx.guestName)}
${eventRef(ctx)}
<p style="margin:0 0 16px;">Registámos a actualização da sua resposta. A equipa do evento foi notificada automaticamente.</p>
<p style="margin:0;font-style:italic;color:#8a8478;">Com apreço,<br>Equipa HAXR Signature</p>`,
    cta: ctx.eventUrl
      ? { label: "Rever convite", href: ctx.eventUrl }
      : undefined,
  });
}

export function buildEventInviteEmail(ctx: EventEmailContext): string {
  return buildBrandEmailHtml({
    title: "O seu convite",
    preheader: `Foi convidado para ${ctx.eventTitle}.`,
    body: `${greeting(ctx.guestName)}
<p style="margin:0 0 16px;">É com prazer que partilhamos o convite para <em style="color:#c9a962;">${ctx.eventTitle}</em>${ctx.eventDate ? `, a ${ctx.eventDate}` : ""}.</p>
<p style="margin:0 0 16px;">Abra a experiência digital para confirmar presença, consultar detalhes e viver a antecipação do evento com a elegância que merece.</p>`,
    cta: ctx.eventUrl
      ? { label: "Abrir convite", href: ctx.eventUrl }
      : undefined,
  });
}

export function buildFindYourSeatEmail(ctx: EventEmailContext): string {
  const seat =
    ctx.seatLabel || ctx.tableLabel
      ? `<p style="margin:0 0 16px;">O seu lugar${ctx.tableLabel ? ` na mesa <strong style="color:#f5f0e8;font-weight:400;">${ctx.tableLabel}</strong>` : ""}${ctx.seatLabel ? `, lugar <strong style="color:#f5f0e8;font-weight:400;">${ctx.seatLabel}</strong>` : ""}, está reservado.</p>`
      : `<p style="margin:0 0 16px;">Consulte o seu lugar na recepção — basta introduzir o seu nome na experiência Find Your Seat.</p>`;

  return buildBrandEmailHtml({
    title: "O seu lugar está definido",
    preheader: `Encontre o seu lugar em ${ctx.eventTitle}.`,
    body: `${greeting(ctx.guestName)}
${eventRef(ctx)}
${seat}
<p style="margin:0 0 16px;">Na recepção, localize o seu lugar de forma discreta e rápida — sem filas, com a fluidez que o momento exige.</p>`,
    cta: ctx.eventUrl
      ? { label: "Encontrar lugar", href: ctx.eventUrl }
      : undefined,
  });
}

export function buildCheckInEmail(ctx: EventEmailContext): string {
  return buildBrandEmailHtml({
    title: "Bem-vindo ao evento",
    preheader: `Check-in registado em ${ctx.eventTitle}.`,
    body: `${greeting(ctx.guestName)}
${eventRef(ctx)}
<p style="margin:0 0 16px;">O seu check-in foi registado. A equipa de recepção está pronta para o acolher com a discrição e elegância do evento.</p>
<p style="margin:0;font-style:italic;color:#8a8478;">Desejamos uma experiência memorável.</p>`,
  });
}

export function buildCommercialFollowUpEmail(
  name: string,
  topic: string
): string {
  return buildBrandEmailHtml({
    title: "Continuamos à disposição",
    preheader: `Sobre o seu pedido: ${topic}`,
    body: `${greeting(name)}
<p style="margin:0 0 16px;">Entrámos em contacto sobre <em style="color:#c9a962;">${topic}</em> e gostaríamos de saber se podemos avançar com uma proposta personalizada.</p>
<p style="margin:0 0 16px;">Responda a este email ou fale connosco pelo WhatsApp <a href="${siteContact.whatsapp.href}" style="color:#c9a962;">${siteContact.whatsapp.display}</a>.</p>
<p style="margin:0;font-style:italic;color:#8a8478;">Com apreço,<br>Equipa HAXR Signature</p>`,
    cta: {
      label: "Pedir proposta",
      href: "https://www.haxrsignature.com/contacto",
    },
  });
}

export function buildProposalConfirmationEmail(
  name: string,
  topic: string
): string {
  return buildBrandEmailHtml({
    title: "Pedido de proposta recebido",
    preheader: "A equipa HAXR irá preparar uma resposta personalizada.",
    body: `${greeting(name)}
<p style="margin:0 0 16px;">Recebemos o seu pedido de proposta sobre <em style="color:#c9a962;">${topic}</em>. A nossa equipa irá analisar os detalhes e responder em breve com uma proposta à medida do seu evento.</p>
<p style="margin:0 0 16px;">Se preferir falar de imediato, estamos disponíveis pelo WhatsApp <a href="${siteContact.whatsapp.href}" style="color:#c9a962;">${siteContact.whatsapp.display}</a> ou por <a href="mailto:${siteContact.email}" style="color:#c9a962;">${siteContact.email}</a>.</p>
<p style="margin:0;font-style:italic;color:#8a8478;">Com apreço,<br>Equipa HAXR Signature</p>`,
  });
}
