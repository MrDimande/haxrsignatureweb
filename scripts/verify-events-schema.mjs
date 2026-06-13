import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (key) => {
  const line = env.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).replace(/^["']|["']$/g, "");
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.log("FAIL: variáveis Supabase em falta no .env.local");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = [];

const { data: events, error: e1 } = await sb
  .from("events")
  .select(
    "id, name, google_sheet_url, google_sheet_gid, sheets_last_synced_at, sheets_sync_summary"
  )
  .limit(5);

if (e1) {
  checks.push(["events + colunas Sheets", `FAIL: ${e1.message}`]);
} else {
  checks.push([
    "events + colunas Sheets",
    `OK — ${events?.length ?? 0} evento(s)`,
  ]);
  if (events?.length) {
    for (const ev of events) {
      console.log(`  · ${ev.name} (sheet: ${ev.google_sheet_url ? "ligada" : "não ligada"})`);
    }
  }
}

for (const [table, label] of [
  ["guests", "guests"],
  ["seats", "seats"],
  ["checkins", "checkins"],
] ) {
  const { error } = await sb.from(table).select("id").limit(1);
  checks.push([label, error ? `FAIL: ${error.message}` : "OK"]);
}

const { error: rpcErr } = await sb.rpc("lookup_event_checkin", {
  p_event_id: "00000000-0000-0000-0000-000000000000",
  p_token: "invalid-token-for-test",
} );

checks.push([
  "RPC lookup_event_checkin",
  rpcErr ? `FAIL: ${rpcErr.message}` : "OK",
]);

console.log("\n--- Verificação Supabase ---");
for (const [name, result] of checks) {
  console.log(`${name}: ${result}`);
}

const failed = checks.some(([, r]) => r.startsWith("FAIL"));
process.exit(failed ? 1 : 0);
