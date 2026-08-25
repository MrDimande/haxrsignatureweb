import { NextResponse } from "next/server";
import {
  deleteCatalogItem,
  getCatalogItemById,
  listCatalog,
  saveCatalogItem,
} from "@/lib/admin/repositories/catalog.repository";
import { neonQuery } from "@/lib/neon/server-db";
import type { CatalogFormData } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CatalogStateRow = { is_active: boolean };

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

  const initialCount = (await listCatalog(undefined, true)).length;
  const suffix = Date.now().toString(36);
  const id = `migration-catalog-${suffix}`;

  const draft: CatalogFormData = {
    id,
    businessId: "haxr-signature",
    name: `Migration Catalog Canary ${suffix}`,
    description: "Temporary Neon migration canary",
    price: 1234,
    category: "addons",
    sortOrder: 9999,
    isActive: true,
  };

  try {
    const created = await saveCatalogItem(draft);
    const fetched = await getCatalogItemById(id);
    const updated = await saveCatalogItem({
      ...draft,
      name: `${draft.name} Updated`,
      price: 2345,
    });

    await deleteCatalogItem(id);

    const activeItems = await listCatalog(undefined, false);
    const allItems = await listCatalog(undefined, true);
    const databaseState = await neonQuery<CatalogStateRow>(
      "SELECT is_active FROM public.service_catalog WHERE id = $1",
      [id],
    );

    const operations = {
      create: created.id === id,
      readById: fetched?.id === id,
      update:
        updated.id === id &&
        updated.name.endsWith(" Updated") &&
        updated.basePrice === 2345,
      softDeleteHidden: !activeItems.some((item) => item.id === id),
      inactiveVisible: allItems.some((item) => item.id === id),
      databaseInactive: databaseState.rows[0]?.is_active === false,
    };

    const ok = Object.values(operations).every(Boolean);

    return NextResponse.json(
      { ok, operations, initialCount, countBeforeCleanup: allItems.length },
      { status: ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "catalog_neon_canary_failed" },
      { status: 503 },
    );
  } finally {
    await neonQuery("DELETE FROM public.service_catalog WHERE id = $1", [id]).catch(
      () => undefined,
    );
  }
}
