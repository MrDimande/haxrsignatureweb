/**
 * Read-only reconciliation. No env-file loading, row writes or blob downloads.
 * See docs/migrations/preview-photos-read-only-audit.md for scope and limitations.
 */
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import {
  assertPreviewNeonTarget, checksumRows, GateError, normalizeTargetColumnList,
  quoteIdentifier, resolveSourceConfig, summarizeTargetReconciliation,
} from "./gate-2c-gifts-photos-migration.mjs";

export const PHOTO_BASELINE = Object.freeze({
  count: 147,
  checksum: "36b8f471d851f7244a47f2b3070b03465d5415a1f7d42109f3fb7764054ecfd0",
});
const SOURCE_REF = "oxsrdmydlqyvnueedgtl";
const SOURCE_ORIGIN = `https://${SOURCE_REF}.supabase.co`;
const NEON_HOST = "ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech";
const BUCKET = "wedding-photos";
const TABLE = "public.wedding_photos";
export const PHOTO_COLUMNS = Object.freeze([
  "id", "invitation_slug", "storage_path", "original_filename", "content_type",
  "file_size_bytes", "guest_name", "caption", "moderation_status", "created_at",
  "approved_at", "rejected_at", "challenge_id", "table_id", "participant_id",
  "experience_id", "phase_id",
]);

export class PhotoAuditError extends Error {}
function requireCondition(condition, code) {
  if (!condition) throw new PhotoAuditError(code);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const TIMESTAMP_COLUMNS = new Set(["created_at", "approved_at", "rejected_at"]);
function canonicalPhotoValue(column, value) {
  if (!TIMESTAMP_COLUMNS.has(column) || typeof value !== "string") return value;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return value;
  const second = new Date(`${match[1]}${match[3]}`);
  if (Number.isNaN(second.valueOf())) return value;
  // PostgreSQL preserves microseconds; converting the full value to Date would lose them.
  return second.toISOString().replace(".000Z", `.${(match[2] || "").padEnd(6, "0")}Z`);
}

export function checksumPhotoRows(rows) {
  const canonical = rows.map((row) => Object.fromEntries(Object.keys(row).sort()
    .map((column) => [column, canonicalPhotoValue(column, row[column])])))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return sha256(JSON.stringify(canonical));
}

export function safeAuditError(cause) {
  return (cause instanceof PhotoAuditError || cause instanceof GateError) &&
    /^[a-z0-9_]+$/.test(cause.message) ? cause.message : "photo_audit_io_failed";
}

export function resolveAuditConfig(argv, env) {
  requireCondition(argv.length === 0, "photo_audit_arguments_rejected");
  requireCondition(env.NODE_TLS_REJECT_UNAUTHORIZED !== "0", "tls_verification_required");
  const target = assertPreviewNeonTarget(env, null, "audit-event-dependencies");
  const url = new URL(target.connectionString);
  requireCondition(["postgres:", "postgresql:"].includes(url.protocol), "neon_protocol_invalid");
  requireCondition(url.hostname === NEON_HOST, "neon_host_mismatch");
  requireCondition(url.pathname === "/neondb" && !url.hash, "neon_database_mismatch");
  requireCondition(!url.port || url.port === "5432", "neon_port_mismatch");
  requireCondition(Boolean(url.username && url.password), "neon_credentials_missing");
  for (const [key, value] of url.searchParams) {
    requireCondition(
      (key === "sslmode" && ["require", "verify-full"].includes(value)) ||
      (key === "channel_binding" && value === "require"),
      "neon_connection_option_rejected",
    );
  }
  const source = resolveSourceConfig(env, SOURCE_REF, { requireDedicated: true });
  const sourceUrl = new URL(source.url);
  requireCondition(
    sourceUrl.origin === SOURCE_ORIGIN && sourceUrl.pathname === "/" &&
      !sourceUrl.username && !sourceUrl.password && !sourceUrl.search && !sourceUrl.hash,
    "source_endpoint_mismatch",
  );
  requireCondition(source.adminKey.startsWith("sb_secret_"), "dedicated_revocable_secret_required");
  requireCondition(env.GATE_2C_SOURCE_PHOTOS_BUCKET === BUCKET, "source_bucket_binding_required");
  return {
    source,
    // No connectionString: URL sslmode parameters must not overwrite the TLS object.
    postgres: {
      host: NEON_HOST, port: 5432, database: "neondb",
      user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
      ssl: { rejectUnauthorized: true, servername: NEON_HOST },
      enableChannelBinding: true,
      options: "-c default_transaction_read_only=on",
      application_name: "gate-2c-photos-read-only-audit",
      connectionTimeoutMillis: 10000, statement_timeout: 30000, query_timeout: 35000,
    },
  };
}

export function createReadOnlySourceFetch(fetchImpl = globalThis.fetch) {
  return async (input, init = {}) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(request ? request.url : input);
    const method = (init.method || request?.method || "GET").toUpperCase();
    const allowedPath = url.pathname === "/rest/v1/wedding_photos" ||
      url.pathname === `/storage/v1/bucket/${BUCKET}` ||
      url.pathname.startsWith(`/storage/v1/object/info/${BUCKET}/`);
    requireCondition(
      url.origin === SOURCE_ORIGIN && !url.username && !url.password &&
        allowedPath && ["GET", "HEAD"].includes(method),
      "source_read_only_request_rejected",
    );
    const signal = init.signal || request?.signal;
    return fetchImpl(input, {
      ...init, redirect: "error",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
    });
  };
}

