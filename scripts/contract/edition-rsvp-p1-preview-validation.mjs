#!/usr/bin/env node
/**
 * P1.1 Preview Validation Report — safe gates only.
 * External automation uses Edition/Core protection bypass; runtime proxy does not.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  resolveCoreProtectionBypass,
  resolveEditionProtectionBypass,
} from "./resolve-preview-bypass.mjs";

const CORE_PROJECT_ID =
  process.env.CORE_VERCEL_PROJECT_ID?.trim() ||
  "prj_0IDkBPavK5WZVQtbh3CKyAekQG8u";
const EDITION_PROJECT_ID =
  process.env.EDITION_VERCEL_PROJECT_ID?.trim() ||
  "prj_gR5eLFnRUjEm2IPPMqgOpR9PrqHw";
const CONTRACT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CORE_ROOT = path.resolve(CONTRACT_DIR, "../..");
const TIMEOUT_SCRIPT = "scripts/edition-rsvp-proxy-timeout.local.mjs";

/** Resolve Edition repo from script location (sibling of Core), with optional override. */
function resolveEditionRepoRoot() {
  const envRoot = process.env.EDITION_REPO_ROOT?.trim();
  if (envRoot) {
    const resolved = path.resolve(envRoot);
    if (isEditionRepoRoot(resolved)) return resolved;
    throw new Error(
      `EDITION_REPO_ROOT does not contain ${TIMEOUT_SCRIPT}: ${resolved}`
    );
  }

  const candidates = [
    path.resolve(CONTRACT_DIR, "../../../projecto_haxrsignature"),
    path.resolve(CORE_ROOT, "../projecto_haxrsignature"),
  ];

  for (const candidate of candidates) {
    if (isEditionRepoRoot(candidate)) return candidate;
  }

  throw new Error(
    `Edition repo not found. Expected ${TIMEOUT_SCRIPT} under a sibling of ${CORE_ROOT}. Set EDITION_REPO_ROOT.`
  );
}

/** @param {string} root */
function isEditionRepoRoot(root) {
  return existsSync(path.join(root, TIMEOUT_SCRIPT));
}

/** Read-only: reuse existing automation bypass key without PATCH. */
function readExistingBypassToken(projectId) {
  const probe = spawnSync(
    "npx",
    ["vercel", "api", `/v9/projects/${projectId}`, "--raw"],
    {
      encoding: "utf8",
      cwd: CORE_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    }
  );
  if (probe.status !== 0) return null;
  try {
    const payload = JSON.parse(probe.stdout.trim());
    const entries = Object.entries(
      /** @type {Record<string, { createdAt?: number; isEnvVar?: boolean }>} */ (
        payload.protectionBypass ?? {}
      )
    ).filter(([, meta]) => meta?.isEnvVar !== true);
    if (entries.length === 0) return null;
    entries.sort(
      (a, b) => Number(b[1]?.createdAt ?? 0) - Number(a[1]?.createdAt ?? 0)
    );
    return entries[0]?.[0] ?? null;
  } catch {
    return null;
  }
}

function resolvePreviewBypass(deploymentUrl, projectId, resolver) {
  return (
    resolver(deploymentUrl) ||
    process.env.CORE_PROTECTION_BYPASS?.trim() ||
    process.env.EDITION_PROTECTION_BYPASS?.trim() ||
    readExistingBypassToken(projectId)
  );
}

const editionBase =
  process.env.EDITION_BASE_URL?.replace(/\/$/, "") ||
  "https://projecto-haxrsignature-edition-koliaxg94.vercel.app";
const coreBase =
  process.env.CORE_BASE_URL?.replace(/\/$/, "") ||
  "https://haxrsignatureweb-1njsa9e0c-alberto-dimandes-projects.vercel.app";
const proxySecret = process.env.HAXR_EDITION_PROXY_SECRET?.trim();

if (!proxySecret) {
  console.error("HAXR_EDITION_PROXY_SECRET is required.");
  process.exit(2);
}

