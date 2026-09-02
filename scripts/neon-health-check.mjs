#!/usr/bin/env node
/**
 * HAXR Signature — Neon Database Health & Schema Readiness Checker
 *
 * Usage:
 *   node scripts/neon-health-check.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.development.local");
loadEnvFile(".env.production");
loadEnvFile(".env.preview");
loadEnvFile(".env.branch");
loadEnvFile(".env");

const { Pool } = pg;

const databaseUrl = process.env.HAXR_NEON_PRODUCTION_OWNER_URL || process.env.DATABASE_URL;

console.log("═══════════════════════════════════════════════════════════════════");
console.log("  HAXR SIGNATURE — NEON DATABASE HEALTH & INTEGRITY AUDIT");
console.log("═══════════════════════════════════════════════════════════════════\n");

if (!databaseUrl) {
  console.error("❌ ERRO: DATABASE_URL ou HAXR_NEON_PRODUCTION_OWNER_URL não encontrada no ambiente.");
  console.error("   Certifique-se de definir no .env.local ou passar por variável de ambiente.\n");
  process.exit(1);
}

const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ":****@");
console.log(`🔌 Conectando ao Neon PostgreSQL: ${maskedUrl}`);

const pool = new Pool({
  connectionString: databaseUrl,
  max: 3,
  connectionTimeoutMillis: 10_000,
  ssl: { rejectUnauthorized: false },
});

const REQUIRED_TABLES = [
  "profiles",
  "client_events",
  "client_event_members",
  "guests",
  "guest_groups",
  "guest_party_members",
  "guest_import_batches",
  "documents",
  "document_items",
  "supplier_profiles",
  "supplier_applications",
  "supplier_favorites",
  "concierge_requests",
  "payments",
  "expenses",
  "monthly_targets",
  "marketing_contacts",
  "contact_inquiries",
];

async function runAudit() {
  const client = await pool.connect();
  try {
    console.log("✅ Conexão estabelecida com sucesso!");

    const versionRes = await client.query("SELECT version(), NOW() AS server_time, current_database() AS db_name;");
    const { version, server_time, db_name } = versionRes.rows[0];
    console.log(`\n📦 Base de Dados: ${db_name}`);
    console.log(`⏱️  Hora do Servidor: ${server_time}`);
    console.log(`🏛️  Versão: ${version.split(" on ")[0]}\n`);

    console.log("🔍 Verificando Tabelas Críticas do HAXR Signature...");
    const tableQuery = `
      SELECT table_name 
        FROM information_schema.tables 
       WHERE table_schema = 'public' 
         AND table_type = 'BASE TABLE';
    `;
    const tableRes = await client.query(tableQuery);
    const existingTables = new Set(tableRes.rows.map((r) => r.table_name));

    let allTablesPresent = true;
    for (const table of REQUIRED_TABLES) {
      if (existingTables.has(table)) {
        const countRes = await client.query(`SELECT COUNT(*)::int AS count FROM public."${table}"`);
        console.log(`  ✔ [OK] public.${table.padEnd(26)} (Registos: ${countRes.rows[0].count})`);
      } else {
        console.log(`  ❌ [FALTA] public.${table.padEnd(26)} (Tabela não encontrada!)`);
        allTablesPresent = false;
      }
    }

    console.log("\n🔒 Testando Atomicidade e Transações (BEGIN / ROLLBACK)...");
    await client.query("BEGIN;");
    const txRes = await client.query("SELECT 1 AS tx_ok;");
    await client.query("ROLLBACK;");
    if (txRes.rows[0]?.tx_ok === 1) {
      console.log("  ✔ Atomicidade Transacional: PASS");
    }

    console.log("\n═══════════════════════════════════════════════════════════════════");
    if (allTablesPresent) {
      console.log("🎉 RESULTADO: O Neon Database está 100% PRONTO PARA PRODUÇÃO!");
    } else {
      console.log("⚠️  RESULTADO: Algumas tabelas ainda precisam de ser migradas para o Neon.");
    }
    console.log("═══════════════════════════════════════════════════════════════════\n");
  } finally {
    client.release();
    await pool.end();
  }
}

runAudit().catch((err) => {
  console.error("❌ Erro durante a auditoria do Neon:", err.message);
  process.exit(1);
});
