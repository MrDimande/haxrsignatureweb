import { mapBusiness } from "@/lib/admin/db/mappers";
import type { Business, BusinessId } from "@/lib/admin/types";
import { neonQuery } from "@/lib/neon/server-db";
import type { Database } from "@/lib/supabase/database.types";

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
type BankAccountRow = Database["public"]["Tables"]["business_bank_accounts"]["Row"];
type MobilePaymentRow = Database["public"]["Tables"]["business_mobile_payments"]["Row"];
type JsonRow<T> = { row: T };

export async function listBusinesses(): Promise<Business[]> {
  const businessResult = await neonQuery<JsonRow<BusinessRow>>(
    `SELECT to_jsonb(b) AS row
     FROM public.businesses b
     WHERE b.is_active = true
     ORDER BY b.name`,
  );
  const businesses = businessResult.rows.map(({ row }) => row);
  if (!businesses.length) return [];

  const ids = businesses.map((business) => business.id);
  const [bankResult, mobileResult] = await Promise.all([
    neonQuery<JsonRow<BankAccountRow>>(
      `SELECT to_jsonb(bank) AS row
       FROM public.business_bank_accounts bank
       WHERE bank.business_id = ANY($1::text[])`,
      [ids],
    ),
    neonQuery<JsonRow<MobilePaymentRow>>(
      `SELECT to_jsonb(mobile) AS row
       FROM public.business_mobile_payments mobile
       WHERE mobile.business_id = ANY($1::text[])`,
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

export async function getBusinessById(id: BusinessId): Promise<Business | null> {
  const businesses = await listBusinesses();
  return businesses.find((business) => business.id === id) ?? null;
}
