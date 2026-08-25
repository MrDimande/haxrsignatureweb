import { businesses as staticBusinesses } from "@/lib/admin/businesses";
import { mapBusiness } from "@/lib/admin/db/mappers";
import type { Business, BusinessId } from "@/lib/admin/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import type { Database } from "@/lib/supabase/database.types";
import { asTableRows, isSupabasePermissionDeniedError } from "@/lib/supabase/helpers";
import { createAdminClient } from "@/lib/supabase/server";

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
type BankAccountRow = Database["public"]["Tables"]["business_bank_accounts"]["Row"];
type MobilePaymentRow = Database["public"]["Tables"]["business_mobile_payments"]["Row"];
type JsonRow<T> = { row: T };

async function listBusinessesFromNeon(): Promise<Business[]> {
  const businessResult = await neonQuery<JsonRow<BusinessRow>>(`
    SELECT to_jsonb(b) AS row
    FROM public.businesses b
    WHERE b.is_active = true
    ORDER BY b.name
  `);

  const businesses = businessResult.rows.map(({ row }) => row);
  if (businesses.length === 0) return [];

  const ids = businesses.map((business) => business.id);

  const [bankResult, mobileResult] = await Promise.all([
    neonQuery<JsonRow<BankAccountRow>>(
      `
        SELECT to_jsonb(bank) AS row
        FROM public.business_bank_accounts bank
        WHERE bank.business_id = ANY($1::text[])
      `,
      [ids],
    ),
    neonQuery<JsonRow<MobilePaymentRow>>(
      `
        SELECT to_jsonb(mobile) AS row
        FROM public.business_mobile_payments mobile
        WHERE mobile.business_id = ANY($1::text[])
      `,
      [ids],
    ),
  ]);

  const bankRows = bankResult.rows.map(({ row }) => row);
  const mobileRows = mobileResult.rows.map(({ row }) => row);

  return businesses.map((business) =>
    mapBusiness(
      business,
      bankRows.filter((bank) => bank.business_id === business.id),
      mobileRows.filter((mobile) => mobile.business_id === business.id),
    ),
  );
}

async function listBusinessesFromSupabase(): Promise<Business[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);

  const businesses = asTableRows<"businesses">(data);
  if (businesses.length === 0) return [];

  const ids = businesses.map((business) => business.id);

  const [{ data: banks }, { data: mobiles }] = await Promise.all([
    supabase.from("business_bank_accounts").select("*").in("business_id", ids),
    supabase.from("business_mobile_payments").select("*").in("business_id", ids),
  ]);

  const bankRows = asTableRows<"business_bank_accounts">(banks);
  const mobileRows = asTableRows<"business_mobile_payments">(mobiles);

  return businesses.map((business) =>
    mapBusiness(
      business,
      bankRows.filter((bank) => bank.business_id === business.id),
      mobileRows.filter((mobile) => mobile.business_id === business.id),
    ),
  );
}

async function listBusinessesFromDatabase(): Promise<Business[]> {
  if (shouldUseNeonServerDatabase()) {
    return listBusinessesFromNeon();
  }

  return listBusinessesFromSupabase();
}

export async function listBusinesses(): Promise<Business[]> {
  const useNeon = shouldUseNeonServerDatabase();

  try {
    return await listBusinessesFromDatabase();
  } catch (error) {
    if (
      !useNeon &&
      process.env.NODE_ENV === "development" &&
      isSupabasePermissionDeniedError(error)
    ) {
      console.warn(
        "[admin] businesses: permission denied — a usar catálogo estático local. Verifique SUPABASE_SERVICE_ROLE_KEY e aplique supabase/migrations/045_admin_service_role_grants.sql no projecto Supabase.",
      );
      return staticBusinesses;
    }
    throw error;
  }
}

export async function getBusinessById(id: BusinessId): Promise<Business | null> {
  const businesses = await listBusinesses();
  return businesses.find((business) => business.id === id) ?? null;
}