function assertRowShape(rows) {
  const signature = [...PHOTO_COLUMNS].sort().join(",");
  requireCondition(rows.every((row) => Object.keys(row).sort().join(",") === signature), "photo_columns_drift");
  requireCondition(rows.every((row) => typeof row.id === "string" && row.id.length > 0), "photo_identity_invalid");
  requireCondition(new Set(rows.map((row) => row.id)).size === rows.length, "photo_identity_duplicate");
}

async function readSourcePhotos(source, baseline) {
  const { data, count, error } = await source.from("wedding_photos").select("*", { count: "exact" })
    .order("id", { ascending: true }).range(0, baseline.count);
  requireCondition(!error && Array.isArray(data), "source_photo_read_failed");
  requireCondition(count === baseline.count && data.length === baseline.count, "source_photo_count_drift");
  assertRowShape(data);
  requireCondition(checksumRows(data) === baseline.checksum, "source_photo_checksum_drift");
  return data;
}

export function buildForeignKeyAuditQuery(foreignKey) {
  const local = normalizeTargetColumnList(foreignKey.local_columns);
  const remote = normalizeTargetColumnList(foreignKey.remote_columns);
  requireCondition(local.length > 0 && local.length === remote.length, "foreign_key_shape_invalid");
  requireCondition(["s", "f"].includes(foreignKey.match_type), "foreign_key_match_unsupported");
  const present = local.map((col) => `p.${quoteIdentifier(col)} IS NOT NULL`);
  const join = local.map((col, i) => `r.${quoteIdentifier(remote[i])} = p.${quoteIdentifier(col)}`).join(" AND ");
  const partialNull = foreignKey.match_type === "f"
    ? ` OR ((${present.join(" OR ")}) AND NOT (${present.join(" AND ")}))` : "";
  return `SELECT count(*)::int AS orphan_count FROM public.wedding_photos p
    WHERE ((${present.join(" AND ")}) AND NOT EXISTS (
      SELECT 1 FROM ${quoteIdentifier(foreignKey.remote_schema)}.${quoteIdentifier(foreignKey.remote_table)} r
      WHERE ${join}))${partialNull}`;
}

export async function readTargetSnapshot(client, baseline) {
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    transactionStarted = true;
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
    const identity = (await client.query(
      "SELECT current_database() AS database, current_setting('transaction_read_only') AS read_only",
    )).rows[0];
    requireCondition(identity?.database === "neondb" && identity.read_only === "on", "read_only_transaction_required");
    const table = (await client.query(
      `SELECT c.relrowsecurity AS rls_enabled, row_security_active(c.oid) AS rls_filters_rows,
              has_table_privilege(current_user, c.oid, 'SELECT') AS can_select
         FROM pg_class c WHERE c.oid = to_regclass($1) AND c.relkind IN ('r','p')`, [TABLE],
    )).rows[0];
    requireCondition(table?.can_select && table.rls_filters_rows === false, "target_full_select_required");
    const columns = (await client.query(
      `SELECT column_name, udt_name, is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'wedding_photos' ORDER BY ordinal_position`,
    )).rows;
    const names = new Set(columns.map((row) => row.column_name));
    requireCondition(PHOTO_COLUMNS.every((col) => names.has(col)), "target_photo_columns_missing");
    const unique = (await client.query(
      `SELECT EXISTS (SELECT 1 FROM pg_index i JOIN pg_attribute a
         ON a.attrelid = i.indrelid AND a.attname = 'id'
        WHERE i.indrelid = $1::regclass AND i.indisunique AND i.indisvalid AND i.indisready
          AND i.indpred IS NULL AND i.indexprs IS NULL AND i.indnkeyatts = 1
          AND i.indkey[0] = a.attnum) AS id_unique`, [TABLE],
    )).rows[0]?.id_unique === true;
    const foreignKeys = (await client.query(
      `SELECT c.convalidated AS validated, c.confmatchtype AS match_type,
              n.nspname AS remote_schema, r.relname AS remote_table,
              ARRAY(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num, ord)
                    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num ORDER BY k.ord) AS local_columns,
              ARRAY(SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY k(num, ord)
                    JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.num ORDER BY k.ord) AS remote_columns
         FROM pg_constraint c JOIN pg_class r ON r.oid=c.confrelid JOIN pg_namespace n ON n.oid=r.relnamespace
        WHERE c.conrelid=$1::regclass AND c.contype='f' ORDER BY c.oid`, [TABLE],
    )).rows;
    let orphanCount = 0;
    for (const key of foreignKeys) {
      orphanCount += (await client.query(buildForeignKeyAuditQuery(key))).rows[0].orphan_count;
    }
    const total = (await client.query("SELECT count(*)::int AS count FROM public.wedding_photos")).rows[0].count;
    const rows = (await client.query(
      "SELECT to_jsonb(p) AS record FROM public.wedding_photos p ORDER BY id LIMIT $1", [baseline.count + 1],
    )).rows.map((row) => row.record);
    return {
      rows, total,
      schema: {
        requiredColumnsPresent: true, idUnique: unique, rlsEnabled: table.rls_enabled === true,
        readOnlyTransaction: true, declaredForeignKeyCount: foreignKeys.length,
        unvalidatedForeignKeyCount: foreignKeys.filter((key) => !key.validated).length,
        orphanReferenceCount: orphanCount, columnContractChecksum: checksumRows(columns),
        sourceSchemaParityVerified: false, logicalDependenciesVerified: false,
      },
    };
  } finally {
    try {
      if (transactionStarted) await client.query("ROLLBACK");
    } finally {
      await client.end();
    }
  }
}