const editionBypass = resolvePreviewBypass(
  editionBase,
  EDITION_PROJECT_ID,
  resolveEditionProtectionBypass
);
const coreBypass = resolvePreviewBypass(
  coreBase,
  CORE_PROJECT_ID,
  resolveCoreProtectionBypass
);

if (!editionBypass || !coreBypass) {
  console.error("Could not resolve preview protection bypass tokens.");
  process.exit(2);
}

/** @typedef {{ id: string; name: string; category: string; body: Record<string, unknown>; expectStatus: number; expectSuccess?: boolean; expectError?: string }} GateCase */

/** @type {GateCase[]} */
const GATES = [
  {
    id: "T1",
    name: "honeypot safety",
    category: "honeypot-nonempty",
    body: {
      name: "Bot",
      attending: true,
      guests: 1,
      honeypot: "spam-bot",
    },
    expectStatus: 200,
    expectSuccess: true,
  },
  {
    id: "T2",
    name: "farewell phone required",
    category: "farewell-validation-no-phone",
    body: {
      slug: "despedida-de-solteira",
      name: "Contract Preview",
      attending: true,
      guests: 1,
      email: "",
      phone: "",
      honeypot: "",
    },
    expectStatus: 400,
    expectSuccess: false,
    expectError: "Indique o telefone para contacto (WhatsApp).",
  },
  {
    id: "T3",
    name: "missing contact",
    category: "kulaya-validation-no-contact",
    body: {
      slug: "jessicakulaya",
      name: "Contract Preview",
      attending: true,
      guests: 1,
      email: "",
      phone: "",
      honeypot: "",
    },
    expectStatus: 400,
    expectSuccess: false,
    expectError: "Indique email ou telefone para contacto.",
  },
];

/**
 * @param {string} base
 * @param {string} routePath
 * @param {Record<string, unknown>} body
 * @param {object} opts
 */
async function postJson(base, routePath, body, opts) {
  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    "X-Forwarded-For": opts.ip,
  };
  if (opts.bypass) headers["x-vercel-protection-bypass"] = opts.bypass;
  if (opts.secret) headers.Authorization = `Bearer ${opts.secret}`;

  const response = await fetch(`${base}${routePath}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

async function runGate(gate, ipSuffix) {
  const ip = `203.0.113.${ipSuffix}`;
  const edition = await postJson(editionBase, "/api/rsvp", gate.body, {
    ip,
    bypass: editionBypass,
  });

  const editionBody = /** @type {Record<string, unknown>} */ (edition.json ?? {});
  const failures = [];

  if (edition.status !== gate.expectStatus) {
    failures.push(`status ${edition.status} !== ${gate.expectStatus}`);
  }
  if (gate.expectSuccess !== undefined && editionBody.success !== gate.expectSuccess) {
    failures.push(`success ${editionBody.success} !== ${gate.expectSuccess}`);
  }
  if (gate.expectError && editionBody.error !== gate.expectError) {
    failures.push(`error mismatch`);
  }

  return {
    id: gate.id,
    name: gate.name,
    category: gate.category,
    expectedStatus: gate.expectStatus,
    actualStatus: edition.status,
    expectedSuccess: gate.expectSuccess ?? null,
    actualSuccess: editionBody.success ?? null,
    expectedError: gate.expectError ?? null,
    actualError:
      typeof editionBody.error === "string" ? editionBody.error : null,
    pass: failures.length === 0,
    failures,
  };
}

async function runCore401Gate() {
  const response = await fetch(`${coreBase}/api/v1/edition/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "203.0.113.254",
      "x-vercel-protection-bypass": coreBypass,
    },
    body: JSON.stringify({
      slug: "despedida-de-solteira",
      name: "",
      attending: true,
      guests: 1,
    }),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  const body = /** @type {Record<string, unknown>} */ (json ?? {});
  const pass =
    response.status === 401 &&
    body.success === false &&
    typeof body.error === "string";

  return {
    id: "T4",
    name: "core proxy-secret rejection",
    category: "core-direct-no-secret",
    expectedStatus: 401,
    actualStatus: response.status,
    expectedSuccess: false,
    actualSuccess: body.success ?? null,
    expectedError: "unauthorized envelope",
    actualError: typeof body.error === "string" ? body.error : null,
    pass,
    failures: pass ? [] : ["Core did not return 401 unauthorized envelope"],
  };
}

