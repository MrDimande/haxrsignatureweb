/**
 * Invoca o Supabase CLI local sem o npm engolir flags como --status/--linked.
 *
 * Uso:
 *   node scripts/run-supabase.mjs migration repair 045 --status applied --linked
 *   npm run supabase:cli -- migration list --linked
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliJs = resolve(root, "node_modules/supabase/dist/supabase.js");

if (!existsSync(cliJs)) {
  console.error(
    "Supabase CLI não encontrado. Corra: npm install\n" +
      "Depois: node scripts/run-supabase.mjs <comando>",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Uso: node scripts/run-supabase.mjs <comando supabase...>");
  process.exit(1);
}

const result = spawnSync(process.execPath, [cliJs, ...args], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
