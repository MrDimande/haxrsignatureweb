# PR.4.1 - executar dry-run completo na sessao actual.
# PR4_DATABASE_URL = libpq (sem password, sem uselibpqcompat) + PGPASSWORD separado.
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

if (-not $env:PR4_DATABASE_URL) {
    Write-Error "PR4_DATABASE_URL em falta."
    exit 1
}
if (-not $env:PGPASSWORD) {
    Write-Error "PGPASSWORD em falta. Definir password fora da URL."
    exit 1
}
if ($env:PR4_SOURCE_DATABASE_URL) {
    Write-Error "ABORT: PR4_SOURCE_DATABASE_URL ainda definida - remover antes de continuar."
    exit 1
}
if ($env:PR4_DATABASE_URL -match "oxsrdmydlqyvnueedgtl") {
    Write-Error "ABORT: destino aponta para producao."
    exit 1
}
if ($env:PR4_DATABASE_URL -notmatch "rkkxfrwtmsqzpnbkshnd") {
    Write-Error "ABORT: destino nao e o clone dry-run."
    exit 1
}
if ($env:PR4_DATABASE_URL -match "uselibpqcompat") {
    Write-Error "ABORT: uselibpqcompat so e permitido na URL derivada Node, nao em PR4_DATABASE_URL."
    exit 1
}

try {
    $uri = [Uri]$env:PR4_DATABASE_URL
    if ($uri.UserInfo -match ':') {
        Write-Error "ABORT: password embebida na URL. Usar PGPASSWORD separado."
        exit 1
    }
    if ($uri.UserInfo -ne "postgres.rkkxfrwtmsqzpnbkshnd") {
        Write-Error "ABORT: user da connection string deve ser postgres.rkkxfrwtmsqzpnbkshnd"
        exit 1
    }
    if ($uri.Host -ne "aws-0-eu-central-1.pooler.supabase.com") {
        Write-Error "ABORT: host deve ser aws-0-eu-central-1.pooler.supabase.com"
        exit 1
    }
    if ($uri.Port -ne 5432) {
        Write-Error "ABORT: porta deve ser 5432."
        exit 1
    }
    if ($uri.AbsolutePath.TrimStart('/') -ne "postgres") {
        Write-Error "ABORT: database deve ser postgres."
        exit 1
    }
}
catch {
    Write-Error "ABORT: PR4_DATABASE_URL invalida."
    exit 1
}

Write-Output "Destino dry-run validado (libpq + PGPASSWORD). A iniciar pipeline."
node scripts/pr4/run-dryrun-from-dump.mjs
exit $LASTEXITCODE
