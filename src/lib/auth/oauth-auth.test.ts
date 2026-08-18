import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { mapSupabaseOAuthError, signInWithGoogle } from "./oauth-auth";
import { SUPABASE_PREVIEW_URL } from "@/lib/supabase/config";

const originalNodeEnv = process.env.NODE_ENV;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restoreEnv(): void {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;

  if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;

  if (originalSupabaseAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnon;
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
    process.env.NODE_ENV = "development";
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
});
