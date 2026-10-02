import { NextResponse } from "next/server";
import { logoutPortalSession } from "@/lib/portal-auth/portal-auth.server";

export async function POST() {
  try {
    return await logoutPortalSession();
  } catch {
    return NextResponse.json({ error: "Não foi possível terminar a sessão." }, { status: 503 });
  }
}
