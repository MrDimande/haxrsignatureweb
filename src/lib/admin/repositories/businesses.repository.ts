import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";
import { mapBusiness } from "@/lib/admin/db/mappers";
import type { Business, BusinessId } from "@/lib/admin/types";

export async function listBusinesses(): Promise<Business[]> {
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

export async function getBusinessById(id: BusinessId): Promise<Business | null> {
  const businesses = await listBusinesses();
  return businesses.find((b) => b.id === id) ?? null;
}
