#!/usr/bin/env node
/**
 * Proxy parity — Edition POST /api/rsvp (proxy mode) vs Core direct.
 *
 * Pré-requisitos (dois dev servers):
 *   Core :3000  — HAXR_EDITION_PROXY_SECRET=<shared>
 *   Edition :3001 — HAXR_API_BACKEND=proxy
 *                   HAXR_CORE_API_BASE_URL=http://localhost:3000
 *                   HAXR_EDITION_PROXY_SECRET=<shared>
 *                   HAXR_PROXY_FALLBACK=false
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const contractScript = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "edition-rsvp.contract.mjs"
);

const sharedSecret =
  process.env.HAXR_EDITION_PROXY_SECRET?.trim() || "contract-test-proxy-secret";

const result = spawnSync(
  process.execPath,
  [contractScript],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CONTRACT_PHASE: "proxy-local",
      EDITION_BASE_URL: "http://localhost:3001",
      CORE_BASE_URL: "http://localhost:3000",
      HAXR_EDITION_PROXY_SECRET: sharedSecret,
      CONTRACT_PROXY_MODE: "1",
    },
  }
);

process.exit(result.status ?? 1);
