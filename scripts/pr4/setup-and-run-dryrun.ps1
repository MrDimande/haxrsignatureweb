# PR.4.1 - setup interactivo seguro + execucao do dry-run.
# PR4_DATABASE_URL libpq (sem password, sem uselibpqcompat) + PGPASSWORD separado.
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

Remove-Item Env:PR4_SOURCE_DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue

$securePassword = Read-Host "Password da base DRY-RUN" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    Remove-Variable securePassword, pointer -ErrorAction SilentlyContinue
}

$env:PR4_DATABASE_URL = "postgresql://postgres.rkkxfrwtmsqzpnbkshnd@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=15"

Write-Output "A validar ambiente dry-run..."
node scripts/pr4/validate-dryrun-dest.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Validacao falhou."
    exit $LASTEXITCODE
}

Write-Output "A executar pipeline..."
& "$PSScriptRoot\run-in-session.ps1"
$code = $LASTEXITCODE

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue

exit $code
