/**
 * Post-migration validation — Phase 2 RSVP sheet sync ledger.
 * Uso: node --import tsx scripts/post-migration-phase2-rsvp-sync.mjs [--cleanup]
 *
 * - Não envia emails
 * - Não toca folhas Google externas
 * - Usa evento etiquetado [PHASE2-QA] apenas
 * - --cleanup remove só dados [PHASE2-QA]
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const TAG = "[PHASE2-QA]";
const EVENT_NAME = `${TAG} Ledger smoke`;
const CLEANUP = process.argv.includes("--cleanup");

const TEST_CSV = `Nome,Email,Telefone
${TAG} Alice QA,phase2-alice-${Date.now()}@haxr-qa.invalid,+351912000001
${TAG} Bruno QA,phase2-bruno-${Date.now()}@haxr-qa.invalid,+351912000002
`;

function loadEnv() {
  if (!existsSync(ENV_FILE)) throw new Error(".env.local não encontrado");
  const values = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    let v = trimmed.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    values[trimmed.slice(0, i).trim()] = v;
  }
  return values;
}

function qrToken() {
  return randomBytes(24).toString("base64url");
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

async function cleanupQaEvents(sb) {
  const { data: events } = await sb
    .from("events")
    .select("id, name")
    .ilike("name", `${TAG}%`);

  for (const ev of events ?? []) {
    await sb.from("events").delete().eq("id", ev.id);
    console.log(`  cleanup evento: ${ev.name}`);
  }
}

async function main() {
  const env = loadEnv();
  for (const [key, value] of Object.entries(env)) {
    if (value && !process.env[key]) process.env[key] = value;
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL/service key em falta");

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (CLEANUP) {
    await cleanupQaEvents(sb);
    console.log("Cleanup concluído.");
    return;
  }

  console.log("\n=== Post-migration validation — Phase 2 RSVP sync ledger ===\n");

  // 1–2. Tables accessible
  const { error: importErr } = await sb
    .from("event_sheet_import_rows")
    .select("id")
    .limit(1);
  record(
    "table-event_sheet_import_rows",
    !importErr,
    importErr?.message ?? "acessível"
  );

  const { error: ledgerErr } = await sb
    .from("event_sheet_sync_ledger")
    .select("id")
    .limit(1);
  record(
    "table-event_sheet_sync_ledger",
    !ledgerErr,
    ledgerErr?.message ?? "acessível"
  );

  if (importErr || ledgerErr) {
    console.error("\nTabelas inacessíveis — aplicar migração 030 e NOTIFY pgrst.");
    process.exitCode = 1;
    return;
  }

  const { count: globalImportBefore } = await sb
    .from("event_sheet_import_rows")
    .select("*", { count: "exact", head: true });
  const { count: globalLedgerBefore } = await sb
    .from("event_sheet_sync_ledger")
    .select("*", { count: "exact", head: true });

  await cleanupQaEvents(sb);

  const { data: event, error: eventErr } = await sb
    .from("events")
    .insert({
      business_id: "haxr-signature",
      name: EVENT_NAME,
      type: "other",
      location: "QA",
      notes: TAG,
      google_sheet_url: "",
      google_sheet_gid: "",
      sheets_sync_mode: "master",
      find_seat_code: `P2${Date.now().toString(36).slice(-6).toUpperCase()}`,
    })
    .select("id")
    .single();

  if (eventErr || !event) {
    record("create-qa-event", false, eventErr?.message ?? "sem id");
    process.exitCode = 1;
    return;
  }
  const eventId = event.id;
  record("create-qa-event", true, eventId);

  const { importGuestsFromCsv } = await import(
    "../src/lib/events/services/import-csv.service.ts"
  );

  let first;
  try {
    first = await importGuestsFromCsv(eventId, TEST_CSV, "phase2-qa.csv");
    record(
      "csv-import-first",
      true,
      `created=${first.created} updated=${first.updated} skipped=${first.skipped} importRowsSeen=${first.importRowsSeen ?? "n/a"}`
    );
  } catch (err) {
    record(
      "csv-import-first",
      false,
      err instanceof Error ? err.message : String(err)
    );
    process.exitCode = 1;
    return;
  }

  const { count: guestsAfterFirst } = await sb
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  record(
    "csv-first-guest-count",
    (guestsAfterFirst ?? 0) === 2,
    `esperado 2, obtido ${guestsAfterFirst ?? 0}`
  );

  let second;
  try {
    second = await importGuestsFromCsv(eventId, TEST_CSV, "phase2-qa.csv");
    record(
      "csv-import-second",
      true,
      `created=${second.created} updated=${second.updated} skipped=${second.skipped} ledgerMatched=${second.ledgerMatched ?? "n/a"}`
    );
  } catch (err) {
    record(
      "csv-import-second",
      false,
      err instanceof Error ? err.message : String(err)
    );
    process.exitCode = 1;
    return;
  }

  const { count: guestsAfterSecond } = await sb
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const noDupes =
    second.created === 0 && (guestsAfterSecond ?? 0) === (guestsAfterFirst ?? 0);
  record(
    "csv-duplicate-prevention",
    noDupes,
    `created 2ª=${second.created} guests=${guestsAfterSecond} (antes ${guestsAfterFirst})`
  );

  const { count: importRowsForEvent } = await sb
    .from("event_sheet_import_rows")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("source", "csv_upload");

  const { count: ledgerRowsForEvent } = await sb
    .from("event_sheet_sync_ledger")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("source", "csv_upload");

  record(
    "import-rows-written",
    (importRowsForEvent ?? 0) >= 2,
    `${importRowsForEvent ?? 0} linhas (evento QA)`
  );
  record(
    "ledger-actions-written",
    (ledgerRowsForEvent ?? 0) >= 2,
    `${ledgerRowsForEvent ?? 0} entradas (evento QA)`
  );

  const { data: ledgerBreakdown } = await sb
    .from("event_sheet_sync_ledger")
    .select("action")
    .eq("event_id", eventId);

  const actionCounts = {};
  for (const row of ledgerBreakdown ?? []) {
    actionCounts[row.action] = (actionCounts[row.action] ?? 0) + 1;
  }
  record(
    "ledger-action-mix",
    Boolean(actionCounts.created || actionCounts.updated),
    JSON.stringify(actionCounts)
  );

  // Deleted guest → skipped, not recreated
  const { data: oneGuest } = await sb
    .from("guests")
    .select("id, name")
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle();

  if (oneGuest) {
    await sb.from("guests").delete().eq("id", oneGuest.id);

    const { count: beforeThird } = await sb
      .from("guests")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    let third;
    try {
      third = await importGuestsFromCsv(eventId, TEST_CSV, "phase2-qa.csv");
    } catch (err) {
      record(
        "csv-import-after-delete",
        false,
        err instanceof Error ? err.message : String(err)
      );
      third = null;
    }

    const { count: afterThird } = await sb
      .from("guests")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    const skippedDeleted =
      third &&
      (third.ledgerSkipped ?? 0) >= 1 &&
      third.created === 0 &&
      (afterThird ?? 0) === (beforeThird ?? 0);

    record(
      "deleted-guest-not-recreated",
      Boolean(skippedDeleted),
      third
        ? `skipped=${third.skipped} ledgerSkipped=${third.ledgerSkipped} created=${third.created} guests ${beforeThird}→${afterThird}`
        : "falha no 3º import"
    );

    const { data: skippedLedger } = await sb
      .from("event_sheet_sync_ledger")
      .select("action, reason")
      .eq("event_id", eventId)
      .eq("action", "skipped");

    const hasDeletedReason = (skippedLedger ?? []).some(
      (r) => r.reason === "guest_deleted_or_missing"
    );
    record(
      "ledger-skipped-reason",
      hasDeletedReason,
      hasDeletedReason
        ? "guest_deleted_or_missing presente"
        : JSON.stringify(skippedLedger ?? [])
    );
  } else {
    record("deleted-guest-not-recreated", false, "sem convidado para apagar");
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- Resumo ---");
  console.log(`Global import rows (antes QA): ${globalImportBefore ?? "?"}`);
  console.log(`Global ledger rows (antes QA): ${globalLedgerBefore ?? "?"}`);
  console.log(`Evento QA: ${eventId}`);
  console.log(`Pass: ${results.length - failed.length}/${results.length}`);
  console.log("Emails enviados: nenhum");
  console.log("Dados produção apagados: nenhum (só evento QA)");
  console.log("Folha Google externa: não tocada");
  console.log(
    "\nPara remover dados QA: node --import tsx scripts/post-migration-phase2-rsvp-sync.mjs --cleanup"
  );

  if (failed.length) {
    console.log("\nFalhas:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log("\nVeredito: post-migration Phase 2 validation PASSED");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
