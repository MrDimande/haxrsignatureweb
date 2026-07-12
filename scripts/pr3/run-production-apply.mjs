/**
 * PR.3 — apply 036–043 em produção (janela autorizada). Para após primeiro erro.
 * Requer PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED + PR3_SOURCE_PGPASSWORD.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { APPLY_AUTH_TOKEN } from "./lib/pr3-production-db.mjs";
import { PRODUCTION_REF } from "./lib/pr3-guards.mjs";

if (process.env.PR3_APPLY_AUTHORIZED?.trim() !== APPLY_AUTH_TOKEN) {
  console.error(
    JSON.stringify({
      pass: false,
      reason: "missing_human_go_token",
      required: `PR3_APPLY_AUTHORIZED=${APPLY_AUTH_TOKEN}`,
    }),
  );
  process.exit(1);
}

const report = {
  phase: "pr3-production-apply",
  productionRef: PRODUCTION_REF,
  startedAt: new Date().toISOString(),
  steps: [],
  pass: false,
};

function runStep(name, script, args = []) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  const entry = {
    name,
    pass: (result.status ?? 1) === 0,
    ms: Date.now() - started,
    exitCode: result.status ?? 1,
  };
  report.steps.push(entry);
  if (!entry.pass) {
    report.finishedAt = new Date().toISOString();
    report.pass = false;
    report.abortedAt = name;
    flushReport();
    process.exit(entry.exitCode);
  }
}

function flushReport() {
  mkdirSync(resolve(process.cwd(), "backups/pr3-production-pre036"), { recursive: true });
  writeFileSync(
    resolve(process.cwd(), "backups/pr3-production-pre036/production-apply-report.json"),
    JSON.stringify(report, null, 2),
  );
}

runStep("pre_apply_gate", "scripts/pr3/run-pre-apply-gate.mjs");
runStep("verify_pre036", "scripts/pr3/verify-production-pre-036.mjs");

const migrations = ["036", "037", "038", "039", "040", "041", "042", "043"];
for (const version of migrations) {
  runStep(`apply_${version}`, "scripts/pr3/apply-migration-production.mjs", [version]);
  if (version === "036") {
    runStep("verify_post_036", "scripts/pr3/verify-production-post-036.mjs");
  }
  if (version === "038") {
    runStep("verify_post_038", "scripts/pr3/verify-production-post-038.mjs");
  }
  if (version === "043") {
    runStep("verify_post_043_rpcs", "scripts/pr3/verify-production-rpcs.mjs");
  }
}

report.finishedAt = new Date().toISOString();
report.pass = true;
flushReport();
console.log(JSON.stringify({ pass: true, productionRef: PRODUCTION_REF, steps: report.steps.length }, null, 2));
