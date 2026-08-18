import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  mapSupabaseSignUpError,
  signUpWithEmailPassword,
  validateSignUpCredentials,
  type EmailPasswordSignUpClient,
} from "./sign-up-auth";
import {
  SUPABASE_PREVIEW_URL,
  validateClientAppAuthEnvironment,
} from "@/lib/supabase/config";

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

function mockClient(
  impl: EmailPasswordSignUpClient["auth"]["signUp"],
): EmailPasswordSignUpClient {
  return {
    auth: {
      signUp: impl,
    },
  };
}

const validInput = {
  fullName: "Jessica Silva",
  email: "jessica@example.com",
  password: "secret123",
  confirmPassword: "secret123",
  termsAccepted: true,
};

describe("sign-up-auth", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("validateSignUpCredentials rejects mismatched passwords", () => {
    const errors = validateSignUpCredentials({
      ...validInput,
      confirmPassword: "different",
    });
    assert.equal(errors.confirmPassword, "As palavras-passe não coincidem.");
  });

  it("validateSignUpCredentials requires terms acceptance", () => {
    const errors = validateSignUpCredentials({
      ...validInput,
      termsAccepted: false,
    });
    assert.equal(errors.termsAccepted, "Aceite os termos para continuar.");
  });

  it("mapSupabaseSignUpError maps duplicate email", () => {
    assert.match(
      mapSupabaseSignUpError("User already registered"),
      /já está registado/i,
    );
  });

  it("signUpWithEmailPassword returns field errors without calling Supabase", async () => {
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { data: { session: null }, error: null };
    });

    const result = await signUpWithEmailPassword(client, {
      ...validInput,
      email: "",
    });

    assert.equal(result.ok, false);
    assert.equal(called, false);
  });

  it("signUpWithEmailPassword creates session on preview project", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let receivedEmail = "";
    const client = mockClient(async (credentials) => {
      receivedEmail = credentials.email;
      return { data: { session: { access_token: "token" } }, error: null };
    });

    const result = await signUpWithEmailPassword(client, validInput);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.sessionCreated, true);
    }
    assert.equal(receivedEmail, "jessica@example.com");
  });

  it("signUpWithEmailPassword surfaces Supabase errors", async () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const client = mockClient(async () => ({
      data: { session: null },
      error: { message: "User already registered" },
    }));

    const result = await signUpWithEmailPassword(client, validInput);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.formError, /já está registado/i);
    }
  });
});

describe("supabase config — sign-up uses same auth guard", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("validateClientAppAuthEnvironment allows preview ref in development", () => {
    setProcessEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const result = validateClientAppAuthEnvironment();
    assert.equal(result.ok, true);
  });
});
