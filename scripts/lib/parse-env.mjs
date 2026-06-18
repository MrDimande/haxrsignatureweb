import { readFileSync, existsSync } from "node:fs";

/**
 * Lê .env.local (ou outro ficheiro) para process.env e devolve o objecto.
 */
export function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Ficheiro não encontrado: ${path}`);
  }

  const values = {};
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
    if (!process.env[key]) process.env[key] = value;
  }

  return values;
}
