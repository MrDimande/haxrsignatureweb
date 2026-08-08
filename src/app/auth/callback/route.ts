import { NextResponse } from "next/server";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-redirect";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeAuthCallbackNext(requestUrl.searchParams.get("next"));

  if (!code) {
    const signInUrl = new URL(buildSignInPath(null), requestUrl.origin);
    signInUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(signInUrl);
  }

  try {
    const supabase = await createSupabaseServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const signInUrl = new URL(buildSignInPath(null), requestUrl.origin);
      signInUrl.searchParams.set("error", "auth_callback");
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch {
    const signInUrl = new URL(buildSignInPath(null), requestUrl.origin);
    signInUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(signInUrl);
  }
}
