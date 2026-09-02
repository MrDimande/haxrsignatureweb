import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";
import { createClient } from "@supabase/supabase-js";
import {
  auditSourceStorage, buildForeignKeyAuditQuery, checksumPhotoRows, createReadOnlySourceFetch,
  PHOTO_COLUMNS, PhotoAuditError, readTargetSnapshot, reconcilePhotos,
  resolveAuditConfig, runPhotoAudit, safeAuditError, validStoragePath,
} from "./audit-preview-photos.mjs";
import { checksumRows } from "./gate-2c-gifts-photos-migration.mjs";
import { main as retiredApply } from "./apply-preview-photos.mjs";

const HOST = "ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech";
const ORIGIN = "https://oxsrdmydlqyvnueedgtl.supabase.co";
function environment(overrides = {}) {
  return {
    VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "migration/supabase-to-neon",
    DATABASE_URL_UNPOOLED: `postgresql://fixture:fixture@${HOST}/neondb?sslmode=require`,
    GATE_2C_SOURCE_SUPABASE_URL: ORIGIN,
    GATE_2C_SOURCE_SUPABASE_SECRET_KEY: "sb_secret_synthetic_fixture",
    GATE_2C_SOURCE_PHOTOS_BUCKET: "wedding-photos", ...overrides,
  };
}
function photo(overrides = {}) {
  return {
    ...Object.fromEntries(PHOTO_COLUMNS.map((col) => [col, null])),
    id: "synthetic-row-id", storage_path: "private-fixture/photo.jpeg",
    guest_name: "PRIVATE_FIXTURE_NAME", caption: "PRIVATE_FIXTURE_CAPTION",
    content_type: "image/jpeg", file_size_bytes: 100, ...overrides,
  };
}
function baseline(rows) { return { count: rows.length, checksum: checksumRows(rows) }; }
function schema(overrides = {}) {
  return {
    requiredColumnsPresent: true, readOnlyTransaction: true, idUnique: true,
    rlsEnabled: true, unvalidatedForeignKeyCount: 0, orphanReferenceCount: 0, ...overrides,
  };
}
function sourceFixture(rows = [photo()], overrides = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      assert.equal(table, "wedding_photos");
      return { select(columns, options) {
        assert.equal(columns, "*"); assert.deepEqual(options, { count: "exact" }); return this;
      }, order() { return this; }, async range(start, end) {
        assert.equal(start, 0); assert.equal(end, rows.length);
        return { data: rows, count: Object.hasOwn(overrides, "sourceCount") ? overrides.sourceCount : rows.length, error: overrides.sourceError ?? null };
      } };
    },
    storage: {
      async getBucket(bucket) {
        calls.push("bucket"); assert.equal(bucket, "wedding-photos");
        return { data: {
          id: bucket, public: false, allowed_mime_types: ["image/jpeg"], file_size_limit: 500,
          ...overrides.bucket,
        }, error: overrides.bucketError ?? null };
      },
      from(bucket) {
        assert.equal(bucket, "wedding-photos");
        return { async info(path) {
          calls.push("info"); overrides.onInfo?.();
          return { data: { bucketId: bucket, name: path, size: 100, contentType: "image/jpeg", ...overrides.info }, error: overrides.infoError ?? null };
        } };
      },
    },
  };
}
function targetFixture(rows = [photo()], overrides = {}) {
  const calls = [];
  const client = {
    calls, ended: false,
    async connect() { calls.push("CONNECT"); },
    async end() { calls.push("END"); client.ended = true; },
    async query(sql, values) {
      calls.push(sql);
      assert.match(sql, /^(SELECT|BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY|SET LOCAL|ROLLBACK)/);
      if (/^(BEGIN|SET LOCAL|ROLLBACK)/.test(sql)) return { rows: [] };
      if (sql.includes("current_database")) return { rows: [{ database: "neondb", read_only: overrides.readOnly ?? "on" }] };
      if (sql.includes("has_table_privilege")) return { rows: [{ rls_enabled: true, rls_filters_rows: false, can_select: true, ...overrides.table }] };
      if (sql.includes("information_schema.columns")) return { rows: (overrides.columns ?? PHOTO_COLUMNS).map((column_name) => ({ column_name, udt_name: "text", is_nullable: "YES" })) };
      if (sql.includes("pg_index")) return { rows: [{ id_unique: overrides.idUnique ?? true }] };
      if (sql.includes("pg_constraint")) return { rows: overrides.foreignKeys ?? [] };
      if (sql.includes("orphan_count")) return { rows: [{ orphan_count: overrides.orphanCount ?? 0 }] };
      if (sql.includes("count(*)")) return { rows: [{ count: overrides.total ?? rows.length }] };
      if (sql.includes("to_jsonb(p)")) {
        assert.equal(values[0], rows.length + 1);
        if (overrides.readError) throw new Error("PRIVATE_PASSWORD_FROM_FAKE_DB");
        return { rows: rows.map((record) => ({ record })) };
      }
      throw new Error("Unexpected fixture query");
    },
  };
  return client;
}

