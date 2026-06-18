import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const ENVIRONMENTS = ["production", "preview", "development"];

const FORCE_SYNC_KEYS = new Set([
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "CONTACT_NOTIFY_EMAIL",
  "RESEND_BRAND_DOMAIN",
]);

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CONTACT_NOTIFY_EMAIL",
];

const OPTIONAL_KEYS = [
  "RESEND_FROM_EMAIL",
  "RESEND_BRAND_DOMAIN",
  "BREVO_API_KEY",
  "BREVO_LIST_LEADS",
  "BREVO_LIST_NEWSLETTER",
  "BREVO_SENDER_EMAIL",
  "BREVO_SENDER_NAME",
  "BREVO_FUNNEL_ENABLED",
  "BREVO_FUNNEL_PORTFOLIO_DAYS",
  "BREVO_FUNNEL_EXPERIENCES_DAYS",
  "BREVO_FUNNEL_MEETING_DAYS",
  "BREVO_FUNNEL_LAST_CALL_DAYS",
  "CRON_SECRET",
];

function parseEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Ficheiro não encontrado: ${path}`);
  }

  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
  }
  return values;
}

function runVercel(args, stdinValue) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("npx", ["vercel", ...args], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || stdout || `vercel exit ${code}`));
    });

    if (stdinValue != null) {
      child.stdin.write(stdinValue);
    }
    child.stdin.end();
  });
}

async function listEnvNames(environment) {
  const { stdout } = await runVercel(["env", "ls", environment]);
  const names = new Set();
  for (const line of stdout.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z0-9_]+)\s+/);
    if (match) names.add(match[1]);
  }
  return names;
}

async function addEnv(name, value, environment) {
  await runVercel(["env", "add", name, environment, "--force"], `${value}\n`);
  console.log(`✓ ${name} (${environment})`);
}

async function main() {
  const localEnv = parseEnvFile(ENV_FILE);

  if (!localEnv.CRON_SECRET?.trim()) {
    localEnv.CRON_SECRET = randomBytes(32).toString("hex");
    console.log("• CRON_SECRET gerado automaticamente para sync Vercel");
  }

  for (const key of REQUIRED_KEYS) {
    if (!localEnv[key]) {
      throw new Error(`Variável em falta no .env.local: ${key}`);
    }
  }

  const sessionSecret =
    localEnv.ADMIN_SESSION_SECRET?.trim() ||
    randomBytes(32).toString("hex");

  const payload = {
    ...Object.fromEntries(REQUIRED_KEYS.map((key) => [key, localEnv[key]])),
    ...Object.fromEntries(
      OPTIONAL_KEYS.filter((key) => localEnv[key]).map((key) => [key, localEnv[key]])
    ),
    ADMIN_SESSION_SECRET: sessionSecret,
  };

  for (const environment of ENVIRONMENTS) {
    const existing = await listEnvNames(environment);
    for (const [name, value] of Object.entries(payload)) {
      const shouldForce = FORCE_SYNC_KEYS.has(name);
      if (existing.has(name) && name !== "ADMIN_SESSION_SECRET" && !shouldForce) {
        console.log(`• ${name} (${environment}) já existe`);
        continue;
      }
      if (shouldForce && existing.has(name)) {
        console.log(`↻ ${name} (${environment}) actualizado`);
      }
      await addEnv(name, value, environment);
    }
  }

  console.log("Variáveis Vercel sincronizadas.");
}

main().catch((error) => {
  const message = error.message || String(error);
  if (/no existing credentials|not logged in/i.test(message)) {
    console.error("Vercel: sessão não encontrada.\n");
    console.error("1. Corre no terminal:  npx vercel login");
    console.error("2. Depois:           npm run vercel:env\n");
    console.error("Ou define variáveis manualmente em:");
    console.error("https://vercel.com → Project → Settings → Environment Variables");
    console.error("\nMínimo para o funil Brevo em produção:");
    console.error("  CRON_SECRET, BREVO_API_KEY, BREVO_LIST_LEADS, BREVO_LIST_NEWSLETTER");
    process.exit(1);
  }
  console.error(message);
  process.exit(1);
});
