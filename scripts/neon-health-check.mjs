#!/usr/bin/env node
/**
 * Read-only Neon schema readiness audit for the migration Preview.
 *
 * This is not a Production-readiness certificate. It verifies connectivity,
 * critical tables and row counts without changing the database.
 */

import pg from "pg";
import {
  assertPreviewNeonTarget,
  loadExplicitEnvFile,
} from "./gate-2c-gifts-photos-migration.mjs";

const REQUIRED_TABLES = Object.freeze([
  "profiles",
  "client_events",
  "client_event_members",
  "guests",
  "guest_groups",
  "guest_party_members",
  "guest_import_batches",
  "documents",
  "document_items",
  "supplier_profiles",
  "supplier_applications",
  "supplier_favorites",
  "concierge_requests",
  "payments",
  "expenses",
  "monthly_targets",
  "marketing_contacts",
  "contact_inquiries",
  "edition_gift_reservations",
  "wedding_photos",
]);

function parseEnvFileArg(argv) {
  const argument = argv.find((value) => value.startsWith("--env-file="));
  return argument ? argument.slice("--env-file=".length) : null;
}

async function main() {
  loadExplicitEnvFile(parseEnvFileArg(process.argv.slice(2)));
  const target = assertPreviewNeonTarget(process.env, null, "preflight");
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
    const metadata = await client.query(
      `SELECT current_database() AS database,
              current_setting('server_version_num')::int AS server_version_num,
              pg_is_in_recovery() AS is_replica`,
    );
    if (metadata.rows[0]?.is_replica) throw new Error("target_is_read_replica");

    const tableResult = await client.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE'`,
    );
    const existing = new Set(tableResult.rows.map((row) => row.table_name));
    const missing = REQUIRED_TABLES.filter((table) => !existing.has(table));
    const counts = {};

    for (const table of REQUIRED_TABLES) {
      if (!existing.has(table)) continue;
      const result = await client.query(`SELECT count(*)::int AS count FROM public."${table}"`);
      counts[table] = result.rows[0]?.count ?? 0;
    }

    console.info(
      "[neon-schema-readiness]",
      JSON.stringify({
        provider: "neon",
        runtime: "vercel-preview",
        connectionMode: target.connectionMode,
        database: metadata.rows[0]?.database,
        serverVersion: metadata.rows[0]?.server_version_num,
        requiredTableCount: REQUIRED_TABLES.length,
        missingTables: missing,
        rowCounts: counts,
        schemaReady: missing.length === 0,
        productionReadyClaimed: false,
      }),
    );

    if (missing.length) throw new Error("required_tables_missing");
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch((cause) => {
  console.error(
    "[neon-schema-readiness] blocked",
    cause instanceof Error ? cause.message : "unknown_error",
  );
  process.exit(1);
});
