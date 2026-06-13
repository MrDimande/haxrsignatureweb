import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const ENVIRONMENTS = ["production", "preview", "development"];

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
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
    const value = trimmed.slice(index + 1).trim();
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
    ADMIN_SESSION_SECRET: sessionSecret,
  };

  for (const environment of ENVIRONMENTS) {
    const existing = await listEnvNames(environment);
    for (const [name, value] of Object.entries(payload)) {
      if (existing.has(name) && name !== "ADMIN_SESSION_SECRET") {
        console.log(`• ${name} (${environment}) já existe`);
        continue;
      }
      await addEnv(name, value, environment);
    }
  }

  console.log("Variáveis Vercel sincronizadas.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
