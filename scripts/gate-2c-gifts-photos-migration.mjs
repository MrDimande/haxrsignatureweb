#!/usr/bin/env node
/**
 * Gate 2C — Supabase -> Neon gift reservations and photo metadata.
 *
 * The command is read-only unless `apply` is selected and every Preview gate
 * passes. It never copies Storage blobs and never falls back to the anon key.
 *
 * Examples:
 *   node scripts/gate-2c-gifts-photos-migration.mjs source-audit \
 *     --env-file=.env.local --expected-source-ref=<ref>
 *   node scripts/gate-2c-gifts-photos-migration.mjs preflight \
 *     --expected-source-ref=<ref> --expected-gifts=38 --expected-photos=147 \
 *     --expected-gifts-checksum=<sha256> --expected-photos-checksum=<sha256>
 *   node scripts/gate-2c-gifts-photos-migration.mjs apply \
 *     --expected-source-ref=<ref> --expected-gifts=38 --expected-photos=147 \
 *     --expected-neon-host=<exact-preview-host> \
 *     --confirm=GATE_2C_PREVIEW_WRITE
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const APPLY_CONFIRMATION = "GATE_2C_PREVIEW_WRITE";
const GIFT_TABLE = "edition_gift_reservations";
const PHOTO_TABLE_CANDIDATES = Object.freeze([
  "wedding_photos",
  "experience_photos",
  "event_photos",
  "portal_photos",
  "concierge_uploads",
]);
const SOURCE_PAGE_SIZE = 500;
const INSERT_BATCH_SIZE = 250;
const MAX_RECONCILIATION_AUDIT_ROWS = 512;

export class GateError extends Error {
  constructor(code) {
    super(code);
    this.name = "GateError";
  }
}

export function parseArgs(argv) {
  const [mode = "source-audit", ...rawFlags] = argv;
  if (!new Set(["source-audit", "preflight", "apply"]).has(mode)) {
    throw new GateError("invalid_mode");
  }

  const flags = new Map();
  for (const raw of rawFlags) {
    if (!raw.startsWith("--") || !raw.includes("=")) {
      throw new GateError("invalid_argument_format");
    }
    const separator = raw.indexOf("=");
    flags.set(raw.slice(2, separator), raw.slice(separator + 1));
  }

  return {
    mode,
    envFile: flags.get("env-file") || null,
    expectedSourceRef: flags.get("expected-source-ref") || null,
    expectedGifts: parseExpectedCount(flags.get("expected-gifts"), "expected_gifts"),
    expectedPhotos: parseExpectedCount(flags.get("expected-photos"), "expected_photos"),
    expectedGiftsChecksum: parseExpectedChecksum(
      flags.get("expected-gifts-checksum"),
      "expected_gifts_checksum",
    ),
    expectedPhotosChecksum: parseExpectedChecksum(
      flags.get("expected-photos-checksum"),
      "expected_photos_checksum",
    ),
    photoTable: flags.get("photo-table") || null,
    expectedNeonHost: flags.get("expected-neon-host") || null,
    confirmation: flags.get("confirm") || null,
  };
}

function parseExpectedCount(value, label) {
  if (value === undefined) return null;
  if (!/^\d+$/.test(value)) throw new GateError(`${label}_invalid`);
  return Number(value);
}

function parseExpectedChecksum(value, label) {
  if (value === undefined) return null;
  if (!/^[a-f0-9]{64}$/.test(value)) throw new GateError(`${label}_invalid`);
  return value;
}

export function loadExplicitEnvFile(filename, env = process.env) {
  if (!filename) return;
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) throw new GateError("env_file_not_found");

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (env[key] === undefined) env[key] = value;
  }
}

function projectRefFromSupabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new GateError("supabase_url_invalid");
  }
  const suffix = ".supabase.co";
  if (!url.hostname.endsWith(suffix)) throw new GateError("supabase_host_invalid");
  const projectRef = url.hostname.slice(0, -suffix.length);
  if (!/^[a-z0-9]{20}$/.test(projectRef)) throw new GateError("supabase_ref_invalid");
  return projectRef;
}

export function resolveSourceConfig(env, expectedSourceRef, { requireDedicated = false } = {}) {
  const url = requireDedicated
    ? env.GATE_2C_SOURCE_SUPABASE_URL?.trim()
    : env.GATE_2C_SOURCE_SUPABASE_URL?.trim() ||
      env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      env.SUPABASE_URL?.trim();
  const adminKey = requireDedicated
    ? env.GATE_2C_SOURCE_SUPABASE_SECRET_KEY?.trim()
    : env.GATE_2C_SOURCE_SUPABASE_SECRET_KEY?.trim() ||
      env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) {
    throw new GateError(
      requireDedicated ? "migration_source_supabase_url_missing" : "supabase_url_missing",
    );
  }
  if (!adminKey) {
    throw new GateError(
      requireDedicated
        ? "migration_source_supabase_secret_key_missing"
        : "supabase_service_role_missing",
    );
  }
  if (!expectedSourceRef) throw new GateError("expected_source_ref_missing");

  const actualRef = projectRefFromSupabaseUrl(url);
  if (actualRef !== expectedSourceRef) throw new GateError("source_ref_mismatch");
  return { url, adminKey, projectRef: actualRef };
}

function resolveNeonUrl(env) {
  return env.DATABASE_URL_UNPOOLED?.trim() || env.DATABASE_URL?.trim() || "";
}

export function assertPreviewNeonTarget(env, confirmation, mode, expectedNeonHost = null) {
  if (env.VERCEL_ENV !== "preview") throw new GateError("vercel_preview_required");
  if (env.VERCEL_GIT_COMMIT_REF !== MIGRATION_BRANCH) {
    throw new GateError("migration_branch_required");
  }
  if (mode === "apply" && confirmation !== APPLY_CONFIRMATION) {
    throw new GateError("apply_confirmation_missing");
  }

  const connectionString = resolveNeonUrl(env);
  if (!connectionString) throw new GateError("neon_database_url_missing");

  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new GateError("neon_database_url_invalid");
  }
  if (!url.hostname.endsWith(".neon.tech")) throw new GateError("neon_host_required");
  if (!url.pathname || url.pathname === "/") throw new GateError("neon_database_missing");
  if (mode === "apply") {
    if (!expectedNeonHost) throw new GateError("expected_neon_host_missing");
    if (url.hostname !== expectedNeonHost) throw new GateError("neon_host_mismatch");
  }

  return {
    connectionString,
    host: url.hostname,
    database: url.pathname.slice(1),
    connectionMode: url.hostname.includes("-pooler.") ? "pooled" : "direct",
  };
}

function createSupabase(source) {
  return createClient(source.url, source.adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function inspectSourceTable(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) {
    return { table, accessible: false, count: null, errorCode: error.code || "unknown" };
  }
  return { table, accessible: true, count: count ?? 0, errorCode: null };
}

async function fetchAllSourceRows(supabase, table) {
  const rows = [];
  for (let start = 0; ; start += SOURCE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(start, start + SOURCE_PAGE_SIZE - 1);
    if (error) throw new GateError(`source_read_failed:${table}:${error.code || "unknown"}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < SOURCE_PAGE_SIZE) break;
  }
  return rows;
}

export function selectPhotoTable(audit, requestedTable = null) {
  if (requestedTable && !PHOTO_TABLE_CANDIDATES.includes(requestedTable)) {
    throw new GateError("photo_table_not_allowed");
  }
  if (requestedTable) {
    const requested = audit.find((item) => item.table === requestedTable);
    if (!requested?.accessible) throw new GateError("photo_table_inaccessible");
    return requestedTable;
  }

  const populated = audit.filter((item) => item.accessible && item.count > 0);
  if (populated.length === 0) throw new GateError("photo_table_not_found");
  if (populated.length > 1) throw new GateError("photo_table_ambiguous");
  return populated[0].table;
}

function canonicalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    const timestamp = new Date(value);
    if (!Number.isNaN(timestamp.valueOf())) return timestamp.toISOString();
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function checksumRows(rows) {
  const canonicalRows = [...rows]
    .map((row) => canonicalize(row))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return createHash("sha256").update(JSON.stringify(canonicalRows)).digest("hex");
}

export function quoteIdentifier(identifier) {
  if (!/^[a-z][a-z0-9_]*$/.test(identifier)) throw new GateError("identifier_invalid");
  return `"${identifier}"`;
}

export function normalizeTargetColumnList(value) {
  if (Array.isArray(value) && value.every((column) => typeof column === "string")) {
    return value;
  }
  if (typeof value === "string" && /^\{[a-z0-9_,]*\}$/.test(value)) {
    const body = value.slice(1, -1);
    return body ? body.split(",") : [];
  }
  if (value === null || value === undefined) return [];
  throw new GateError("target_constraint_metadata_invalid");
}

export function selectConflictKey(table, sourceColumns, primaryKey, uniqueKeys) {
  const idUnique = uniqueKeys.some(
    (columns) => columns.length === 1 && columns[0] === "id",
  );
  if (idUnique && sourceColumns.includes("id")) {
    return { primaryKey, idUnique, conflictColumns: ["id"] };
  }

  const primaryKeyUsable =
    primaryKey.length > 0 && primaryKey.every((column) => sourceColumns.includes(column));
  if (primaryKeyUsable) {
    return { primaryKey, idUnique, conflictColumns: primaryKey };
  }

  const compatibleUniqueKey = uniqueKeys.find(
    (columns) => columns.length > 0 && columns.every((column) => sourceColumns.includes(column)),
  );
  if (compatibleUniqueKey) {
    return { primaryKey, idUnique, conflictColumns: compatibleUniqueKey };
  }

  throw new GateError(`target_conflict_key_missing:${table}`);
}

function conflictKey(row, columns) {
  return JSON.stringify(columns.map((column) => canonicalize(row[column])));
}

export function assertSourceConflictKeys(table, rows, columns) {
  const seen = new Set();
  for (const row of rows) {
    if (columns.some((column) => row[column] === null || row[column] === undefined)) {
      throw new GateError(`source_conflict_key_null:${table}`);
    }
    const key = conflictKey(row, columns);
    if (seen.has(key)) throw new GateError(`source_conflict_key_duplicate:${table}`);
    seen.add(key);
  }
}

export function checksumConflictKeys(rows, conflictColumns) {
  const keys = rows.map((row) => conflictKey(row, conflictColumns)).sort();
  return createHash("sha256").update(JSON.stringify(keys)).digest("hex");
}

export function summarizeTargetReconciliation(
  sourceRows,
  matchingTargetRows,
  allTargetRows,
  conflictColumns,
) {
  const sourceByConflictKey = new Map(
    sourceRows.map((row) => [conflictKey(row, conflictColumns), row]),
  );
  const targetOnlyRows = allTargetRows.filter(
    (row) => !sourceByConflictKey.has(conflictKey(row, conflictColumns)),
  );
  const divergentRecordCount = matchingTargetRows.filter(
    (row) =>
      checksumRows([row]) !==
      checksumRows([sourceByConflictKey.get(conflictKey(row, conflictColumns))]),
  ).length;
  const storagePathMatchCount =
    sourceRows[0] && Object.hasOwn(sourceRows[0], "storage_path")
      ? matchingTargetRows.filter(
          (row) =>
            row.storage_path ===
            sourceByConflictKey.get(conflictKey(row, conflictColumns))?.storage_path,
        ).length
      : null;

  return {
    sourceRowCount: sourceRows.length,
    targetRowCount: allTargetRows.length,
    matchedConflictKeyCount: matchingTargetRows.length,
    matchingRecordCount: matchingTargetRows.length - divergentRecordCount,
    divergentRecordCount,
    storagePathMatchCount,
    sourceOnlyCount: sourceRows.length - matchingTargetRows.length,
    targetOnlyCount: targetOnlyRows.length,
    targetOnlyKeyChecksum: checksumConflictKeys(targetOnlyRows, conflictColumns),
  };
}

function rowColumns(rows) {
  if (rows.length === 0) return [];
  const columns = Object.keys(rows[0]).sort();
  const signature = columns.join("\u0000");
  for (const row of rows) {
    if (Object.keys(row).sort().join("\u0000") !== signature) {
      throw new GateError("source_row_shape_inconsistent");
    }
  }
  if (!columns.includes("id")) throw new GateError("source_primary_key_missing");
  return columns;
}

async function inspectTargetTable(client, table, sourceRows) {
  const tableResult = await client.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [`public.${table}`],
  );
  if (!tableResult.rows[0]?.exists) throw new GateError(`target_table_missing:${table}`);

  const columnsResult = await client.query(
    `SELECT column_name, data_type, udt_name, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position`,
    [table],
  );
  const targetColumns = new Set(columnsResult.rows.map((row) => row.column_name));
  const sourceColumns = rowColumns(sourceRows);
  const missingColumns = sourceColumns.filter((column) => !targetColumns.has(column));
  if (missingColumns.length) throw new GateError(`target_columns_missing:${table}`);

  const primaryKeyResult = await client.query(
    `SELECT array_agg(a.attname ORDER BY key_position.ordinality) AS columns
       FROM pg_constraint c
       JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS key_position(attnum, ordinality)
         ON true
       JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=key_position.attnum
      WHERE c.conrelid=$1::regclass AND c.contype='p'`,
    [`public.${table}`],
  );
  const primaryKey = normalizeTargetColumnList(primaryKeyResult.rows[0]?.columns);
  const uniqueKeysResult = await client.query(
    `SELECT array_agg(a.attname ORDER BY key_position.ordinality) AS columns
       FROM pg_index i
       JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS key_position(attnum, ordinality)
         ON true
       JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=key_position.attnum
      WHERE i.indrelid=$1::regclass
        AND i.indisunique
        AND i.indisvalid
        AND i.indisready
        AND i.indpred IS NULL
      GROUP BY i.indexrelid
      ORDER BY i.indexrelid`,
    [`public.${table}`],
  );
  const uniqueKeys = uniqueKeysResult.rows.map((row) => normalizeTargetColumnList(row.columns));
  console.info(
    "[gate-2c-target-contract]",
    JSON.stringify({
      table,
      columns: columnsResult.rows.map((row) => ({
        name: row.column_name,
        dataType: row.data_type,
        udtName: row.udt_name,
        nullable: row.is_nullable === "YES",
        hasDefault: row.column_default !== null,
      })),
      primaryKey,
      uniqueKeys,
    }),
  );
  const identity = selectConflictKey(table, sourceColumns, primaryKey, uniqueKeys);

  const privilegesResult = await client.query(
    `SELECT
       has_table_privilege(current_user, $1, 'SELECT') AS can_select,
       has_table_privilege(current_user, $1, 'INSERT') AS can_insert`,
    [`public.${table}`],
  );
  if (!privilegesResult.rows[0]?.can_select || !privilegesResult.rows[0]?.can_insert) {
    throw new GateError(`target_privileges_missing:${table}`);
  }

  return { sourceColumns, ...identity };
}

export function buildTargetRowFetch(table, columns, conflictColumns, rows) {
  if (rows.length === 0) return null;
  const selected = columns.map(quoteIdentifier).join(", ");
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = conflictColumns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const key = conflictColumns.map(quoteIdentifier).join(", ");
  return {
    sql:
    `SELECT ${selected}
       FROM public.${quoteIdentifier(table)}
      WHERE (${key}) IN (${tuples.join(", ")})
      ORDER BY ${key}`,
    values,
  };
}

async function fetchTargetRows(client, table, columns, conflictColumns, rows) {
  const query = buildTargetRowFetch(table, columns, conflictColumns, rows);
  if (!query) return [];
  const result = await client.query(query.sql, query.values);
  return result.rows;
}

async function countTargetRows(client, table) {
  const result = await client.query(
    `SELECT count(*)::int AS count FROM public.${quoteIdentifier(table)}`,
  );
  return result.rows[0]?.count ?? 0;
}

async function fetchAllTargetRowsForReconciliation(
  client,
  table,
  columns,
  conflictColumns,
  targetRowCount,
) {
  if (targetRowCount > MAX_RECONCILIATION_AUDIT_ROWS) {
    throw new GateError(`target_audit_row_limit:${table}`);
  }
  const selected = columns.map(quoteIdentifier).join(", ");
  const orderBy = conflictColumns.map(quoteIdentifier).join(", ");
  const result = await client.query(
    `SELECT ${selected}
       FROM public.${quoteIdentifier(table)}
      ORDER BY ${orderBy}`,
  );
  if (result.rows.length !== targetRowCount) {
    throw new GateError(`target_row_count_changed:${table}`);
  }
  return result.rows;
}

async function assertForeignKeysPresent(client, table, rows) {
  if (!rows.length || !Object.hasOwn(rows[0], "event_id")) return;
  const eventIds = [...new Set(rows.map((row) => row.event_id).filter(Boolean))];
  if (!eventIds.length) return;
  const result = await client.query(
    "SELECT count(*)::int AS count FROM public.events WHERE id = ANY($1::uuid[])",
    [eventIds],
  );
  if ((result.rows[0]?.count ?? 0) !== eventIds.length) {
    throw new GateError(`target_event_fk_missing:${table}`);
  }
}

async function inspectTargetState(client, table, rows) {
  const { sourceColumns, primaryKey, idUnique, conflictColumns } = await inspectTargetTable(
    client,
    table,
    rows,
  );
  await assertForeignKeysPresent(client, table, rows);
  assertSourceConflictKeys(table, rows, conflictColumns);
  const existingRows = await fetchTargetRows(
    client,
    table,
    sourceColumns,
    conflictColumns,
    rows,
  );
  const totalCount = await countTargetRows(client, table);
  const allTargetRows = await fetchAllTargetRowsForReconciliation(
    client,
    table,
    sourceColumns,
    conflictColumns,
    totalCount,
  );
  const reconciliation = summarizeTargetReconciliation(
    rows,
    existingRows,
    allTargetRows,
    conflictColumns,
  );
  console.info(
    "[gate-2c-reconciliation-audit]",
    JSON.stringify({
      table,
      conflictKey: conflictColumns,
      ...reconciliation,
      sourceMutated: false,
      targetMutated: false,
      storageBlobsCopied: false,
    }),
  );
  if (reconciliation.divergentRecordCount) throw new GateError(`target_conflict:${table}`);
  if (reconciliation.targetOnlyCount) throw new GateError(`target_extra_rows:${table}`);

  return {
    columns: sourceColumns,
    primaryKey,
    idUnique,
    conflictColumns,
    existingCount: existingRows.length,
    totalCount,
    reconciliation,
    sourceChecksum: checksumRows(rows),
    targetChecksum: checksumRows(existingRows),
  };
}

export function buildBatchInsert(table, columns, rows, conflictColumns) {
  if (!rows.length) return null;
  if (!conflictColumns.length) throw new GateError(`target_conflict_key_missing:${table}`);
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const sql = `INSERT INTO public.${quoteIdentifier(table)} (${columns
    .map(quoteIdentifier)
    .join(", ")}) VALUES ${tuples.join(", ")} ON CONFLICT (${conflictColumns
    .map(quoteIdentifier)
    .join(", ")}) DO NOTHING`;
  return { sql, values };
}

async function insertRows(client, table, columns, rows, conflictColumns) {
  for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
    const batch = buildBatchInsert(
      table,
      columns,
      rows.slice(start, start + INSERT_BATCH_SIZE),
      conflictColumns,
    );
    if (batch) await client.query(batch.sql, batch.values);
  }
}

function assertExpectedCount(label, actual, expected) {
  if (expected === null) throw new GateError(`${label}_expected_count_missing`);
  if (actual !== expected) throw new GateError(`${label}_count_mismatch`);
}

function assertExpectedChecksum(label, actual, expected) {
  if (expected === null) throw new GateError(`${label}_expected_checksum_missing`);
  if (actual !== expected) throw new GateError(`${label}_checksum_mismatch`);
}

function safeTableAudit(audit) {
  return audit.map(({ table, accessible, count, errorCode }) => ({
    table,
    accessible,
    count,
    errorCode,
  }));
}

async function loadSourceData(options, env) {
  const source = resolveSourceConfig(env, options.expectedSourceRef, {
    requireDedicated: options.mode !== "source-audit",
  });
  const supabase = createSupabase(source);
  const giftAudit = await inspectSourceTable(supabase, GIFT_TABLE);
  const photoAudit = await Promise.all(
    PHOTO_TABLE_CANDIDATES.map((table) => inspectSourceTable(supabase, table)),
  );

  if (options.mode === "source-audit") {
    console.info(
      "[gate-2c-source-audit]",
      JSON.stringify({
        sourceRef: source.projectRef,
        gifts: giftAudit,
        photoCandidates: safeTableAudit(photoAudit),
        storageBlobsCopied: false,
      }),
    );
  }

  if (!giftAudit.accessible) {
    throw new GateError(`gift_table_inaccessible:${giftAudit.errorCode}`);
  }

  const photoTable = selectPhotoTable(photoAudit, options.photoTable);
  const [gifts, photos] = await Promise.all([
    fetchAllSourceRows(supabase, GIFT_TABLE),
    fetchAllSourceRows(supabase, photoTable),
  ]);

  return { source, photoTable, gifts, photos };
}

async function runGate(options, env = process.env) {
  loadExplicitEnvFile(options.envFile, env);
  const target =
    options.mode === "source-audit"
      ? null
      : assertPreviewNeonTarget(
          env,
          options.confirmation,
          options.mode,
          options.expectedNeonHost,
        );
  const sourceData = await loadSourceData(options, env);

  if (options.mode === "source-audit") {
    console.info(
      "[gate-2c-source-summary]",
      JSON.stringify({
        sourceRef: sourceData.source.projectRef,
        giftTable: GIFT_TABLE,
        giftCount: sourceData.gifts.length,
        giftChecksum: checksumRows(sourceData.gifts),
        giftColumns: rowColumns(sourceData.gifts),
        photoTable: sourceData.photoTable,
        photoCount: sourceData.photos.length,
        photoChecksum: checksumRows(sourceData.photos),
        photoColumns: rowColumns(sourceData.photos),
        storageBlobsCopied: false,
      }),
    );
    return;
  }

  assertExpectedCount("gifts", sourceData.gifts.length, options.expectedGifts);
  assertExpectedCount("photos", sourceData.photos.length, options.expectedPhotos);
  const giftChecksum = checksumRows(sourceData.gifts);
  const photoChecksum = checksumRows(sourceData.photos);
  assertExpectedChecksum("gifts", giftChecksum, options.expectedGiftsChecksum);
  assertExpectedChecksum("photos", photoChecksum, options.expectedPhotosChecksum);
  const pool = new pg.Pool({
    connectionString: target.connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: true },
  });

  let client;
  try {
    client = await pool.connect();
    const connectionResult = await client.query(
      `SELECT current_database() AS database,
              current_setting('server_version_num')::int AS server_version_num,
              pg_is_in_recovery() AS is_replica`,
    );
    if (connectionResult.rows[0]?.is_replica) throw new GateError("target_is_read_replica");

    const giftState = await inspectTargetState(client, GIFT_TABLE, sourceData.gifts);
    const photoState = await inspectTargetState(client, sourceData.photoTable, sourceData.photos);

    console.info(
      "[gate-2c-preflight]",
      JSON.stringify({
        sourceRef: sourceData.source.projectRef,
        target: {
          provider: "neon",
          runtime: "vercel-preview",
          gitBranch: MIGRATION_BRANCH,
          host: target.host,
          database: connectionResult.rows[0]?.database,
          serverVersion: connectionResult.rows[0]?.server_version_num,
          connectionMode: target.connectionMode,
        },
        gifts: {
          sourceCount: sourceData.gifts.length,
          existingTargetCount: giftState.existingCount,
          targetPrimaryKey: giftState.primaryKey,
          targetIdUnique: giftState.idUnique,
          targetConflictKey: giftState.conflictColumns,
          sourceChecksum: giftState.sourceChecksum,
          existingTargetChecksum: giftState.targetChecksum,
        },
        photos: {
          table: sourceData.photoTable,
          sourceCount: sourceData.photos.length,
          existingTargetCount: photoState.existingCount,
          targetPrimaryKey: photoState.primaryKey,
          targetIdUnique: photoState.idUnique,
          targetConflictKey: photoState.conflictColumns,
          sourceChecksum: photoState.sourceChecksum,
          existingTargetChecksum: photoState.targetChecksum,
        },
        storageBlobsCopied: false,
        writeAuthorized: options.mode === "apply",
      }),
    );

    if (options.mode === "preflight") return;

    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '30s'");
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('haxr:gate-2c:gifts-photos'))");

      await insertRows(
        client,
        GIFT_TABLE,
        giftState.columns,
        sourceData.gifts,
        giftState.conflictColumns,
      );
      await insertRows(
        client,
        sourceData.photoTable,
        photoState.columns,
        sourceData.photos,
        photoState.conflictColumns,
      );

      const verifiedGifts = await fetchTargetRows(
        client,
        GIFT_TABLE,
        giftState.columns,
        giftState.conflictColumns,
        sourceData.gifts,
      );
      const verifiedPhotos = await fetchTargetRows(
        client,
        sourceData.photoTable,
        photoState.columns,
        photoState.conflictColumns,
        sourceData.photos,
      );
      const finalGiftCount = await countTargetRows(client, GIFT_TABLE);
      const finalPhotoCount = await countTargetRows(client, sourceData.photoTable);

      if (
        finalGiftCount !== sourceData.gifts.length ||
        verifiedGifts.length !== sourceData.gifts.length ||
        checksumRows(verifiedGifts) !== giftState.sourceChecksum
      ) {
        throw new GateError("gift_verification_failed");
      }
      if (
        finalPhotoCount !== sourceData.photos.length ||
        verifiedPhotos.length !== sourceData.photos.length ||
        checksumRows(verifiedPhotos) !== photoState.sourceChecksum
      ) {
        throw new GateError("photo_verification_failed");
      }

      await client.query("COMMIT");
      console.info(
        "[gate-2c-apply]",
        JSON.stringify({
          status: "committed_and_verified",
          sourceRef: sourceData.source.projectRef,
          target: "neon-vercel-preview",
          gifts: { count: finalGiftCount, checksum: giftState.sourceChecksum },
          photos: {
            table: sourceData.photoTable,
            count: finalPhotoCount,
            checksum: photoState.sourceChecksum,
          },
          storageBlobsCopied: false,
        }),
      );
    } catch (cause) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw cause;
    }
  } finally {
    client?.release();
    await pool.end();
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv);
  await runGate(options, env);
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  main().catch((cause) => {
    const code = cause instanceof Error ? cause.message : "unknown_error";
    console.error("[gate-2c] blocked", code);
    process.exit(1);
  });
}
