import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { validateAyllaGiftDatabaseEnvironment } from "./aylla-gift-config";

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

  it("rejects a dedicated URL for a privileged or unexpected role", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://neondb_owner:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("accepts only the dedicated haxrweb_runtime connection identity", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxrweb_runtime:secret@example.test/neondb";
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: true,
      databaseUrl: process.env.HAXR_AYLLA_GIFT_DATABASE_URL,
    });
  });
});
