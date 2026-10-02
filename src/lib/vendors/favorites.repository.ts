import { neonQuery } from "@/lib/neon/server-db";

export type SupplierFavoriteQueryError = {
  code?: string;
  message: string;
} | null;

export type SupplierFavoriteQueryResult<T> = {
  data: T | null;
  error: SupplierFavoriteQueryError;
};

function mapNeonError(cause: unknown): SupplierFavoriteQueryError {
  const code =
    typeof cause === "object" && cause !== null && "code" in cause
      ? String((cause as { code?: unknown }).code ?? "") || undefined
      : undefined;
  return {
    ...(code ? { code } : {}),
    message: cause instanceof Error ? cause.message : "Falha na persistência Neon.",
  };
}

export async function listSavedSupplierProfileIds(
  ownerUserId: string,
): Promise<SupplierFavoriteQueryResult<string[]>> {
  try {
    const result = await neonQuery<{ supplier_profile_id: string }>(
      `SELECT supplier_profile_id
         FROM public.saved_supplier_profiles
        WHERE owner_user_id = $1::uuid
        ORDER BY created_at DESC`,
      [ownerUserId],
    );
    return {
      data: result.rows.map((row) => row.supplier_profile_id),
      error: null,
    };
  } catch (cause) {
    return { data: null, error: mapNeonError(cause) };
  }
}

export async function findPublishedSupplierProfile(
  supplierProfileId: string,
): Promise<SupplierFavoriteQueryResult<{ id: string }>> {
  try {
    const result = await neonQuery<{ id: string }>(
      `SELECT id
         FROM public.supplier_profiles
        WHERE id = $1::uuid
          AND publication_status = 'published'::supplier_publication_status
        LIMIT 1`,
      [supplierProfileId],
    );
    return { data: result.rows[0] ?? null, error: null };
  } catch (cause) {
    return { data: null, error: mapNeonError(cause) };
  }
}

export async function saveSupplierProfileFavorite(
  ownerUserId: string,
  supplierProfileId: string,
): Promise<SupplierFavoriteQueryResult<null>> {
  try {
    await neonQuery(
      `INSERT INTO public.saved_supplier_profiles (owner_user_id, supplier_profile_id)
       VALUES ($1::uuid, $2::uuid)
       ON CONFLICT (owner_user_id, supplier_profile_id) DO NOTHING`,
      [ownerUserId, supplierProfileId],
    );
    return { data: null, error: null };
  } catch (cause) {
    return { data: null, error: mapNeonError(cause) };
  }
}

export async function removeSupplierProfileFavorite(
  ownerUserId: string,
  supplierProfileId: string,
): Promise<SupplierFavoriteQueryResult<null>> {
  try {
    await neonQuery(
      `DELETE FROM public.saved_supplier_profiles
        WHERE owner_user_id = $1::uuid
          AND supplier_profile_id = $2::uuid`,
      [ownerUserId, supplierProfileId],
    );
    return { data: null, error: null };
  } catch (cause) {
    return { data: null, error: mapNeonError(cause) };
  }
}
