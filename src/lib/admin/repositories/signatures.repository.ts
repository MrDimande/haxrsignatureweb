import { mapSignature } from "@/lib/admin/db/mappers";
import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import type {
  BusinessId,
  BusinessSignature,
  UploadSignatureInput,
} from "@/lib/admin/types";

export async function listSignatures(
  businessId?: BusinessId
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

export async function createSignature(
  input: UploadSignatureInput
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

export async function deleteSignature(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("business_signatures")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setDefaultSignature(
  id: string,
  businessId: BusinessId
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
