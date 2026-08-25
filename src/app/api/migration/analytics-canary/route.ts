import { NextResponse } from "next/server";
import { queryDocumentAnalytics } from "@/lib/admin/repositories/analytics.repository";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";

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

  if (!shouldUseNeonServerDatabase()) {
    return NextResponse.json(
      { ok: false, error: "neon_server_database_not_selected" },
      { status: 503 },
    );
  }

  try {
    const rows = await queryDocumentAnalytics();
    return NextResponse.json({ ok: true, rowCount: rows.length });
  } catch {
    return NextResponse.json(
      { ok: false, error: "analytics_canary_failed" },
      { status: 503 },
    );
  }
}