export function reconcilePhotos(sourceRows, target, baseline = PHOTO_BASELINE) {
  const byId = new Map(sourceRows.map((row) => [row.id, row]));
  const complete = target.total === target.rows.length;
  const reconciliation = complete ? summarizeTargetReconciliation(
    sourceRows, target.rows.filter((row) => byId.has(row.id)), target.rows, ["id"],
  ) : null;
  if (reconciliation) {
    const matching = target.rows.filter((row) => byId.has(row.id));
    reconciliation.divergentRecordCount = matching.filter((row) =>
      checksumPhotoRows([row]) !== checksumPhotoRows([byId.get(row.id)])).length;
    reconciliation.matchingRecordCount = matching.length - reconciliation.divergentRecordCount;
  }
  const sourceBaselineChecksum = checksumRows(sourceRows);
  const sourceChecksum = checksumPhotoRows(sourceRows);
  const targetChecksum = complete ? checksumPhotoRows(target.rows) : null;
  const ready = complete && sourceRows.length === baseline.count && target.total === baseline.count &&
    sourceBaselineChecksum === baseline.checksum && targetChecksum === sourceChecksum &&
    target.schema.requiredColumnsPresent && target.schema.readOnlyTransaction &&
    target.schema.idUnique && target.schema.rlsEnabled &&
    target.schema.unvalidatedForeignKeyCount === 0 && target.schema.orphanReferenceCount === 0;
  return {
    expectedCount: baseline.count, recordedExpectedChecksum: baseline.checksum, sourceBaselineChecksum,
    sourceCount: sourceRows.length, targetCount: target.total, sourceChecksum, targetChecksum,
    timestampPrecision: "microseconds",
    targetSnapshotComplete: complete, reconciliation, schema: target.schema, ready,
  };
}

export function validStoragePath(path) {
  return typeof path === "string" && path.length > 0 && path.length <= 2048 &&
    path === path.trim() && !/[\\%?#:\u0000-\u001f\u007f]/.test(path) &&
    path.split("/").every((part) => part && part !== "." && part !== "..");
}

function normalizedMime(value) {
  return typeof value === "string" ? value.split(";", 1)[0].trim().toLowerCase() : null;
}
function byteSize(value) {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+$/.test(value))) return null;
  const size = Number(value);
  return Number.isSafeInteger(size) && size >= 0 ? size : null;
}
function allowsMime(allowed, mime) {
  return Boolean(mime) && allowed.some((pattern) => pattern === mime ||
    (pattern.endsWith("/*") && mime.startsWith(pattern.slice(0, -1))));
}

