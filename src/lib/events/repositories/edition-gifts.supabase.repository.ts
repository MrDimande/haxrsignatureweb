import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";

export type EditionGiftReservation = {
  id: string;
  registryKey: string;
  giftId: string;
  giftName: string;
  reservedBy: string;
  createdAt: string;
  category: string;
};

function inferCategory(giftId: string): string {
  const prefix = giftId.split("-")[0] ?? "";
  const labels: Record<string, string> = {
    cozinha: "Cozinha",
    casa: "Casa",
    banho: "Casa de banho",
    noiva: "Noiva (info)",
  };
  return labels[prefix] ?? prefix;
}

export async function listEditionGiftReservations(
  registryKey: string
): Promise<EditionGiftReservation[]> {
  if (!registryKey.trim()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("edition_gift_reservations")
    .select("id, registry_key, gift_id, gift_name, reserved_by, created_at")
    .eq("registry_key", registryKey.trim())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return asTableRows<"edition_gift_reservations">(data).map((row) => ({
    id: row.id,
    registryKey: row.registry_key,
    giftId: row.gift_id,
    giftName: row.gift_name || row.gift_id,
    reservedBy: row.reserved_by,
    createdAt: row.created_at,
    category: inferCategory(row.gift_id),
  }));
}
