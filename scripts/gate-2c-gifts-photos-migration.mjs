#!/usr/bin/env node
/**
 * Gate 2C — Supabase -> Neon gift reservations and photo metadata.
 *
 * The command is read-only unless an explicit `apply-*` mode is selected and
 * every Preview gate passes. Photo metadata is intentionally deferred: this
 * gate never copies Storage blobs and never falls back to the anon key.
 *
 * Examples:
 *   node scripts/gate-2c-gifts-photos-migration.mjs source-audit \
 *     --env-file=.env.local --expected-source-ref=<ref>
 *   node scripts/gate-2c-gifts-photos-migration.mjs preflight-gifts \
 *     --expected-source-ref=<ref> --expected-gifts=38 \
 *     --expected-gifts-checksum=<sha256>
 *   node scripts/gate-2c-gifts-photos-migration.mjs preflight-gift-bindings \
 *     --expected-source-ref=<ref> --expected-gifts=38 \
 *     --expected-gifts-checksum=<sha256>
 *   node scripts/gate-2c-gifts-photos-migration.mjs apply-gifts \
 *     --expected-source-ref=<ref> --expected-gifts=38 \
 *     --expected-existing-gifts=0 --expected-existing-gifts-checksum=<sha256> \
 *     --expected-neon-host=<exact-preview-host> \
 *     --confirm=GATE_2C_PREVIEW_GIFTS_WRITE
 *   node scripts/gate-2c-gifts-photos-migration.mjs apply-events \
 *     --expected-source-ref=<ref> --expected-gifts=42 \
 *     --expected-events=2 --expected-event-id-checksum=<sha256> \
 *     --expected-business-references=1 --expected-business-reference-checksum=<sha256> \
 *     --expected-client-references=1 --expected-client-reference-checksum=<sha256> \
 *     --expected-existing-event-bindings=0 --expected-existing-event-ids=0 \
 *     --expected-non-empty-registry-keys=0 \
 *     --expected-neon-host=<exact-preview-host> \
 *     --confirm=GATE_2C_PREVIEW_EVENTS_WRITE
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const APPLY_GIFTS_CONFIRMATION = "GATE_2C_PREVIEW_GIFTS_WRITE";
const APPLY_EVENTS_CONFIRMATION = "GATE_2C_PREVIEW_EVENTS_WRITE";
const CLEANUP_CONFIRMATION = "GATE_2C_PREVIEW_CLEANUP";
const GIFT_TABLE = "edition_gift_reservations";
const EVENT_TABLE = "events";
const BUSINESS_TABLE = "businesses";
const CLIENT_TABLE = "clients";
const EVENT_REGISTRY_UNIQUE_INDEX = "events_edition_registry_key_nonempty_uidx";
const EVENT_AUDIT_COLUMNS = Object.freeze([
  "id",
  "business_id",
  "client_id",
  "edition_registry_key",
  "name",
  "type",
  "date",
  "is_active",
]);
const MINIMAL_EVENT_TRANSFER_COLUMNS = Object.freeze([
  "id",
  "business_id",
  "name",
  "type",
  "date",
  "is_active",
  "edition_registry_key",
]);
const EVENT_INSERT_COLUMNS = Object.freeze([
  "id",
  "business_id",
  "client_id",
  "name",
  "type",
  "date",
  "is_active",
  "edition_registry_key",
]);
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

export function modeRequiresPhotoData(mode) {
  return mode === "source-audit" || mode === "cleanup-preview-photos";
}

function modeRequiresGiftBindingData(mode) {
  return (
    mode === "preflight-gift-bindings" ||
    mode === "audit-event-dependencies" ||
    mode === "apply-events"
  );
}

function modeRequiresEventDependencyData(mode) {
  return mode === "audit-event-dependencies" || mode === "apply-events";
}

export function parseArgs(argv) {
  const [mode = "source-audit", ...rawFlags] = argv;
  if (
    !new Set([
      "source-audit",
      "preflight-gifts",
      "preflight-gift-bindings",
      "audit-event-dependencies",
      "apply-events",
      "apply-gifts",
      "cleanup-preview-photos",
    ]).has(mode)
  ) {
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
    expectedEvents: parseExpectedCount(flags.get("expected-events"), "expected_events"),
    expectedEventIdChecksum: parseExpectedChecksum(
      flags.get("expected-event-id-checksum"),
      "expected_event_id_checksum",
    ),
    expectedBusinessReferences: parseExpectedCount(
      flags.get("expected-business-references"),
      "expected_business_references",
    ),
    expectedBusinessReferenceChecksum: parseExpectedChecksum(
      flags.get("expected-business-reference-checksum"),
      "expected_business_reference_checksum",
    ),
    expectedClientReferences: parseExpectedCount(
      flags.get("expected-client-references"),
      "expected_client_references",
    ),
    expectedClientReferenceChecksum: parseExpectedChecksum(
      flags.get("expected-client-reference-checksum"),
      "expected_client_reference_checksum",
    ),
    expectedExistingEventBindings: parseExpectedCount(
      flags.get("expected-existing-event-bindings"),
      "expected_existing_event_bindings",
    ),
    expectedExistingEventIds: parseExpectedCount(
      flags.get("expected-existing-event-ids"),
      "expected_existing_event_ids",
    ),
    expectedNonEmptyRegistryKeys: parseExpectedCount(
      flags.get("expected-non-empty-registry-keys"),
      "expected_non_empty_registry_keys",
    ),
    expectedExistingGifts: parseExpectedCount(
      flags.get("expected-existing-gifts"),
      "expected_existing_gifts",
    ),
    expectedExistingGiftsChecksum: parseExpectedChecksum(
      flags.get("expected-existing-gifts-checksum"),
      "expected_existing_gifts_checksum",
    ),
    expectedPhotosChecksum: parseExpectedChecksum(
      flags.get("expected-photos-checksum"),
      "expected_photos_checksum",
    ),
    expectedTargetOnlyPhotos: parseExpectedCount(
      flags.get("expected-target-only-photos"),
      "expected_target_only_photos",
    ),
    expectedTargetOnlyPhotosChecksum: parseExpectedChecksum(
      flags.get("expected-target-only-photos-checksum"),
      "expected_target_only_photos_checksum",
    ),
    expectedCascadeDependentRows: parseExpectedCount(
      flags.get("expected-cascade-dependent-rows"),
      "expected_cascade_dependent_rows",
    ),
    expectedCascadeDependencyPlanChecksum: parseExpectedChecksum(
      flags.get("expected-cascade-dependency-plan-checksum"),
      "expected_cascade_dependency_plan_checksum",
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
  const requiresWriteConfirmation = new Set([
    "apply-gifts",
    "apply-events",
    "cleanup-preview-photos",
  ]).has(mode);
  const expectedConfirmation =
    mode === "apply-gifts"
      ? APPLY_GIFTS_CONFIRMATION
      : mode === "apply-events"
        ? APPLY_EVENTS_CONFIRMATION
        : CLEANUP_CONFIRMATION;
  if (requiresWriteConfirmation && confirmation !== expectedConfirmation) {
    throw new GateError(
      mode === "apply-gifts"
        ? "apply_gifts_confirmation_missing"
        : mode === "apply-events"
          ? "apply_events_confirmation_missing"
          : "cleanup_confirmation_missing",
    );
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
  if (requiresWriteConfirmation) {
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

async function fetchAllSourceRows(supabase, table, columns = "*") {
  const rows = [];
  for (let start = 0; ; start += SOURCE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(start, start + SOURCE_PAGE_SIZE - 1);
    if (error) throw new GateError(`source_read_failed:${table}:${error.code || "unknown"}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < SOURCE_PAGE_SIZE) break;
  }
  return rows;
}

async function fetchSourceRowsByValues(supabase, table, column, values, columns) {
  if (!values.length) return [];
  const rows = [];
  for (let start = 0; ; start += SOURCE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .in(column, values)
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

function collectRegistryKeys(rows, column, { required = false } = {}) {
  const keys = new Set();
  for (const row of rows) {
    const value = row[column];
    if (typeof value !== "string" || !value.trim()) {
      if (required) throw new GateError(`registry_key_missing:${column}`);
      continue;
    }
    keys.add(value.trim());
  }
  return [...keys].sort();
}

function checksumRegistryKeys(keys) {
  return createHash("sha256").update(JSON.stringify(keys)).digest("hex");
}

function collectNonEmptyStrings(rows, column) {
  return [
    ...new Set(
      rows
        .map((row) => row[column])
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim()),
    ),
  ].sort();
}

export function summarizeGiftEventBindings(gifts, sourceEvents, targetEvents) {
  const giftRegistryKeys = collectRegistryKeys(gifts, "registry_key", { required: true });
  const sourceEventRegistryKeys = collectRegistryKeys(sourceEvents, "edition_registry_key");
  const targetEventRegistryKeys = collectRegistryKeys(targetEvents, "edition_registry_key");
  const sourceEventKeySet = new Set(sourceEventRegistryKeys);
  const targetEventKeySet = new Set(targetEventRegistryKeys);
  const sourceBoundKeys = giftRegistryKeys.filter((key) => sourceEventKeySet.has(key));
  const targetBoundKeys = giftRegistryKeys.filter((key) => targetEventKeySet.has(key));
  const missingSourceKeys = giftRegistryKeys.filter((key) => !sourceEventKeySet.has(key));
  const missingTargetKeys = giftRegistryKeys.filter((key) => !targetEventKeySet.has(key));

  return {
    giftRegistryKeyCount: giftRegistryKeys.length,
    giftRegistryKeyChecksum: checksumRegistryKeys(giftRegistryKeys),
    sourceEventBindingCount: sourceBoundKeys.length,
    sourceEventBindingChecksum: checksumRegistryKeys(sourceBoundKeys),
    targetEventBindingCount: targetBoundKeys.length,
    targetEventBindingChecksum: checksumRegistryKeys(targetBoundKeys),
    missingSourceEventBindingCount: missingSourceKeys.length,
    missingSourceEventBindingChecksum: checksumRegistryKeys(missingSourceKeys),
    missingTargetEventBindingCount: missingTargetKeys.length,
    missingTargetEventBindingChecksum: checksumRegistryKeys(missingTargetKeys),
    ready: missingSourceKeys.length === 0 && missingTargetKeys.length === 0,
  };
}

function eventRecordMatchesSource(source, target) {
  return (
    source.id === target.id &&
    source.business_id === target.business_id &&
    source.edition_registry_key === target.edition_registry_key
  );
}

function countDuplicateValues(rows, column) {
  const values = rows
    .map((row) => row[column])
    .filter((value) => typeof value === "string" && value.trim());
  return values.length - new Set(values).size;
}

/**
 * Summarizes the minimum dependencies for importing Edition event bindings.
 * It intentionally returns only aggregate counts, checksums and booleans: no
 * event, business, client or registry identifiers are included in its output.
 */
