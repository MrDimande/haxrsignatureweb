/**
 * Captura segura de contactos de marketing — persistência + sync Brevo.
 * Não dispara campanhas. Não envia emails por si só.
 */

import {
  type CaptureMarketingContactResult,
  type MarketingContact,
  toHaxrLead,
} from "@/lib/email/marketing/marketing-contact";
import {
  insertMarketingContact,
  markMarketingContactBrevoSynced,
} from "@/lib/email/marketing/marketing-contacts.repository";
import { syncMarketingContact } from "@/lib/email/marketing/marketing-service";

export async function captureMarketingContact(
  contact: MarketingContact
): Promise<CaptureMarketingContactResult> {
  const normalized: MarketingContact = {
    ...contact,
    email: contact.email.toLowerCase().trim(),
    createdAt: contact.createdAt ?? new Date().toISOString(),
  };

  const stored = await insertMarketingContact(normalized);
  if (!stored) {
    console.warn(
      "[contact-capture] Lead aceite sem persistência local:",
      normalized.email,
      normalized.segment
    );
  }

  if (normalized.consentStatus !== "granted") {
    return {
      ok: true,
      contactId: stored?.id ?? null,
      stored: Boolean(stored),
      brevo: {
        synced: false,
        skipped: "Sem consentimento de marketing (consentStatus !== granted)",
      },
    };
  }

  const brevoResult = await syncMarketingContact(toHaxrLead(normalized));

  if (brevoResult.ok && brevoResult.synced && stored?.id) {
    await markMarketingContactBrevoSynced(stored.id);
  }

  if (!brevoResult.ok) {
    console.warn(
      "[contact-capture] Brevo sync falhou (não bloqueante):",
      brevoResult.error
    );
    return {
      ok: true,
      contactId: stored?.id ?? null,
      stored: Boolean(stored),
      brevo: { synced: false, skipped: "sync_indisponivel" },
    };
  }

  if (brevoResult.ok && !brevoResult.synced) {
    console.warn(
      "[contact-capture] Brevo sync ignorado:",
      brevoResult.skipped ?? "n/d"
    );
  }

  return {
    ok: true,
    contactId: stored?.id ?? null,
    stored: Boolean(stored),
    brevo: {
      synced: brevoResult.ok && brevoResult.synced,
      skipped: brevoResult.ok && !brevoResult.synced ? brevoResult.skipped : undefined,
    },
  };
}
