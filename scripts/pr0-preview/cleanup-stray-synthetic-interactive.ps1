#Requires -Version 5.1
<# Remove stray synthetic RSVP guests from failed 500 (email pr0-integration-preview+%). Clone only. #>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167"

function Clear-Creds {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

try {
  Clear-Creds
  Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
  Write-Host "Cleanup stray synthetic guests (clone only)." -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }

  node scripts/pr0-preview/cleanup-stray-synthetic.mjs
  if ($LASTEXITCODE -ne 0) { throw "cleanup failed" }
  exit 0
}
catch {
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
finally {
  Clear-Creds
}
