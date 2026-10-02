import { NextResponse } from "next/server";
import {
  listPublishedSupplierProfiles,
} from "@/lib/vendors/marketplace-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suppliers = await listPublishedSupplierProfiles();
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
