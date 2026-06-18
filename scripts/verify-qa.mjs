/**
 * QA Fase 10 — orquestra verificações automatizadas do roadmap de estabilização.
 * Uso: npm run verify:qa [-- --full]
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const full = process.argv.includes("--full");

const results = [];

function loadEnv() {
  const values = {};
  if (!existsSync(ENV_FILE)) return values;
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
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

function run(cmd, args) {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    child.on("close", (code) => {
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });
}

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const tag = status === "OK" ? "OK  " : status === "WARN" ? "WARN" : "FAIL";
  console.log(`${tag} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function runNpmScript(script) {
  const { code, stdout, stderr } = await run("npm", ["run", script]);
  const out = `${stdout}\n${stderr}`;
  if (code === 0) return { ok: true, out };
  if (out.includes("SKIP") && script === "verify:brevo") {
    return { ok: true, warn: "opcional / não configurado", out };
  }
  return { ok: false, out: out.slice(-400) };
}

async function main() {
  console.log("\n═══ HAXR Signature · QA Fase 10 ═══\n");

  const env = loadEnv();

  // —— Automatizados ——
  const scripts = [
    "test",
    "verify:assets",
    "verify:jsonld",
    "verify:demos",
    "verify:portal-spec",
    "verify:checkin",
  ];

  if (full) scripts.push("build");

  for (const script of scripts) {
    const result = await runNpmScript(script);
    if (result.ok && result.warn) {
      record(script, "WARN", result.warn);
    } else if (result.ok) {
      record(script, "OK");
    } else {
      record(script, "FAIL", result.out?.trim().split("\n").pop() ?? "exit != 0");
    }
  }

  // —— Ambiente produção ——
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "";
  if (siteUrl.includes("www.haxrsignature.com")) {
    record("env NEXT_PUBLIC_SITE_URL", "OK", siteUrl);
  } else if (siteUrl) {
    record("env NEXT_PUBLIC_SITE_URL", "WARN", `actual: ${siteUrl}`);
  } else {
    record("env NEXT_PUBLIC_SITE_URL", "WARN", "não definido");
  }

  if (env.ADMIN_SESSION_SECRET?.trim()) {
    record("env ADMIN_SESSION_SECRET", "OK", "definido");
  } else {
    record(
      "env ADMIN_SESSION_SECRET",
      "WARN",
      "usa fallback ADMIN_PASSWORD — definir secret independente"
    );
  }

  if (env.RESEND_API_KEY?.trim()) {
    record("env RESEND_API_KEY", "OK");
  } else {
    record("env RESEND_API_KEY", "FAIL", "formulário sem email");
  }

  if (env.RESEND_BRAND_DOMAIN === "true") {
    record("env RESEND_BRAND_DOMAIN", "OK", "domínio marca activo");
  } else {
    record("env RESEND_BRAND_DOMAIN", "WARN", "sandbox ou domínio pendente");
  }

  if (env.RESEND_API_KEY?.trim()) {
    const resendDns = await runNpmScript("verify:resend");
    if (resendDns.ok) {
      record("verify:resend", "OK", "SPF/DKIM/DMARC");
    } else {
      record("verify:resend", "WARN", "domínio ou DMARC pendente");
    }
  }

  const brevoKey = env.BREVO_API_KEY?.trim();
  const leadsList = env.BREVO_LIST_LEADS?.trim();
  if (!brevoKey) {
    record("env Brevo", "WARN", "opcional — marketing manual");
  } else if (!/^\d+$/.test(leadsList ?? "")) {
    record("env BREVO_LIST_*", "WARN", "IDs devem ser números inteiros");
  } else {
    record("env Brevo", "OK", "configurado");
  }

  // —— Segurança estática ——
  const gitignore = readFileSync(resolve(ROOT, ".gitignore"), "utf8");
  if (gitignore.includes(".env*.local")) {
    record("segurança .gitignore", "OK", ".env.local ignorado");
  } else {
    record("segurança .gitignore", "FAIL");
  }

  let clientLeak = false;
  const srcDir = resolve(ROOT, "src");
  function scanDir(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, entry.name);
      if (entry.isDirectory()) scanDir(p);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const text = readFileSync(p, "utf8");
        if (text.includes("NEXT_PUBLIC_SUPABASE_SERVICE")) clientLeak = true;
      }
    }
  }
  scanDir(srcDir);
  record(
    "segurança service role",
    clientLeak ? "FAIL" : "OK",
    clientLeak ? "NEXT_PUBLIC service role no cliente" : "só server-side"
  );

  const middleware = readFileSync(resolve(ROOT, "src/middleware.ts"), "utf8");
  if (
    middleware.includes("X-Frame-Options") &&
    middleware.includes("isValidSession")
  ) {
    record("segurança middleware admin", "OK");
  } else {
    record("segurança middleware admin", "WARN");
  }

  const findSeat = readFileSync(
    resolve(ROOT, "src/app/api/events/find-seat/route.ts"),
    "utf8"
  );
  if (
    findSeat.includes("persistentRateLimit") &&
    findSeat.includes("accessCode")
  ) {
    record("segurança find-seat", "OK", "código + rate limit");
  } else {
    record("segurança find-seat", "FAIL");
  }

  const seo = readFileSync(resolve(ROOT, "src/lib/seo.ts"), "utf8");
  if (seo.includes("index: false") && seo.includes("buildPrivateEventMetadata")) {
    record("SEO eventos privados", "OK", "noindex RSVP/check-in");
  } else {
    record("SEO eventos privados", "WARN");
  }

  const migrations = readdirSync(resolve(ROOT, "supabase/migrations")).filter(
    (f) => f.endsWith(".sql")
  );
  const required = ["019", "020", "021"];
  const missing = required.filter(
    (n) => !migrations.some((f) => f.startsWith(n + "_"))
  );
  if (!missing.length) {
    record("migrations 019–021", "OK", `${migrations.length} ficheiros`);
  } else {
    record("migrations 019–021", "WARN", `ficheiros locais OK; aplicar em prod: ${missing.join(", ")}`);
  }

  // —— Resumo ——
  const fail = results.filter((r) => r.status === "FAIL").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const ok = results.filter((r) => r.status === "OK").length;

  console.log("\n─── Resumo ───");
  console.log(`OK: ${ok}  WARN: ${warn}  FAIL: ${fail}`);
  console.log(`Relatório: docs/QA_FASE10_REPORT.md\n`);

  if (fail > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
