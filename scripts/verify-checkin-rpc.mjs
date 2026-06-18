/**
 * Verifica se perform_event_checkin está corrigido (migration 020).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const get = (key) => {
  const line = env.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).replace(/^["']|["']$/g, "");
};

const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: fn, error: fnErr } = await sb.rpc("perform_event_checkin", {
  p_event_id: "00000000-0000-0000-0000-000000000000",
  p_token: "invalid-token-for-schema-test-only",
});

if (fnErr?.message?.includes("json || json")) {
  console.log("FAIL: migration 020 NÃO aplicada — perform_event_checkin ainda usa json || json");
  process.exit(1);
}

if (fnErr && !fnErr.message.includes("not_found") && !fnErr.message.includes("invalid_token")) {
  console.log(`RPC erro inesperado: ${fnErr.message}`);
  process.exit(1);
}

console.log("OK: perform_event_checkin responde sem erro json || json");

const { data: sim } = await sb
  .from("events")
  .select("id")
  .ilike("name", "[SIM-300]%")
  .limit(1)
  .maybeSingle();

if (!sim) {
  console.log("(sem evento SIM-300 para teste real)");
  process.exit(0);
}

const { data: guest } = await sb
  .from("guests")
  .select("qr_token, status")
  .eq("event_id", sim.id)
  .eq("status", "confirmed")
  .limit(1)
  .maybeSingle();

if (!guest) {
  console.log("(sem convidado confirmed para teste real)");
  process.exit(0);
}

const { data: result, error: checkErr } = await sb.rpc("perform_event_checkin", {
  p_event_id: sim.id,
  p_token: guest.qr_token,
});

if (checkErr) {
  console.log(`FAIL check-in real: ${checkErr.message}`);
  process.exit(1);
}

console.log("OK: check-in real", result?.checkedIn || result?.alreadyCheckedIn ? "sucesso" : JSON.stringify(result));
