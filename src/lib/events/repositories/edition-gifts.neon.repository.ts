import { neonQuery } from "@/lib/neon/server-db";

export type EditionGiftReservation = {
  id: string;
  registryKey: string;
  giftId: string;
  giftName: string;
  reservedBy: string;
  createdAt: string;
  category: string;
};

type EditionGiftRow = {
  id: string;
  registry_key: string;
  gift_id: string;
  gift_name: string;
  reserved_by: string;
  created_at: string;
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
  registryKey: string,
): Promise<EditionGiftReservation[]> {
  const normalizedRegistryKey = registryKey.trim();
  if (!normalizedRegistryKey) return [];

  const result = await neonQuery<EditionGiftRow>(
    `
      SELECT id,
             registry_key,
             gift_id,
             gift_name,
             reserved_by,
             to_jsonb(created_at) #>> '{}' AS created_at
      FROM public.edition_gift_reservations
      WHERE registry_key = $1
      ORDER BY created_at DESC
    `,
    [normalizedRegistryKey],
  );

  return result.rows.map((row) => ({
    id: row.id,
    registryKey: row.registry_key,
    giftId: row.gift_id,
    giftName: row.gift_name || row.gift_id,
    reservedBy: row.reserved_by,
    createdAt: row.created_at,
    category: inferCategory(row.gift_id),
  }));
}
