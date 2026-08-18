import { businesses as staticBusinesses } from "@/lib/admin/businesses";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows, isSupabasePermissionDeniedError } from "@/lib/supabase/helpers";
import { mapBusiness } from "@/lib/admin/db/mappers";
import type { Business, BusinessId } from "@/lib/admin/types";

async function listBusinessesFromDatabase(): Promise<Business[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);

  const businesses = asTableRows<"businesses">(data);
  if (businesses.length === 0) return [];

  const ids = businesses.map((b) => b.id);

  const [{ data: banks }, { data: mobiles }] = await Promise.all([
    supabase.from("business_bank_accounts").select("*").in("business_id", ids),
    supabase.from("business_mobile_payments").select("*").in("business_id", ids),
  ]);

  const bankRows = asTableRows<"business_bank_accounts">(banks);
  const mobileRows = asTableRows<"business_mobile_payments">(mobiles);

  return businesses.map((b) =>
    mapBusiness(
      b,
      bankRows.filter((bank) => bank.business_id === b.id),
      mobileRows.filter((m) => m.business_id === b.id)
    )
  );
}

export async function listBusinesses(): Promise<Business[]> {
  try {
    return await listBusinessesFromDatabase();
  } catch (error) {
    if (
      process.env.NODE_ENV === "development" &&
      isSupabasePermissionDeniedError(error)
    ) {
      console.warn(
        "[admin] businesses: permission denied — a usar catálogo estático local. Verifique SUPABASE_SERVICE_ROLE_KEY e aplique supabase/migrations/045_admin_service_role_grants.sql no projecto Supabase."
      );
      return staticBusinesses;
    }
    throw error;
  }
}

export async function getBusinessById(id: BusinessId): Promise<Business | null> {
  const businesses = await listBusinesses();
  return businesses.find((b) => b.id === id) ?? null;
}
