/**
 * Smoke test: listBusinesses via service_role (sem imprimir dados sensíveis).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

loadEnvFile(".env.development.local");
loadEnvFile(".env.local");

const { listBusinesses } = await import("../src/lib/admin/repositories/businesses.repository.ts");

try {
  const businesses = await listBusinesses();
  console.log(
    JSON.stringify(
      {
        ok: true,
        count: businesses.length,
        ids: businesses.map((b) => b.id),
        source:
          businesses.length > 0
            ? "database-or-fallback"
            : "empty",
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
