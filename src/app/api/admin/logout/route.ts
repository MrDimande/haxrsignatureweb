import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import {
  parseSessionCookieValue,
  revokeAdminSession,
} from "@/lib/admin/admin-sessions.repository";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const parsed = parseSessionCookieValue(token);

    if (parsed) {
      await revokeAdminSession(parsed.sessionId);
    }
  } catch {
    // Continue clearing cookie even if session lookup fails
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
