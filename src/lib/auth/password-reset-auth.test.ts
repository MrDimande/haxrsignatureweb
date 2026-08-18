import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  mapSupabasePasswordResetError,
  requestPasswordResetEmail,
  updatePasswordAfterRecovery,
  validateResetPasswordFields,
} from "./password-reset-auth";
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

describe("password-reset-auth", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("validateResetPasswordFields rejects mismatched passwords", () => {
    const errors = validateResetPasswordFields({
      password: "secret123",
      confirmPassword: "different",
    });
    assert.equal(errors.confirmPassword, "As palavras-passe não coincidem.");
  });

  it("mapSupabasePasswordResetError maps expired session", () => {
    assert.match(
      mapSupabasePasswordResetError("Auth session missing"),
      /link expirou/i,
    );
  });

  it("requestPasswordResetEmail sends reset email on preview", async () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let receivedEmail = "";
    const result = await requestPasswordResetEmail(
      {
        auth: {
          resetPasswordForEmail: async (email) => {
            receivedEmail = email;
            return { error: null };
          },
        },
      },
      "jessica@example.com",
      "http://localhost:3000/auth/callback?next=%2Freset-password",
    );

    assert.equal(result.ok, true);
    assert.equal(receivedEmail, "jessica@example.com");
  });

  it("updatePasswordAfterRecovery updates password", async () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    let receivedPassword = "";
    const result = await updatePasswordAfterRecovery(
      {
        auth: {
          updateUser: async ({ password }) => {
            receivedPassword = password;
            return { error: null };
          },
        },
      },
      "newpassword123",
      "newpassword123",
    );

    assert.equal(result.ok, true);
    assert.equal(receivedPassword, "newpassword123");
  });
});
