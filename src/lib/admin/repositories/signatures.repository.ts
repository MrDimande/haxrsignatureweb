import { mapSignature } from "@/lib/admin/db/mappers";
import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import type { BusinessId, BusinessSignature, UploadSignatureInput } from "@/lib/admin/types";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";

type SignatureRow = Tables<"business_signatures">;
type NeonSignatureRow = { row: SignatureRow };

export async function listSignatures(
  businessId?: BusinessId,
): Promise<BusinessSignature[]> {
  const result = await neonQuery<NeonSignatureRow>(
    `SELECT to_jsonb(bs) AS row
     FROM public.business_signatures bs
     WHERE ($1::text IS NULL OR bs.business_id = $1)
     ORDER BY bs.is_default DESC, bs.created_at DESC`,
    [businessId ?? null],
  );
  return result.rows.map(({ row }) => mapSignature(row));
}

export async function createSignature(
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
      `WITH saved AS (
         INSERT INTO public.business_signatures (
           business_id, label, role_title, image_data, mime_type, is_default
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *
       ) SELECT to_jsonb(saved) AS row FROM saved`,
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

export async function deleteSignature(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.business_signatures WHERE id = $1", [id]);
}

export async function setDefaultSignature(
  id: string,
  businessId: BusinessId,
): Promise<BusinessSignature> {
  const row = await withNeonTransaction(async (client) => {
    await client.query(
      "UPDATE public.business_signatures SET is_default = false WHERE business_id = $1",
      [businessId],
    );
    const result = await client.query<NeonSignatureRow>(
      `WITH saved AS (
         UPDATE public.business_signatures
         SET is_default = true
         WHERE id = $1
         RETURNING *
       ) SELECT to_jsonb(saved) AS row FROM saved`,
      [id],
    );
    return result.rows[0]?.row;
  });
  if (!row) throw new Error("Assinatura não encontrada.");
  return mapSignature(row);
}
