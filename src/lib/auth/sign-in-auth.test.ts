import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  hasSignInFieldErrors,
  mapSupabaseSignInError,
  signInWithEmailPassword,
  validateSignInCredentials,
  type EmailPasswordSignInClient,
} from "./sign-in-auth";
import {
  SUPABASE_PREVIEW_PROJECT_REF,
  SUPABASE_PREVIEW_URL,
  SUPABASE_PRODUCTION_PROJECT_REF,
  validateClientAppAuthEnvironment,
} from "@/lib/supabase/config";

const originalNodeEnv = process.env.NODE_ENV;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restoreEnv(): void {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

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
    process.env.NODE_ENV = "development";
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
    process.env.NODE_ENV = "development";
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
    process.env.NODE_ENV = "development";
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
    process.env.NODE_ENV = "development";
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
});

describe("supabase config — client app auth guard", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("validateClientAppAuthEnvironment allows preview ref in development", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const result = validateClientAppAuthEnvironment();
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.projectRef, SUPABASE_PREVIEW_PROJECT_REF);
    }
  });
});