export async function auditSourceStorage(source, rows) {
  requireCondition(rows.every((row) => validStoragePath(row.storage_path)), "storage_path_invalid");
  const { data: bucket, error } = await source.storage.getBucket(BUCKET);
  requireCondition(!error && bucket?.id === BUCKET, "source_bucket_unavailable");
  const allowed = Array.isArray(bucket.allowed_mime_types) ? bucket.allowed_mime_types : [];
  const allowlistValid = allowed.length > 0 && allowed.every((mime) =>
    typeof mime === "string" && /^[a-z0-9][a-z0-9!#$&^_.+-]*\/(?:\*|[a-z0-9][a-z0-9!#$&^_.+-]*)$/.test(mime));
  const groups = new Map();
  for (const row of rows) {
    const group = groups.get(row.storage_path) ?? [];
    group.push(row);
    groups.set(row.storage_path, group);
  }
  const summary = {
    bucketPrivate: bucket.public === false, mimeAllowlistRestricted: allowlistValid,
    bucketSizeLimitConfigured: byteSize(bucket.file_size_limit) !== null,
    bucketSizeLimitValid: bucket.file_size_limit == null || byteSize(bucket.file_size_limit) !== null,
    referencedPathCount: groups.size, repeatedPathReferenceCount: rows.length - groups.size,
    inaccessibleObjectCount: 0, objectIdentityMismatchCount: 0, invalidMetadataCount: 0,
    sizeMismatchCount: 0, contentTypeMismatchCount: 0, mimeNotAllowedCount: 0,
    bucketLimitExceededCount: 0,
    fileBytesDownloaded: false, byteContentVerified: false, targetStorageVerified: false,
    applicationAccessVerified: false,
  };
  const manifest = [];
  const entries = [...groups.entries()];
  for (let i = 0; i < entries.length; i += 4) {
    await Promise.all(entries.slice(i, i + 4).map(async ([path, references]) => {
      const { data, error: infoError } = await source.storage.from(BUCKET).info(path);
      if (infoError || !data) { summary.inaccessibleObjectCount++; return; }
      if (data.bucketId !== BUCKET || data.name !== path) summary.objectIdentityMismatchCount++;
      const size = byteSize(data.size ?? data.metadata?.size);
      const mime = normalizedMime(data.contentType ?? data.metadata?.mimetype);
      if (size === null || !mime) summary.invalidMetadataCount++;
      if (references.some((row) => byteSize(row.file_size_bytes) === null || byteSize(row.file_size_bytes) !== size)) summary.sizeMismatchCount++;
      if (references.some((row) => normalizedMime(row.content_type) !== mime)) summary.contentTypeMismatchCount++;
      if (!allowlistValid || !allowsMime(allowed, mime)) summary.mimeNotAllowedCount++;
      const limit = byteSize(bucket.file_size_limit);
      if (limit !== null && size !== null && size > limit) summary.bucketLimitExceededCount++;
      manifest.push({ id: sha256(path), size, mime });
    }));
  }
  const ready = summary.bucketPrivate && summary.mimeAllowlistRestricted && summary.bucketSizeLimitValid &&
    ["inaccessibleObjectCount", "objectIdentityMismatchCount", "invalidMetadataCount", "sizeMismatchCount",
      "contentTypeMismatchCount", "mimeNotAllowedCount", "bucketLimitExceededCount"].every((key) => summary[key] === 0);
  return { ...summary, objectMetadataChecksum: checksumRows(manifest), ready };
}

export async function runPhotoAudit(argv = [], env = process.env, dependencies = {}) {
  const config = resolveAuditConfig(argv, env); // Gates run before constructing clients or making requests.
  const baseline = dependencies.baseline ?? PHOTO_BASELINE;
  const makeSource = dependencies.createSource ?? ((sourceConfig) => createClient(sourceConfig.url, sourceConfig.adminKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: createReadOnlySourceFetch() },
  }));
  const source = makeSource(config.source);
  const sourceRows = await readSourcePhotos(source, baseline);
  const client = dependencies.createPostgres ? dependencies.createPostgres(config.postgres) : new pg.Client(config.postgres);
  const target = await readTargetSnapshot(client, baseline);
  const metadata = reconcilePhotos(sourceRows, target, baseline);
  // End the DB transaction before any Storage network requests.
  const storage = metadata.ready ? await auditSourceStorage(source, sourceRows) : null;
  const checksPassed = metadata.ready && storage?.ready === true;
  return {
    verdict: checksPassed ? "READ_ONLY_CHECKS_PASSED" : "BLOCKED",
    metadata, sourceStorage: storage, sourceStorageAuditSkipped: storage === null,
    writeAuthorized: false, sourceMutated: false, targetMutated: false, storageBlobsCopied: false,
    storageCutoverReady: false, productionReadyClaimed: false,
  };
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  try {
    const result = await runPhotoAudit(argv, env);
    console.info("[gate-2c-photos-audit]", JSON.stringify(result));
    return result.verdict === "READ_ONLY_CHECKS_PASSED" ? 0 : 1;
  } catch (cause) {
    console.error("[gate-2c-photos-audit] blocked", safeAuditError(cause));
    return 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = await main();
}
