import { NextResponse } from "next/server";
import {
  deleteClient,
  ensureClientPortalToken,
  getClientById,
  getClientByPortalToken,
  listClients,
  upsertClient,
} from "@/lib/admin/repositories/clients.repository";
import type { ClientFormData } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "migration/supabase-to-neon"
  );
}

export async function GET() {
  if (!isMigrationPreview()) {
    return new NextResponse(null, { status: 404 });
  }

  const initialCount = (await listClients()).length;
  let createdId: string | null = null;

  try {
    const suffix = Date.now().toString(36);
    const draft: ClientFormData = {
      fullName: `Migration Canary ${suffix}`,
      clientType: "individual",
      companyName: "",
      nuit: "",
      email: `migration-canary-${suffix}@example.invalid`,
      phone: "+258000000000",
      address: "Neon Preview",
    };

    const created = await upsertClient(draft);
    createdId = created.id;

    const fetched = await getClientById(created.id);
    const portalToken = await ensureClientPortalToken(created.id);
    const fetchedByToken = await getClientByPortalToken(portalToken);

    const updated = await upsertClient(
      { ...draft, fullName: `${draft.fullName} Updated` },
      created.id,
    );

    await deleteClient(created.id);
    createdId = null;

    const finalCount = (await listClients()).length;
    const ok = Boolean(
      fetched?.id === created.id &&
        fetchedByToken?.id === created.id &&
        updated.fullName.endsWith(" Updated") &&
        portalToken.length >= 32 &&
        finalCount === initialCount,
    );

    return NextResponse.json(
      {
        ok,
        operations: {
          create: Boolean(created.id),
          readById: fetched?.id === created.id,
          portalToken: portalToken.length >= 32,
          readByToken: fetchedByToken?.id === created.id,
          update: updated.fullName.endsWith(" Updated"),
          delete: finalCount === initialCount,
        },
        initialCount,
        finalCount,
      },
      { status: ok ? 200 : 503 },
    );
  } catch {
    if (createdId) {
      try {
        await deleteClient(createdId);
      } catch {
        // Best-effort cleanup in the isolated migration preview branch.
      }
    }

    return NextResponse.json(
      { ok: false, error: "clients_neon_canary_failed" },
      { status: 503 },
    );
  }
}
