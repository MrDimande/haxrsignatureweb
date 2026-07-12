# PR.3 - smokes E2E no clone (rkkx). Password via Read-Host; nunca commitada.
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
. (Join-Path $PSScriptRoot "lib\Read-Pr3Passwords.ps1")

$CloneRef = "rkkxfrwtmsqzpnbkshnd"
$ProductionRef = "oxsrdmydlqyvnueedgtl"

Write-Output "PR.3 clone E2E smokes - target: $CloneRef (never $ProductionRef)"
Write-Output ""

Read-Pr3PasswordIfMissing -EnvName "PGPASSWORD" -Prompt "Clone DB password"

$env:PR4_DATABASE_URL = "postgresql://postgres.$CloneRef@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

$exitCode = 1
try {
    node scripts/pr3/run-clone-e2e-smokes.mjs
    $exitCode = $LASTEXITCODE
}
finally {
    Clear-Pr3SensitiveEnv
    Write-Output "Passwords limpas da sessao."
}

exit $exitCode
