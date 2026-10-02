import assert from "node:assert/strict";
import test from "node:test";
import { validateSignUpCredentials } from "./sign-up-auth";

test("activation request validation enforces consent and a strong password", () => {
  const errors = validateSignUpCredentials({ email: "client@example.com", password: "short", termsAccepted: false });
  assert.ok(errors.password);
  assert.ok(errors.termsAccepted);
});
