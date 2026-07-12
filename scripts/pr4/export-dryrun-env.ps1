# PR.4.1 - exporta PR4_DATABASE_URL (sem password) para pr4-env.local.
# PGPASSWORD NUNCA e escrito em disco.
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outFile = Join-Path $root "pr4-env.local"

$value = [Environment]::GetEnvironmentVariable("PR4_DATABASE_URL", "Process")
if (-not $value) {
    Write-Error "PR4_DATABASE_URL em falta na sessao actual."
    exit 1
}
if ($value -match "oxsrdmydlqyvnueedgtl") {
    Write-Error "ABORT: destino aponta para producao."
    exit 1
}
if ($value -notmatch "rkkxfrwtmsqzpnbkshnd") {
    Write-Error "ABORT: destino nao contem ref dry-run esperada."
    exit 1
}
if ($value -match "uselibpqcompat") {
    Write-Error "ABORT: URL libpq nao deve conter uselibpqcompat."
    exit 1
}

try {
    $uri = [Uri]$value
    if ($uri.UserInfo -match ':') {
        Write-Error "ABORT: URL contem password embebida. Usar PGPASSWORD na sessao."
        exit 1
    }
    if ($uri.UserInfo -ne "postgres.rkkxfrwtmsqzpnbkshnd") {
        Write-Error "ABORT: user da URL deve ser postgres.rkkxfrwtmsqzpnbkshnd"
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

[System.IO.File]::WriteAllText($outFile, "PR4_DATABASE_URL=$value`n")
Write-Output "pr4-env.local escrito (URL sem password; PGPASSWORD omitido)"
