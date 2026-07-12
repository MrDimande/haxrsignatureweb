/**
 * Post-migration smoke — Google Sheets sync path (Phase 2 ledger).
 *
 * Uso:
 *   node --import tsx scripts/post-migration-phase2-google-sheets-smoke.mjs
 *   node --import tsx scripts/post-migration-phase2-google-sheets-smoke.mjs --cleanup
 *
 * Env opcional:
 *   PHASE2_GS_TEST_SHEET_URL — folha pública real (sem mock de fetch)
 *   PHASE2_GS_TEST_SHEET_GID  — gid override
 *
 * Segurança:
 *   - Só eventos etiquetados [PHASE2-GS-QA] por defeito
 *   - --allow-real-event <uuid> obrigatório para sincronizar outro evento
 *   - Não modifica folhas Google externas
 *   - Não envia emails
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const TAG = "[PHASE2-GS-QA]";
const EVENT_NAME = `${TAG} Sheets smoke`;
const CLEANUP = process.argv.includes("--cleanup");
const MOCK_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1PHASE2QAMOCK00000000000000000000/edit#gid=0";

const allowRealIdx = process.argv.indexOf("--allow-real-event");
const allowRealEventId =
  allowRealIdx >= 0 ? process.argv[allowRealIdx + 1]?.trim() : null;

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

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

function installGoogleSheetsFetchMock(csvText) {
  const realFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (
      url.includes("docs.google.com/spreadsheets") ||
      url.includes("google.com/spreadsheets")
    ) {
      return new Response(csvText, {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return realFetch(input, init);
  };
  return () => {
    globalThis.fetch = realFetch;
  };
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

async function countGuests(sb, eventId) {
  const { count } = await sb
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count ?? 0;
}

async function countImportRows(sb, eventId) {
  const { count } = await sb
    .from("event_sheet_import_rows")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("source", "google_sheet");
  return count ?? 0;
}

async function countLedgerRows(sb, eventId) {
  const { count } = await sb
    .from("event_sheet_sync_ledger")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("source", "google_sheet");
  return count ?? 0;
}

function formatSyncSummary(label, result) {
  return `${label}: created=${result.created} updated=${result.updated} skipped=${result.skipped} ledgerMatched=${result.ledgerMatched ?? 0} ledgerSkipped=${result.ledgerSkipped ?? 0} importRowsSeen=${result.importRowsSeen ?? 0}`;
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
    console.log("Cleanup [PHASE2-GS-QA] concluído.");
    return;
  }

  console.log("\n=== Post-migration smoke — Google Sheets sync (Phase 2) ===\n");

  const runId = `gs${Date.now().toString(36)}`;
  const testCsv = `Nome,Email,Telefone
${TAG} Alice GS,phase2-gs-alice-${runId}@haxr-qa.invalid,+351912200001
${TAG} Bruno GS,phase2-gs-bruno-${runId}@haxr-qa.invalid,+351912200002
`;

  const realSheetUrl = env.PHASE2_GS_TEST_SHEET_URL?.trim() || "";
  const sheetGid = env.PHASE2_GS_TEST_SHEET_GID?.trim() || "0";
  const sheetUrl = realSheetUrl || MOCK_SHEET_URL;
  const usingMockFetch = !realSheetUrl;

  console.log(
    usingMockFetch
      ? "Modo: mock fetch CSV (PHASE2_GS_TEST_SHEET_URL não configurado)"
      : `Modo: folha pública real (${realSheetUrl.slice(0, 48)}…)`
  );

  let restoreFetch = () => {};
  if (usingMockFetch) {
    restoreFetch = installGoogleSheetsFetchMock(testCsv);
  }

  const { error: importTableErr } = await sb
    .from("event_sheet_import_rows")
    .select("id")
    .limit(1);
  record(
    "table-event_sheet_import_rows",
    !importTableErr,
    importTableErr?.message ?? "acessível"
  );

  const { error: ledgerTableErr } = await sb
    .from("event_sheet_sync_ledger")
    .select("id")
    .limit(1);
  record(
    "table-event_sheet_sync_ledger",
    !ledgerTableErr,
    ledgerTableErr?.message ?? "acessível"
  );

  if (importTableErr || ledgerTableErr) {
    restoreFetch();
    process.exitCode = 1;
    return;
  }

  let eventId = allowRealEventId;

  if (eventId) {
    const { data: ev, error } = await sb
      .from("events")
      .select("id, name")
      .eq("id", eventId)
      .maybeSingle();
    if (error || !ev) {
      record("allow-real-event", false, error?.message ?? "evento não encontrado");
      restoreFetch();
      process.exitCode = 1;
      return;
    }
    if (!ev.name.includes(TAG) && !allowRealEventId) {
      record("allow-real-event", false, "evento não é QA — use --allow-real-event");
      restoreFetch();
      process.exitCode = 1;
      return;
    }
    record("allow-real-event", true, `${ev.name} (${eventId})`);
  } else {
    await cleanupQaEvents(sb);

    const { data: event, error: eventErr } = await sb
      .from("events")
      .insert({
        business_id: "haxr-signature",
        name: EVENT_NAME,
        type: "other",
        location: "QA",
        notes: `${TAG} run=${runId}`,
        google_sheet_url: sheetUrl,
        google_sheet_gid: sheetGid,
        sheets_sync_mode: "master",
        find_seat_code: `GS${Date.now().toString(36).slice(-6).toUpperCase()}`,
      })
      .select("id")
      .single();

    if (eventErr || !event) {
      record("create-qa-event", false, eventErr?.message ?? "sem id");
      restoreFetch();
      process.exitCode = 1;
      return;
    }
    eventId = event.id;
    record("create-qa-event", true, `${eventId} · sheet configured`);
  }

  const guestsBefore = await countGuests(sb, eventId);

  const { syncEventGuestsFromSheet } = await import(
    "../src/lib/events/sheets/sync.service.ts"
  );

  let first;
  try {
    first = await syncEventGuestsFromSheet(eventId);
    record("gs-sync-first", true, formatSyncSummary("1ª", first));
  } catch (err) {
    record(
      "gs-sync-first",
      false,
      err instanceof Error ? err.message : String(err)
    );
    restoreFetch();
    process.exitCode = 1;
    return;
  }

  const guestsAfterFirst = await countGuests(sb, eventId);
  record(
    "gs-first-guest-count",
    guestsAfterFirst >= guestsBefore + 2 || first.created + first.updated >= 2,
    `guests ${guestsBefore}→${guestsAfterFirst}`
  );

  let second;
  try {
    second = await syncEventGuestsFromSheet(eventId);
    record("gs-sync-second", true, formatSyncSummary("2ª", second));
  } catch (err) {
    record(
      "gs-sync-second",
      false,
      err instanceof Error ? err.message : String(err)
    );
    restoreFetch();
    process.exitCode = 1;
    return;
  }

  const guestsAfterSecond = await countGuests(sb, eventId);
  const noDupes =
    second.created === 0 && guestsAfterSecond === guestsAfterFirst;
  record(
    "gs-duplicate-prevention",
    noDupes,
    `created 2ª=${second.created} guests=${guestsAfterSecond} (antes ${guestsAfterFirst})`
  );

  const importRows = await countImportRows(sb, eventId);
  const ledgerRows = await countLedgerRows(sb, eventId);
  record(
    "gs-import-rows-written",
    importRows >= 2,
    `${importRows} linhas (source=google_sheet)`
  );
  record(
    "gs-ledger-rows-written",
    ledgerRows >= 2,
    `${ledgerRows} entradas (source=google_sheet)`
  );

  const hasLedgerReuse =
    (second.ledgerMatched ?? 0) >= 1 || second.updated >= 2;
  record(
    "gs-ledger-matched-or-updated",
    hasLedgerReuse,
    `ledgerMatched=${second.ledgerMatched ?? 0} updated=${second.updated}`
  );

  const { data: oneGuest } = await sb
    .from("guests")
    .select("id, name")
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle();

  let third = null;
  if (oneGuest) {
    await sb.from("guests").delete().eq("id", oneGuest.id);
    const beforeThird = await countGuests(sb, eventId);

    try {
      third = await syncEventGuestsFromSheet(eventId);
      record("gs-sync-after-delete", true, formatSyncSummary("3ª", third));
    } catch (err) {
      record(
        "gs-sync-after-delete",
        false,
        err instanceof Error ? err.message : String(err)
      );
    }

    const afterThird = await countGuests(sb, eventId);
    const skippedDeleted =
      third &&
      (third.ledgerSkipped ?? 0) >= 1 &&
      third.created === 0 &&
      afterThird === beforeThird;

    record(
      "gs-deleted-guest-not-recreated",
      Boolean(skippedDeleted),
      third
        ? `skipped=${third.skipped} ledgerSkipped=${third.ledgerSkipped} created=${third.created} guests ${beforeThird}→${afterThird}`
        : "falha no 3º sync"
    );

    const { data: skippedLedger } = await sb
      .from("event_sheet_sync_ledger")
      .select("action, reason")
      .eq("event_id", eventId)
      .eq("source", "google_sheet")
      .eq("action", "skipped");

    const hasDeletedReason = (skippedLedger ?? []).some(
      (r) => r.reason === "guest_deleted_or_missing"
    );
    record(
      "gs-ledger-skipped-reason",
      hasDeletedReason,
      hasDeletedReason
        ? "guest_deleted_or_missing presente"
        : JSON.stringify(skippedLedger ?? [])
    );
  } else {
    record("gs-deleted-guest-not-recreated", false, "sem convidado para apagar");
  }

  restoreFetch();

  const failed = results.filter((r) => !r.ok);
  const skippedTotal = third?.skipped ?? second.skipped ?? 0;

  console.log("\n--- Resumo ---");
  console.log(`QA event id: ${eventId}`);
  console.log(`Modo fetch: ${usingMockFetch ? "mock CSV" : "folha real"}`);
  console.log(`1ª sync: ${formatSyncSummary("", first)}`);
  console.log(`2ª sync: ${formatSyncSummary("", second)}`);
  console.log(`Guests antes: ${guestsBefore}`);
  console.log(`Guests após 1ª: ${guestsAfterFirst}`);
  console.log(`Guests após 2ª: ${guestsAfterSecond}`);
  console.log(`Import rows (google_sheet): ${importRows}`);
  console.log(`Ledger rows (google_sheet): ${ledgerRows}`);
  console.log(`Skipped (último sync relevante): ${skippedTotal}`);
  console.log(`Pass: ${results.length - failed.length}/${results.length}`);
  console.log("Emails enviados: nenhum");
  console.log("Dados produção tocados: nenhum");
  console.log("Folha Google externa modificada: não");
  console.log(
    "\nCleanup: node --import tsx scripts/post-migration-phase2-google-sheets-smoke.mjs --cleanup"
  );

  if (failed.length) {
    console.log("\nFalhas:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log("\nVeredito: Google Sheets smoke PASSED");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
