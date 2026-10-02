import { NextResponse } from "next/server";
import { displayPortalSession, getCurrentPortalSession } from "@/lib/portal-auth/portal-auth.server";

export async function GET() {
  try {
    const session = await getCurrentPortalSession();
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({
      authenticated: true,
      user: displayPortalSession(session),
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 503 });
  }
}
