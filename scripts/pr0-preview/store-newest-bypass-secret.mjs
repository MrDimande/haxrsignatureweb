import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const store = path.join(os.tmpdir(), "haxr-pr0-core-protection-bypass.txt");
const targetCreatedAt = Number(process.env.HAXR_BYPASS_CREATED_AT || "1784100708803");

const raw = execSync(
  "npx vercel project protection haxrsignatureweb --format json",
  { encoding: "utf8", cwd: process.cwd() }
);
const jsonStart = raw.indexOf("{");
const data = JSON.parse(raw.slice(jsonStart));
const pb = data.protectionBypass || {};

let chosen = null;
for (const [secret, meta] of Object.entries(pb)) {
  if (meta && Number(meta.createdAt) === targetCreatedAt) {
    chosen = secret;
    break;
  }
}

if (!chosen) {
  // Fallback: newest by createdAt
  let newestAt = -1;
  for (const [secret, meta] of Object.entries(pb)) {
    const at = Number(meta?.createdAt || 0);
    if (at > newestAt) {
      newestAt = at;
      chosen = secret;
    }
  }
}

if (!chosen || chosen.length < 16) {
  console.error("FAIL: could not locate bypass secret");
  process.exit(1);
}

fs.writeFileSync(store, chosen, { encoding: "ascii", mode: 0o600 });
chosen = null;
console.log(`STORE_OK=true path=${store} length_hint=stored`);
