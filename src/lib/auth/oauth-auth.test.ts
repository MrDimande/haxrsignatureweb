import assert from "node:assert/strict";
import test from "node:test";
import { signInWithGoogle } from "./oauth-auth";

test("external OAuth is not a portal runtime fallback", async () => {
  const result = await signInWithGoogle();
  assert.equal(result.ok, false);
});
