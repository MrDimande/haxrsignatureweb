# PR.3 - preflight (Session pooler) then backup/restore drill on PASS.
# Passwords via Read-Host once; reused for drill. Never committed.

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
. (Join-Path $PSScriptRoot "lib\Read-Pr3Passwords.ps1")

$ProductionRef = "oxsrdmydlqyvnueedgtl"
$CloneRef = "rkkxfrwtmsqzpnbkshnd"

$env:PR3_SOURCE_POOLER_HOST = "aws-1-eu-central-1.pooler.supabase.com"
$env:PR3_SOURCE_POOLER_USER = "postgres.$ProductionRef"
$env:PR3_DEST_POOLER_HOST = "aws-0-eu-central-1.pooler.supabase.com"
$env:PR3_DEST_POOLER_USER = "postgres.$CloneRef"

Remove-Item Env:PR3_SOURCE_DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:PR3_DEST_DATABASE_URL -ErrorAction SilentlyContinue

Write-Output "PR.3 Phase 1 - preflight then drill (Session pooler :5432)"
Write-Output "Production: $env:PR3_SOURCE_POOLER_USER @ $env:PR3_SOURCE_POOLER_HOST"
Write-Output "Clone:      $env:PR3_DEST_POOLER_USER @ $env:PR3_DEST_POOLER_HOST"
Write-Output ""

Read-Pr3PasswordIfMissing -EnvName "PR3_SOURCE_PGPASSWORD" -Prompt "Production DB password"
Read-Pr3PasswordIfMissing -EnvName "PR3_DEST_PGPASSWORD" -Prompt "Clone DB password"

$exitCode = 1
try {
    Write-Output ""
    Write-Output "=== SOURCE + DESTINATION PREFLIGHT ==="
    node scripts/pr3/run-preflight.mjs
    $preflightExit = $LASTEXITCODE
    if ($preflightExit -ne 0) {
        Write-Output "Preflight FAIL - aborting before backup."
        $exitCode = $preflightExit
        return
    }

    Write-Output ""
    Write-Output "Preflight PASS - starting backup/restore drill..."
    node scripts/pr3/run-backup-restore-drill.mjs
    $exitCode = $LASTEXITCODE
}
finally {
    Clear-Pr3SensitiveEnv
    Write-Output "Passwords limpas da sessao."
}

exit $exitCode
