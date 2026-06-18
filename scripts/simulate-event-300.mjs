/**
 * Simulação operacional — 300 convidados (Fase 3)
 *
 * Uso:
 *   node scripts/simulate-event-300.mjs           # criar + testar
 *   node scripts/simulate-event-300.mjs --cleanup # remover dados de simulação
 *   node scripts/simulate-event-300.mjs --reuse     # reutilizar evento existente
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const SIM_TAG = "[SIM-300]";
const SIM_EVENT_NAME = `${SIM_TAG} Evento de Carga`;
const SIM_ACCESS_CODE = "SIM300TEST";
const GUEST_COUNT = 300;
const TABLE_COUNT = 30;
const SEATS_PER_TABLE = 10;

const args = new Set(process.argv.slice(2));
const CLEANUP_ONLY = args.has("--cleanup");
const REUSE = args.has("--reuse");

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

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1
  );
  return sorted[idx];
}

async function timed(label, fn, buckets) {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = performance.now() - start;
    buckets.push({ label, ms, ok: true });
    return result;
  } catch (error) {
    const ms = performance.now() - start;
    buckets.push({
      label,
      ms,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function summarize(buckets, labelFilter) {
  const rows = buckets.filter((b) => b.label === labelFilter && b.ok);
  const ms = rows.map((r) => r.ms);
  const errors = buckets.filter((b) => b.label === labelFilter && !b.ok);
  return {
    count: rows.length,
    errors: errors.length,
    p50: Math.round(percentile(ms, 50)),
    p95: Math.round(percentile(ms, 95)),
    max: ms.length ? Math.round(Math.max(...ms)) : 0,
    total: Math.round(ms.reduce((a, b) => a + b, 0)),
  };
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const buckets = [];

  async function cleanupSimulation() {
    const { data: events } = await sb
      .from("events")
      .select("id, name")
      .ilike("name", `${SIM_TAG}%`);

    if (!events?.length) {
      console.log("Nenhum evento de simulação para remover.");
      return;
    }

    for (const ev of events) {
      await sb.from("events").delete().eq("id", ev.id);
      console.log(`Removido: ${ev.name}`);
    }
  }

  if (CLEANUP_ONLY) {
    await cleanupSimulation();
    return;
  }

  const { error: schemaErr } = await sb
    .from("events")
    .select("find_seat_code")
    .limit(1);

  const hasFindSeatCode = !schemaErr;
  if (!hasFindSeatCode) {
    console.warn(
      "⚠ Migration 019 em falta (find_seat_code). Benchmarks de BD continuam; API find-seat ficará bloqueada.\n" +
        "  Aplicar: supabase/migrations/019_find_seat_security.sql no SQL Editor do Supabase.\n"
    );
  }

  let eventId;
  let accessCode = SIM_ACCESS_CODE;

  if (REUSE) {
    const selectCols = hasFindSeatCode ? "id, find_seat_code" : "id";
    const { data: existing } = await sb
      .from("events")
      .select(selectCols)
      .eq("name", SIM_EVENT_NAME)
      .maybeSingle();

    if (!existing) {
      throw new Error("Evento de simulação não encontrado. Corra sem --reuse.");
    }
    eventId = existing.id;
    accessCode = existing.find_seat_code || SIM_ACCESS_CODE;
    console.log(`Reutilizar evento ${eventId}`);
  } else {
    await cleanupSimulation();

    const eventInsert = {
      business_id: "haxr-signature",
      name: SIM_EVENT_NAME,
      type: "wedding",
      date: "2026-12-01",
      location: "Maputo · Simulação",
      notes: "Gerado automaticamente — Fase 3 QA",
    };
    if (hasFindSeatCode) {
      eventInsert.find_seat_code = SIM_ACCESS_CODE;
    }

    const { data: event, error: eventErr } = await sb
      .from("events")
      .insert(eventInsert)
      .select(hasFindSeatCode ? "id, find_seat_code" : "id")
      .single();

    if (eventErr) throw new Error(eventErr.message);
    eventId = event.id;
    accessCode = event.find_seat_code ?? SIM_ACCESS_CODE;

    const seatRows = [];
    for (let t = 1; t <= TABLE_COUNT; t++) {
      for (let s = 1; s <= SEATS_PER_TABLE; s++) {
        seatRows.push({
          event_id: eventId,
          table_name: `Mesa ${t}`,
          seat_number: s,
          label: String(s),
        });
      }
    }

    await timed("seed_seats", async () => {
      const { error } = await sb.from("seats").insert(seatRows);
      if (error) throw new Error(error.message);
    }, buckets);

    const { data: seats } = await sb
      .from("seats")
      .select("id")
      .eq("event_id", eventId)
      .order("table_name")
      .order("seat_number");

    const statuses = [];
    for (let i = 0; i < GUEST_COUNT; i++) {
      if (i < 120) statuses.push("confirmed");
      else if (i < 180) statuses.push("invited");
      else if (i < 220) statuses.push("declined");
      else statuses.push("checked_in");
    }

    const guestBatch = [];
    for (let i = 0; i < GUEST_COUNT; i++) {
      const num = String(i + 1).padStart(3, "0");
      const name = `Convidado Sim ${num}`;
      guestBatch.push({
        event_id: eventId,
        name,
        name_normalized: normalizeName(name),
        email: `sim${num}@example.test`,
        phone: "",
        client_type: "individual",
        seat_id: seats[i]?.id ?? null,
        qr_token: qrToken(),
        status: statuses[i],
        plus_ones: i % 5 === 0 ? 1 : 0,
        guest_source: "manual",
      });
    }

    await timed("seed_guests", async () => {
      const chunk = 50;
      for (let i = 0; i < guestBatch.length; i += chunk) {
        const { error } = await sb.from("guests").insert(guestBatch.slice(i, i + chunk));
        if (error) throw new Error(error.message);
      }
    }, buckets);

    console.log(`Evento criado: ${eventId} · código ${accessCode}`);
  }

  const { data: guests } = await sb
    .from("guests")
    .select("id, name, qr_token, status")
    .eq("event_id", eventId)
    .order("name");

  if (!guests?.length) throw new Error("Sem convidados na simulação");

  console.log(`Convidados: ${guests.length}`);

  await timed("stats_query", async () => {
    const { data, error } = await sb
      .from("guests")
      .select("status, seat_id, plus_ones, name_normalized")
      .eq("event_id", eventId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const confirmed = rows.filter((g) => g.status === "confirmed").length;
    const invited = rows.filter((g) => g.status === "invited").length;
    const declined = rows.filter((g) => g.status === "declined").length;
    const checkedIn = rows.filter((g) => g.status === "checked_in").length;
    return { confirmed, invited, declined, checkedIn, total: rows.length };
  }, buckets);

  await timed("list_guests_join", async () => {
    const { data, error } = await sb
      .from("guests")
      .select("id, name, status, seats(table_name, seat_number, label)")
      .eq("event_id", eventId)
      .order("name");
    if (error) throw new Error(error.message);
    return data?.length ?? 0;
  }, buckets);

  const searchGuests = guests.slice(0, GUEST_COUNT);
  for (const guest of searchGuests) {
    const query = guest.name.replace("Convidado Sim ", "Convidado ");
    await timed("find_seat_db", async () => {
      const norm = normalizeName(query);
      const { data, error } = await sb
        .from("guests")
        .select("id, name, name_normalized, seats(table_name, seat_number, label)")
        .eq("event_id", eventId)
        .or(`name.ilike.%${query}%,name_normalized.ilike.%${norm}%`)
        .limit(40);
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    }, buckets);
  }

  const rsvpGuests = guests.filter((g) => g.status !== "declined").slice(0, GUEST_COUNT);
  for (const guest of rsvpGuests) {
    await timed("rsvp_lookup", async () => {
      const { error } = await sb.rpc("lookup_event_checkin", {
        p_event_id: eventId,
        p_token: guest.qr_token,
      });
      if (error) throw new Error(error.message);
      return true;
    }, buckets);
  }

  const checkinCandidates = guests.filter((g) => g.status === "confirmed").slice(0, 80);
  for (const guest of checkinCandidates) {
    await timed("checkin_rpc", async () => {
      const { error } = await sb.rpc("perform_event_checkin", {
        p_event_id: eventId,
        p_token: guest.qr_token,
      });
      if (error) throw new Error(error.message);
      return true;
    }, buckets);
  }

  const apiSample = hasFindSeatCode
    ? guests.slice(0, Math.min(50, guests.length))
    : [];
  let apiOk = 0;
  let apiFail = 0;
  for (const guest of apiSample) {
    const query = guest.name.replace("Sim ", "");
    try {
      const res = await fetch(`${siteUrl.replace(/\/$/, "")}/api/events/find-seat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          query,
          accessCode,
        }),
      });
      const body = await res.json();
      await timed("find_seat_api", async () => {
        if (!res.ok || !body.ok) throw new Error(body.error ?? res.status);
        return true;
      }, buckets);
      apiOk++;
    } catch {
      apiFail++;
    }
  }

  const report = {
    eventId,
    accessCode,
    hasFindSeatCode,
    guestCount: guests.length,
    seed_seats: summarize(buckets, "seed_seats"),
    seed_guests: summarize(buckets, "seed_guests"),
    stats_query: summarize(buckets, "stats_query"),
    list_guests_join: summarize(buckets, "list_guests_join"),
    find_seat_db: summarize(buckets, "find_seat_db"),
    rsvp_lookup: summarize(buckets, "rsvp_lookup"),
    checkin_rpc: summarize(buckets, "checkin_rpc"),
    find_seat_api: summarize(buckets, "find_seat_api"),
    apiSample: { ok: apiOk, fail: apiFail, url: siteUrl },
    errors: buckets.filter((b) => !b.ok).map((b) => `${b.label}: ${b.error}`),
  };

  console.log("\n═══════════════════════════════════════");
  console.log("  RELATÓRIO FASE 3 — SIMULAÇÃO 300 CONVIDADOS");
  console.log("═══════════════════════════════════════\n");
  console.log(`Evento:     ${report.eventId}`);
  console.log(`Código:     ${hasFindSeatCode ? report.accessCode : "(migration 019 pendente)"}`);
  console.log(`Convidados: ${report.guestCount}\n`);

  const rows = [
    ["Operação", "N", "p50 ms", "p95 ms", "max ms", "erros"],
    ["Seed lugares", 1, ...fmtRow(report.seed_seats)],
    ["Seed convidados", 1, ...fmtRow(report.seed_guests)],
    ["Estatísticas", 1, ...fmtRow(report.stats_query)],
    ["Listagem + join", 1, ...fmtRow(report.list_guests_join)],
    ["Find-seat (DB)", report.find_seat_db.count, ...fmtRow(report.find_seat_db)],
    ["RSVP lookup", report.rsvp_lookup.count, ...fmtRow(report.rsvp_lookup)],
    ["Check-in RPC", report.checkin_rpc.count, ...fmtRow(report.checkin_rpc)],
    ["Find-seat (API)", report.find_seat_api.count, ...fmtRow(report.find_seat_api)],
  ];

  for (const row of rows) {
    console.log(row.map((c) => String(c).padEnd(16)).join(""));
  }

  console.log(`\nAPI HTTP (${siteUrl}): ${apiOk} OK · ${apiFail} falhas (amostra ${apiSample.length})`);

  if (!hasFindSeatCode) {
    console.log("\n⚠ Aplicar migration 019 antes de validar Find Your Seat em produção.");
  }

  if (report.errors.length) {
    console.log("\nErros:");
    for (const e of report.errors.slice(0, 10)) console.log(`  • ${e}`);
  }

  const thresholds = {
    stats_query: 500,
    list_guests_join: 2000,
    find_seat_db: 300,
    rsvp_lookup: 200,
    checkin_rpc: 300,
  };

  const failures = [];
  for (const [key, maxMs] of Object.entries(thresholds)) {
    if (report[key].p95 > maxMs) {
      failures.push(`${key} p95=${report[key].p95}ms > ${maxMs}ms`);
    }
    if (report[key].errors > 0) {
      failures.push(`${key} com ${report[key].errors} erros`);
    }
  }

  console.log("\n───────────────────────────────────────");
  if (!hasFindSeatCode) {
    console.log("RESULTADO: PARCIAL — migration 019 pendente (find_seat_code)");
    process.exitCode = 1;
  } else if (failures.length) {
    console.log("RESULTADO: ATENÇÃO — limites ultrapassados");
    for (const f of failures) console.log(`  ⚠ ${f}`);
    process.exitCode = 1;
  } else {
    console.log("RESULTADO: APROVADO para evento de 300 convidados");
  }

  console.log("\nLimpar dados: node scripts/simulate-event-300.mjs --cleanup");
}

function fmtRow(s) {
  return [s.p50, s.p95, s.max, s.errors];
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
