import { NextResponse } from "next/server";
import {
  editionProxyUnauthorizedResponse,
  validateAyllaProxyRequest,
  validateEditionProxyJsonBody,
} from "@/lib/edition/proxy-auth";
import { getAyllaSyntheticOutboxMessagesForTesting } from "@/lib/edition/gifts/aylla/instance";
import { isAyllaTestActivationEnabled } from "@/lib/edition/gifts/aylla/test-activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Isolated Gate D test-only synthetic OTP outbox reader.
 * Strictly returns 404 unless non-production test activation AND synthetic
 * delivery barrier are explicitly enabled, AND requires server proxy auth.
 */
export async function POST(request: Request) {
  if (!isAyllaTestActivationEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const proxyAuth = validateAyllaProxyRequest(request);
  if (!proxyAuth.ok) {
    return NextResponse.json(editionProxyUnauthorizedResponse(), { status: 401 });
  }

  const bodyCheck = validateEditionProxyJsonBody(request);
  if (!bodyCheck.ok) {
    return NextResponse.json({ success: false, error: bodyCheck.error }, { status: bodyCheck.status });
  }

  let body: { contact?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const messages = getAyllaSyntheticOutboxMessagesForTesting(body.contact);
  if (!messages) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const latest = messages[messages.length - 1] ?? null;
  return NextResponse.json({
    success: true,
    latestCode: latest?.code ?? null,
    expiresAt: latest?.expiresAt instanceof Date ? latest.expiresAt.toISOString() : latest?.expiresAt ?? null,
    count: messages.length,
  });
}
