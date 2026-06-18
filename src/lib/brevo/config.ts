/**
 * Brevo (marketing / CRM) — separado do Resend (transaccional).
 *
 * Variáveis:
 * - BREVO_API_KEY — chave API v3 (Contacts)
 * - BREVO_LIST_LEADS — ID da lista «Leads website» (todos os pedidos)
 * - BREVO_LIST_NEWSLETTER — ID da lista «Newsletter» (só com marketingOptIn)
 */

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

function parseListId(raw: string | undefined): number | null {
  const value = raw?.trim();
  if (!value) return null;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function getBrevoLeadsListId(): number | null {
  return parseListId(process.env.BREVO_LIST_LEADS);
}

export function getBrevoNewsletterListId(): number | null {
  return parseListId(process.env.BREVO_LIST_NEWSLETTER);
}

export function isBrevoFunnelEnabled(): boolean {
  return (
    process.env.BREVO_FUNNEL_ENABLED !== "false" && isBrevoConfigured()
  );
}

export function getBrevoSender(): { name: string; email: string } {
  return {
    name: process.env.BREVO_SENDER_NAME?.trim() || "HAXR Signature",
    email:
      process.env.BREVO_SENDER_EMAIL?.trim() || "hello@haxrsignature.com",
  };
}

function parsePositiveDays(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? String(fallback), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getBrevoFunnelDelays(): {
  portfolioDays: number;
  experiencesDays: number;
  meetingDays: number;
  lastCallDays: number;
} {
  return {
    portfolioDays: parsePositiveDays(
      process.env.BREVO_FUNNEL_PORTFOLIO_DAYS,
      3
    ),
    experiencesDays: parsePositiveDays(
      process.env.BREVO_FUNNEL_EXPERIENCES_DAYS,
      7
    ),
    meetingDays: parsePositiveDays(process.env.BREVO_FUNNEL_MEETING_DAYS, 14),
    lastCallDays: parsePositiveDays(
      process.env.BREVO_FUNNEL_LAST_CALL_DAYS,
      21
    ),
  };
}

/** Atributos personalizados — criar no painel Brevo (Contacts → Settings → Contact attributes). */
export const brevoCustomAttributes = [
  "PROJECT_TYPE",
  "PACKAGE",
  "LEAD_SOURCE",
  "INQUIRY_ID",
  "MARKETING_OPT_IN",
  "CLIENT_INTENT",
] as const;
