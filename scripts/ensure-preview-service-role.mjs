/**
 * Ensures preview SUPABASE_SERVICE_ROLE_KEY exists in .env.development.local.
 * Never prints the key value.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PREVIEW_REF = "uxleigndoomoezwsxlan";
const DEV_ENV_PATH = resolve(process.cwd(), ".env.development.local");

function parseEnv(content) {
  const entries = new Map();
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    entries.set(line.slice(0, idx).trim(), line.slice(idx + 1));
  }
  return entries;
}

function getJwtRef(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    );
    return json.ref ?? null;
  } catch {
    return null;
  }
}

const existing = existsSync(DEV_ENV_PATH) ? readFileSync(DEV_ENV_PATH, "utf8") : "";
const entries = parseEnv(existing);
const currentKey = entries.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

if (currentKey && getJwtRef(currentKey) === PREVIEW_REF) {
  console.log("preview_service_role_in_dev_local=already_set");
  process.exit(0);
}

const raw = execSync(
  `npx supabase projects api-keys --project-ref ${PREVIEW_REF} -o json`,
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const keys = JSON.parse(raw);
const serviceRole =
  keys.find((entry) => entry.name === "service_role")?.api_key ??
  keys.find((entry) => entry.id === "service_role")?.api_key;

if (!serviceRole || getJwtRef(serviceRole) !== PREVIEW_REF) {
  console.error("Failed to resolve preview service role via Supabase CLI.");
  process.exit(1);
}

const lines = existing.trimEnd().split(/\r?\n/).filter(Boolean);
const withoutOld = lines.filter(
  (line) => !line.startsWith("SUPABASE_SERVICE_ROLE_KEY="),
);
withoutOld.push(`SUPABASE_SERVICE_ROLE_KEY=${serviceRole}`);
writeFileSync(`${DEV_ENV_PATH}`, `${withoutOld.join("\n")}\n`, "utf8");

console.log("preview_service_role_in_dev_local=written");
console.log("service_key_ref=uxleigndoomoezwsxlan");
