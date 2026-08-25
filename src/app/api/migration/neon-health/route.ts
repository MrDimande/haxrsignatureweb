import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/neon/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "migration/supabase-to-neon"
  );
}

type HealthRow = {
  database_name: string;
  public_tables: number;
  legacy_identity_mappings: number;
  has_document_analytics: boolean;
};

export async function GET() {
  if (!isMigrationPreview()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const result = await neonQuery<HealthRow>(`
      SELECT
        current_database() AS database_name,
        (
          SELECT count(*)::int
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        ) AS public_tables,
        (
          SELECT count(*)::int
          FROM app_private.legacy_auth_identity
        ) AS legacy_identity_mappings,
        to_regclass('public.document_analytics') IS NOT NULL AS has_document_analytics
    `);

    const health = result.rows[0];
    const expectedPreview = Boolean(
      health &&
        health.public_tables === 65 &&
        health.legacy_identity_mappings === 4 &&
        health.has_document_analytics,
    );

    return NextResponse.json(
      {
        ok: expectedPreview,
        database: health?.database_name ?? null,
        publicTables: health?.public_tables ?? null,
        legacyIdentityMappings: health?.legacy_identity_mappings ?? null,
        documentAnalytics: health?.has_document_analytics ?? false,
      },
      { status: expectedPreview ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "neon_preview_database_unavailable" },
      { status: 503 },
    );
  }
}
