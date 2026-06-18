/**
 * Registo de automações futuras (newsletter, campanhas, portal).
 * Cada entrada pode ser ligada a cron, webhooks ou filas sem alterar fluxos existentes.
 */

export type AutomationChannel = "brevo" | "resend" | "internal";

export type AutomationDefinition = {
  id: string;
  name: string;
  channel: AutomationChannel;
  description: string;
  enabled: boolean;
};

export const automationRegistry: AutomationDefinition[] = [
  {
    id: "brevo-lead-funnel",
    name: "Funil de leads website",
    channel: "brevo",
    description: "Dia 0 boas-vindas · 3 portfólio · 7 experiências · 14 reunião · 21 última chamada",
    enabled: true,
  },
  {
    id: "brevo-newsletter",
    name: "Boas-vindas newsletter",
    channel: "brevo",
    description: "Opt-in no formulário de contacto",
    enabled: true,
  },
  {
    id: "resend-contact",
    name: "Contacto website",
    channel: "resend",
    description: "Notificação equipa + confirmação ao cliente",
    enabled: true,
  },
  {
    id: "resend-rsvp",
    name: "Emails de evento (RSVP)",
    channel: "resend",
    description: "Confirmação, recusa, actualização, convite, find-seat, check-in",
    enabled: true,
  },
  {
    id: "brevo-editorial-campaigns",
    name: "Campanhas editoriais",
    channel: "brevo",
    description: "Newsletter e insights — activar quando a biblioteca editorial crescer",
    enabled: false,
  },
  {
    id: "portal-cliente",
    name: "Portal Exclusivo HAXR",
    channel: "internal",
    description: "Notificações e aprovações para clientes activos",
    enabled: false,
  },
];

export function getEnabledAutomations(): AutomationDefinition[] {
  return automationRegistry.filter((a) => a.enabled);
}
