import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";
import { mapCatalogItem } from "@/lib/admin/db/mappers";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { BusinessId, CatalogFormData, ServiceCatalogItem } from "@/lib/admin/types";

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
  includeInactive = false
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

export async function getCatalogForBusiness(
  businessId: BusinessId
): Promise<ServiceCatalogItem[]> {
  const items = await listCatalog(businessId);
  return items.filter(
    (item) => !item.businessIds || item.businessIds.includes(businessId)
  );
}

export async function getCatalogItemById(
  id: string
): Promise<ServiceCatalogItem | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCatalogItem(data);
}

export async function saveCatalogItem(
  form: CatalogFormData
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
  return mapCatalogItem(data);
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("service_catalog")
    .update({ is_active: false } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
}
