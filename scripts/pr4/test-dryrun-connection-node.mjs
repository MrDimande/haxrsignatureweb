/**
 * PR.4.1 - preflight Node (pg) com URL derivada + uselibpqcompat=true.
 */
import pg from "pg";
import { buildPgClientConfig } from "./lib/pr4-db.mjs";
import { validateDryRunDest } from "./validate-dryrun-dest.mjs";

const dest = validateDryRunDest();
if (dest.abort) {
  console.log(JSON.stringify({ pass: false, client: "node", phase: "validate", ...dest }, null, 2));
  process.exit(2);
}

const client = new pg.Client(buildPgClientConfig());

const report = {
  pass: false,
  client: "node",
  currentUser: null,
  sessionUser: null,
  database: null,
  connectionUserOk: dest.connectionUserOk,
  note: "URL Node derivada com uselibpqcompat; current_user pode ser postgres no pooler.",
  error: null,
};

try {
  await client.connect();
  const row = (
    await client.query(
      "SELECT current_user, session_user, current_database() AS database",
    )
  ).rows[0];
  report.currentUser = row.current_user;
  report.sessionUser = row.session_user;
  report.database = row.database;
  report.pass = true;
} catch (error) {
  report.error = error.message;
  if (/password authentication failed/i.test(report.error)) {
    report.hint =
      "Verificar PGPASSWORD (fora da URL) e user libpq postgres.rkkxfrwtmsqzpnbkshnd";
  }
} finally {
  await client.end().catch(() => undefined);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
