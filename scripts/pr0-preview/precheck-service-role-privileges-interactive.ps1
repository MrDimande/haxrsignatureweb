#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"

function Clear-Creds {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

try {
  Clear-Creds
  Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
  Write-Host "Precheck privileges (read-only). Password hidden." -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  if ([string]::IsNullOrWhiteSpace($plain)) { throw "empty password" }

  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }
  if ($env:PR4_DATABASE_URL -notmatch $CLONE_REF) { throw "ABORT not clone" }

  node scripts/pr0-preview/precheck-service-role-privileges.mjs
  exit $LASTEXITCODE
}
catch {
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
finally {
  Clear-Creds
}
