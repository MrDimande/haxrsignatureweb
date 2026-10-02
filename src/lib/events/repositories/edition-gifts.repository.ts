import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.neon.repository";
import { listEditionGiftReservations as listEditionGiftReservationsNeon } from "@/lib/events/repositories/edition-gifts.neon.repository";

export type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.neon.repository";

export function listEditionGiftReservations(
  registryKey: string,
): Promise<EditionGiftReservation[]> {
  return listEditionGiftReservationsNeon(registryKey);
}
