/**
 * Wrapper server-side único para API Brevo v3.
 * Reutiliza brevoFetch existente — não expor chaves.
 */

import { brevoFetch, brevoReady, type BrevoApiResult } from "@/lib/brevo/client";
import {
  getBrevoSender,
  getEmailSendMode,
  MARKETING_SEND_CONFIRMATION,
  resolveOutboundRecipient,
} from "@/lib/email/email-config";
import type { SendEmailOutcome } from "@/lib/email/email-types";

export { brevoFetch, brevoReady, type BrevoApiResult };

export type CreateOrUpdateContactInput = {
  email: string;
  attributes?: Record<string, string | number | boolean>;
  listIds?: number[];
};

export async function createOrUpdateContact(
  input: CreateOrUpdateContactInput
): Promise<BrevoApiResult<{ id?: number }>> {
  return brevoFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.toLowerCase(),
      attributes: input.attributes ?? {},
      listIds: input.listIds ?? [],
      updateEnabled: true,
    }),
  });
}

export async function addContactToList(
  listId: number,
  email: string
): Promise<BrevoApiResult<unknown>> {
  return brevoFetch(`/contacts/lists/${listId}/contacts/add`, {
    method: "POST",
    body: JSON.stringify({ emails: [email.toLowerCase()] }),
  });
}

export type SendTransactionalEmailInput = {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  preheader?: string;
  tags?: string[];
};

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<SendEmailOutcome> {
  if (!brevoReady()) {
    return { ok: false, error: "BREVO_API_KEY não configurada" };
  }

  const resolved = resolveOutboundRecipient(input.toEmail, input.toName);
  if (resolved.skipped) {
    return { ok: true, mock: true, reason: resolved.reason ?? "envio desactivado" };
  }

  const sender = getBrevoSender();
  const subjectPrefix =
    getEmailSendMode() === "test" ? "[TESTE] " : "";

  const result = await brevoFetch<{ messageId?: string }>("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender,
      to: [{ email: resolved.email, name: resolved.name }],
      replyTo: { email: sender.email, name: sender.name },
      subject: `${subjectPrefix}${input.subject}`,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
      headers: input.preheader
        ? { "X-Mailin-Preview": input.preheader }
        : undefined,
      tags: input.tags ?? ["haxr-transactional"],
    }),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, messageId: result.data?.messageId };
}

export async function sendTestEmail(input: {
  subject: string;
  htmlContent: string;
  textContent?: string;
  preheader?: string;
}): Promise<SendEmailOutcome> {
  const testRecipient = process.env.BREVO_TEST_RECIPIENT?.trim();
  if (!testRecipient) {
    return {
      ok: false,
      error: "BREVO_TEST_RECIPIENT não configurado",
    };
  }

  return sendTransactionalEmail({
    toEmail: testRecipient,
    toName: "HAXR Test",
    subject: input.subject,
    htmlContent: input.htmlContent,
    textContent: input.textContent,
    preheader: input.preheader,
    tags: ["haxr-test"],
  });
}

export type CreateCampaignDraftInput = {
  name: string;
  subject: string;
  htmlContent: string;
  listIds: number[];
  previewText?: string;
};

/** Cria rascunho de campanha no Brevo — não envia. */
export async function createCampaignDraft(
  input: CreateCampaignDraftInput
): Promise<BrevoApiResult<{ id?: number }>> {
  const sender = getBrevoSender();

  return brevoFetch("/emailCampaigns", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      subject: input.subject,
      sender,
      htmlContent: input.htmlContent,
      previewText: input.previewText,
      recipients: { listIds: input.listIds },
      inlineImageActivation: false,
    }),
  });
}

export type SendCampaignInput = {
  campaignId: number;
  listId: number;
  confirm?: string;
  dryRun?: boolean;
};

/**
 * Envio de campanha — apenas com confirmação explícita e modo production.
 * Nunca envia silenciosamente.
 */
export async function sendCampaign(
  input: SendCampaignInput
): Promise<
  | { ok: true; campaignId: number; dryRun: boolean; recipientListId: number }
  | { ok: false; error: string }
> {
  if (getEmailSendMode() !== "production") {
    return {
      ok: false,
      error: "Envio de campanha requer EMAIL_SEND_MODE=production",
    };
  }

  if (input.confirm !== MARKETING_SEND_CONFIRMATION) {
    return {
      ok: false,
      error: `Confirmação inválida — use confirm: "${MARKETING_SEND_CONFIRMATION}"`,
    };
  }

  if (input.dryRun !== false) {
    return {
      ok: false,
      error: "dryRun deve ser false explicitamente para enviar",
    };
  }

  if (!brevoReady()) {
    return { ok: false, error: "BREVO_API_KEY não configurada" };
  }

  console.info(
    `[email/marketing] A enviar campanha ${input.campaignId} para lista ${input.listId}`
  );

  const result = await brevoFetch(`/emailCampaigns/${input.campaignId}/sendNow`, {
    method: "POST",
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    campaignId: input.campaignId,
    dryRun: false,
    recipientListId: input.listId,
  };
}
