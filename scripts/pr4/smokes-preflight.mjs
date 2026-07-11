/**
 * PR.4.1 — validação de pré-requisitos dos smokes preview (sem expor valores).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PREVIEW_REF = "uxleigndoomoezwsxlan";
const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";

const CREDENTIAL_KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STAGING_TEST_EMAIL",
  "STAGING_TEST_PASSWORD",
  "STAGING_TEST_EVENT_ID",
  "STAGING_TEST_EVENT_FINGERPRINT",
];

function parseEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};

  const entries = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

function resolveSmokeEnv() {
  const fileEnv = {
    ...parseEnvFile(".env.local"),
    ...parseEnvFile(".env.development.local"),
  };

  const merged = { ...fileEnv };
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", ...CREDENTIAL_KEYS]) {
    const fromProcess = process.env[key]?.trim();
    if (fromProcess) merged[key] = fromProcess;
  }

  const apiBase =
    process.env.API_BASE_URL?.trim() ||
    process.env.STAGING_TEST_BASE_URL?.trim() ||
    fileEnv.STAGING_TEST_BASE_URL?.trim() ||
    "http://localhost:3000";

  return { env: merged, apiBase };
}

function classifyPreviewEnvironment(supabaseUrl) {
  if (!supabaseUrl) {
    return { invalid: true, reason: "credentials_missing", missing: ["NEXT_PUBLIC_SUPABASE_URL"] };
  }
  if (supabaseUrl.includes(PRODUCTION_REF)) {
    return {
      invalid: true,
      reason: "preview_environment_invalid",
      missing: ["NEXT_PUBLIC_SUPABASE_URL_production_ref"],
    };
  }
  if (!supabaseUrl.includes(PREVIEW_REF)) {
    return {
      invalid: true,
      reason: "preview_environment_invalid",
      missing: ["NEXT_PUBLIC_SUPABASE_URL_preview_ref"],
    };
  }
  return { invalid: false, reason: null, missing: [] };
}

export function validateSmokePrerequisites() {
  const { env, apiBase } = resolveSmokeEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

  const preview = classifyPreviewEnvironment(supabaseUrl);
  if (preview.invalid) {
    return {
      ready: false,
      missing: preview.missing,
      apiBase,
      reason: preview.reason,
    };
  }

  const missing = CREDENTIAL_KEYS.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    return {
      ready: false,
      missing,
      apiBase,
      reason: "credentials_missing",
    };
  }

  return {
    ready: true,
    missing: [],
    apiBase,
    reason: null,
  };
}

export async function checkLocalServer(apiBase) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(apiBase, {
      method: "GET",
      signal: controller.signal,
      redirect: "manual",
    });
    return response.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function evaluateSmokeReadiness() {
  const preflight = validateSmokePrerequisites();
  if (!preflight.ready) {
    return {
      ...preflight,
      serverOk: false,
    };
  }

  const serverOk = await checkLocalServer(preflight.apiBase);
  if (!serverOk) {
    return {
      ...preflight,
      serverOk: false,
      missing: [...preflight.missing, "local_dev_server"],
      ready: false,
      reason: "server_unavailable",
    };
  }

  return {
    ...preflight,
    serverOk: true,
    reason: null,
  };
}
