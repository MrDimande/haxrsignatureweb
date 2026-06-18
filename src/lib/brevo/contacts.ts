import {
  getBrevoLeadsListId,
  getBrevoNewsletterListId,
} from "@/lib/brevo/config";
import { brevoFetch, brevoReady } from "@/lib/brevo/client";
import { triggerLeadFunnelOnSync } from "@/lib/brevo/funnel";
import { splitName } from "@/lib/brevo/names";
import { projectTypeLabels } from "@/lib/site-config";
import type { ContactInquiry } from "@/lib/contact/types";

export type BrevoSyncResult = {
  synced: boolean;
  skipped?: string;
  error?: string;
  funnel?: import("@/lib/brevo/funnel").FunnelOnSyncResult;
};

export type BrevoSyncOptions = {
  /** Envia emails do funil após sync (default: true). */
  triggerFunnel?: boolean;
};

function resolveListIds(inquiry: ContactInquiry): number[] {
  const ids = new Set<number>();
  const leadsList = getBrevoLeadsListId();
  const newsletterList = getBrevoNewsletterListId();

  if (leadsList) ids.add(leadsList);
  if (inquiry.marketingOptIn && newsletterList) ids.add(newsletterList);

  return [...ids];
}

function buildAttributes(inquiry: ContactInquiry): Record<string, string> {
  const { firstName, lastName } = splitName(inquiry.name);
  const projectLabel =
    projectTypeLabels[inquiry.projectType] ?? inquiry.projectType;

  return {
    FIRSTNAME: firstName,
    LASTNAME: lastName,
    PROJECT_TYPE: projectLabel,
    PACKAGE: inquiry.packageLabel?.trim() || "",
    LEAD_SOURCE: inquiry.source || "website",
    INQUIRY_ID: inquiry.id,
    MARKETING_OPT_IN: inquiry.marketingOptIn ? "yes" : "no",
    CLIENT_INTENT: inquiry.intent.slice(0, 500),
  };
}

/**
 * Sincroniza um lead do Supabase para o Brevo (upsert por email).
 * Falhas são não-bloqueantes — o formulário de contacto não depende disto.
 */
export async function syncInquiryToBrevo(
  inquiry: ContactInquiry,
  options: BrevoSyncOptions = {}
): Promise<BrevoSyncResult> {
  const triggerFunnel = options.triggerFunnel ?? true;
  if (!brevoReady()) {
    return { synced: false, skipped: "Brevo não configurado" };
  }

  const listIds = resolveListIds(inquiry);
  if (!listIds.length) {
    return {
      synced: false,
      skipped: "Nenhuma lista Brevo configurada (BREVO_LIST_LEADS / BREVO_LIST_NEWSLETTER)",
    };
  }

  const result = await brevoFetch<{ id?: number }>("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: inquiry.email.toLowerCase(),
      attributes: buildAttributes(inquiry),
      listIds,
      updateEnabled: true,
    }),
  });

  if (!result.ok) {
    return { synced: false, error: result.error };
  }

  const output: BrevoSyncResult = { synced: true };

  if (triggerFunnel) {
    try {
      output.funnel = await triggerLeadFunnelOnSync(inquiry);
    } catch (err) {
      console.warn("[brevo] funnel on sync:", err);
    }
  }

  return output;
}

export { splitName };
