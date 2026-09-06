import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { mapCatalogItem } from "@/lib/admin/db/mappers";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type { BusinessId, CatalogFormData, ServiceCatalogItem } from "@/lib/admin/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";

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

async function listCatalogFromNeon(
  businessId?: BusinessId,
  includeInactive = false,
): Promise<ServiceCatalogItem[]> {
  const result = await neonQuery<NeonCatalogRow>(
    `
      SELECT to_jsonb(sc) AS row
      FROM public.service_catalog sc
      WHERE ($1::boolean OR sc.is_active = true)
        AND (
          $2::text IS NULL
          OR sc.business_id = $2
          OR sc.business_id IS NULL
        )
      ORDER BY sc.sort_order
    `,
    [includeInactive, businessId ?? null],
  );

  return result.rows.map(({ row }) => mapCatalogItem(row));
}

async function listCatalogFromSupabase(
  businessId?: BusinessId,
  includeInactive = false,
): Promise<ServiceCatalogItem[]> {
  const supabase = createAdminClient();

  let query = supabase.from("service_catalog").select("*").order("sort_order");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  if (businessId) {
    query = query.or(`business_id.eq.${businessId},business_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return asTableRows<"service_catalog">(data).map(mapCatalogItem);
}

export async function listCatalog(
  businessId?: BusinessId,
  includeInactive = false,
): Promise<ServiceCatalogItem[]> {
  if (shouldUseNeonServerDatabase()) {
    return listCatalogFromNeon(businessId, includeInactive);
  }

  return listCatalogFromSupabase(businessId, includeInactive);
}

export async function getCatalogForBusiness(
  businessId: BusinessId,
): Promise<ServiceCatalogItem[]> {
  const items = await listCatalog(businessId);
  return items.filter(
    (item) => !item.businessIds || item.businessIds.includes(businessId),
  );
}

async function getCatalogItemByIdFromNeon(
  id: string,
): Promise<ServiceCatalogItem | null> {
  const result = await neonQuery<NeonCatalogRow>(
    `
      SELECT to_jsonb(sc) AS row
      FROM public.service_catalog sc
      WHERE sc.id = $1
      LIMIT 1
    `,
    [id],
  );

  const row = result.rows[0]?.row;
  return row ? mapCatalogItem(row) : null;
}

async function getCatalogItemByIdFromSupabase(
  id: string,
): Promise<ServiceCatalogItem | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"service_catalog">(data);
  return row ? mapCatalogItem(row) : null;
}

export async function getCatalogItemById(
  id: string,
): Promise<ServiceCatalogItem | null> {
  if (shouldUseNeonServerDatabase()) {
    return getCatalogItemByIdFromNeon(id);
  }

  return getCatalogItemByIdFromSupabase(id);
}

async function saveCatalogItemInNeon(
  form: CatalogFormData,
): Promise<ServiceCatalogItem> {
  const id = form.id?.trim() || slugifyId(form.name);
  const result = await neonQuery<NeonCatalogRow>(
    `
      WITH saved AS (
        INSERT INTO public.service_catalog (
          id,
          business_id,
          name,
          description,
          price,
          category,
          sort_order,
          is_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::public.service_category,
          $7,
          $8
        )
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
      SELECT to_jsonb(saved) AS row
      FROM saved
    `,
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

async function saveCatalogItemInSupabase(
  form: CatalogFormData,
): Promise<ServiceCatalogItem> {
  const supabase = createAdminClient();
  const id = form.id?.trim() || slugifyId(form.name);

  const row: TablesInsert<"service_catalog"> = {
    id,
    business_id: form.businessId,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: form.price,
    category: form.category,
    sort_order: form.sortOrder,
    is_active: form.isActive,
  };

  const { data, error } = await supabase
    .from("service_catalog")
    .upsert(row as never, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const saved = asTableRow<"service_catalog">(data);
  if (!saved) throw new Error("Falha ao guardar item do catálogo.");
  return mapCatalogItem(saved);
}

export async function saveCatalogItem(
  form: CatalogFormData,
): Promise<ServiceCatalogItem> {
  if (shouldUseNeonServerDatabase()) {
    return saveCatalogItemInNeon(form);
  }

  return saveCatalogItemInSupabase(form);
}

async function deleteCatalogItemFromNeon(id: string): Promise<void> {
  await neonQuery(
    "UPDATE public.service_catalog SET is_active = false WHERE id = $1",
    [id],
  );
}

async function deleteCatalogItemFromSupabase(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("service_catalog")
    .update({ is_active: false } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteCatalogItem(id: string): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await deleteCatalogItemFromNeon(id);
    return;
  }

  await deleteCatalogItemFromSupabase(id);
}
