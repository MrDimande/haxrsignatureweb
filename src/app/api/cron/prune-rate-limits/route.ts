import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { pruneExpiredPersistentRateLimits } from "@/lib/security/persistent-rate-limit.neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7).trim();
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);

  if (tokenBuf.length !== secretBuf.length) return false;
  return timingSafeEqual(tokenBuf, secretBuf);
}

/** Removes expired rate-limit buckets under Vercel Cron's awaited request lifecycle. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const deleted = await pruneExpiredPersistentRateLimits();
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("[cron/prune-rate-limits]", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "Falha ao limpar limites expirados." }, { status: 500 });
  }
}
