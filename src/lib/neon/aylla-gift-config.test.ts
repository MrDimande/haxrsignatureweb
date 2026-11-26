import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  AYLLA_GIFT_RUNTIME_ROLE,
  validateAyllaGiftDatabaseEnvironment,
} from "./aylla-gift-config";
import { assertRuntimeIdentity } from "./aylla-gift-db";

const originalRuntimeUrl = process.env.HAXR_AYLLA_GIFT_DATABASE_URL;
const originalIssuerUrl = process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL;

afterEach(() => {
  if (originalRuntimeUrl === undefined) delete process.env.HAXR_AYLLA_GIFT_DATABASE_URL;
  else process.env.HAXR_AYLLA_GIFT_DATABASE_URL = originalRuntimeUrl;
  if (originalIssuerUrl === undefined) delete process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL;
  else process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = originalIssuerUrl;
});

describe("Aylla Gift Registry database identity", () => {
  it("fails closed when the dedicated issuer URL is missing", () => {
    delete process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL;
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:secret@example.test/neondb";
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: false,
      message: "HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL não configurada.",
    });
  });

  it("fails closed when the dedicated runtime URL is missing", () => {
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret@example.test/neondb";
    delete process.env.HAXR_AYLLA_GIFT_DATABASE_URL;
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: false,
      message: "HAXR_AYLLA_GIFT_DATABASE_URL não configurada.",
    });
  });

  it("rejects a dedicated URL for neondb_owner or other privileged roles", () => {
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://neondb_owner:secret@example.test/neondb";
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("rejects a dedicated URL configured for haxrweb_runtime (enforces role separation)", () => {
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret@example.test/neondb";
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxrweb_runtime:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("rejects a dedicated URL configured for edition_runtime", () => {
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret@example.test/neondb";
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://edition_runtime:secret@example.test/neondb";
    assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);
  });

  it("rejects configuration when issuer and runtime point to identical connection strings", () => {
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret@example.test/neondb";
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret@example.test/neondb";
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: false,
      message: "HAXR_AYLLA_GIFT_DATABASE_URL requer a identidade haxr_aylla_gift_runtime.",
    });
  });

  it("accepts dedicated connections configured for both haxr_aylla_gift_issuer and haxr_aylla_gift_runtime", () => {
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret1@example.test/neondb";
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:secret2@example.test/neondb";
    assert.deepEqual(validateAyllaGiftDatabaseEnvironment(), {
      ok: true,
      issuerDatabaseUrl: process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL,
      runtimeDatabaseUrl: process.env.HAXR_AYLLA_GIFT_DATABASE_URL,
    });
  });

  it("assertRuntimeIdentity verifies identity on physical connection and rejects unauthorized roles", async () => {
    const invalidQuery = async () => ({
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
    });
    const invalidClient: Parameters<typeof assertRuntimeIdentity>[0] = {
      query: invalidQuery as unknown as Parameters<typeof assertRuntimeIdentity>[0]["query"],
    };

    await assert.rejects(
      async () => {
        await assertRuntimeIdentity(invalidClient);
      },
      /Gift Registry PostgreSQL runtime identity is not permitted/
    );
  });

  it("enforces TLS verification on Neon endpoints and in Vercel production", () => {
    const previousVercelEnv = process.env.VERCEL_ENV;
    try {
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL =
        "postgresql://haxr_aylla_gift_issuer:secret1@ep-pooler.us-east-2.aws.neon.tech/neondb";
      process.env.HAXR_AYLLA_GIFT_DATABASE_URL =
        "postgresql://haxr_aylla_gift_runtime:secret2@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";
      assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);

      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL =
        "postgresql://haxr_aylla_gift_issuer:secret1@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=disable";
      assert.equal(validateAyllaGiftDatabaseEnvironment().ok, false);

      (process.env as Record<string, string | undefined>).VERCEL_ENV = "production";
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL =
        "postgresql://haxr_aylla_gift_issuer:secret1@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";
      assert.equal(validateAyllaGiftDatabaseEnvironment().ok, true);
    } finally {
      if (previousVercelEnv === undefined) delete (process.env as Record<string, string | undefined>).VERCEL_ENV;
      else (process.env as Record<string, string | undefined>).VERCEL_ENV = previousVercelEnv;
    }
  });

  it("assertRuntimeIdentity verifies identity on each query checkout without caching", async () => {
    let queryCount = 0;
    const validQuery = async () => {
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
    };
    const client1: Parameters<typeof assertRuntimeIdentity>[0] = {
      query: validQuery as unknown as Parameters<typeof assertRuntimeIdentity>[0]["query"],
    };

    await assertRuntimeIdentity(client1);
    assert.equal(queryCount, 1);

    // Each checkout re-verifies against pg_roles to prevent dynamic role alteration (e.g. SET ROLE)
    await assertRuntimeIdentity(client1);
    assert.equal(queryCount, 2);

    // New physical client connection (e.g. after reconnection) is also verified
    const client2: Parameters<typeof assertRuntimeIdentity>[0] = {
      query: validQuery as unknown as Parameters<typeof assertRuntimeIdentity>[0]["query"],
    };

    await assertRuntimeIdentity(client2);
    assert.equal(queryCount, 3);
  });
});
