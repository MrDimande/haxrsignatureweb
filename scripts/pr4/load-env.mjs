/**
 * PR.4 — carrega pr4-env.local (gitignored) para process.env sem imprimir valores.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILE = resolve(process.cwd(), "pr4-env.local");

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const idx = trimmed.indexOf("=");
  if (idx === -1) return null;
  const key = trimmed.slice(0, idx).trim();
  let value = trimmed.slice(idx + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

export function loadPr4Env() {
  if (!existsSync(ENV_FILE)) return { loaded: false, keys: [] };

  const keys = [];
  const blocked = new Set(["PGPASSWORD", "PR4_SOURCE_DATABASE_URL"]);
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    if (blocked.has(parsed.key)) continue;
    if (!process.env[parsed.key]) {
      process.env[parsed.key] = parsed.value;
    }
    keys.push(parsed.key);
  }

  return { loaded: true, keys };
}

loadPr4Env();
