#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$Report = Join-Path $env:TEMP "haxr-pr0-embed-grants-report.txt"
$SqlFile = Join-Path $PSScriptRoot "sql\clone_grant_service_role_guest_embeds_select.sql"

function Clear-Creds {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Add-Report([string]$line) {
  Add-Content $Report $line
  Write-Host $line
}

function Invoke-Node([string]$rel) {
  $out = & node $rel 2>&1
  if ($LASTEXITCODE -ne 0) { throw ("node failed: " + (($out | ForEach-Object {"$_"}) -join "`n")) }
  return (($out | ForEach-Object {"$_"}) -join "`n")
}

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  Clear-Creds
  Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

  Write-Host "=== APPLY SELECT embeds for getGuestById (CLONE ONLY) ===" -ForegroundColor Cyan
  Write-Host "Tables: seats, checkins, guest_groups (SELECT only)"
  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }

  Add-Report "--- BEFORE COUNTS ---"
  Add-Report (Invoke-Node "scripts/pr0-preview/clone-counts.mjs").TrimEnd()

  Add-Report "--- APPLY EMBEDS ---"
  $applyOut = & node scripts/pr0-preview/apply-embed-selects.mjs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ("apply embeds failed: " + (($applyOut | ForEach-Object { "$_" }) -join "`n"))
  }
  Add-Report (($applyOut | ForEach-Object { "$_" }) -join "`n")

  Add-Report "--- PRIVILEGE CHECK ---"
  $privOut = & node scripts/pr0-preview/precheck-embed-privileges.mjs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ("privilege check failed: " + (($privOut | ForEach-Object { "$_" }) -join "`n"))
  }
  Add-Report (($privOut | ForEach-Object { "$_" }) -join "`n")

  Add-Report "--- AFTER COUNTS ---"
  Add-Report (Invoke-Node "scripts/pr0-preview/clone-counts.mjs").TrimEnd()

  Add-Report "STATUS=OK"
  Write-Host "Reply: EMBEDS_OK" -ForegroundColor Green
  exit 0
}
catch {
  Add-Report ("STATUS=FAIL message=" + $_.Exception.Message)
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
finally {
  Clear-Creds
}
