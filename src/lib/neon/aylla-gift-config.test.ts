import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { AYLLA_GIFT_RUNTIME_ROLE, validateAyllaGiftDatabaseEnvironment } from "./aylla-gift-config";
import { assertRuntimeIdentity } from "./aylla-gift-db";

const originalUrl = process.env.HAXR_AYLLA_GIFT_DATABASE_URL;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.HAXR_AYLLA_GIFT_DATABASE_URL;
  else process.env.HAXR_AYLLA_GIFT_DATABASE_URL = originalUrl;
});

describe("Aylla Gift Registry database identity", () => {
  it("fails closed when the dedicated runtime URL is missing", () => {
    delete process.env.HAXR_AYLLA_GIFT_DATABASE_URL;
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: false,
      message: "HAXR_AYLLA_GIFT_DATABASE_URL não configurada.",
    });
  });

  it("rejects a dedicated URL for neondb_owner or other privileged roles", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://neondb_owner:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("rejects a dedicated URL configured for haxrweb_runtime (enforces role separation)", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxrweb_runtime:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("rejects a dedicated URL configured for edition_runtime", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://edition_runtime:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("accepts only the dedicated haxr_aylla_gift_runtime connection identity", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:secret@example.test/neondb";
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: true,
      databaseUrl: process.env.HAXR_AYLLA_GIFT_DATABASE_URL,
    });
  });

  it("assertRuntimeIdentity verifies identity on physical connection and rejects unauthorized roles", async () => {
    const invalidClient = {
      async query() {
        return {
          rows: [
            {
              current_user: "haxrweb_runtime",
              rolcanlogin: true,
              rolsuper: false,
              rolcreaterole: false,
              rolcreatedb: false,
              rolbypassrls: false,
            },
          ],
        };
      },
    };

    await assert.rejects(
      async () => {
        await assertRuntimeIdentity(invalidClient as any);
      },
      /Gift Registry PostgreSQL runtime identity is not permitted/
    );
  });

  it("assertRuntimeIdentity verifies identity on each new physical connection", async () => {
    let queryCount = 0;
    const client1 = {
      async query() {
        queryCount++;
        return {
          rows: [
            {
              current_user: AYLLA_GIFT_RUNTIME_ROLE,
              rolcanlogin: true,
              rolsuper: false,
              rolcreaterole: false,
              rolcreatedb: false,
              rolbypassrls: false,
            },
          ],
        };
      },
    };

    await assertRuntimeIdentity(client1 as any);
    assert.equal(queryCount, 1);

    // Warm client does not re-query
    await assertRuntimeIdentity(client1 as any);
    assert.equal(queryCount, 1);

    // New physical client connection (e.g. after reconnection) must be verified
    const client2 = {
      async query() {
        queryCount++;
        return {
          rows: [
            {
              current_user: AYLLA_GIFT_RUNTIME_ROLE,
              rolcanlogin: true,
              rolsuper: false,
              rolcreaterole: false,
              rolcreatedb: false,
              rolbypassrls: false,
            },
          ],
        };
      },
    };

    await assertRuntimeIdentity(client2 as any);
    assert.equal(queryCount, 2);
  });
});
