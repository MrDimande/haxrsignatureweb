import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route";

test("cron/prune-rate-limits rejects unauthenticated or incorrectly authenticated requests", async () => {
  const previous = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "super-secret-cron-key-2026-haxr";

    // 1. Sem header
    const noAuth = new Request("https://example.test/api/cron/prune-rate-limits");
    const resNoAuth = await GET(noAuth);
    assert.equal(resNoAuth.status, 401);

    // 2. Token incorreto (tamanhos diferentes ou iguais)
    const badAuth = new Request("https://example.test/api/cron/prune-rate-limits", {
      headers: { authorization: "Bearer invalid-token" },
    });
    const resBadAuth = await GET(badAuth);
    assert.equal(resBadAuth.status, 401);

    // 3. Sem prefixo Bearer
    const badScheme = new Request("https://example.test/api/cron/prune-rate-limits", {
      headers: { authorization: "Basic super-secret-cron-key-2026-haxr" },
    });
    const resBadScheme = await GET(badScheme);
    assert.equal(resBadScheme.status, 401);
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  }
});
