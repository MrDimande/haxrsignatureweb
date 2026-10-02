import { mapCatalogItem } from "@/lib/admin/db/mappers";
import type { BusinessId, CatalogFormData, ServiceCatalogItem } from "@/lib/admin/types";
import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";

type CatalogRow = Tables<"service_catalog">;
type NeonCatalogRow = { row: CatalogRow };

function slugifyId(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `service-${Date.now()}`;
}

export async function listCatalog(
  businessId?: BusinessId,
  includeInactive = false,
): Promise<ServiceCatalogItem[]> {
  const result = await neonQuery<NeonCatalogRow>(
    `SELECT to_jsonb(sc) AS row
     FROM public.service_catalog sc
     WHERE ($1::boolean OR sc.is_active = true)
       AND ($2::text IS NULL OR sc.business_id = $2 OR sc.business_id IS NULL)
     ORDER BY sc.sort_order`,
    [includeInactive, businessId ?? null],
  );
  return result.rows.map(({ row }) => mapCatalogItem(row));
}

export async function getCatalogForBusiness(
  businessId: BusinessId,
): Promise<ServiceCatalogItem[]> {
  const items = await listCatalog(businessId);
  return items.filter((item) => !item.businessIds || item.businessIds.includes(businessId));
}

export async function getCatalogItemById(
  id: string,
): Promise<ServiceCatalogItem | null> {
  const result = await neonQuery<NeonCatalogRow>(
    `SELECT to_jsonb(sc) AS row
     FROM public.service_catalog sc
     WHERE sc.id = $1
     LIMIT 1`,
    [id],
  );
  const row = result.rows[0]?.row;
  return row ? mapCatalogItem(row) : null;
}

export async function saveCatalogItem(
  form: CatalogFormData,
): Promise<ServiceCatalogItem> {
  const id = form.id?.trim() || slugifyId(form.name);
  const result = await neonQuery<NeonCatalogRow>(
    `WITH saved AS (
       INSERT INTO public.service_catalog (
         id, business_id, name, description, price, category, sort_order, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6::public.service_category, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         business_id = EXCLUDED.business_id,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         category = EXCLUDED.category,
         sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active
       RETURNING *
     )
     SELECT to_jsonb(saved) AS row FROM saved`,
    [
      id,
      form.businessId,
      form.name.trim(),
      form.description.trim() || null,
      form.price,
      form.category,
      form.sortOrder,
      form.isActive,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar item do catálogo.");
  return mapCatalogItem(row);
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await neonQuery(
    "UPDATE public.service_catalog SET is_active = false WHERE id = $1",
    [id],
  );
}
