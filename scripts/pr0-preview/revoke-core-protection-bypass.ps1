#Requires -Version 5.1
<#
.SYNOPSIS
  Revoke all Core automation protection bypass secrets without printing values.
#>
$ErrorActionPreference = "Stop"
$Report = Join-Path $env:TEMP "haxr-pr0-bypass-revoke-report.txt"
$StateIn = Join-Path $env:TEMP "haxr-pr0-protection-state-in.json"
$StateOut = Join-Path $env:TEMP "haxr-pr0-protection-state-out.json"
$Store = Join-Path $env:TEMP "haxr-pr0-core-protection-bypass.txt"
$Worker = Join-Path $env:TEMP "haxr-pr0-revoke-all-bypass.mjs"

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  Set-Location C:\project-x\haxrsignature

  $pList = Start-Process -FilePath "npx.cmd" -ArgumentList @("vercel","project","protection","haxrsignatureweb","--format","json") `
    -WorkingDirectory (Get-Location).Path -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput $StateIn -RedirectStandardError (Join-Path $env:TEMP "haxr-pr0-protection-list.err")
  if ($pList.ExitCode -ne 0) { throw ("list protection failed exit={0}" -f $pList.ExitCode) }

  @'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const statePath = path.join(os.tmpdir(), "haxr-pr0-protection-state-in.json");
const storePath = path.join(os.tmpdir(), "haxr-pr0-core-protection-bypass.txt");
const reportPath = path.join(os.tmpdir(), "haxr-pr0-bypass-revoke-report.txt");

const raw = readFileSync(statePath, "utf8");
const json = JSON.parse(raw);
const bypass = json?.protectionBypass && typeof json.protectionBypass === "object"
  ? json.protectionBypass
  : {};
const keys = Object.keys(bypass);
const attempted = [];
let disabled = 0;
let missing = 0;
let failed = 0;

for (const secret of keys) {
  const r = spawnSync(
    "npx.cmd",
    [
      "vercel",
      "project",
      "protection",
      "disable",
      "haxrsignatureweb",
      "--protection-bypass",
      "--protection-bypass-secret",
      secret,
      "--format",
      "json",
    ],
    { encoding: "utf8", shell: true, cwd: process.cwd() }
  );
  attempted.push(1);
  const combined = `${r.stdout || ""}\n${r.stderr || ""}`;
  if (r.status === 0) {
    disabled += 1;
  } else if (/does not exist/i.test(combined)) {
    missing += 1;
  } else {
    failed += 1;
  }
}

// Also try locally stored secret if present and not already in live map
if (existsSync(storePath)) {
  const local = readFileSync(storePath, "utf8").trim();
  if (local && !keys.includes(local)) {
    const r = spawnSync(
      "npx.cmd",
      [
        "vercel",
        "project",
        "protection",
        "disable",
        "haxrsignatureweb",
        "--protection-bypass",
        "--protection-bypass-secret",
        local,
        "--format",
        "json",
      ],
      { encoding: "utf8", shell: true, cwd: process.cwd() }
    );
    attempted.push(1);
    const combined = `${r.stdout || ""}\n${r.stderr || ""}`;
    if (r.status === 0) disabled += 1;
    else if (/does not exist/i.test(combined)) missing += 1;
    else failed += 1;
  }
  try { unlinkSync(storePath); } catch {}
}

const verify = spawnSync(
  "npx.cmd",
  ["vercel", "project", "protection", "haxrsignatureweb", "--format", "json"],
  { encoding: "utf8", shell: true, cwd: process.cwd() }
);
let remaining = -1;
if (verify.status === 0) {
  try {
    const after = JSON.parse(verify.stdout || "{}");
    remaining = Object.keys(after?.protectionBypass || {}).length;
  } catch {
    remaining = -1;
  }
}

const lines = [
  "STATUS=" + (failed === 0 && remaining === 0 ? "OK" : failed === 0 && remaining === -1 ? "OK_UNVERIFIED" : remaining === 0 ? "OK" : "FAIL"),
  `LIVE_KEYS_BEFORE=${keys.length}`,
  `ATTEMPTED=${attempted.length}`,
  `DISABLED=${disabled}`,
  `ALREADY_MISSING=${missing}`,
  `FAILED=${failed}`,
  `REMAINING_AFTER=${remaining}`,
];
writeFileSync(reportPath, lines.join("\n") + "\n", "utf8");
console.log(lines.join("\n"));
process.exit(failed === 0 && (remaining === 0 || remaining === -1) ? 0 : 1);
'@ | Set-Content -Path $Worker -Encoding utf8

  Write-Host "Revoking all Core protection bypass secrets (values not printed)..." -ForegroundColor Cyan
  & node $Worker
  $code = $LASTEXITCODE
  Remove-Item $Worker -Force -ErrorAction SilentlyContinue

  if (Test-Path $Report) { Get-Content $Report }
  if ($code -ne 0) { throw "revoke-all failed" }

  Write-Host "Core bypass revoke complete." -ForegroundColor Green
  exit 0
}
catch {
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  Add-Content $Report ("STATUS=FAIL message={0}" -f $_.Exception.Message)
  exit 1
}
finally {
  Remove-Item $Worker -Force -ErrorAction SilentlyContinue
}
