import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";
import { mapCatalogItem } from "@/lib/admin/db/mappers";
import type { BusinessId, ServiceCatalogItem } from "@/lib/admin/types";

export async function listCatalog(
  businessId?: BusinessId
): Promise<ServiceCatalogItem[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("service_catalog")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

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
