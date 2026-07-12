#!/usr/bin/env node
/**
 * Phase 1 — local parity (both dev servers required).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractScript = path.join(scriptDir, "edition-rsvp.contract.mjs");

const result = spawnSync(
  process.execPath,
  [contractScript],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CONTRACT_PHASE: "local",
      EDITION_BASE_URL: "http://localhost:3001",
      CORE_BASE_URL: "http://localhost:3000",
    },
  }
);

process.exit(result.status ?? 1);
