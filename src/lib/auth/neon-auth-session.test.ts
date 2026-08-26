import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLegacyEmailSha256,
  parseNeonSessionPayload,
} from "@/lib/neon/auth-session";

test("legacy email hash is normalized and deterministic", () => {
  assert.equal(
    buildLegacyEmailSha256("  USER@Example.COM "),
    "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514",
  );
});

test("parses a verified Neon Auth session envelope", () => {
  assert.deepEqual(
    parseNeonSessionPayload({
      user: {
        id: "a4000000-0000-4000-8000-000000000001",
        email: "canary@example.invalid",
        name: "Neon Canary",
        emailVerified: true,
      },
      session: { id: "session-canary" },
    }),
    {
      user: {
        id: "a4000000-0000-4000-8000-000000000001",
        email: "canary@example.invalid",
        name: "Neon Canary",
        emailVerified: true,
      },
      session: { id: "session-canary" },
    },
  );
});

test("rejects null or incomplete Neon Auth envelopes", () => {
  assert.equal(parseNeonSessionPayload(null), null);
  assert.equal(parseNeonSessionPayload({ session: null, user: null }), null);
  assert.equal(parseNeonSessionPayload({ user: { id: "missing-email" } }), null);
});
