/**
 * Configuração central de email outbound (marketing + funil Brevo).
 * Secrets apenas server-side — nunca NEXT_PUBLIC_*.
 */

export type EmailSendMode = "disabled" | "test" | "production";

/** Confirmação obrigatória para envio em massa a listas. */
export const MARKETING_SEND_CONFIRMATION = "SEND_HAXR_MARKETING" as const;

export function getEmailSendMode(): EmailSendMode {
  const raw = process.env.EMAIL_SEND_MODE?.trim().toLowerCase();
  if (raw === "production") return "production";
  if (raw === "test") return "test";
  return "disabled";
}

export function isEmailSendingAllowed(): boolean {
  return getEmailSendMode() !== "disabled";
}

export function getBrevoTestRecipient(): string | null {
  const value = process.env.BREVO_TEST_RECIPIENT?.trim();
  return value || null;
}

function parseListId(raw: string | undefined): number | null {
  const value = raw?.trim();
  if (!value) return null;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Lista geral de marketing (opcional — fallback para leads). */
export function getBrevoMarketingListId(): number | null {
  return (
    parseListId(process.env.BREVO_MARKETING_LIST_ID) ??
    parseListId(process.env.BREVO_LIST_LEADS)
  );
}

export function getBrevoSuppliersListId(): number | null {
  return parseListId(process.env.BREVO_SUPPLIERS_LIST_ID);
}

export function getBrevoClientsListId(): number | null {
  return parseListId(process.env.BREVO_CLIENTS_LIST_ID);
}

export function getBrevoSender(): { name: string; email: string } {
  return {
    name: process.env.BREVO_SENDER_NAME?.trim() || "HAXR Signature",
    email:
      process.env.BREVO_SENDER_EMAIL?.trim() || "hello@haxrsignature.com",
  };
}

export type ResolvedRecipient = {
  email: string;
  name: string;
  skipped: boolean;
  redirected: boolean;
  originalEmail?: string;
  reason?: string;
};

/**
 * Resolve o destinatário efectivo conforme EMAIL_SEND_MODE.
 * - disabled: não envia (skipped)
 * - test: redirecciona para BREVO_TEST_RECIPIENT
 * - production: destinatário real
 */
export function resolveOutboundRecipient(
  intendedEmail: string,
  intendedName: string
): ResolvedRecipient {
  const mode = getEmailSendMode();

  if (mode === "disabled") {
    return {
      email: "",
      name: "",
      skipped: true,
      redirected: false,
      reason: "EMAIL_SEND_MODE=disabled",
    };
  }

  if (mode === "test") {
    const test = getBrevoTestRecipient();
    if (!test) {
      return {
        email: "",
        name: "",
        skipped: true,
        redirected: false,
        reason: "BREVO_TEST_RECIPIENT não configurado",
      };
    }
    const normalized = test.toLowerCase();
    return {
      email: normalized,
      name: `[TEST] ${intendedName}`,
      skipped: false,
      redirected: normalized !== intendedEmail.toLowerCase(),
      originalEmail: intendedEmail,
    };
  }

  return {
    email: intendedEmail.toLowerCase(),
    name: intendedName,
    skipped: false,
    redirected: false,
  };
}
