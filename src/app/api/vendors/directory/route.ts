import { NextResponse } from "next/server";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import {
  listPublishedSupplierProfiles,
  type SupplierMarketplaceQueryClient,
} from "@/lib/vendors/marketplace-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = shouldUseNeonServerDatabase()
      ? null
      : ((await createSupabaseServerAuthClient()) as unknown as SupplierMarketplaceQueryClient);
    const suppliers = await listPublishedSupplierProfiles(client);
    const response = NextResponse.json({ ok: true, suppliers });
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return response;
  } catch {
    const response = NextResponse.json(
      { ok: false, suppliers: [], message: "Directório temporariamente indisponível." },
      { status: 503 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
