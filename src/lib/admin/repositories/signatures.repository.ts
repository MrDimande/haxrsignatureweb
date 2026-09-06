import { mapSignature } from "@/lib/admin/db/mappers";
import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import type {
  BusinessId,
  BusinessSignature,
  UploadSignatureInput,
} from "@/lib/admin/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";

type SignatureRow = Tables<"business_signatures">;
type NeonSignatureRow = { row: SignatureRow };

async function listSignaturesFromNeon(
  businessId?: BusinessId,
): Promise<BusinessSignature[]> {
  const result = await neonQuery<NeonSignatureRow>(
    `
      SELECT to_jsonb(bs) AS row
      FROM public.business_signatures bs
      WHERE ($1::text IS NULL OR bs.business_id = $1)
      ORDER BY bs.is_default DESC, bs.created_at DESC
    `,
    [businessId ?? null],
  );

  return result.rows.map(({ row }) => mapSignature(row));
}

async function listSignaturesFromSupabase(
  businessId?: BusinessId,
): Promise<BusinessSignature[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("business_signatures")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return asTableRows<"business_signatures">(data).map(mapSignature);
}

export async function listSignatures(
  businessId?: BusinessId,
): Promise<BusinessSignature[]> {
  if (shouldUseNeonServerDatabase()) {
    return listSignaturesFromNeon(businessId);
  }

  return listSignaturesFromSupabase(businessId);
}

async function createSignatureInNeon(
  input: UploadSignatureInput,
): Promise<BusinessSignature> {
  const parsed = parseSignatureDataUrl(input.imageDataUrl);

  const row = await withNeonTransaction(async (client) => {
    if (input.setAsDefault) {
      await client.query(
        "UPDATE public.business_signatures SET is_default = false WHERE business_id = $1",
        [input.businessId],
      );
    }

    const result = await client.query<NeonSignatureRow>(
      `
        WITH saved AS (
          INSERT INTO public.business_signatures (
            business_id,
            label,
            role_title,
            image_data,
            mime_type,
            is_default
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row
        FROM saved
      `,
      [
        input.businessId,
        input.label.trim(),
        input.roleTitle.trim(),
        parsed.base64,
        parsed.mimeType,
        input.setAsDefault ?? false,
      ],
    );

    return result.rows[0]?.row;
  });

  if (!row) throw new Error("Falha ao guardar assinatura.");
  return mapSignature(row);
}

async function createSignatureInSupabase(
  input: UploadSignatureInput,
): Promise<BusinessSignature> {
  const supabase = createAdminClient();
  const parsed = parseSignatureDataUrl(input.imageDataUrl);

  if (input.setAsDefault) {
    const { error: clearError } = await supabase
      .from("business_signatures")
      .update({ is_default: false } as never)
      .eq("business_id", input.businessId);
    if (clearError) throw new Error(clearError.message);
  }

  const payload: TablesInsert<"business_signatures"> = {
    business_id: input.businessId,
    label: input.label.trim(),
    role_title: input.roleTitle.trim(),
    image_data: parsed.base64,
    mime_type: parsed.mimeType,
    is_default: input.setAsDefault ?? false,
  };

  const { data, error } = await supabase
    .from("business_signatures")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"business_signatures">(data);
  if (!row) throw new Error("Falha ao guardar assinatura.");

  return mapSignature(row);
}

export async function createSignature(
  input: UploadSignatureInput,
): Promise<BusinessSignature> {
  if (shouldUseNeonServerDatabase()) {
    return createSignatureInNeon(input);
  }

  return createSignatureInSupabase(input);
}

async function deleteSignatureFromNeon(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.business_signatures WHERE id = $1", [id]);
}

async function deleteSignatureFromSupabase(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("business_signatures")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSignature(id: string): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await deleteSignatureFromNeon(id);
    return;
  }

  await deleteSignatureFromSupabase(id);
}

async function setDefaultSignatureInNeon(
  id: string,
  businessId: BusinessId,
): Promise<BusinessSignature> {
  const row = await withNeonTransaction(async (client) => {
    await client.query(
      "UPDATE public.business_signatures SET is_default = false WHERE business_id = $1",
      [businessId],
    );

    const result = await client.query<NeonSignatureRow>(
      `
        WITH saved AS (
          UPDATE public.business_signatures
          SET is_default = true
          WHERE id = $1
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row
        FROM saved
      `,
      [id],
    );

    return result.rows[0]?.row;
  });

  if (!row) throw new Error("Assinatura não encontrada.");
  return mapSignature(row);
}

async function setDefaultSignatureInSupabase(
  id: string,
  businessId: BusinessId,
): Promise<BusinessSignature> {
  const supabase = createAdminClient();

  const { error: clearError } = await supabase
    .from("business_signatures")
    .update({ is_default: false } as never)
    .eq("business_id", businessId);
  if (clearError) throw new Error(clearError.message);

  const { data, error } = await supabase
    .from("business_signatures")
    .update({ is_default: true } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"business_signatures">(data);
  if (!row) throw new Error("Assinatura não encontrada.");

  return mapSignature(row);
}

export async function setDefaultSignature(
  id: string,
  businessId: BusinessId,
): Promise<BusinessSignature> {
  if (shouldUseNeonServerDatabase()) {
    return setDefaultSignatureInNeon(id, businessId);
  }

  return setDefaultSignatureInSupabase(id, businessId);
}
