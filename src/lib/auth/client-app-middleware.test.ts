import assert from "node:assert/strict";
import test from "node:test";
import { buildSignInPath, isSafeClientReturnPath, isSafeAppReturnPath } from "./client-app-middleware";

test("portal redirect helpers reject external return paths", () => {
  assert.equal(isSafeAppReturnPath("/app/dashboard"), true);
  assert.equal(isSafeClientReturnPath("//attacker.example"), false);
  assert.equal(buildSignInPath("//attacker.example"), "/sign-in");
});