export function summarizeEventDependencies({
  gifts,
  sourceEvents,
  sourceBusinesses,
  sourceClients,
  targetEventsByRegistry,
  targetEventsById,
  targetBusinesses,
  targetSchema,
}) {
  const giftRegistryKeys = collectRegistryKeys(gifts, "registry_key", { required: true });
  const sourceRegistryKeys = collectRegistryKeys(sourceEvents, "edition_registry_key");
  const sourceEventIds = collectNonEmptyStrings(sourceEvents, "id");
  const sourceBusinessIds = collectNonEmptyStrings(sourceEvents, "business_id");
  const sourceClientIds = collectNonEmptyStrings(sourceEvents, "client_id");
  const sourceBusinessIdSet = new Set(sourceBusinesses.map((row) => row.id));
  const sourceClientIdSet = new Set(sourceClients.map((row) => row.id));
  const targetBusinessIdSet = new Set(targetBusinesses.map((row) => row.id));
  const sourceByRegistryKey = new Map(
    sourceEvents.map((row) => [row.edition_registry_key, row]),
  );
  const sourceById = new Map(sourceEvents.map((row) => [row.id, row]));
  const targetRegistryKeys = collectRegistryKeys(
    targetEventsByRegistry,
    "edition_registry_key",
  );
  const targetRegistryKeySet = new Set(targetRegistryKeys);
  const targetRegistryMatches = targetEventsByRegistry.filter((target) => {
    const source = sourceByRegistryKey.get(target.edition_registry_key);
    return source ? eventRecordMatchesSource(source, target) : false;
  });
  const targetIdMatches = targetEventsById.filter((target) => {
    const source = sourceById.get(target.id);
    return source ? eventRecordMatchesSource(source, target) : false;
  });
  const missingSourceRegistryKeys = giftRegistryKeys.filter(
    (key) => !sourceByRegistryKey.has(key),
  );
  const missingTargetRegistryKeys = giftRegistryKeys.filter(
    (key) => !targetRegistryKeySet.has(key),
  );
  const sourceBusinessReferenceFailures = sourceBusinessIds.filter(
    (id) => !sourceBusinessIdSet.has(id),
  );
  const sourceClientReferenceFailures = sourceClientIds.filter(
    (id) => !sourceClientIdSet.has(id),
  );
  const targetBusinessReferenceFailures = sourceBusinessIds.filter(
    (id) => !targetBusinessIdSet.has(id),
  );
  const sourceRequiredFieldFailureCount = sourceEvents.filter((row) => {
    const hasRequiredText = [
      row.id,
      row.business_id,
      row.edition_registry_key,
      row.name,
      row.type,
    ].every((value) => typeof value === "string" && value.trim());
    return !hasRequiredText || typeof row.is_active !== "boolean";
  }).length;
  const unsupportedEventTypeCount = sourceEvents.filter(
    (row) => !targetSchema.eventTypeLabels.has(row.type),
  ).length;
  const targetEmptyForRequestedEvents =
    targetEventsByRegistry.length === 0 && targetEventsById.length === 0;
  const targetBindingComplete =
    targetRegistryMatches.length === giftRegistryKeys.length &&
    targetEventsByRegistry.length === giftRegistryKeys.length &&
    missingTargetRegistryKeys.length === 0;
  const sourceReady =
    missingSourceRegistryKeys.length === 0 &&
    sourceEvents.length === giftRegistryKeys.length &&
    countDuplicateValues(sourceEvents, "edition_registry_key") === 0 &&
    countDuplicateValues(sourceEvents, "id") === 0 &&
    sourceRequiredFieldFailureCount === 0 &&
    sourceBusinessReferenceFailures.length === 0 &&
    sourceClientReferenceFailures.length === 0 &&
    unsupportedEventTypeCount === 0;
  const targetSchemaReady =
    targetSchema.missingMinimalEventColumns.length === 0 &&
    targetSchema.clientIdNullable &&
    targetSchema.eventIdUnique;
  const targetReadyForEventDataImport =
    sourceReady &&
    targetSchemaReady &&
    targetBusinessReferenceFailures.length === 0 &&
    targetEmptyForRequestedEvents &&
    targetSchema.nonEmptyRegistryKeyDuplicateCount === 0;
  const targetAlreadyConsistent =
    sourceReady &&
    targetSchemaReady &&
    targetBusinessReferenceFailures.length === 0 &&
    targetBindingComplete &&
    targetIdMatches.length === giftRegistryKeys.length &&
    targetEventsById.length === giftRegistryKeys.length &&
    targetSchema.nonEmptyRegistryKeyDuplicateCount === 0;

  return {
    registryKeyCount: giftRegistryKeys.length,
    registryKeyChecksum: checksumRegistryKeys(giftRegistryKeys),
    source: {
      eventCount: sourceEvents.length,
      eventIdChecksum: checksumRegistryKeys(sourceEventIds),
      registryBindingCount: sourceRegistryKeys.length,
      duplicateRegistryBindingCount: countDuplicateValues(sourceEvents, "edition_registry_key"),
      duplicateEventIdCount: countDuplicateValues(sourceEvents, "id"),
      missingRegistryBindingCount: missingSourceRegistryKeys.length,
      missingRegistryBindingChecksum: checksumRegistryKeys(missingSourceRegistryKeys),
      requiredFieldFailureCount: sourceRequiredFieldFailureCount,
      unsupportedEventTypeCount,
      businessReferenceCount: sourceBusinessIds.length,
      businessReferenceChecksum: checksumRegistryKeys(sourceBusinessIds),
      missingBusinessReferenceCount: sourceBusinessReferenceFailures.length,
      missingBusinessReferenceChecksum: checksumRegistryKeys(sourceBusinessReferenceFailures),
      clientReferenceCount: sourceClientIds.length,
      clientReferenceChecksum: checksumRegistryKeys(sourceClientIds),
      missingClientReferenceCount: sourceClientReferenceFailures.length,
      missingClientReferenceChecksum: checksumRegistryKeys(sourceClientReferenceFailures),
    },
    target: {
      missingMinimalEventColumnCount: targetSchema.missingMinimalEventColumns.length,
      missingMinimalEventColumnChecksum: checksumRegistryKeys(
        targetSchema.missingMinimalEventColumns,
      ),
      clientIdNullable: targetSchema.clientIdNullable,
      clientIdForeignKeySetNull: targetSchema.clientIdForeignKeySetNull,
      eventIdUnique: targetSchema.eventIdUnique,
      editionRegistryKeyUnique: targetSchema.editionRegistryKeyUnique,
      nonEmptyRegistryKeyCount: targetSchema.nonEmptyRegistryKeyCount,
      nonEmptyRegistryKeyDuplicateCount: targetSchema.nonEmptyRegistryKeyDuplicateCount,
      registryBindingCount: targetEventsByRegistry.length,
      matchingRegistryBindingCount: targetRegistryMatches.length,
      missingRegistryBindingCount: missingTargetRegistryKeys.length,
      missingRegistryBindingChecksum: checksumRegistryKeys(missingTargetRegistryKeys),
      duplicateRegistryBindingCount: countDuplicateValues(
        targetEventsByRegistry,
        "edition_registry_key",
      ),
      matchingSourceIdCount: targetIdMatches.length,
      conflictingSourceIdCount: targetEventsById.length - targetIdMatches.length,
      businessReferenceCount: sourceBusinessIds.length,
      missingBusinessReferenceCount: targetBusinessReferenceFailures.length,
      missingBusinessReferenceChecksum: checksumRegistryKeys(targetBusinessReferenceFailures),
      state: targetEmptyForRequestedEvents
        ? "empty_for_requested_events"
        : targetBindingComplete
          ? "already_consistent"
          : "mixed_or_conflicting",
    },
    readyForEventDataImport: targetReadyForEventDataImport,
    readyForSafeEventMigration:
      (targetReadyForEventDataImport || targetAlreadyConsistent) &&
      targetSchema.editionRegistryKeyUnique,
    readyForGiftBindings: sourceReady && targetBindingComplete,
  };
}

