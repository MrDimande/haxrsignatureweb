#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCoreProtectionBypass } from "./resolve-preview-bypass.mjs";

const coreBase = process.argv[2]?.replace(/\/$/, "");
const outFile = process.argv[3];

if (!coreBase || !outFile) {
  console.error(
    "Usage: node write-core-bypass-file.mjs <CORE_BASE_URL> <OUT_FILE>"
  );
  process.exit(2);
}

const bypass = resolveCoreProtectionBypass(coreBase);
if (!bypass) {
  console.error("Could not resolve Core protection bypass.");
  process.exit(1);
}

fs.writeFileSync(outFile, bypass, "utf8");
console.log(`Wrote bypass to ${outFile}`);