function simulateBuild(env, auditStatus = 0) {
  const wrapper = readFileSync(new URL("./run-production-build.mjs", import.meta.url), "utf8");
  const imports = /^import .+ from "node:(?:child_process|fs|path)";\r?\n/gm;
  assert.equal([...wrapper.matchAll(imports)].length, 3);
  const calls = []; const removals = []; let exitCode;
  const stopped = new Error("synthetic_process_exit");
  assert.throws(() => runInNewContext(wrapper.replace(imports, ""), {
    process: {
      env: { ...env }, execPath: "synthetic-node", cwd: () => "synthetic-build",
      exit(code) { exitCode = code; throw stopped; },
    },
    resolve,
    spawnSync(_binary, args) {
      calls.push(args);
      return { status: args[0].endsWith("audit-preview-photos.mjs") ? auditStatus : 0 };
    },
    rmSync(...args) { removals.push(args); },
    console: { warn() {}, error() {} },
  }, { timeout: 1000 }), (cause) => cause === stopped);
  return { calls, removals, exitCode };
}

describe("photo audit fail-closed gates", () => {
  it("retires the unsafe write command and makes imports side-effect free", () => {
    assert.throws(retiredApply, /photo_apply_disabled/);
    const child = spawnSync(process.execPath, ["scripts/apply-preview-photos.mjs", "--apply"], { env: {}, encoding: "utf8" });
    assert.equal(child.status, 1);
    assert.match(child.stderr, /photo_apply_disabled/);
    assert.doesNotMatch(child.stderr, /ENOENT|credentials|postgresql:/);
  });
  it("rejects every CLI argument, including old apply, confirmation and env-file flags", () => {
    for (const arg of ["--apply", "--confirm=GATE_2C_PREVIEW_PHOTOS_WRITE", "--source-env=.env.local"]) {
      assert.throws(() => resolveAuditConfig([arg], environment()), /arguments_rejected/);
    }
  });
  it("blocks Production and a wrong branch before constructing any client", async () => {
    for (const changes of [{ VERCEL_ENV: "production" }, { VERCEL_GIT_COMMIT_REF: "main" }]) {
      await assert.rejects(runPhotoAudit([], environment(changes), {
        createSource() { assert.fail("must not construct a source client"); },
        createPostgres() { assert.fail("must not construct a database client"); },
      }), /preview_required|branch_required/);
    }
  });
  it("does not fall back to local or legacy credential bindings", () => {
    assert.throws(() => resolveAuditConfig([], environment({
      GATE_2C_SOURCE_SUPABASE_SECRET_KEY: undefined, SUPABASE_SERVICE_ROLE_KEY: "legacy-fixture",
    })), /migration_source_supabase_secret_key_missing/);
    assert.throws(() => resolveAuditConfig([], environment({ GATE_2C_SOURCE_SUPABASE_SECRET_KEY: "legacy-fixture" })), /revocable_secret_required/);
    assert.throws(() => resolveAuditConfig([], environment({ GATE_2C_SOURCE_PHOTOS_BUCKET: undefined })), /bucket_binding_required/);
  });
  it("rejects source lookalikes, HTTP, userinfo, paths and query strings", () => {
    for (const url of [ORIGIN + ".invalid", ORIGIN.replace("https:", "http:"), ORIGIN + "/other", ORIGIN + "?x=1", ORIGIN.replace("https://", "https://fixture@")]) {
      assert.throws(() => resolveAuditConfig([], environment({ GATE_2C_SOURCE_SUPABASE_URL: url })));
    }
  });
  it("pins the exact Neon host, database, port, protocol and safe URL options", () => {
    for (const url of [
      `postgresql://u:p@${HOST}.invalid/neondb`, `postgresql://u:p@other.neon.tech/neondb`,
      `postgresql://u:p@${HOST}/other`, `postgresql://u:p@${HOST}:5444/neondb`,
      `https://u:p@${HOST}/neondb`, `postgresql://u:p@${HOST}/neondb?sslmode=disable`,
      `postgresql://u:p@${HOST}/neondb?sslrootcert=arbitrary`,
    ]) assert.throws(() => resolveAuditConfig([], environment({ DATABASE_URL_UNPOOLED: url })));
  });
  it("always enables TLS verification and startup read-only mode without connectionString overrides", () => {
    const { postgres } = resolveAuditConfig([], environment());
    assert.equal(postgres.connectionString, undefined);
    assert.equal(postgres.ssl.rejectUnauthorized, true);
    assert.equal(postgres.ssl.servername, HOST);
    assert.match(postgres.options, /default_transaction_read_only=on/);
    assert.throws(() => resolveAuditConfig([], environment({ NODE_TLS_REJECT_UNAUTHORIZED: "0" })), /tls_verification_required/);
  });
  it("restricts Supabase HTTP to approved GET/HEAD metadata endpoints with no redirects", async () => {
    let calls = 0;
    const fetcher = createReadOnlySourceFetch(async (_url, init) => { calls++; assert.equal(init.redirect, "error"); return new Response("{}"); });
    await fetcher(ORIGIN + "/rest/v1/wedding_photos");
    await fetcher(ORIGIN + "/storage/v1/bucket/wedding-photos");
    await fetcher(ORIGIN + "/storage/v1/object/info/wedding-photos/safe/photo.jpg");
    for (const [url, method] of [
      [ORIGIN + "/rest/v1/wedding_photos", "POST"], [ORIGIN + "/rest/v1/clients", "GET"],
      [ORIGIN + "/storage/v1/object/wedding-photos/file", "GET"],
      ["https://invalid.test/rest/v1/wedding_photos", "GET"],
    ]) await assert.rejects(fetcher(url, { method }), /read_only_request_rejected/);
    assert.equal(calls, 3);
  });
  it("never exposes underlying error details", () => {
    assert.equal(safeAuditError(new Error("PRIVATE_PASSWORD_NAME_PATH")), "photo_audit_io_failed");
    assert.equal(safeAuditError(new PhotoAuditError("storage_path_invalid")), "storage_path_invalid");
  });
  it("only runs the photo build hook in the exact migration Preview", () => {
    const preview = simulateBuild(environment());
    assert.equal(preview.exitCode, 0);
    const photoCalls = preview.calls.filter((args) => args[0].endsWith("audit-preview-photos.mjs"));
    assert.equal(photoCalls.length, 1);
    assert.equal(photoCalls[0].length, 1);
    for (const changes of [{ VERCEL_ENV: "production" }, { VERCEL_ENV: "development" }, { VERCEL_GIT_COMMIT_REF: "main" }]) {
      const other = simulateBuild(environment(changes));
      assert.equal(other.calls.length, 1);
      assert.equal(other.calls[0][1], "build");
    }
  });
  it("stops a failed photo audit before cache cleanup and the application build", () => {
    const result = simulateBuild(environment(), 1);
    assert.equal(result.exitCode, 1);
    assert.equal(result.removals.length, 0);
    assert.ok(result.calls.at(-1)[0].endsWith("audit-preview-photos.mjs"));
    assert.equal(result.calls.some((args) => args[1] === "build"), false);
  });
});

