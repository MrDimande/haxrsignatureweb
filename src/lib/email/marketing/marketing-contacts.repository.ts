import type { MarketingContact } from "@/lib/email/marketing/marketing-contact";
import {
  insertMarketingContact as insertMarketingContactNeon,
  markMarketingContactBrevoSynced as markMarketingContactBrevoSyncedNeon,
} from "@/lib/email/marketing/marketing-contacts.neon.repository";

export function insertMarketingContact(
  contact: MarketingContact,
): Promise<{ id: string } | null> {
  return insertMarketingContactNeon(contact);
}

export function markMarketingContactBrevoSynced(id: string): Promise<void> {
  return markMarketingContactBrevoSyncedNeon(id);
}
