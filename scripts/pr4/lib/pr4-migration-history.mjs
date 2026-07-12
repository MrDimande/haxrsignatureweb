/**
 * PR.4.1 — histórico de migrations Supabase (opcional em dump public-only).
 */
import { queryOne } from "./pr4-db.mjs";

const CLIENT_MIGRATION_COUNT_SQL = `
SELECT COUNT(*)::int AS count
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%client_app%'
   OR name LIKE '%client_event%'
   OR version IN ('036', '037', '038', '039', '040', '041', '042', '043')
`;

const MIGRATION_RELATION_SQL = `
SELECT to_regclass('supabase_migrations.schema_migrations')::text AS relation
`;

export async function resolveClientMigrationHistory(client) {
  const migrationRelation = await queryOne(client, MIGRATION_RELATION_SQL);
  const migrationHistoryAvailable = Boolean(migrationRelation?.relation);

  let clientMigrationsCount = 0;
  if (migrationHistoryAvailable) {
    const counted = await queryOne(client, CLIENT_MIGRATION_COUNT_SQL);
    clientMigrationsCount = counted?.count ?? 0;
  }

  const migrationHistoryNote = migrationHistoryAvailable
    ? "Migration history table available."
    : "Migration history unavailable because dump is public-schema-only.";

  return {
    migrationHistoryAvailable,
    clientMigrationsCount,
    migrationHistoryNote,
  };
}
