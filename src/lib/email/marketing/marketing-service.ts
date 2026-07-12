import {
  brevoReady,
  createCampaignDraft,
  createOrUpdateContact,
  sendCampaign,
  sendTestEmail,
  sendTransactionalEmail,
} from "@/lib/email/brevo-client";
import {
  getEmailSendMode,
  MARKETING_SEND_CONFIRMATION,
} from "@/lib/email/email-config";
import type {
  ConsentStatus,
  HAXRLead,
  SendEmailOutcome,
} from "@/lib/email/email-types";
import {
  getCampaignDraft,
  marketingCampaignDrafts,
} from "@/lib/email/marketing/marketing-campaigns";
import {
  buildBrevoMarketingContactAttributes,
  isBrevoPhoneValidationError,
  omitBrevoSmsAttribute,
} from "@/lib/email/marketing/brevo-contact-attributes";
import { resolveListIdsForSegments } from "@/lib/email/marketing/marketing-lists";
import { renderMarketingTemplate } from "@/lib/email/marketing/marketing-templates";

export type SyncMarketingContactResult =
  | { ok: true; synced: true }
  | { ok: true; synced: false; skipped: string }
  | { ok: false; error: string };

function consentAllowsMarketing(consent: ConsentStatus): boolean {
  return consent === "granted";
}

/**
 * Sincroniza contacto para listas Brevo apenas com consentimento explícito (granted).
 */
export async function syncMarketingContact(
  contact: HAXRLead
): Promise<SyncMarketingContactResult> {
  if (!brevoReady()) {
    return { ok: true, synced: false, skipped: "Brevo não configurado" };
  }

  if (!consentAllowsMarketing(contact.consentStatus)) {
    return {
      ok: true,
      synced: false,
      skipped: "Sem consentimento de marketing",
    };
  }

  const { listIds, missing } = resolveListIdsForSegments([contact.segment]);
  if (!listIds.length) {
    return {
      ok: true,
      synced: false,
      skipped: `Listas não configuradas (${missing.join(", ") || "n/d"})`,
    };
  }

  const attributes = buildBrevoMarketingContactAttributes(contact);
  let result = await createOrUpdateContact({
    email: contact.email,
    listIds,
    attributes,
  });

  if (
    !result.ok &&
    contact.phone?.trim() &&
    attributes.SMS &&
    isBrevoPhoneValidationError(result.error)
  ) {
    console.warn(
      "[marketing-service] Brevo rejeitou SMS — retry sem atributo SMS:",
      contact.email
    );
    result = await createOrUpdateContact({
      email: contact.email,
      listIds,
      attributes: omitBrevoSmsAttribute(attributes),
    });
  }

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, synced: true };
}

export async function sendMarketingTestEmail(
  templateId: string,
  firstName = "Convidado"
): Promise<SendEmailOutcome> {
  const rendered = renderMarketingTemplate(templateId, firstName);
  if (!rendered) {
    return { ok: false, error: `Template desconhecido: ${templateId}` };
  }

  if (getEmailSendMode() === "disabled") {
    return {
      ok: true,
      mock: true,
      reason: "EMAIL_SEND_MODE=disabled — teste simulado",
    };
  }

  return sendTestEmail({
    subject: rendered.subject,
    htmlContent: rendered.html,
    textContent: rendered.text,
    preheader: rendered.preheader,
  });
}

export type CreateDraftResult =
  | { ok: true; campaignId: number; name: string; listIds: number[] }
  | { ok: false; error: string; missingLists?: string[] };

/** Cria rascunho no Brevo — não envia. */
export async function createCampaignDraftFromDefinition(
  campaignId: string,
  firstName = "Convidado"
): Promise<CreateDraftResult> {
  const draft = getCampaignDraft(campaignId);
  if (!draft) {
    return { ok: false, error: `Campanha desconhecida: ${campaignId}` };
  }

  const rendered = renderMarketingTemplate(draft.templateId, firstName);
  if (!rendered) {
    return { ok: false, error: `Template em falta: ${draft.templateId}` };
  }

  const { listIds, missing } = resolveListIdsForSegments(
    draft.audienceSegments
  );
  if (!listIds.length) {
    return {
      ok: false,
      error: "Nenhuma lista Brevo configurada para esta audiência",
      missingLists: missing,
    };
  }

  const result = await createCampaignDraft({
    name: draft.name,
    subject: rendered.subject,
    htmlContent: rendered.html,
    previewText: rendered.preheader,
    listIds,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const brevoId = result.data?.id;
  if (!brevoId) {
    return { ok: false, error: "Brevo não devolveu ID da campanha" };
  }

  return {
    ok: true,
    campaignId: brevoId,
    name: draft.name,
    listIds,
  };
}

export type SendMarketingCampaignInput = {
  campaignId: number;
  listId: number;
  confirm?: string;
  dryRun?: boolean;
};

export async function sendMarketingCampaign(
  input: SendMarketingCampaignInput
) {
  return sendCampaign({
    campaignId: input.campaignId,
    listId: input.listId,
    confirm: input.confirm,
    dryRun: input.dryRun,
  });
}

export async function sendMarketingTemplateEmail(input: {
  templateId: string;
  toEmail: string;
  toName: string;
  firstName?: string;
}): Promise<SendEmailOutcome> {
  const rendered = renderMarketingTemplate(
    input.templateId,
    input.firstName ?? input.toName
  );
  if (!rendered) {
    return { ok: false, error: `Template desconhecido: ${input.templateId}` };
  }

  return sendTransactionalEmail({
    toEmail: input.toEmail,
    toName: input.toName,
    subject: rendered.subject,
    htmlContent: rendered.html,
    textContent: rendered.text,
    preheader: rendered.preheader,
    tags: [`haxr-marketing-${input.templateId}`],
  });
}

export { marketingCampaignDrafts, MARKETING_SEND_CONFIRMATION };
