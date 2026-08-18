import fs from "node:fs";
import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const url = process.env.PR4_DATABASE_URL || "";
if (!url.includes(CLONE) || url.includes(PROD)) throw new Error("ABORT identity");

const sqlPath = new URL(
  "./sql/clone_grant_service_role_guest_embeds_select.sql",
  import.meta.url
);
const sql = fs.readFileSync(sqlPath, "utf8");
const stripped = sql.replace(/--.*$/gm, "");
if (/INSERT|UPDATE|DELETE|ALL TABLES|DEFAULT PRIVILEGES|GRANT\s+ALL/i.test(stripped)) {
  throw new Error("ABORT unsafe SQL");
}

const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  await c.query(sql);
  console.log("APPLY_EMBEDS_STATUS=COMMITTED");
} finally {
  await c.end();
}