async function runTimeoutLocalGate() {
  const editionRoot = resolveEditionRepoRoot();
  const scriptPath = path.join(editionRoot, TIMEOUT_SCRIPT);

  const result = spawnSync(process.execPath, ["--import", "tsx", scriptPath], {
    encoding: "utf8",
    cwd: editionRoot,
    env: {
      ...process.env,
      HAXR_API_BACKEND: "proxy",
      HAXR_CORE_API_BASE_URL: "http://127.0.0.1:9",
      HAXR_EDITION_PROXY_SECRET: proxySecret,
      HAXR_PROXY_FALLBACK: "false",
      HAXR_PROXY_TIMEOUT_MS: "3000",
    },
  });

  const pass = result.status === 0;
  return {
    id: "T5",
    name: "timeout / upstream failure (local proxy)",
    category: "invalid-core-base-local",
    expectedStatus: 500,
    actualStatus: pass ? 500 : null,
    expectedSuccess: false,
    actualSuccess: false,
    expectedError: "controlled generic Edition error",
    actualError: pass ? "Ocorreu um erro ao processar o seu RSVP." : null,
    pass,
    failures: pass ? [] : [result.stderr || result.stdout || "local timeout gate failed"],
    note: "Local-only gate; Preview env unchanged. Validates no automatic fallback.",
    editionRepoRoot: editionRoot,
  };
}

function loadLocalEnv() {
  const envFile = path.join(CORE_ROOT, ".env.local");
  if (!existsSync(envFile)) return {};
  /** @type {Record<string, string>} */
  const values = {};
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
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

function fetchDeploymentLogs(deploymentUrl) {
  const result = spawnSync(
    "npx",
    ["vercel", "logs", deploymentUrl, "--json"],
    {
      encoding: "utf8",
      cwd: CORE_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      timeout: 45_000,
    }
  );

  if (result.status !== 0) {
    return {
      ok: false,
      error: result.stderr?.trim() || result.stdout?.trim() || "vercel logs failed",
      lines: [],
    };
  }

  /** @type {Record<string, unknown>[]} */
  const lines = [];
  for (const line of result.stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      lines.push(JSON.parse(trimmed));
    } catch {
      // ignore non-json lines
    }
  }

  return { ok: true, error: null, lines };
}

function extractLogText(lines) {
  return lines
    .flatMap((entry) => {
      /** @type {string[]} */
      const chunks = [JSON.stringify(entry)];
      const nested = entry.logs;
      if (Array.isArray(nested)) {
        for (const item of nested) {
          if (item && typeof item === "object" && "message" in item) {
            chunks.push(String(/** @type {{ message?: unknown }} */ (item).message));
          }
        }
      }
      if (typeof entry.message === "string") chunks.push(entry.message);
      return chunks;
    })
    .join("\n");
}