describe("photo read-only snapshot and reconciliation", () => {
  it("uses the installed Supabase SDK with only mocked GET metadata requests", async () => {
    const rows = [photo()]; const paths = [];
    const result = await runPhotoAudit([], environment(), {
      baseline: baseline(rows), createPostgres: () => targetFixture(rows),
      createSource: (config) => createClient(config.url, config.adminKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: createReadOnlySourceFetch(async (input, init) => {
          const url = new URL(input instanceof Request ? input.url : input);
          paths.push(url.pathname);
          assert.equal((init.method || "GET").toUpperCase(), "GET");
          assert.equal(init.redirect, "error");
          let data;
          if (url.pathname === "/rest/v1/wedding_photos") data = rows;
          else if (url.pathname === "/storage/v1/bucket/wedding-photos") {
            data = { id: "wedding-photos", public: false, allowed_mime_types: ["image/jpeg"], file_size_limit: 500 };
          } else if (url.pathname === `/storage/v1/object/info/wedding-photos/${rows[0].storage_path}`) {
            data = { bucket_id: "wedding-photos", name: rows[0].storage_path, size: 100, content_type: "image/jpeg" };
          } else assert.fail("Unexpected SDK request");
          return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Content-Range": "0-0/1" } });
        }) },
      }),
    });
    assert.equal(result.verdict, "READ_ONLY_CHECKS_PASSED");
    assert.equal(paths.length, 3);
    assert.equal(result.metadata.sourceCount, 1);
  });
  it("uses a read-only snapshot, bounded reads, rollback and closes before Storage access", async () => {
    const rows = [photo()]; const client = targetFixture(rows);
    const source = sourceFixture(rows, { onInfo() { assert.equal(client.ended, true); } });
    const result = await runPhotoAudit([], environment(), {
      baseline: baseline(rows), createSource: () => source, createPostgres: () => client,
    });
    assert.equal(result.verdict, "READ_ONLY_CHECKS_PASSED");
    assert.equal(client.calls[1], "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    assert.deepEqual(client.calls.slice(-2), ["ROLLBACK", "END"]);
    assert.equal(result.storageCutoverReady, false);
    assert.equal(result.sourceStorage.byteContentVerified, false);
    assert.equal(result.writeAuthorized, false);
    const output = JSON.stringify(result);
    for (const privateValue of [rows[0].id, rows[0].storage_path, rows[0].guest_name, rows[0].caption]) assert.ok(!output.includes(privateValue));
  });
  it("rejects missing columns, filtered RLS, and writable transaction state", async () => {
    for (const overrides of [{ columns: ["id"] }, { table: { rls_filters_rows: true } }, { readOnly: "off" }]) {
      const client = targetFixture([photo()], overrides);
      await assert.rejects(readTargetSnapshot(client, { count: 1 }));
      assert.deepEqual(client.calls.slice(-2), ["ROLLBACK", "END"]);
    }
  });
  it("cleans up on a query failure without swallowing it", async () => {
    const client = targetFixture([photo()], { readError: true });
    await assert.rejects(readTargetSnapshot(client, { count: 1 }), /PRIVATE_PASSWORD/);
    assert.deepEqual(client.calls.slice(-2), ["ROLLBACK", "END"]);
  });
  it("does not call target or Storage when the source checksum drifts", async () => {
    const rows = [photo()]; const source = sourceFixture(rows);
    await assert.rejects(runPhotoAudit([], environment(), {
      baseline: { count: 1, checksum: "0".repeat(64) }, createSource: () => source,
      createPostgres() { assert.fail("must not reach target"); },
    }), /source_photo_checksum_drift/);
    assert.equal(source.calls.length, 0);
  });
  it("does not accept row-shape drift or duplicate source identities", async () => {
    for (const rows of [[photo({ unexpected: "private" })], [photo(), photo()]]) {
      await assert.rejects(runPhotoAudit([], environment(), {
        baseline: baseline(rows), createSource: () => sourceFixture(rows),
        createPostgres() { assert.fail("must not reach target"); },
      }), /columns_drift|identity_duplicate/);
    }
  });
  it("requires the exact server count even when an API row limit hides extra rows", async () => {
    const rows = [photo()];
    for (const sourceCount of [0, 2, null]) {
      await assert.rejects(runPhotoAudit([], environment(), {
        baseline: baseline(rows), createSource: () => sourceFixture(rows, { sourceCount }),
        createPostgres() { assert.fail("must not reach target"); },
      }), /source_photo_count_drift/);
    }
  });
  it("normalizes equivalent timestamps without losing PostgreSQL microseconds", () => {
    const rows = [photo({ created_at: "2026-09-01T12:00:00.123456+02:00" })];
    const equivalent = [photo({ created_at: "2026-09-01T10:00:00.123456Z" })];
    const changed = [photo({ created_at: "2026-09-01T10:00:00.123457Z" })];
    assert.equal(checksumPhotoRows(rows), checksumPhotoRows(equivalent));
    assert.notEqual(checksumPhotoRows(rows), checksumPhotoRows(changed));
    const result = reconcilePhotos(rows, { rows: changed, total: 1, schema: schema() }, baseline(rows));
    assert.equal(result.ready, false);
    assert.equal(result.reconciliation.divergentRecordCount, 1);
  });
  it("compares non-timestamp text literally even if it resembles a timestamp", () => {
    const rows = [photo({ caption: "2026-09-01T12:00:00+02:00" })];
    const changed = [photo({ caption: "2026-09-01T10:00:00Z" })];
    assert.notEqual(checksumPhotoRows(rows), checksumPhotoRows(changed));
    assert.equal(reconcilePhotos(rows, { rows: changed, total: 1, schema: schema() }, baseline(rows)).ready, false);
  });
  it("detects missing, extra and divergent target rows and absent uniqueness or RLS", () => {
    const rows = [photo()]; const expected = baseline(rows);
    for (const target of [
      { rows: [], total: 0, schema: schema() },
      { rows: [photo({ caption: "changed" })], total: 1, schema: schema() },
      { rows: [...rows, photo({ id: "extra" })], total: 2, schema: schema() },
      { rows, total: 1, schema: schema({ idUnique: false }) },
      { rows, total: 1, schema: schema({ rlsEnabled: false }) },
      { rows, total: 1, schema: schema({ orphanReferenceCount: 1 }) },
    ]) assert.equal(reconcilePhotos(rows, target, expected).ready, false);
    const partial = reconcilePhotos(rows, { rows, total: 999, schema: schema() }, expected);
    assert.equal(partial.targetSnapshotComplete, false);
    assert.equal(partial.targetChecksum, null);
    assert.equal(partial.reconciliation, null);
  });
  it("skips Storage when metadata differs instead of reporting a false pass", async () => {
    const rows = [photo()]; const source = sourceFixture(rows);
    const result = await runPhotoAudit([], environment(), {
      baseline: baseline(rows), createSource: () => source,
      createPostgres: () => targetFixture([photo({ caption: "changed" })]),
    });
    assert.equal(result.verdict, "BLOCKED"); assert.equal(result.sourceStorage, null);
    assert.equal(source.calls.length, 0);
  });
  it("supports declared composite FK null semantics and rejects unsafe catalog identifiers", () => {
    const key = { local_columns: ["experience_id", "phase_id"], remote_columns: ["id", "phase"], remote_schema: "public", remote_table: "experiences", match_type: "f" };
    const sql = buildForeignKeyAuditQuery(key);
    assert.match(sql, /SELECT count\(\*\).*orphan_count/);
    assert.match(sql, /r\."phase" = p\."phase_id"/);
    assert.match(sql, /AND NOT \(/);
    assert.throws(() => buildForeignKeyAuditQuery({ ...key, remote_table: 'x"; DROP TABLE x' }));
  });
});

