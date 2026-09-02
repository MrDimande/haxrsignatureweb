import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GateError,
  assertPreviewNeonTarget,
  buildBatchInsert,
  checksumRows,
  main,
  parseArgs,
  quoteIdentifier,
  resolveSourceConfig,
  selectPhotoTable,
} from "./gate-2c-gifts-photos-migration.mjs";
import { REQUIRED_TABLES } from "./neon-health-check.mjs";

function throwsCode(fn, code) {
  assert.throws(fn, (cause) => cause instanceof GateError && cause.message === code);
}

describe("Gate 2C safety gates", () => {
  it("defaults to a read-only source audit", () => {
    assert.equal(parseArgs([]).mode, "source-audit");
  });

  it("validates pinned source checksums", () => {
    const checksum = "a".repeat(64);
    const parsed = parseArgs([
      "preflight",
      `--expected-gifts-checksum=${checksum}`,
      `--expected-photos-checksum=${checksum}`,
    ]);
    assert.equal(parsed.expectedGiftsChecksum, checksum);
    assert.equal(parsed.expectedPhotosChecksum, checksum);
    throwsCode(
      () => parseArgs(["preflight", "--expected-gifts-checksum=not-a-sha256"]),
      "expected_gifts_checksum_invalid",
    );
  });

  it("blocks non-Preview preflight before attempting a source read", async () => {
    await assert.rejects(
      () => main(["preflight"], {}),
      (cause) => cause instanceof GateError && cause.message === "vercel_preview_required",
    );
  });

  it("requires the service role and exact source ref", () => {
    throwsCode(
      () =>
        resolveSourceConfig(
          {
            NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-only",
          },
          "aaaaaaaaaaaaaaaaaaaa",
        ),
      "supabase_service_role_missing",
    );
    throwsCode(
      () =>
        resolveSourceConfig(
          {
            NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY: "server-only",
          },
          "bbbbbbbbbbbbbbbbbbbb",
        ),
      "source_ref_mismatch",
    );
  });

  it("requires the exact Vercel Preview branch and apply confirmation", () => {
    const base = {
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "migration/supabase-to-neon",
      DATABASE_URL: "postgresql://role:secret@ep-example.us-east-2.aws.neon.tech/neondb",
    };
    throwsCode(
      () => assertPreviewNeonTarget({ ...base, VERCEL_ENV: "production" }, null, "preflight"),
      "vercel_preview_required",
    );
    throwsCode(
      () => assertPreviewNeonTarget(base, null, "apply"),
      "apply_confirmation_missing",
    );
    throwsCode(
      () => assertPreviewNeonTarget(base, "GATE_2C_PREVIEW_WRITE", "apply"),
      "expected_neon_host_missing",
    );
    throwsCode(
      () =>
        assertPreviewNeonTarget(
          base,
          "GATE_2C_PREVIEW_WRITE",
          "apply",
          "ep-wrong.us-east-2.aws.neon.tech",
        ),
      "neon_host_mismatch",
    );
    assert.equal(
      assertPreviewNeonTarget(
        base,
        "GATE_2C_PREVIEW_WRITE",
        "apply",
        "ep-example.us-east-2.aws.neon.tech",
      ).database,
      "neondb",
    );
  });

  it("never falls back to a Production-owner URL", () => {
    throwsCode(
      () =>
        assertPreviewNeonTarget(
          {
            VERCEL_ENV: "preview",
            VERCEL_GIT_COMMIT_REF: "migration/supabase-to-neon",
            HAXR_NEON_PRODUCTION_OWNER_URL:
              "postgresql://role:secret@ep-production.us-east-2.aws.neon.tech/neondb",
          },
          null,
          "preflight",
        ),
      "neon_database_url_missing",
    );
  });

  it("rejects non-Neon database hosts", () => {
    throwsCode(
      () =>
        assertPreviewNeonTarget(
          {
            VERCEL_ENV: "preview",
            VERCEL_GIT_COMMIT_REF: "migration/supabase-to-neon",
            DATABASE_URL: "postgresql://role:secret@database.example.com/app",
          },
          null,
          "preflight",
        ),
      "neon_host_required",
    );
  });

  it("does not guess when multiple photo tables contain data", () => {
    throwsCode(
      () =>
        selectPhotoTable([
          { table: "wedding_photos", accessible: true, count: 1 },
          { table: "concierge_uploads", accessible: true, count: 2 },
        ]),
      "photo_table_ambiguous",
    );
  });
});

describe("Gate 2C integrity helpers", () => {
  it("produces stable checksums independent of key and row order", () => {
    const left = [
      { id: "b", metadata: { z: 1, a: true } },
      { id: "a", created_at: "2026-09-02T00:00:00.000Z" },
    ];
    const right = [
      { created_at: "2026-09-02T00:00:00.000Z", id: "a" },
      { metadata: { a: true, z: 1 }, id: "b" },
    ];
    assert.equal(checksumRows(left), checksumRows(right));
  });

  it("normalizes equivalent Postgres timestamp representations", () => {
    assert.equal(
      checksumRows([{ id: "a", created_at: "2026-09-02T02:00:00+02:00" }]),
      checksumRows([{ id: "a", created_at: new Date("2026-09-02T00:00:00.000Z") }]),
    );
  });

  it("builds a parameterized idempotent batch insert", () => {
    const batch = buildBatchInsert(
      "edition_gift_reservations",
      ["id", "gift_name"],
      [
        { id: "1", gift_name: "A" },
        { id: "2", gift_name: "B" },
      ],
    );
    assert.match(batch.sql, /VALUES \(\$1, \$2\), \(\$3, \$4\)/);
    assert.match(batch.sql, /ON CONFLICT \(id\) DO NOTHING$/);
    assert.deepEqual(batch.values, ["1", "A", "2", "B"]);
  });

  it("rejects unsafe SQL identifiers", () => {
    throwsCode(() => quoteIdentifier('photos"; drop table events; --'), "identifier_invalid");
  });
});

describe("Neon schema readiness contract", () => {
  it("uses canonical repository table names", () => {
    const required = new Set(REQUIRED_TABLES);
    for (const table of [
      "event_members",
      "document_line_items",
      "saved_supplier_profiles",
      "concierge_uploads",
      "finance_expenses",
      "finance_monthly_targets",
    ]) {
      assert.equal(required.has(table), true, `missing canonical table ${table}`);
    }
    for (const alias of [
      "client_event_members",
      "document_items",
      "supplier_favorites",
      "concierge_requests",
      "expenses",
      "monthly_targets",
    ]) {
      assert.equal(required.has(alias), false, `unexpected alias ${alias}`);
    }
  });
});
