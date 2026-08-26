import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type { MarketingContact } from "@/lib/email/marketing/marketing-contact";
import {
  insertMarketingContact as insertMarketingContactNeon,
  markMarketingContactBrevoSynced as markMarketingContactBrevoSyncedNeon,
} from "@/lib/email/marketing/marketing-contacts.neon.repository";
import {
  insertMarketingContact as insertMarketingContactSupabase,
  markMarketingContactBrevoSynced as markMarketingContactBrevoSyncedSupabase,
} from "@/lib/email/marketing/marketing-contacts.supabase.repository";

export type { MarketingContactInsert } from "@/lib/email/marketing/marketing-contacts.supabase.repository";

export function insertMarketingContact(
  contact: MarketingContact,
): Promise<{ id: string } | null> {
  return shouldUseNeonServerDatabase()
    ? insertMarketingContactNeon(contact)
    : insertMarketingContactSupabase(contact);
}

export function markMarketingContactBrevoSynced(id: string): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? markMarketingContactBrevoSyncedNeon(id)
    : markMarketingContactBrevoSyncedSupabase(id);
}
