import assert from "node:assert/strict";
import test from "node:test";
import { hasSignInFieldErrors, validateSignInCredentials } from "./sign-in-auth";

test("portal login validation requires a valid email and password", () => {
  assert.equal(hasSignInFieldErrors(validateSignInCredentials("invalid", "")), true);
  assert.deepEqual(validateSignInCredentials("client@example.com", "secret"), {});
});
