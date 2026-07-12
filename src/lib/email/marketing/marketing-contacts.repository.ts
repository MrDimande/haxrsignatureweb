import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { MarketingContact } from "@/lib/email/marketing/marketing-contact";

type MarketingContactInsert =
  Database["public"]["Tables"]["marketing_contacts"]["Insert"];

export async function insertMarketingContact(
  contact: MarketingContact
): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured()) {
    console.warn("[marketing-contacts] Supabase não configurado — lead não persistido");
    return null;
  }

  const supabase = createAdminClient();
  const payload: MarketingContactInsert = {
    email: contact.email.toLowerCase(),
    first_name: contact.firstName,
    last_name: contact.lastName ?? null,
    phone: contact.phone ?? null,
    company_name: contact.companyName ?? null,
    role: contact.role ?? null,
    segment: contact.segment,
    source: contact.source,
    consent_status: contact.consentStatus,
    consent_text: contact.consentText ?? null,
    consent_at: contact.consentAt ?? null,
    city: contact.city ?? null,
    event_type: contact.eventType ?? null,
    event_date: contact.eventDate ?? null,
    message: contact.message ?? null,
    metadata: (contact.metadata ?? {}) as Json,
  };

  const { data, error } = await supabase
    .from("marketing_contacts")
    .insert(payload as never)
    .select("id")
    .single();

  if (error) {
    console.error("[marketing-contacts] insert failed:", error.message);
    return null;
  }

  const id = (data as { id: string } | null)?.id;
  return id ? { id } : null;
}

export async function markMarketingContactBrevoSynced(
  id: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("marketing_contacts")
    .update({ brevo_synced_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) {
    console.warn("[marketing-contacts] brevo sync mark failed:", error.message);
  }
}

export type { MarketingContactInsert };
