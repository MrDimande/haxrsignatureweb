#!/usr/bin/env node
/**
 * Preflight checks antes da validação manual do HAXR Concierge Admin.
 * Uso: node scripts/concierge-preflight.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const checks = [];

function pass(label, detail) {
  checks.push({ ok: true, label, detail });
  console.log(`✓ ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail) {
  checks.push({ ok: false, label, detail });
  console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

const geminiKey = process.env.GEMINI_API_KEY?.trim();
if (geminiKey && geminiKey.length > 8) {
  pass("GEMINI_API_KEY", `activa (len=${geminiKey.length})`);
} else {
  fail("GEMINI_API_KEY", "em falta ou inválida em .env.local");
}

const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();
if (adminEmail && adminPassword) {
  pass("Admin credentials", `email=${adminEmail}`);
} else {
  fail("Admin credentials", "ADMIN_EMAIL ou ADMIN_PASSWORD em falta");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceKey) {
  fail("Supabase", "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta");
} else {
  pass("Supabase env", supabaseUrl);
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [
    "concierge_uploads",
    "concierge_review_items",
    "event_vendors",
    "event_checklist_items",
    "event_moodboard_items",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      fail(`Migration 027 — tabela ${table}`, error.message);
    } else {
      pass(`Tabela ${table}`, "acessível");
    }
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(5);

  if (eventsError) {
    fail("Eventos de teste", eventsError.message);
  } else if (!events?.length) {
    fail("Eventos de teste", "nenhum evento encontrado");
  } else {
    pass("Eventos de teste", events.map((e) => `${e.name} (${e.id})`).join("; "));
  }

  const bucket = process.env.CONCIERGE_BUCKET?.trim() || "concierge-uploads";
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    fail("Storage bucket", bucketError.message);
  } else {
    const found = buckets?.some((b) => b.name === bucket);
    if (found) {
      pass("Storage bucket", bucket);
    } else {
      fail("Storage bucket", `${bucket} não encontrado`);
    }
  }
}

console.log("\n--- Resumo ---");
const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error(`${failed.length} verificação(ões) falharam.`);
  if (failed.some((f) => f.label.includes("concierge") || f.label.includes("027"))) {
    console.error(
      "\nA migration 027_concierge.sql pode não estar aplicada no projecto Supabase ligado."
    );
    console.error("Aplique via Supabase Dashboard ou CLI antes do teste manual.");
  }
  process.exit(1);
}

console.log("Tudo pronto para: npm run dev → http://localhost:3000/admin");
console.log("Tab: Evento → Concierge");
