import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { listEditionGiftReservations as listEditionGiftReservationsNeon } from "@/lib/events/repositories/edition-gifts.neon.repository";
import { listEditionGiftReservations as listEditionGiftReservationsSupabase } from "@/lib/events/repositories/edition-gifts.supabase.repository";
import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.supabase.repository";

export type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.supabase.repository";

export function listEditionGiftReservations(
  registryKey: string,
): Promise<EditionGiftReservation[]> {
  return shouldUseNeonServerDatabase()
    ? listEditionGiftReservationsNeon(registryKey)
    : listEditionGiftReservationsSupabase(registryKey);
}
