import { NextResponse } from "next/server";

/** Legacy provider callback URLs fail closed after the HAXR-owned auth cutover. */
export function GET(request: Request) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("error", "legacy_auth_callback");
  return NextResponse.redirect(url);
}