export function prepareEventRowsForTarget(sourceEvents) {
  return sourceEvents.map((row) => ({
    id: row.id,
    business_id: row.business_id,
    client_id: null,
    name: row.name,
    type: row.type,
    date: row.date,
    is_active: row.is_active,
    edition_registry_key: row.edition_registry_key,
  }));
}

export function assertExpectedEventMigrationBaseline(state, options) {
  assertExpectedCount("events", state.source.eventCount, options.expectedEvents);
  assertExpectedCount("event_registry_keys", state.registryKeyCount, options.expectedEvents);
  assertExpectedChecksum(
    "event_ids",
    state.source.eventIdChecksum,
    options.expectedEventIdChecksum,
  );
  assertExpectedCount(
    "business_references",
    state.source.businessReferenceCount,
    options.expectedBusinessReferences,
  );
  assertExpectedChecksum(
    "business_references",
    state.source.businessReferenceChecksum,
    options.expectedBusinessReferenceChecksum,
  );
  assertExpectedCount(
    "client_references",
    state.source.clientReferenceCount,
    options.expectedClientReferences,
  );
  assertExpectedChecksum(
    "client_references",
    state.source.clientReferenceChecksum,
    options.expectedClientReferenceChecksum,
  );
  assertExpectedCount(
    "existing_event_bindings",
    state.target.registryBindingCount,
    options.expectedExistingEventBindings,
  );
  assertExpectedCount(
    "existing_event_ids",
    state.target.matchingSourceIdCount + state.target.conflictingSourceIdCount,
    options.expectedExistingEventIds,
  );
  assertExpectedCount(
    "non_empty_registry_keys",
    state.target.nonEmptyRegistryKeyCount,
    options.expectedNonEmptyRegistryKeys,
  );
  if (state.target.nonEmptyRegistryKeyDuplicateCount !== 0) {
    throw new GateError("target_event_registry_duplicates_present");
  }
  if (state.target.editionRegistryKeyUnique) {
    throw new GateError("target_event_registry_unique_index_baseline_mismatch");
  }
  if (state.target.state !== "empty_for_requested_events") {
    throw new GateError("target_event_baseline_not_empty");
  }
  if (!state.readyForEventDataImport) {
    throw new GateError("event_dependency_baseline_not_ready");
  }
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

async function inspectGiftEventBindings(client, gifts, sourceEvents, { log = true } = {}) {
  const eventTableResult = await client.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    ["public.events"],
  );
  if (!eventTableResult.rows[0]?.exists) throw new GateError("target_table_missing:events");

  const eventColumnResult = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema='public'
         AND table_name='events'
         AND column_name='edition_registry_key'
     ) AS exists`,
  );
  if (!eventColumnResult.rows[0]?.exists) {
    throw new GateError("target_columns_missing:events.edition_registry_key");
  }

  const giftRegistryKeys = collectRegistryKeys(gifts, "registry_key", { required: true });
  const targetResult = await client.query(
    `SELECT DISTINCT edition_registry_key
       FROM public.events
      WHERE edition_registry_key = ANY($1::text[])
      ORDER BY edition_registry_key`,
    [giftRegistryKeys],
  );
  const summary = summarizeGiftEventBindings(gifts, sourceEvents, targetResult.rows);
  if (log) {
    console.info(
      "[gate-2c-gift-bindings]",
      JSON.stringify({
        ...summary,
        sourceMutated: false,
        targetMutated: false,
        storageBlobsCopied: false,
      }),
    );
  }
  return summary;
}

function isSupportedRegistryKeyUniqueIndex(columns, predicate) {
  if (columns.length !== 1 || columns[0] !== "edition_registry_key") return false;
  if (predicate === null || predicate === undefined) return true;
  const normalized = String(predicate)
    .toLowerCase()
    .replace(/["()\s]/g, "")
    .replace(/::text/g, "");
  return normalized === "edition_registry_key<>''";
}

async function assertTargetTableExists(client, table) {
  const result = await client.query("SELECT to_regclass($1) IS NOT NULL AS exists", [
    `public.${table}`,
  ]);
  if (!result.rows[0]?.exists) throw new GateError(`target_table_missing:${table}`);
}

async function inspectEventDependencyState(
  client,
  gifts,
  sourceEventDependencies,
  { log = true } = {},
) {
  await assertTargetTableExists(client, EVENT_TABLE);
  await assertTargetTableExists(client, BUSINESS_TABLE);

  const columnsResult = await client.query(
    `SELECT column_name, is_nullable, udt_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [EVENT_TABLE],
  );
  const columnsByName = new Map(
    columnsResult.rows.map((row) => [row.column_name, row]),
  );
  const missingMinimalEventColumns = MINIMAL_EVENT_TRANSFER_COLUMNS.filter(
    (column) => !columnsByName.has(column),
  );
  for (const identityColumn of ["id", "business_id", "client_id", "edition_registry_key"]) {
    if (!columnsByName.has(identityColumn)) {
      throw new GateError(`target_columns_missing:events.${identityColumn}`);
    }
  }

  const eventTypeName = columnsByName.get("type")?.udt_name;
  const eventTypesResult = eventTypeName
    ? await client.query(
        `SELECT enumlabel
           FROM pg_type type
           JOIN pg_enum value ON value.enumtypid = type.oid
          WHERE type.typname = $1
          ORDER BY value.enumsortorder`,
        [eventTypeName],
      )
    : { rows: [] };
  const uniqueIndexesResult = await client.query(
    `SELECT array_agg(attribute.attname ORDER BY key_position.ordinality) AS columns,
            (
              SELECT pg_get_expr(predicate_index.indpred, predicate_index.indrelid)
                FROM pg_index predicate_index
               WHERE predicate_index.indexrelid = index_definition.indexrelid
            ) AS predicate
       FROM pg_index index_definition
       JOIN LATERAL unnest(index_definition.indkey) WITH ORDINALITY AS key_position(attnum, ordinality)
         ON true
       JOIN pg_attribute attribute
         ON attribute.attrelid = index_definition.indrelid
        AND attribute.attnum = key_position.attnum
      WHERE index_definition.indrelid = $1::regclass
        AND index_definition.indisunique
        AND index_definition.indisvalid
        AND index_definition.indisready
      GROUP BY index_definition.indexrelid`,
    [`public.${EVENT_TABLE}`],
  );
  const uniqueIndexes = uniqueIndexesResult.rows.map((row) => ({
    columns: normalizeTargetColumnList(row.columns),
    predicate: row.predicate,
  }));
  const clientForeignKeyResult = await client.query(
    `SELECT EXISTS (
       SELECT 1
         FROM pg_constraint constraint_definition
         JOIN LATERAL unnest(constraint_definition.conkey) AS key_column(attnum) ON true
         JOIN pg_attribute attribute
           ON attribute.attrelid = constraint_definition.conrelid
          AND attribute.attnum = key_column.attnum
        WHERE constraint_definition.conrelid = $1::regclass
          AND constraint_definition.contype = 'f'
          AND attribute.attname = 'client_id'
          AND constraint_definition.confdeltype = 'n'
     ) AS set_null`,
    [`public.${EVENT_TABLE}`],
  );
  const nonEmptyRegistryResult = await client.query(
    `SELECT count(*)::int AS row_count,
            count(DISTINCT edition_registry_key)::int AS distinct_count
       FROM public.events
      WHERE edition_registry_key <> ''`,
  );

  const registryKeys = collectRegistryKeys(gifts, "registry_key", { required: true });
  const sourceEventIds = collectNonEmptyStrings(sourceEventDependencies.events, "id");
  const sourceBusinessIds = collectNonEmptyStrings(
    sourceEventDependencies.events,
    "business_id",
  );
  const targetEventsByRegistryResult = await client.query(
    `SELECT id::text AS id,
            business_id,
            client_id::text AS client_id,
            edition_registry_key
       FROM public.events
      WHERE edition_registry_key = ANY($1::text[])
      ORDER BY edition_registry_key, id`,
    [registryKeys],
  );
  const targetEventsByIdResult = sourceEventIds.length
    ? await client.query(
        `SELECT id::text AS id,
                business_id,
                client_id::text AS client_id,
                edition_registry_key
           FROM public.events
          WHERE id = ANY($1::uuid[])
          ORDER BY id`,
        [sourceEventIds],
      )
    : { rows: [] };
  const targetBusinessesResult = sourceBusinessIds.length
    ? await client.query(
        "SELECT id FROM public.businesses WHERE id = ANY($1::text[]) ORDER BY id",
        [sourceBusinessIds],
      )
    : { rows: [] };
  const nonEmptyRegistry = nonEmptyRegistryResult.rows[0] ?? {
    row_count: 0,
    distinct_count: 0,
  };
  const targetSchema = {
    missingMinimalEventColumns,
    clientIdNullable: columnsByName.get("client_id")?.is_nullable === "YES",
    clientIdForeignKeySetNull: Boolean(clientForeignKeyResult.rows[0]?.set_null),
    eventIdUnique: uniqueIndexes.some(
      (index) => index.columns.length === 1 && index.columns[0] === "id",
    ),
    editionRegistryKeyUnique: uniqueIndexes.some((index) =>
      isSupportedRegistryKeyUniqueIndex(index.columns, index.predicate),
    ),
    nonEmptyRegistryKeyCount: nonEmptyRegistry.row_count ?? 0,
    nonEmptyRegistryKeyDuplicateCount:
      (nonEmptyRegistry.row_count ?? 0) - (nonEmptyRegistry.distinct_count ?? 0),
    eventTypeLabels: new Set(eventTypesResult.rows.map((row) => row.enumlabel)),
  };
  const summary = summarizeEventDependencies({
    gifts,
    sourceEvents: sourceEventDependencies.events,
    sourceBusinesses: sourceEventDependencies.businesses,
    sourceClients: sourceEventDependencies.clients,
    targetEventsByRegistry: targetEventsByRegistryResult.rows,
    targetEventsById: targetEventsByIdResult.rows,
    targetBusinesses: targetBusinessesResult.rows,
    targetSchema,
  });
  if (log) {
    console.info(
      "[gate-2c-event-dependencies]",
      JSON.stringify({
        ...summary,
        sourceMutated: false,
        targetMutated: false,
        storageBlobsCopied: false,
      }),
    );
  }
  return summary;
}

