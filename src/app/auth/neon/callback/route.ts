import { NextResponse } from "next/server";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-redirect";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import { exchangeNeonOAuthVerifier } from "@/lib/neon/auth-proxy";

function redirectToAuthError(origin: string): NextResponse {
  const signInUrl = new URL(buildSignInPath(null), origin);
  signInUrl.searchParams.set("error", "auth_callback");
  return NextResponse.redirect(signInUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = sanitizeAuthCallbackNext(requestUrl.searchParams.get("next"));

  if (requestUrl.searchParams.has("error")) {
    return redirectToAuthError(requestUrl.origin);
  }

  const exchange = await exchangeNeonOAuthVerifier(request);
  if (exchange && !exchange.ok) {
    console.warn("[neon-auth] OAuth callback exchange failed", exchange.message);
    return redirectToAuthError(requestUrl.origin);
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  if (exchange?.ok) {
    for (const cookie of exchange.cookies) {
      response.headers.append("Set-Cookie", cookie);
    }
  }

  return response;
}
