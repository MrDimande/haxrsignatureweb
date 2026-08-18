/**
 * Apply minimal service_role RSVP grants on clone ONLY.
 * Requires PR4_DATABASE_URL + PGPASSWORD.
 * Does not print secrets.
 */
import fs from "node:fs";
import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const sqlPath = new URL(
  "./sql/clone_grant_service_role_rsvp_minimal.sql",
  import.meta.url
);

const url = process.env.PR4_DATABASE_URL || "";
if (!url.includes(CLONE) || url.includes(PROD)) {
  throw new Error("ABORT identity");
}

const sql = fs.readFileSync(sqlPath, "utf8");
const stripped = sql.replace(/--.*$/gm, "");
if (
  /GRANT\s+ALL/i.test(stripped) ||
  /ALL\s+TABLES/i.test(stripped) ||
  /DEFAULT\s+PRIVILEGES/i.test(stripped)
) {
  throw new Error("ABORT unsafe SQL keywords");
}
if (/GRANT[\s\S]*\bDELETE\b/i.test(stripped)) {
  throw new Error("ABORT DELETE grant present");
}
if (
  /ON\s+TABLE\s+public\.events/i.test(stripped) ||
  /ON\s+public\.events/i.test(stripped)
) {
  throw new Error("ABORT events grant present but not code-proven");
}

const client = new pg.Client(buildPgClientConfig());
await client.connect();
try {
  await client.query(sql);
  console.log("APPLY_STATUS=COMMITTED");
} finally {
  await client.end();
}