async function assertEventIndexNameAvailable(client) {
  const result = await client.query("SELECT to_regclass($1) IS NULL AS available", [
    `public.${EVENT_REGISTRY_UNIQUE_INDEX}`,
  ]);
  if (!result.rows[0]?.available) {
    throw new GateError("target_event_registry_index_name_unavailable");
  }
}

async function createEventRegistryUniqueIndex(client) {
  await client.query(
    `CREATE UNIQUE INDEX ${quoteIdentifier(EVENT_REGISTRY_UNIQUE_INDEX)}
       ON public.events (edition_registry_key)
      WHERE edition_registry_key <> ''`,
  );
}

async function fetchTargetEventTransferRows(client, sourceEvents) {
  const ids = collectNonEmptyStrings(sourceEvents, "id");
  if (!ids.length) return [];
  const result = await client.query(
    `SELECT id::text AS id,
            business_id,
            client_id::text AS client_id,
            name,
            type::text AS type,
            to_jsonb(date) #>> '{}' AS date,
            is_active,
            edition_registry_key
       FROM public.events
      WHERE id = ANY($1::uuid[])
      ORDER BY id`,
    [ids],
  );
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

async function inspectTargetState(
  client,
  table,
  rows,
  { allowTargetOnly = false, auditTargetOnlyDependencies = false } = {},
) {
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
  const sourceConflictKeys = new Set(rows.map((row) => conflictKey(row, conflictColumns)));
  const targetOnlyRows = allTargetRows.filter(
    (row) => !sourceConflictKeys.has(conflictKey(row, conflictColumns)),
  );
  const dependencyAudit =
    auditTargetOnlyDependencies && targetOnlyRows.length
      ? await auditTargetOnlyDependenciesForTable(
          client,
          table,
          conflictColumns,
          targetOnlyRows,
        )
      : null;
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
  if (!allowTargetOnly && reconciliation.targetOnlyCount) {
    throw new GateError(`target_extra_rows:${table}`);
  }

  return {
    columns: sourceColumns,
    primaryKey,
    idUnique,
    conflictColumns,
    existingCount: existingRows.length,
    totalCount,
    reconciliation,
    targetOnlyRows,
    dependencyAudit,
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

export function buildExactInsert(table, columns, rows) {
  if (!rows.length) return null;
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  return {
    sql: `INSERT INTO public.${quoteIdentifier(table)} (${columns
      .map(quoteIdentifier)
      .join(", ")}) VALUES ${tuples.join(", ")}`,
    values,
  };
}

export function buildBatchDelete(table, conflictColumns, rows) {
  if (!rows.length) return null;
  if (!conflictColumns.length) throw new GateError(`target_conflict_key_missing:${table}`);
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
    sql: `DELETE FROM public.${quoteIdentifier(table)} WHERE (${key}) IN (${tuples.join(
      ", ",
    )}) RETURNING ${key}`,
    values,
  };
}

export function buildInboundReferenceCount(schemaName, table, column, ids) {
  if (schemaName !== "public") throw new GateError("target_cleanup_inbound_fk_schema_unsupported");
  if (!Array.isArray(ids) || !ids.length) {
    throw new GateError("target_cleanup_inbound_fk_ids_missing");
  }
  return {
    sql: `SELECT count(*)::int AS count FROM public.${quoteIdentifier(table)} WHERE ${quoteIdentifier(
      column,
    )} = ANY($1::uuid[])`,
    values: [ids],
  };
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

async function insertExactRows(client, table, columns, rows) {
  const insert = buildExactInsert(table, columns, rows);
  if (!insert) return 0;
  const result = await client.query(insert.sql, insert.values);
  if (result.rowCount !== rows.length) {
    throw new GateError(`target_exact_insert_mismatch:${table}`);
  }
  return result.rowCount;
}

async function deleteRows(client, table, conflictColumns, rows) {
  const batch = buildBatchDelete(table, conflictColumns, rows);
  if (!batch) return 0;
  const result = await client.query(batch.sql, batch.values);
  if (result.rowCount !== rows.length) throw new GateError(`target_cleanup_delete_mismatch:${table}`);
  return result.rowCount;
}

function assertExpectedCount(label, actual, expected) {
  if (expected === null) throw new GateError(`${label}_expected_count_missing`);
  if (actual !== expected) throw new GateError(`${label}_count_mismatch`);
}

function assertExpectedChecksum(label, actual, expected) {
  if (expected === null) throw new GateError(`${label}_expected_checksum_missing`);
  if (actual !== expected) throw new GateError(`${label}_checksum_mismatch`);
}

export function assertExpectedGiftTargetBaseline(giftState, options) {
  assertExpectedCount("existing_gifts", giftState.existingCount, options.expectedExistingGifts);
  assertExpectedChecksum(
    "existing_gifts",
    giftState.targetChecksum,
    options.expectedExistingGiftsChecksum,
  );
}

function assertExpectedTargetOnlyPhotos(reconciliation, options) {
  assertExpectedCount(
    "target_only_photos",
    reconciliation.targetOnlyCount,
    options.expectedTargetOnlyPhotos,
  );
  assertExpectedChecksum(
    "target_only_photos",
    reconciliation.targetOnlyKeyChecksum,
    options.expectedTargetOnlyPhotosChecksum,
  );
}

export function foreignKeyDeleteAction(action) {
  const labels = {
    a: "no_action",
    r: "restrict",
    c: "cascade",
    n: "set_null",
    d: "set_default",
  };
  return labels[action] || "unknown";
}

export function summarizeCleanupDependencies(relations) {
  const canonicalRelations = relations.map(
    ({ table, columns, onDelete, dependentRowCount }) => ({
      id: `${table}:${columns.join(",")}:${onDelete}`,
      table,
      columns,
      onDelete,
      dependentRowCount,
    }),
  );
  const cascadeDependentRowCount = relations
    .filter(({ onDelete }) => onDelete === "cascade")
    .reduce((count, { dependentRowCount }) => count + dependentRowCount, 0);
  const blockingDependentRowCount = relations
    .filter(({ onDelete }) => onDelete !== "cascade")
    .reduce((count, { dependentRowCount }) => count + dependentRowCount, 0);

  return {
    cascadeDependentRowCount,
    blockingDependentRowCount,
    dependencyPlanChecksum: checksumRows(canonicalRelations),
  };
}

async function auditTargetOnlyDependenciesForTable(client, table, conflictColumns, targetOnlyRows) {
  if (conflictColumns.length !== 1 || conflictColumns[0] !== "id") {
    throw new GateError(`target_cleanup_conflict_key_unsupported:${table}`);
  }

  const inboundForeignKeysResult = await client.query(
    `SELECT namespace.nspname AS schema_name,
            relation.relname AS table_name,
            fk.confdeltype AS delete_action,
            array_agg(referencing_column.attname ORDER BY key_position.ordinality) AS referencing_columns,
            array_agg(referenced_column.attname ORDER BY key_position.ordinality) AS referenced_columns
       FROM pg_constraint fk
       JOIN pg_class relation ON relation.oid=fk.conrelid
       JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
       JOIN LATERAL unnest(fk.conkey, fk.confkey) WITH ORDINALITY
            AS key_position(referencing_attnum, referenced_attnum, ordinality) ON true
       JOIN pg_attribute referencing_column
         ON referencing_column.attrelid=fk.conrelid
        AND referencing_column.attnum=key_position.referencing_attnum
       JOIN pg_attribute referenced_column
         ON referenced_column.attrelid=fk.confrelid
        AND referenced_column.attnum=key_position.referenced_attnum
      WHERE fk.contype='f' AND fk.confrelid=$1::regclass
      GROUP BY fk.oid, fk.confdeltype, namespace.nspname, relation.relname
      ORDER BY namespace.nspname, relation.relname, fk.oid`,
    [`public.${table}`],
  );
  const targetIds = targetOnlyRows.map((row) => row.id);
  let dependentRowCount = 0;
  const relations = [];
  for (const row of inboundForeignKeysResult.rows) {
    const referencingColumns = normalizeTargetColumnList(row.referencing_columns);
    const referencedColumns = normalizeTargetColumnList(row.referenced_columns);
    if (
      referencingColumns.length !== 1 ||
      referencedColumns.length !== 1 ||
      referencedColumns[0] !== "id"
    ) {
      throw new GateError(`target_cleanup_inbound_fk_unsupported:${table}`);
    }
    const query = buildInboundReferenceCount(
      row.schema_name,
      row.table_name,
      referencingColumns[0],
      targetIds,
    );
    const result = await client.query(query.sql, query.values);
    const relationDependentRowCount = result.rows[0]?.count ?? 0;
    dependentRowCount += relationDependentRowCount;
    relations.push({
      table: `${row.schema_name}.${row.table_name}`,
      columns: referencingColumns,
      onDelete: foreignKeyDeleteAction(row.delete_action),
      dependentRowCount: relationDependentRowCount,
    });
  }

  const triggersResult = await client.query(
    `SELECT count(*)::int AS count
       FROM pg_trigger
      WHERE tgrelid=$1::regclass
        AND NOT tgisinternal
        AND tgenabled <> 'D'`,
    [`public.${table}`],
  );
  const cleanupDependencies = summarizeCleanupDependencies(relations);
  const audit = {
    table,
    targetOnlyCount: targetOnlyRows.length,
    inboundForeignKeyCount: inboundForeignKeysResult.rows.length,
    dependentRowCount,
    activeTriggerCount: triggersResult.rows[0]?.count ?? 0,
    relations,
    dependencyPlanChecksum: cleanupDependencies.dependencyPlanChecksum,
    sourceMutated: false,
    targetMutated: false,
  };
  console.info("[gate-2c-cleanup-dependency-audit]", JSON.stringify(audit));
  return audit;
}

async function assertCleanupDeleteSafety(client, table, conflictColumns, targetOnlyRows, options) {
  const privilegesResult = await client.query(
    "SELECT has_table_privilege(current_user, $1, 'DELETE') AS can_delete",
    [`public.${table}`],
  );
  if (!privilegesResult.rows[0]?.can_delete) {
    throw new GateError(`target_delete_privilege_missing:${table}`);
  }

  const dependencyAudit = await auditTargetOnlyDependenciesForTable(
    client,
    table,
    conflictColumns,
    targetOnlyRows,
  );
  if (dependencyAudit.activeTriggerCount !== 0) {
    throw new GateError(`target_cleanup_triggers_present:${table}`);
  }
  const cleanupDependencies = summarizeCleanupDependencies(dependencyAudit.relations);
  if (cleanupDependencies.blockingDependentRowCount !== 0) {
    throw new GateError(`target_cleanup_non_cascade_references_present:${table}`);
  }
  assertExpectedCount(
    "cascade_dependent_rows",
    cleanupDependencies.cascadeDependentRowCount,
    options.expectedCascadeDependentRows,
  );
  assertExpectedChecksum(
    "cascade_dependency_plan",
    cleanupDependencies.dependencyPlanChecksum,
    options.expectedCascadeDependencyPlanChecksum,
  );
  return cleanupDependencies;
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
  const requiresPhotoData = modeRequiresPhotoData(options.mode);
  const requiresGiftBindingData = modeRequiresGiftBindingData(options.mode);
  const requiresEventDependencyData = modeRequiresEventDependencyData(options.mode);
  const photoAudit = requiresPhotoData
    ? await Promise.all(PHOTO_TABLE_CANDIDATES.map((table) => inspectSourceTable(supabase, table)))
    : null;

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

  const gifts = await fetchAllSourceRows(supabase, GIFT_TABLE);
  const giftRegistryKeys = collectRegistryKeys(gifts, "registry_key", { required: true });
  const sourceEvents = requiresGiftBindingData
    ? await fetchSourceRowsByValues(
        supabase,
        EVENT_TABLE,
        "edition_registry_key",
        giftRegistryKeys,
        requiresEventDependencyData ? EVENT_AUDIT_COLUMNS.join(",") : "edition_registry_key",
      )
    : null;
  const sourceBusinessIds = requiresEventDependencyData
    ? collectNonEmptyStrings(sourceEvents ?? [], "business_id")
    : [];
  const sourceClientIds = requiresEventDependencyData
    ? collectNonEmptyStrings(sourceEvents ?? [], "client_id")
    : [];
  const eventDependencies = requiresEventDependencyData
    ? {
        events: sourceEvents ?? [],
        businesses: await fetchSourceRowsByValues(
          supabase,
          BUSINESS_TABLE,
          "id",
          sourceBusinessIds,
          "id",
        ),
        clients: await fetchSourceRowsByValues(
          supabase,
          CLIENT_TABLE,
          "id",
          sourceClientIds,
          "id",
        ),
      }
    : null;
  if (!requiresPhotoData) {
    return {
      source,
      gifts,
      sourceEvents,
      eventDependencies,
      photoTable: null,
      photos: null,
    };
  }

  const photoTable = selectPhotoTable(photoAudit, options.photoTable);
  const photos = await fetchAllSourceRows(supabase, photoTable);

  return { source, sourceEvents, eventDependencies, photoTable, gifts, photos };
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
  const requiresPhotoData = modeRequiresPhotoData(options.mode);
  const requiresGiftBindingData = modeRequiresGiftBindingData(options.mode);
  const requiresEventDependencyData = modeRequiresEventDependencyData(options.mode);

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
  const giftChecksum = checksumRows(sourceData.gifts);
  assertExpectedChecksum("gifts", giftChecksum, options.expectedGiftsChecksum);
  if (requiresPhotoData) {
    assertExpectedCount("photos", sourceData.photos.length, options.expectedPhotos);
    assertExpectedChecksum("photos", checksumRows(sourceData.photos), options.expectedPhotosChecksum);
  }
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
    if (options.mode === "apply-gifts") {
      assertExpectedGiftTargetBaseline(giftState, options);
    }
    const giftBindingState = requiresGiftBindingData
      ? await inspectGiftEventBindings(client, sourceData.gifts, sourceData.sourceEvents ?? [])
      : null;
    const eventDependencyState = requiresEventDependencyData
      ? await inspectEventDependencyState(
          client,
          sourceData.gifts,
          sourceData.eventDependencies ?? { events: [], businesses: [], clients: [] },
        )
      : null;
    const isEventApply = options.mode === "apply-events";
    const isPhotoCleanup = options.mode === "cleanup-preview-photos";
    const photoState = requiresPhotoData
      ? await inspectTargetState(client, sourceData.photoTable, sourceData.photos, {
          allowTargetOnly: isPhotoCleanup,
          auditTargetOnlyDependencies: !isPhotoCleanup,
        })
      : null;

    if (isPhotoCleanup) {
      assertExpectedTargetOnlyPhotos(photoState.reconciliation, options);
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query("SET LOCAL statement_timeout = '30s'");
        await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
        await client.query("SELECT pg_advisory_xact_lock(hashtext('haxr:gate-2c:gifts-photos'))");

        await inspectTargetState(client, GIFT_TABLE, sourceData.gifts);
        const lockedPhotoState = await inspectTargetState(
          client,
          sourceData.photoTable,
          sourceData.photos,
          { allowTargetOnly: true },
        );
        assertExpectedTargetOnlyPhotos(lockedPhotoState.reconciliation, options);
        const cleanupDependencies = await assertCleanupDeleteSafety(
          client,
          sourceData.photoTable,
          lockedPhotoState.conflictColumns,
          lockedPhotoState.targetOnlyRows,
          options,
        );
        const deletedMetadataRows = await deleteRows(
          client,
          sourceData.photoTable,
          lockedPhotoState.conflictColumns,
          lockedPhotoState.targetOnlyRows,
        );
        const verifiedPhotoState = await inspectTargetState(
          client,
          sourceData.photoTable,
          sourceData.photos,
        );
        if (verifiedPhotoState.reconciliation.targetOnlyCount !== 0) {
          throw new GateError("target_cleanup_verification_failed");
        }

        await client.query("COMMIT");
        console.info(
          "[gate-2c-cleanup]",
          JSON.stringify({
            status: "committed_and_verified",
            sourceRef: sourceData.source.projectRef,
            target: "neon-vercel-preview",
            table: sourceData.photoTable,
            deletedMetadataRows,
            cascadeDeletedDependentRows: cleanupDependencies.cascadeDependentRowCount,
            cascadeDependencyPlanChecksum: cleanupDependencies.dependencyPlanChecksum,
            targetOnlyKeyChecksum: options.expectedTargetOnlyPhotosChecksum,
            storageBlobsDeleted: false,
            sourceMutated: false,
          }),
        );
        return;
      } catch (cause) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw cause;
      }
    }

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
        giftEventBindings: giftBindingState,
        eventDependencies: eventDependencyState,
        photos: photoState
          ? {
              table: sourceData.photoTable,
              sourceCount: sourceData.photos.length,
              existingTargetCount: photoState.existingCount,
              targetPrimaryKey: photoState.primaryKey,
              targetIdUnique: photoState.idUnique,
              targetConflictKey: photoState.conflictColumns,
              sourceChecksum: photoState.sourceChecksum,
              existingTargetChecksum: photoState.targetChecksum,
            }
          : { migrationDeferred: true },
        storageBlobsCopied: false,
        writeAuthorized: options.mode === "apply-gifts" || isEventApply,
      }),
    );

    if (isEventApply) {
      if (!sourceData.eventDependencies || !eventDependencyState) {
        throw new GateError("event_dependency_data_missing");
      }
      assertExpectedEventMigrationBaseline(eventDependencyState, options);
      const sourceEventRows = prepareEventRowsForTarget(
        sourceData.eventDependencies.events,
      );
      const sourceEventChecksum = checksumRows(sourceEventRows);
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      try {
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query("SET LOCAL statement_timeout = '30s'");
        await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtext('haxr:gate-2c:edition-events'))",
        );

        const lockedEventState = await inspectEventDependencyState(
          client,
          sourceData.gifts,
          sourceData.eventDependencies,
          { log: false },
        );
        assertExpectedEventMigrationBaseline(lockedEventState, options);
        await assertEventIndexNameAvailable(client);
        await createEventRegistryUniqueIndex(client);
        const insertedEventCount = await insertExactRows(
          client,
          EVENT_TABLE,
          EVENT_INSERT_COLUMNS,
          sourceEventRows,
        );
        const verifiedEventRows = await fetchTargetEventTransferRows(client, sourceEventRows);
        const verifiedEventChecksum = checksumRows(verifiedEventRows);
        if (
          verifiedEventRows.length !== options.expectedEvents ||
          verifiedEventChecksum !== sourceEventChecksum
        ) {
          throw new GateError("event_verification_failed");
        }
        const verifiedDependencyState = await inspectEventDependencyState(
          client,
          sourceData.gifts,
          sourceData.eventDependencies,
          { log: false },
        );
        const verifiedGiftBindingState = await inspectGiftEventBindings(
          client,
          sourceData.gifts,
          sourceData.sourceEvents ?? [],
          { log: false },
        );
        if (
          !verifiedDependencyState.target.editionRegistryKeyUnique ||
          !verifiedDependencyState.readyForSafeEventMigration ||
          !verifiedDependencyState.readyForGiftBindings ||
          !verifiedGiftBindingState.ready
        ) {
          throw new GateError("event_post_write_preflight_failed");
        }
        if (
          verifiedDependencyState.target.nonEmptyRegistryKeyCount !==
          options.expectedNonEmptyRegistryKeys + options.expectedEvents
        ) {
          throw new GateError("non_empty_registry_keys_post_write_count_mismatch");
        }

        await client.query("COMMIT");
        console.info(
          "[gate-2c-apply-events]",
          JSON.stringify({
            status: "committed_and_verified",
            sourceRef: sourceData.source.projectRef,
            target: "neon-vercel-preview",
            insertedEventCount,
            eventChecksum: verifiedEventChecksum,
            registryKeyCount: verifiedDependencyState.registryKeyCount,
            registryKeyChecksum: verifiedDependencyState.registryKeyChecksum,
            businessReferenceCount:
              verifiedDependencyState.source.businessReferenceCount,
            clientReferencesCopied: false,
            targetClientIdNullCount: verifiedEventRows.filter(
              (row) => row.client_id === null,
            ).length,
            partialUniqueIndexCreatedAndVerified: true,
            giftBindingCount: verifiedGiftBindingState.targetEventBindingCount,
            giftBindingsReady: verifiedGiftBindingState.ready,
            giftsUnchanged: true,
            photos: { migrationDeferred: true },
            storageBlobsCopied: false,
            sourceMutated: false,
          }),
        );
        return;
      } catch (cause) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw cause;
      }
    }

    if (options.mode === "preflight-gift-bindings") {
      if (giftBindingState.missingSourceEventBindingCount) {
        throw new GateError("gift_registry_source_event_missing");
      }
      if (giftBindingState.missingTargetEventBindingCount) {
        throw new GateError("gift_registry_target_event_missing");
      }
      return;
    }

    if (options.mode === "audit-event-dependencies") return;

    if (options.mode === "preflight-gifts") return;

    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '30s'");
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('haxr:gate-2c:gifts-photos'))");

      const lockedGiftState = await inspectTargetState(client, GIFT_TABLE, sourceData.gifts);
      assertExpectedGiftTargetBaseline(lockedGiftState, options);

      await insertRows(
        client,
        GIFT_TABLE,
        lockedGiftState.columns,
        sourceData.gifts,
        lockedGiftState.conflictColumns,
      );
      const verifiedGifts = await fetchTargetRows(
        client,
        GIFT_TABLE,
        lockedGiftState.columns,
        lockedGiftState.conflictColumns,
        sourceData.gifts,
      );
      const finalGiftCount = await countTargetRows(client, GIFT_TABLE);

      if (
        finalGiftCount !== sourceData.gifts.length ||
        verifiedGifts.length !== sourceData.gifts.length ||
        checksumRows(verifiedGifts) !== lockedGiftState.sourceChecksum
      ) {
        throw new GateError("gift_verification_failed");
      }
      await client.query("COMMIT");
      console.info(
        "[gate-2c-apply-gifts]",
        JSON.stringify({
          status: "committed_and_verified",
          sourceRef: sourceData.source.projectRef,
          target: "neon-vercel-preview",
          gifts: {
            baseline: {
              count: lockedGiftState.existingCount,
              checksum: lockedGiftState.targetChecksum,
            },
            count: finalGiftCount,
            checksum: lockedGiftState.sourceChecksum,
          },
          photos: { migrationDeferred: true },
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
