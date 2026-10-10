import assert from "node:assert/strict";
import test from "node:test";
import { getRequestIp } from "./rate-limit";

test("request IP prefers Vercel's real-client headers and never creates an unknown shared bucket", () => {
  const preferred = new Request("https://example.test", {
    headers: {
      "x-forwarded-for": "198.51.100.20",
      "x-vercel-forwarded-for": "198.51.100.10",
      "x-real-ip": "198.51.100.5",
    },
  });
  assert.equal(getRequestIp(preferred), "198.51.100.5");

  const withoutIp = new Request("https://example.test");
  const first = getRequestIp(withoutIp);
  const second = getRequestIp(withoutIp);
  assert.match(first, /^unattributed:/);
  assert.match(second, /^unattributed:/);
  assert.notEqual(first, second);
});
