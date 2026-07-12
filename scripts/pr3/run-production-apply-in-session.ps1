# PR.3 - apply 036-043 em PRODUCAO (janela autorizada).
# Requer GO escrito + PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
. (Join-Path $PSScriptRoot "lib\Read-Pr3Passwords.ps1")

$ProductionRef = "oxsrdmydlqyvnueedgtl"

if ($env:PR3_APPLY_AUTHORIZED -ne "PR3_HUMAN_GO_CONFIRMED") {
    Write-Error @"
ABORT: apply bloqueado.
Defina PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED apos GO escrito do proprietario (Dimande).
"@
    exit 1
}

$env:PR3_SOURCE_POOLER_HOST = "aws-1-eu-central-1.pooler.supabase.com"
$env:PR3_SOURCE_POOLER_USER = "postgres.$ProductionRef"
$env:PR3_SOURCE_DATABASE_URL = "postgresql://postgres.$ProductionRef@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

Write-Output "PR.3 PRODUCTION APPLY - $ProductionRef"
Write-Output "Token GO: presente"
Write-Output ""
Write-Output "ATENCAO: migrations 036-043 serao aplicadas em PRODUCAO."
Write-Output ""

$confirm = Read-Host "Confirmar apply em producao (escrever APPLY-PRODUCTION)"
if ($confirm -ne "APPLY-PRODUCTION") {
    Write-Error "ABORT: confirmacao nao recebida."
    exit 1
}

Read-Pr3PasswordIfMissing -EnvName "PR3_SOURCE_PGPASSWORD" -Prompt "Production DB password"

$exitCode = 1
try {
    node scripts/pr3/run-production-apply.mjs
    $exitCode = $LASTEXITCODE
}
finally {
    Clear-Pr3SensitiveEnv
    Remove-Item Env:PR3_APPLY_AUTHORIZED -ErrorAction SilentlyContinue
    Write-Output "Passwords limpas da sessao."
}

exit $exitCode
