import { NextResponse } from "next/server";
import { resolveClientEventReadRequestAuth } from "@/lib/auth/client-event-server-clients";
import {
  isSameOriginMutation,
  mapSupplierFavoriteError,
  supplierFavoriteSchema,
} from "@/lib/vendors/favorites";
import {
  findPublishedSupplierProfile,
  listSavedSupplierProfileIds,
  removeSupplierProfileFavorite,
  saveSupplierProfileFavorite,
  type SupplierFavoritesClient,
} from "@/lib/vendors/favorites.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function authenticate(request: Request) {
  return resolveClientEventReadRequestAuth<SupplierFavoritesClient>(request);
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
    const { user, authClient } = await authenticate(request);
    if (!user) {
      return json({ ok: false, message: "Inicie sessão para ver os guardados." }, 401);
    }

    const { data, error } = await listSavedSupplierProfileIds(user.id, authClient);
    if (error) {
      return json({ ok: false, message: "Não foi possível carregar os guardados." }, 503);
    }

    return json({ ok: true, supplierIds: data ?? [] });
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

    const { user, authClient } = await authenticate(request);
    if (!user) {
      return json({ ok: false, message: "Inicie sessão para guardar." }, 401);
    }

    const { data: profile, error: profileError } = await findPublishedSupplierProfile(
      parsed.supplierId,
      authClient,
    );
    if (profileError || !profile) {
      return json({ ok: false, message: "Fornecedor publicado não encontrado." }, 404);
    }

    const { error } = await saveSupplierProfileFavorite(
      user.id,
      parsed.supplierId,
      authClient,
    );
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

    const { user, authClient } = await authenticate(request);
    if (!user) {
      return json({ ok: false, message: "Inicie sessão para continuar." }, 401);
    }

    const { error } = await removeSupplierProfileFavorite(
      user.id,
      parsed.supplierId,
      authClient,
    );
    const mapped = mapSupplierFavoriteError(error);
    if (mapped) {
      return json({ ok: false, message: mapped.message }, mapped.status);
    }

    return json({ ok: true, supplierId: parsed.supplierId });
  } catch {
    return json({ ok: false, message: "Não foi possível remover o fornecedor." }, 503);
  }
}
