/**
 * PR.4 — testa origem (produção) em modo read-only. Nunca SQL mutável.
 */
import pg from "pg";
import "./load-env.mjs";
import { validatePr4Env } from "./validate-env.mjs";

const validation = validatePr4Env();
if (validation.abort) {
  console.error(JSON.stringify({ pass: false, phase: "validate", validation }, null, 2));
  process.exit(2);
}

const sourceUrl = process.env.PR4_SOURCE_DATABASE_URL.trim();
process.env.PGOPTIONS = "-c default_transaction_read_only=on";

const client = new pg.Client({
  connectionString: sourceUrl,
  ssl: { rejectUnauthorized: false },
});

const report = { pass: false, readOnly: null, mutateBlocked: null, error: null };

try {
  await client.connect();

  const ro = await client.query(
    "SELECT current_setting('transaction_read_only') AS read_only",
  );
  report.readOnly = ro.rows[0]?.read_only === "on";

  try {
    await client.query("CREATE TEMP TABLE pr4_readonly_probe (id int)");
    report.mutateBlocked = false;
  } catch (error) {
    report.mutateBlocked =
      error.code === "25006" ||
      /read.?only|cannot execute/i.test(String(error.message));
  }

  report.pass = report.readOnly === true && report.mutateBlocked === true;
} catch (error) {
  report.error = error.message;
} finally {
  await client.end().catch(() => undefined);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
