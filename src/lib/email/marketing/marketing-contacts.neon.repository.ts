import { neonQuery } from "@/lib/neon/server-db";
import type { MarketingContact } from "@/lib/email/marketing/marketing-contact";

type InsertedContactRow = { id: string };

export async function insertMarketingContact(
  contact: MarketingContact,
): Promise<{ id: string } | null> {
  try {
    const result = await neonQuery<InsertedContactRow>(
      `
        INSERT INTO public.marketing_contacts (
          email,first_name,last_name,phone,company_name,role,segment,source,
          consent_status,consent_text,consent_at,city,event_type,event_date,
          message,metadata
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::timestamptz,$12,$13,$14::date,
          $15,$16::jsonb
        )
        RETURNING id
      `,
      [
        contact.email.toLowerCase(),
        contact.firstName,
        contact.lastName ?? null,
        contact.phone ?? null,
        contact.companyName ?? null,
        contact.role ?? null,
        contact.segment,
        contact.source,
        contact.consentStatus,
        contact.consentText ?? null,
        contact.consentAt ?? null,
        contact.city ?? null,
        contact.eventType ?? null,
        contact.eventDate ?? null,
        contact.message ?? null,
        JSON.stringify(contact.metadata ?? {}),
      ],
    );

    const id = result.rows[0]?.id;
    return id ? { id } : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[marketing-contacts] insert failed:", message);
    return null;
  }
}

export async function markMarketingContactBrevoSynced(id: string): Promise<void> {
  try {
    await neonQuery(
      `UPDATE public.marketing_contacts SET brevo_synced_at=now() WHERE id=$1::uuid`,
      [id],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[marketing-contacts] brevo sync mark failed:", message);
  }
}
