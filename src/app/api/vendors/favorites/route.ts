import { NextResponse } from "next/server";
import {
  isSameOriginMutation,
  mapSupplierFavoriteError,
  supplierFavoriteSchema,
} from "@/lib/vendors/favorites";
import { resolveAuthenticatedSupabaseClient } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QueryError = { code?: string; message: string } | null;
type QueryResult<T> = { data: T | null; error: QueryError };

type SelectQuery<T> = PromiseLike<QueryResult<T>> & {
  eq(column: string, value: string): SelectQuery<T>;
  maybeSingle(): Promise<QueryResult<T extends Array<infer Item> ? Item : T>>;
};

type DeleteQuery = PromiseLike<QueryResult<null>> & {
  eq(column: string, value: string): DeleteQuery;
};

type SupplierFavoritesClient = {
  from(table: "saved_supplier_profiles" | "supplier_profiles"): {
    select(columns: string): SelectQuery<Array<{ supplier_profile_id: string }>>;
    insert(values: {
      owner_user_id: string;
      supplier_profile_id: string;
    }): PromiseLike<QueryResult<null>>;
    delete(): DeleteQuery;
  };
};

function json(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function authenticate(request: Request) {
  const { user, supabase } = await resolveAuthenticatedSupabaseClient(request);
  return {
    user,
    client: supabase as unknown as SupplierFavoritesClient,
  };
}

async function parseSupplierId(request: Request): Promise<
  | { ok: true; supplierId: string }
  | { ok: false; response: NextResponse }
> {
  const raw = await request.json().catch(() => null);
  const parsed = supplierFavoriteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Pedido inválido." },
        400,
      ),
    };
  }
  return { ok: true, supplierId: parsed.data.supplierId };
}

export async function GET(request: Request) {
  try {
    const { user, client } = await authenticate(request);
    if (!user) return json({ ok: false, message: "Inicie sessão para ver os guardados." }, 401);

    const { data, error } = await client
      .from("saved_supplier_profiles")
      .select("supplier_profile_id")
      .eq("owner_user_id", user.id);

    if (error) {
      return json({ ok: false, message: "Não foi possível carregar os guardados." }, 503);
    }

    return json({
      ok: true,
      supplierIds: (data ?? []).map((row) => row.supplier_profile_id),
    });
  } catch {
    return json({ ok: false, message: "Não foi possível carregar os guardados." }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return json({ ok: false, message: "Origem do pedido inválida." }, 403);
  }

  try {
    const parsed = await parseSupplierId(request);
    if (!parsed.ok) return parsed.response;

    const { user, client } = await authenticate(request);
    if (!user) return json({ ok: false, message: "Inicie sessão para guardar." }, 401);

    const { data: profile, error: profileError } = await client
      .from("supplier_profiles")
      .select("id")
      .eq("id", parsed.supplierId)
      .eq("publication_status", "published")
      .maybeSingle();

    if (profileError || !profile) {
      return json({ ok: false, message: "Fornecedor publicado não encontrado." }, 404);
    }

    const { error } = await client.from("saved_supplier_profiles").insert({
      owner_user_id: user.id,
      supplier_profile_id: parsed.supplierId,
    });
    const mapped = mapSupplierFavoriteError(error);
    if (mapped && mapped.status !== 200) {
      return json({ ok: false, message: mapped.message }, mapped.status);
    }

    return json({ ok: true, supplierId: parsed.supplierId });
  } catch {
    return json({ ok: false, message: "Não foi possível guardar o fornecedor." }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request)) {
    return json({ ok: false, message: "Origem do pedido inválida." }, 403);
  }

  try {
    const parsed = await parseSupplierId(request);
    if (!parsed.ok) return parsed.response;

    const { user, client } = await authenticate(request);
    if (!user) return json({ ok: false, message: "Inicie sessão para continuar." }, 401);

    const { error } = await client
      .from("saved_supplier_profiles")
      .delete()
      .eq("owner_user_id", user.id)
      .eq("supplier_profile_id", parsed.supplierId);
    const mapped = mapSupplierFavoriteError(error);
    if (mapped) {
      return json({ ok: false, message: mapped.message }, mapped.status);
    }

    return json({ ok: true, supplierId: parsed.supplierId });
  } catch {
    return json({ ok: false, message: "Não foi possível remover o fornecedor." }, 503);
  }
}
