import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  hasSignInFieldErrors,
  mapSupabaseSignInError,
  signOutFromSupabase,
  signInWithEmailPassword,
  signInWithMagicLink,
  validateSignInCredentials,
  type EmailPasswordSignInClient,
} from "./sign-in-auth";
import {
  SUPABASE_PREVIEW_PROJECT_REF,
  SUPABASE_PREVIEW_URL,
  SUPABASE_PRODUCTION_PROJECT_REF,
  validateClientAppAuthEnvironment,
} from "@/lib/supabase/config";

function setProcessEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

const originalNodeEnv = process.env.NODE_ENV;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restoreEnv(): void {
  setProcessEnv("NODE_ENV", originalNodeEnv);

  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  }

  if (originalSupabaseAnon === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnon;
  }
}

function mockClient(
  impl: EmailPasswordSignInClient["auth"]["signInWithPassword"],
): EmailPasswordSignInClient {
  return {
    auth: {
      signInWithPassword: impl,
    },
  };
}

describe("sign-in-auth", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("validateSignInCredentials rejects empty email and password", () => {
    const errors = validateSignInCredentials("", "");
    assert.equal(errors.email, "O email é obrigatório.");
    assert.equal(errors.password, "A palavra-passe é obrigatória.");
    assert.equal(hasSignInFieldErrors(errors), true);
  });

  it("validateSignInCredentials rejects invalid email format", () => {
    const errors = validateSignInCredentials("not-an-email", "secret123");
    assert.equal(errors.email, "Introduza um endereço de email válido.");
    assert.equal(errors.password, undefined);
  });

  it("mapSupabaseSignInError maps invalid credentials", () => {
    assert.equal(
      mapSupabaseSignInError("Invalid login credentials"),
      "Email ou palavra-passe incorrectos.",
    );
  });

  it("mapSupabaseSignInError maps network failures", () => {
    assert.equal(
      mapSupabaseSignInError("TypeError: Failed to fetch"),
      "Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.",
    );
  });

  it("signInWithEmailPassword returns field errors without calling Supabase", async () => {
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { error: null };
    });

    const result = await signInWithEmailPassword(client, "", "");
    assert.equal(result.ok, false);
    assert.equal(called, false);
    if (!result.ok) {
      assert.equal(result.formError, "Corrija os campos assinalados.");
    }
  });

  it("signInWithEmailPassword blocks development sign-in against production ref", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${SUPABASE_PRODUCTION_PROJECT_REF}.supabase.co`;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { error: null };
    });

    const result = await signInWithEmailPassword(
      client,
      "staging-a@haxrsignature.test",
      "wrong-password",
    );

    assert.equal(result.ok, false);
    assert.equal(called, false);
    if (!result.ok) {
      assert.match(result.formError, /produção/i);
    }
  });

  it("signInWithEmailPassword calls Supabase on valid preview credentials", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let receivedEmail = "";
    const client = mockClient(async (credentials) => {
      receivedEmail = credentials.email;
      return { error: null };
    });

    const result = await signInWithEmailPassword(
      client,
      "  staging-a@haxrsignature.test  ",
      "correct-password",
    );

    assert.equal(result.ok, true);
    assert.equal(receivedEmail, "staging-a@haxrsignature.test");
  });

  it("signInWithEmailPassword surfaces invalid login errors from Supabase", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const client = mockClient(async () => ({
      error: { message: "Invalid login credentials" },
    }));

    const result = await signInWithEmailPassword(
      client,
      "staging-a@haxrsignature.test",
      "wrong-password",
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.formError, "Email ou palavra-passe incorrectos.");
    }
  });

  it("signInWithEmailPassword handles thrown network errors", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const client = mockClient(async () => {
      throw new Error("Failed to fetch");
    });

    const result = await signInWithEmailPassword(
      client,
      "staging-a@haxrsignature.test",
      "password",
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.formError, /ligar ao servidor/i);
    }
  });

  it("signInWithMagicLink sends OTP with correct redirect URL", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let sentEmail = "";
    let sentRedirect = "";
    const client = {
      auth: {
        signInWithPassword: async () => ({ error: null }),
        signInWithOtp: async (options: { email: string; options?: { emailRedirectTo?: string } }) => {
          sentEmail = options.email;
          sentRedirect = options.options?.emailRedirectTo ?? "";
          return { error: null };
        },
      },
    };

    const result = await signInWithMagicLink(
      client,
      "couple@example.com",
      "https://example.com/auth/callback",
    );

    assert.equal(result.ok, true);
    assert.equal(sentEmail, "couple@example.com");
    assert.equal(sentRedirect, "https://example.com/auth/callback");
  });

  it("signInWithMagicLink validates email before calling Supabase", async () => {
    let called = false;
    const client = {
      auth: {
        signInWithPassword: async () => ({ error: null }),
        signInWithOtp: async () => {
          called = true;
          return { error: null };
        },
      },
    };

    const result = await signInWithMagicLink(client, "invalid-email", "https://example.com");
    assert.equal(result.ok, false);
    assert.equal(called, false);
  });

  it("signOutFromSupabase calls Supabase signOut", async () => {
    let called = false;
    const result = await signOutFromSupabase({
      auth: {
        signOut: async () => {
          called = true;
          return { error: null };
        },
      },
    });

    assert.equal(called, true);
    assert.deepEqual(result, { ok: true });
  });

  it("signOutFromSupabase maps Supabase errors", async () => {
    const result = await signOutFromSupabase({
      auth: {
        signOut: async () => ({
          error: { message: "Failed to fetch" },
        }),
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /ligar ao servidor/i);
    }
  });
});

describe("supabase config — client app auth guard", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("validateClientAppAuthEnvironment allows preview ref in development", () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const result = validateClientAppAuthEnvironment();
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.projectRef, SUPABASE_PREVIEW_PROJECT_REF);
    }
  });
});
