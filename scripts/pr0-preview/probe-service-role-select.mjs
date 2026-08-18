/**
 * Read-only SELECT as service_role (SET LOCAL ROLE). No writes.
 */
import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const url = process.env.PR4_DATABASE_URL || "";
if (!url.includes(CLONE) || url.includes(PROD)) {
  throw new Error("ABORT identity");
}

const client = new pg.Client(buildPgClientConfig());
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SET LOCAL ROLE service_role");
  const r = await client.query("select id from public.guests limit 1");
  console.log(
    JSON.stringify({
      probe: "SELECT guests LIMIT 1 AS service_role",
      rowCount: r.rowCount,
      ok: true,
    })
  );
  await client.query("ROLLBACK");
} finally {
  await client.end();
}
