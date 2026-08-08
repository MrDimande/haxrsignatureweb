import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthCallbackUrl,
  isSafeAuthCallbackNext,
  sanitizeAuthCallbackNext,
} from "./auth-redirect";

describe("auth-redirect", () => {
  it("isSafeAuthCallbackNext allows dashboard, quiz and reset password", () => {
    assert.equal(isSafeAuthCallbackNext("/app/dashboard"), true);
    assert.equal(isSafeAuthCallbackNext("/style-quiz"), true);
    assert.equal(isSafeAuthCallbackNext("/reset-password"), true);
    assert.equal(isSafeAuthCallbackNext("//evil.test"), false);
  });

  it("sanitizeAuthCallbackNext rejects unsafe paths", () => {
    assert.equal(sanitizeAuthCallbackNext("/style-quiz"), "/style-quiz");
    assert.equal(sanitizeAuthCallbackNext("//evil.test"), "/app/dashboard");
  });

  it("buildAuthCallbackUrl encodes next param", () => {
    const url = buildAuthCallbackUrl({
      origin: "http://localhost:3000",
      next: "/style-quiz",
    });
    assert.equal(url, "http://localhost:3000/auth/callback?next=%2Fstyle-quiz");
  });
});