async function runObservabilityGate() {
  const failures = [];
  const coreLogs = fetchDeploymentLogs(coreBase);
  const editionLogs = fetchDeploymentLogs(editionBase);

  if (!coreLogs.ok) failures.push(`Core logs: ${coreLogs.error}`);
  if (!editionLogs.ok) failures.push(`Edition logs: ${editionLogs.error}`);

  const coreText = extractLogText(coreLogs.lines);
  const editionText = extractLogText(editionLogs.lines);

  const hasCoreProcessed =
    coreText.includes("[api/v1/edition/rsvp] Processed") &&
    coreText.includes("proxyOrigin") &&
    coreText.includes("requestId");
  const hasEditionProxy =
    editionText.includes("edition/rsvp/proxy") &&
    editionText.includes("requestId") &&
    (editionText.includes("forwarded") ||
      editionText.includes("network_error") ||
      editionText.includes("fallback_disabled"));

  if (coreLogs.ok && !hasCoreProcessed) {
    failures.push("Core logs missing Processed + requestId + proxyOrigin");
  }
  if (editionLogs.ok && !hasEditionProxy) {
    failures.push("Edition logs missing proxy entries with requestId");
  }

  const combined = `${coreText}\n${editionText}`;
  if (/Bearer\s+[A-Za-z0-9._-]{8,}/.test(combined)) {
    failures.push("Logs may contain bearer token material");
  }
  if (/HAXR_EDITION_PROXY_SECRET/.test(combined)) {
    failures.push("Logs may contain proxy secret env reference");
  }

  return {
    id: "T6",
    name: "core observability confirmation",
    category: "post-test-log-audit",
    expectedStatus: null,
    actualStatus: null,
    expectedSuccess: null,
    actualSuccess: null,
    expectedError: "requestId + proxyOrigin edition + no secrets",
    actualError: failures.length === 0 ? "observability fields present" : null,
    pass: failures.length === 0,
    failures,
    evidence: {
      coreLogEntries: coreLogs.lines.length,
      editionLogEntries: editionLogs.lines.length,
    },
  };
}

async function runSideEffectsGate() {
  const failures = [];
  const localEnv = loadLocalEnv();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    localEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      id: "T7",
      name: "duplicate side-effect verification",
      category: "supabase-guest-audit",
      expectedStatus: null,
      actualStatus: null,
      expectedSuccess: null,
      actualSuccess: null,
      expectedError: "zero contract test guest rows",
      actualError: null,
      pass: false,
      failures: ["Supabase credentials unavailable for automated T7 audit"],
      note: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sinceIso = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { count: contractNameCount, error: nameError } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .or("name.ilike.%Contract%,name.ilike.%Bot%,name.ilike.%Preview%");

  if (nameError) failures.push(`Guest name audit failed: ${nameError.message}`);
  else if ((contractNameCount ?? 0) > 0) {
    failures.push(`Unexpected guest rows: ${contractNameCount}`);
  }

  const farewellEventId =
    process.env.EDITION_EVENT_JESSICA_FAREWELL_ID?.trim() ||
    localEnv.EDITION_EVENT_JESSICA_FAREWELL_ID ||
    "de9e7136-987d-487a-a1c7-62988239e503";

  const kulayaEventId =
    process.env.EDITION_EVENT_JESSICA_KULAYA_ID?.trim() ||
    localEnv.EDITION_EVENT_JESSICA_KULAYA_ID;

  /** @type {string[]} */
  const eventIds = [farewellEventId];
  if (kulayaEventId) eventIds.push(kulayaEventId);

  const { count: recentEventCount, error: eventError } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .in("event_id", eventIds);

  if (eventError) failures.push(`Event guest audit failed: ${eventError.message}`);
  else if ((recentEventCount ?? 0) > 0) {
    failures.push(`Unexpected recent event guest rows: ${recentEventCount}`);
  }

  return {
    id: "T7",
    name: "duplicate side-effect verification",
    category: "supabase-guest-audit",
    expectedStatus: null,
    actualStatus: null,
    expectedSuccess: null,
    actualSuccess: null,
    expectedError: "zero contract test guest rows",
    actualError:
      failures.length === 0
        ? `contractNames=${contractNameCount ?? 0}, recentEventGuests=${recentEventCount ?? 0}`
        : null,
    pass: failures.length === 0,
    failures,
    evidence: {
      contractNameCount: contractNameCount ?? 0,
      recentEventGuestCount: recentEventCount ?? 0,
    },
    note: "Email side-effects inferred: honeypot/400/401 paths skip sendEditionRsvpNotificationEmail.",
  };
}