describe("source Storage metadata audit", () => {
  it("only inspects referenced objects and does not claim bytes, target Storage or application access", async () => {
    const rows = [photo(), photo({ id: "second-reference" })]; const source = sourceFixture(rows);
    const result = await auditSourceStorage(source, rows);
    assert.equal(result.ready, true); assert.deepEqual(source.calls, ["bucket", "info"]);
    assert.equal(result.repeatedPathReferenceCount, 1);
    for (const field of ["fileBytesDownloaded", "byteContentVerified", "targetStorageVerified", "applicationAccessVerified"]) assert.equal(result[field], false);
  });
  it("blocks unsafe object paths before any Storage request", async () => {
    for (const path of ["../file", "/file", "a//b", "a/./b", "a/%2e%2e/b", "https://invalid/file", "a?token=x", "a\\b", "a\u0000b"]) {
      assert.equal(validStoragePath(path), false);
      const source = sourceFixture();
      await assert.rejects(auditSourceStorage(source, [photo({ storage_path: path })]), /storage_path_invalid/);
      assert.equal(source.calls.length, 0);
    }
  });
  it("blocks public buckets, unrestricted MIME policies, missing objects and mismatched metadata", async () => {
    for (const overrides of [
      { bucket: { public: true } }, { bucket: { allowed_mime_types: null } },
      { bucket: { allowed_mime_types: ["image/jpeg", "*/*"] } },
      { bucket: { file_size_limit: "invalid" } },
      { bucket: { allowed_mime_types: ["image/png"] } }, { bucket: { file_size_limit: 1 } },
      { infoError: { message: "PRIVATE_PATH_OR_TOKEN" } }, { info: { size: 101 } },
      { info: { contentType: "audio/ogg" } }, { info: { name: "different-private-path" } },
    ]) {
      const result = await auditSourceStorage(sourceFixture([photo()], overrides), [photo()]);
      assert.equal(result.ready, false);
      assert.doesNotMatch(JSON.stringify(result), /PRIVATE_PATH_OR_TOKEN|different-private-path/);
    }
  });
  it("supports documented MIME wildcards and fails closed on bucket access errors", async () => {
    assert.equal((await auditSourceStorage(sourceFixture([photo()], { bucket: { allowed_mime_types: ["image/*"] } }), [photo()])).ready, true);
    await assert.rejects(auditSourceStorage(sourceFixture([photo()], { bucketError: { message: "private" } }), [photo()]), /source_bucket_unavailable/);
  });
  it("keeps write hooks disarmed and the auditor free of mutation or env-file loading APIs", () => {
    const build = readFileSync(new URL("./run-production-build.mjs", import.meta.url), "utf8");
    const audit = readFileSync(new URL("./audit-preview-photos.mjs", import.meta.url), "utf8");
    assert.doesNotMatch(build, /apply-preview-photos|apply-events|apply-gifts/);
    // Hash.update is pure computation, not a database update; exempt only this exact expression.
    const auditWithoutHash = audit.replaceAll('createHash("sha256").update(value).digest("hex")', "SHA256_HASH");
    assert.notEqual(auditWithoutHash, audit);
    assert.doesNotMatch(auditWithoutHash, /readFileSync|loadEnvFile|\.insert\(|\.update\(|\.delete\(|\.upload\(|\.remove\(|\.download\(|createSignedUrl|INSERT INTO|DELETE FROM|CREATE TABLE|COMMIT/);
  });
});
