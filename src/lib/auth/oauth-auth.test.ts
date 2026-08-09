import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { mapSupabaseOAuthError, signInWithGoogle } from "./oauth-auth";
import { SUPABASE_PREVIEW_URL } from "@/lib/supabase/config";

const originalNodeEnv = process.env.NODE_ENV;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function setProcessEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

function restoreEnv(): void {
  setProcessEnv("NODE_ENV", originalNodeEnv);
  setProcessEnv("NEXT_PUBLIC_SUPABASE_URL", originalSupabaseUrl);
  setProcessEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", originalSupabaseAnon);
}

describe("oauth-auth", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("mapSupabaseOAuthError maps disabled provider", () => {
    assert.match(
      mapSupabaseOAuthError("Provider is not enabled"),
      /Google ainda não está activo/i,
    );
  });

  it("signInWithGoogle rejects invalid redirect URL", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const result = await signInWithGoogle(
      {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
        },
      },
      "/style-quiz",
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.formError, /URL de retorno inválida/i);
    }
  });

  it("signInWithGoogle returns the provider URL without navigating", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let receivedSkipBrowserRedirect: boolean | undefined;
    const result = await signInWithGoogle(
      {
        auth: {
          signInWithOAuth: async (options) => {
            receivedSkipBrowserRedirect = options.options?.skipBrowserRedirect;
            return {
              data: { url: "https://accounts.google.com/o/oauth2/auth" },
              error: null,
            };
          },
        },
      },
      "https://preview.example.com/auth/callback",
    );

    assert.deepEqual(result, {
      ok: true,
      redirectUrl: "https://accounts.google.com/o/oauth2/auth",
    });
    assert.equal(receivedSkipBrowserRedirect, true);
  });

  it("signInWithGoogle recovers when the provider does not respond", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const result = await signInWithGoogle(
      {
        auth: {
          signInWithOAuth: async () => new Promise(() => undefined),
        },
      },
      "https://preview.example.com/auth/callback",
      { timeoutMs: 1 },
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.formError, /demorou demasiado/i);
    }
  });
});
