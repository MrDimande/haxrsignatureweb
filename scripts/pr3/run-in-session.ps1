# PR.3 - Estrategia B: backup logico + restore drill (clone)
# Session pooler hosts from Dashboard Connect (never inferred from region).

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
. (Join-Path $PSScriptRoot "lib\Read-Pr3Passwords.ps1")

$ProductionRef = "oxsrdmydlqyvnueedgtl"
$CloneRef = "rkkxfrwtmsqzpnbkshnd"

Write-Output "PR.3 Strategy B - backup read-only (production) + restore drill (clone)"
Write-Output "Production ref: $ProductionRef"
Write-Output "Clone ref:      $CloneRef"
Write-Output "Connection:     Session pooler :5432 (exact hosts from Dashboard)"

$env:PR3_SOURCE_POOLER_HOST = "aws-1-eu-central-1.pooler.supabase.com"
$env:PR3_SOURCE_POOLER_USER = "postgres.$ProductionRef"
$env:PR3_DEST_POOLER_HOST = "aws-0-eu-central-1.pooler.supabase.com"
$env:PR3_DEST_POOLER_USER = "postgres.$CloneRef"

Remove-Item Env:PR3_SOURCE_DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:PR3_DEST_DATABASE_URL -ErrorAction SilentlyContinue

if (
    $env:PR3_SOURCE_POOLER_HOST -eq $env:PR3_DEST_POOLER_HOST -and
    $env:PR3_SOURCE_POOLER_USER -eq $env:PR3_DEST_POOLER_USER
) {
    Write-Error "ABORT: origem e destino pooler identicos."
    exit 1
}

Write-Output ""
Write-Output "Source pooler: $($env:PR3_SOURCE_POOLER_USER) @ $($env:PR3_SOURCE_POOLER_HOST):5432/postgres"
Write-Output "Dest pooler:   $($env:PR3_DEST_POOLER_USER) @ $($env:PR3_DEST_POOLER_HOST):5432/postgres"
Write-Output ""

Read-Pr3PasswordIfMissing -EnvName "PR3_SOURCE_PGPASSWORD" -Prompt "Production DB password"
Read-Pr3PasswordIfMissing -EnvName "PR3_DEST_PGPASSWORD" -Prompt "Clone DB password"

try {
    node scripts/pr3/run-backup-restore-drill.mjs
    exit $LASTEXITCODE
}
finally {
    Clear-Pr3SensitiveEnv
    Write-Output "Passwords limpas da sessao."
}
