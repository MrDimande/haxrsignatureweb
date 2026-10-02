import assert from "node:assert/strict";
import test from "node:test";
import { validateResetPasswordFields } from "./password-reset-auth";

test("password definition requires matching strong passwords", () => {
  assert.ok(validateResetPasswordFields({ password: "short", confirmPassword: "short" }).password);
  assert.ok(validateResetPasswordFields({ password: "correct-horse-battery", confirmPassword: "different" }).confirmPassword);
});
