/**
 * PR.3 — gate read-only imediatamente antes da janela de apply.
 * Não aplica migrations. Valida artefactos locais + (opcional) produção pré-036.
 */
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const BACKUP_DIR = resolve(
  process.cwd(),
  "backups/pr3-production-pre036/2026-07-12T06-48-00",
);
const ENC_PATH = resolve(
  process.cwd(),
  "backups/pr3-production-pre036/2026-07-12T06-48-00.tar.gz.enc",
);
const ENC_SHA_PATH = `${ENC_PATH}.sha256`;
const SMOKE_REPORT = resolve(
  process.cwd(),
  "backups/pr3-production-pre036/pr3-clone-e2e-smoke-report.json",
);

const report = {
  phase: "pr3-pre-apply-gate",
  at: new Date().toISOString(),
  checks: [],
  pass: false,
};

function check(id, ok, detail = {}) {
  report.checks.push({ id, pass: ok, ...detail });
  return ok;
}

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: process.env,
  });
  return { code: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

let allPass = true;

const checksum = runNode("scripts/pr3/verify-backup-checksums.mjs", [BACKUP_DIR]);
const checksumPass = checksum.code === 0;
allPass = check("backup_checksums", checksumPass) && allPass;

const encExists = existsSync(ENC_PATH);
const encSize = encExists ? statSync(ENC_PATH).size : 0;
allPass =
  check("encrypted_archive_exists", encExists && encSize > 0, { bytes: encSize }) && allPass;

let shaValid = false;
if (encExists && existsSync(ENC_SHA_PATH)) {
  const expected = readFileSync(ENC_SHA_PATH, "utf8").trim().split(/\s+/)[0]?.toUpperCase();
  const actual = crypto
    .createHash("sha256")
    .update(readFileSync(ENC_PATH))
    .digest("hex")
    .toUpperCase();
  shaValid = expected === actual;
  allPass = check("encrypted_archive_sha256", shaValid, { match: shaValid }) && allPass;
} else {
  allPass = check("encrypted_archive_sha256", false, { reason: "sidecar_missing" }) && allPass;
}

if (existsSync(SMOKE_REPORT)) {
  try {
    const smoke = JSON.parse(readFileSync(SMOKE_REPORT, "utf8"));
    allPass =
      check("clone_db_smokes", smoke.pass === true, {
        finishedAt: smoke.finishedAt,
      }) && allPass;
  } catch {
    allPass = check("clone_db_smokes", false, { reason: "invalid_report" }) && allPass;
  }
} else {
  allPass = check("clone_db_smokes", false, { reason: "report_missing" }) && allPass;
}

const hasProdPw = Boolean(
  process.env.PR3_SOURCE_PGPASSWORD?.trim() || process.env.PGPASSWORD?.trim(),
);
if (hasProdPw) {
  const prod = runNode("scripts/pr3/verify-production-pre-036.mjs");
  allPass =
    check("production_still_pre036", prod.code === 0, {
      skipped: false,
    }) && allPass;
} else {
  check("production_still_pre036", true, {
    skipped: true,
    note: "Defina PR3_SOURCE_PGPASSWORD para validar produção live.",
  });
}

const humanGo = process.env.PR3_APPLY_AUTHORIZED?.trim() === "PR3_HUMAN_GO_CONFIRMED";
check("human_go_token", humanGo, {
  ready: humanGo,
  note: humanGo
    ? "Token presente — apply autorizado pela sessão."
    : "Pendente — definir PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED na janela.",
});

report.pass = allPass;
report.productionTouched = false;
report.readyForApply = allPass && humanGo;

console.log(JSON.stringify(report, null, 2));
process.exit(allPass ? 0 : 1);