/** @param {Record<string, unknown>[]} results */
function writeMarkdownReport(reportPath, results, meta) {
  const lines = [
    "# P1.1 Preview Validation Report",
    "",
    `Generated: ${meta.generatedAt}`,
    `Edition Preview: ${meta.editionBase}`,
    `Core Preview: ${meta.coreBase}`,
    "",
    `**Result:** ${meta.passed}/${meta.total} gates passed`,
    "",
    "| Gate | Name | Category | Expected | Actual | PASS |",
    "|------|------|----------|----------|--------|------|",
  ];

  for (const result of results) {
    const expected =
      result.expectedStatus != null
        ? `HTTP ${result.expectedStatus}${result.expectedError ? ` · ${result.expectedError}` : ""}`
        : String(result.expectedError ?? "—");
    const actual =
      result.actualStatus != null
        ? `HTTP ${result.actualStatus}${result.actualError ? ` · ${result.actualError}` : ""}`
        : String(result.actualError ?? "—");
    lines.push(
      `| ${result.id} | ${result.name} | ${result.category} | ${expected} | ${actual} | ${result.pass ? "PASS" : "FAIL"} |`
    );
  }

  lines.push("", "## Verdict", "");
  lines.push(
    meta.passed === meta.total
      ? "**READY FOR P1.2 PRODUCTION PLAN**"
      : "**NOT READY**"
  );
  lines.push("");

  writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  console.log("P1.1 Preview Validation Report\n");
  console.log(`Edition Preview: ${editionBase}`);
  console.log(`Core Preview:    ${coreBase}\n`);

  /** @type {Record<string, unknown>[]} */
  const results = [];

  for (let i = 0; i < GATES.length; i += 1) {
    results.push(await runGate(GATES[i], 150 + i));
  }

  results.push(await runCore401Gate());
  results.push(await runTimeoutLocalGate());
  results.push(await runObservabilityGate());
  results.push(await runSideEffectsGate());

  let passed = 0;
  for (const result of results) {
    console.log(`${result.pass ? "PASS" : "FAIL"}  ${result.id} — ${result.name}`);
    console.log(`  category: ${result.category}`);
    if (result.expectedStatus != null) {
      console.log(
        `  expected: HTTP ${result.expectedStatus}${result.expectedError ? ` · ${result.expectedError}` : ""}`
      );
      console.log(
        `  actual:   HTTP ${result.actualStatus}${result.actualError ? ` · ${result.actualError}` : ""}`
      );
    } else {
      console.log(`  expected: ${result.expectedError ?? "—"}`);
      console.log(`  actual:   ${result.actualError ?? "—"}`);
    }
    if (result.failures?.length) {
      for (const f of result.failures) console.log(`  - ${f}`);
    }
    if (result.note) console.log(`  note: ${result.note}`);
    console.log("");
    if (result.pass) passed += 1;
  }

  const reportDir = CONTRACT_DIR;
  const reportPath = path.join(reportDir, "p1-preview-validation-report.json");
  const markdownPath = path.join(reportDir, "p1-preview-validation-report.md");
  const generatedAt = new Date().toISOString();
  const reportPayload = {
    generatedAt,
    editionBase,
    coreBase,
    editionRepoRoot: resolveEditionRepoRoot(),
    results,
    passed,
    total: results.length,
    verdict:
      passed === results.length
        ? "READY FOR P1.2 PRODUCTION PLAN"
        : "NOT READY",
  };

  writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2));
  writeMarkdownReport(markdownPath, results, {
    generatedAt,
    editionBase,
    coreBase,
    passed,
    total: results.length,
  });

  console.log(`${passed}/${results.length} gates passed`);
  console.log(`Report JSON: ${reportPath}`);
  console.log(`Report MD:   ${markdownPath}`);

  if (passed !== results.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
