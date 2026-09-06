import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";

export type SupplierFavoriteQueryError = {
  code?: string;
  message: string;
} | null;

export type SupplierFavoriteQueryResult<T> = {
  data: T | null;
  error: SupplierFavoriteQueryError;
};

type SupplierFavoriteRow = {
  supplier_profile_id?: string;
  id?: string;
};

type SelectQuery<T> = PromiseLike<SupplierFavoriteQueryResult<T>> & {
  eq(column: string, value: string): SelectQuery<T>;
  maybeSingle(): Promise<
    SupplierFavoriteQueryResult<T extends Array<infer Item> ? Item : T>
  >;
};

type DeleteQuery = PromiseLike<SupplierFavoriteQueryResult<null>> & {
  eq(column: string, value: string): DeleteQuery;
};

export type SupplierFavoritesClient = {
  from(table: "saved_supplier_profiles" | "supplier_profiles"): {
    select(columns: string): SelectQuery<SupplierFavoriteRow[]>;
    insert(values: {
      owner_user_id: string;
      supplier_profile_id: string;
    }): PromiseLike<SupplierFavoriteQueryResult<null>>;
    delete(): DeleteQuery;
  };
};

function unavailable(message: string): SupplierFavoriteQueryError {
  return { message };
}

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
  supabaseClient: SupplierFavoritesClient | null,
): Promise<SupplierFavoriteQueryResult<string[]>> {
  if (shouldUseNeonServerDatabase()) {
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

  if (!supabaseClient) {
    return { data: null, error: unavailable("Cliente Supabase indisponível.") };
  }

  const { data, error } = await supabaseClient
    .from("saved_supplier_profiles")
    .select("supplier_profile_id")
    .eq("owner_user_id", ownerUserId);

  return {
    data: error
      ? null
      : (data ?? [])
          .map((row) => row.supplier_profile_id)
          .filter((id): id is string => typeof id === "string"),
    error,
  };
}

export async function findPublishedSupplierProfile(
  supplierProfileId: string,
  supabaseClient: SupplierFavoritesClient | null,
): Promise<SupplierFavoriteQueryResult<{ id: string }>> {
  if (shouldUseNeonServerDatabase()) {
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

  if (!supabaseClient) {
    return { data: null, error: unavailable("Cliente Supabase indisponível.") };
  }

  const { data, error } = await supabaseClient
    .from("supplier_profiles")
    .select("id")
    .eq("id", supplierProfileId)
    .eq("publication_status", "published")
    .maybeSingle();

  return {
    data: data?.id ? { id: data.id } : null,
    error,
  };
}

export async function saveSupplierProfileFavorite(
  ownerUserId: string,
  supplierProfileId: string,
  supabaseClient: SupplierFavoritesClient | null,
): Promise<SupplierFavoriteQueryResult<null>> {
  if (shouldUseNeonServerDatabase()) {
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

  if (!supabaseClient) {
    return { data: null, error: unavailable("Cliente Supabase indisponível.") };
  }

  const result = await supabaseClient.from("saved_supplier_profiles").insert({
    owner_user_id: ownerUserId,
    supplier_profile_id: supplierProfileId,
  });
  return { data: result.data, error: result.error };
}

export async function removeSupplierProfileFavorite(
  ownerUserId: string,
  supplierProfileId: string,
  supabaseClient: SupplierFavoritesClient | null,
): Promise<SupplierFavoriteQueryResult<null>> {
  if (shouldUseNeonServerDatabase()) {
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

  if (!supabaseClient) {
    return { data: null, error: unavailable("Cliente Supabase indisponível.") };
  }

  const result = await supabaseClient
    .from("saved_supplier_profiles")
    .delete()
    .eq("owner_user_id", ownerUserId)
    .eq("supplier_profile_id", supplierProfileId);
  return { data: result.data, error: result.error };
}
