/**
 * PR.3 — aplica UMA migration 036–043 em PRODUÇÃO (janela autorizada).
 * Requer PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { migrationPath } from "../pr4/lib/pr4-db.mjs";
import { withProductionClient } from "./lib/pr3-production-db.mjs";
import { PRODUCTION_REF } from "./lib/pr3-guards.mjs";

const version = process.argv[2]?.trim();
if (!version || !/^0(36|37|38|39|40|41|42|43)$/.test(version)) {
  console.error("Uso: node scripts/pr3/apply-migration-production.mjs <036|…|043>");
  process.exit(1);
}

const relativePath = migrationPath(version);
const sql = readFileSync(resolve(process.cwd(), relativePath), "utf8");
const started = Date.now();

try {
  await withProductionClient(
    async (client) => {
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    },
    { requireApplyAuth: true },
  );

  console.log(
    JSON.stringify(
      {
        pass: true,
        productionRef: PRODUCTION_REF,
        version,
        file: relativePath,
        ms: Date.now() - started,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        pass: false,
        productionRef: PRODUCTION_REF,
        version,
        file: relativePath,
        ms: Date.now() - started,
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
