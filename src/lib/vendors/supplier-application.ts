import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import { createAdminClient } from "@/lib/supabase/server";

export type SupplierApplicationInput = {
  applicantUserId: string | null;
  supplierName: string;
  responsibleName: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  portfolioUrl: string | null;
  message: string | null;
};

type SupplierApplicationInsertResult = {
  data: { id: string; status: string } | null;
  error: { code?: string; message: string } | null;
};

export type SupplierApplicationClient = {
  from(table: "supplier_applications"): {
    insert(values: {
      applicant_user_id: string | null;
      supplier_name: string;
      responsible_name: string;
      email: string;
      phone: string;
      category: string;
      city: string;
      portfolio_url: string | null;
      message: string | null;
    }): {
      select(columns: string): {
        single(): Promise<SupplierApplicationInsertResult>;
      };
    };
  };
};

export type CreateSupplierApplicationResult =
  | { ok: true; id: string | null; duplicate: boolean; status: "pending" }
  | { ok: false; message: string };

type NormalizedSupplierApplication = {
  applicant_user_id: string | null;
  supplier_name: string;
  responsible_name: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  portfolio_url: string | null;
  message: string | null;
};

type NeonSupplierApplicationRow = {
  id: string;
  status: string;
};

function normalizeSupplierApplicationInput(
  input: SupplierApplicationInput,
): NormalizedSupplierApplication {
  return {
    applicant_user_id: input.applicantUserId,
    supplier_name: input.supplierName.trim(),
    responsible_name: input.responsibleName.trim(),
    email: input.email.trim().toLocaleLowerCase("pt-PT"),
    phone: input.phone.trim(),
    category: input.category.trim(),
    city: input.city.trim(),
    portfolio_url: input.portfolioUrl?.trim() || null,
    message: input.message?.trim() || null,
  };
}

function duplicateResult(): CreateSupplierApplicationResult {
  return { ok: true, id: null, duplicate: true, status: "pending" };
}

function failureResult(): CreateSupplierApplicationResult {
  return {
    ok: false,
    message: "Não foi possível guardar a candidatura. Tente novamente.",
  };
}

/** Supabase implementation kept intact for Production and unit-test compatibility. */
export async function createSupplierApplication(
  client: SupplierApplicationClient,
  input: SupplierApplicationInput,
): Promise<CreateSupplierApplicationResult> {
  const values = normalizeSupplierApplicationInput(input);
  const { data, error } = await client
    .from("supplier_applications")
    .insert(values)
    .select("id, status")
    .single();

  if (error?.code === "23505") {
    return duplicateResult();
  }

  if (error || !data) {
    return failureResult();
  }

  return { ok: true, id: data.id, duplicate: false, status: "pending" };
}

async function createSupplierApplicationNeon(
  input: SupplierApplicationInput,
): Promise<CreateSupplierApplicationResult> {
  const values = normalizeSupplierApplicationInput(input);

  try {
    const result = await neonQuery<NeonSupplierApplicationRow>(
      `INSERT INTO public.supplier_applications (
         applicant_user_id,
         supplier_name,
         responsible_name,
         email,
         phone,
         category,
         city,
         portfolio_url,
         message
       )
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::text AS id, status::text AS status`,
      [
        values.applicant_user_id,
        values.supplier_name,
        values.responsible_name,
        values.email,
        values.phone,
        values.category,
        values.city,
        values.portfolio_url,
        values.message,
      ],
    );

    const row = result.rows[0];
    return row
      ? { ok: true, id: row.id, duplicate: false, status: "pending" }
      : failureResult();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return duplicateResult();
    }
    return failureResult();
  }
}

/**
 * Provider-aware entry point used by the public supplier application route.
 * Preview migration writes to Neon; Production remains on Supabase.
 */
export async function createSupplierApplicationForActiveDatabase(
  input: SupplierApplicationInput,
): Promise<CreateSupplierApplicationResult> {
  if (shouldUseNeonServerDatabase()) {
    return createSupplierApplicationNeon(input);
  }

  return createSupplierApplication(
    createAdminClient() as unknown as SupplierApplicationClient,
    input,
  );
}
