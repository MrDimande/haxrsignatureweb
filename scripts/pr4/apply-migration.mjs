/**
 * PR.4 — aplica UMA migration SQL no clone de ensaio (036–043).
 * Uso: node scripts/pr4/apply-migration.mjs 036
 */
import { migrationPath, readMigration, timed, withClient } from "./lib/pr4-db.mjs";

const version = process.argv[2]?.trim();
if (!version || !/^0(36|37|38|39|40|41|42|43)$/.test(version)) {
  console.error("Uso: node scripts/pr4/apply-migration.mjs <036|037|038|039|040|041|042|043>");
  process.exit(1);
}

const relativePath = migrationPath(version);
const sql = readMigration(relativePath);

const outcome = await timed(`migration_${version}`, async () =>
  withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
      return { ok: true, file: relativePath };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }),
);

console.log(JSON.stringify(outcome, null, 2));
process.exit(outcome.result?.ok ? 0 : 1);
