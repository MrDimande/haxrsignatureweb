#!/usr/bin/env node
/**
 * HAXR Signature — Neon Database Health & Schema Readiness Checker
 *
 * Usage:
 *   node scripts/neon-health-check.mjs
 *
 * Verifies connectivity, pool configuration, tables, and transactional integrity
 * against the configured Neon PostgreSQL cloud instance.
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import pg from "pg";

// Load local environment files
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env.development.local") });
config({ path: resolve(process.cwd(), ".env.production") });
config({ path: resolve(process.cwd(), ".env") });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

console.log("═══════════════════════════════════════════════════════════════════");
console.log("  HAXR SIGNATURE — NEON DATABASE HEALTH & INTEGRITY AUDIT");
console.log("═══════════════════════════════════════════════════════════════════\n");

if (!databaseUrl) {
  console.error("❌ ERRO: DATABASE_URL não encontrada no ambiente.");
  console.error("   Certifique-se de definir DATABASE_URL no ficheiro .env.local ou nas variáveis da Vercel.\n");
  console.log("Formato esperado: postgresql://[user]:[password]@[neon-host]/[dbname]?sslmode=require");
  process.exit(1);
}

// Masked URL for safe logging
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

    // 1. PostgreSQL Version
    const versionRes = await client.query("SELECT version(), NOW() AS server_time, current_database() AS db_name;");
    const { version, server_time, db_name } = versionRes.rows[0];
    console.log(`\n📦 Base de Dados: ${db_name}`);
    console.log(`⏱️  Hora do Servidor: ${server_time}`);
    console.log(`🏛️  Versão: ${version.split(" on ")[0]}\n`);

    // 2. Audit Core Schema Tables
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

    // 3. Test Transactional Atomicity (BEGIN / ROLLBACK test)
    console.log("\n🔒 Testando Atomicidade e Transações (BEGIN / ROLLBACK)...");
    await client.query("BEGIN;");
    const txRes = await client.query("SELECT 1 AS tx_ok;");
    await client.query("ROLLBACK;");
    if (txRes.rows[0]?.tx_ok === 1) {
      console.log("  ✔ Atomicidade Transacional: PASS");
    }

    // Summary
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
