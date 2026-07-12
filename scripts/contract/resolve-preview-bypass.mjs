#!/usr/bin/env node
/**
 * Resolve Vercel Deployment Protection bypass via authenticated `vercel api`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CORE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const BYPASS_BODY = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "_bypass-body.json"
);

/**
 * @param {string} deploymentUrl
 * @param {string} projectId
 */
export function resolveProtectionBypass(deploymentUrl, projectId) {
  if (!deploymentUrl.includes("vercel.app")) return null;

  const npx = "npx";
  const probe = spawnSync(
    npx,
    [
      "vercel",
      "api",
      `/v1/projects/${projectId}/protection-bypass`,
      "-X",
      "PATCH",
      "-H",
      "Content-Type: application/json",
      "--input",
      BYPASS_BODY,
      "--raw",
    ],
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
      /** @type {Record<string, { createdAt?: number }>} */ (
        payload.protectionBypass ?? {}
      )
    );
    if (entries.length === 0) return null;

    entries.sort(
      (a, b) => Number(b[1]?.createdAt ?? 0) - Number(a[1]?.createdAt ?? 0)
    );
    return entries[0]?.[0] ?? null;
  } catch {
    return null;
  }
}

const CORE_VERCEL_PROJECT_ID =
  process.env.CORE_VERCEL_PROJECT_ID?.trim() ||
  "prj_0IDkBPavK5WZVQtbh3CKyAekQG8u";

const EDITION_VERCEL_PROJECT_ID =
  process.env.EDITION_VERCEL_PROJECT_ID?.trim() ||
  "prj_gR5eLFnRUjEm2IPPMqgOpR9PrqHw";

/** @param {string} deploymentUrl */
export function resolveCoreProtectionBypass(deploymentUrl) {
  const fromEnv =
    process.env.CORE_PROTECTION_BYPASS?.trim() ||
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (fromEnv) return fromEnv;
  return resolveProtectionBypass(deploymentUrl, CORE_VERCEL_PROJECT_ID);
}

/** @param {string} deploymentUrl */
export function resolveEditionProtectionBypass(deploymentUrl) {
  const fromEnv = process.env.EDITION_PROTECTION_BYPASS?.trim();
  if (fromEnv) return fromEnv;
  if (EDITION_VERCEL_PROJECT_ID === "prj_edition_placeholder") return null;
  return resolveProtectionBypass(deploymentUrl, EDITION_VERCEL_PROJECT_ID);
}
