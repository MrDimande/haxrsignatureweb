#Requires -Version 5.1
<#
  GO-authorized: minimal service_role grants on clone ONLY.
  USAGE on public + SELECT/INSERT/UPDATE on guests.
  No events (code does not query events table).
  No DELETE / ALL / PUBLIC / migrations.
#>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$Report = Join-Path $env:TEMP "haxr-pr0-service-role-grants-report.txt"

function Clear-Creds {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Add-Report([string]$line) {
  Add-Content -Path $Report -Value $line
  Write-Host $line
}

function Invoke-NodeJson([string]$ScriptRelPath) {
  $out = & node $ScriptRelPath 2>&1
  $code = $LASTEXITCODE
  $text = ($out | ForEach-Object { "$_" }) -join "`n"
  if ($code -ne 0) {
    throw ("node failed exit={0} detail={1}" -f $code, $text)
  }
  return $text
}

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }

  Clear-Creds
  Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

  Write-Host "=== APPLY minimal service_role RSVP grants (CLONE ONLY) ===" -ForegroundColor Cyan
  Write-Host ("Clone: {0}" -f $CLONE_REF)
  Write-Host ("Production blocked: {0}" -f $PRODUCTION_REF)
  Write-Host "Authorized: USAGE public + SIU guests"
  Write-Host "Not authorized: events, DELETE, ALL, PUBLIC, migrations"
  Write-Host ""

  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
  }
  if ([string]::IsNullOrWhiteSpace($plain)) { throw "empty password" }

  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null

  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT production" }
  if ($env:PR4_DATABASE_URL -notmatch [regex]::Escape($CLONE_REF)) { throw "ABORT not clone" }

  Add-Report "--- PRECHECK ---"
  $preText = Invoke-NodeJson "scripts/pr0-preview/precheck-service-role-privileges.mjs"
  Add-Report $preText.TrimEnd()
  $preJson = $preText | ConvertFrom-Json

  if ($preJson.identity.urlContainsProd -eq $true) { throw "ABORT prod in URL" }
  if ($preJson.identity.urlContainsClone -ne $true) { throw "ABORT not clone URL" }
  if ($preJson.counts.events -ne 7 -or $preJson.counts.guests -ne 139 -or $preJson.counts.migrations -ne 19) {
    throw ("ABORT unexpected counts events={0} guests={1} migrations={2}" -f $preJson.counts.events, $preJson.counts.guests, $preJson.counts.migrations)
  }

  $rpc11 = @($preJson.rpcOverloads | Where-Object { $_.pronargs -eq 11 })
  if ($rpc11.Count -ne 1) { throw "ABORT expected single 11-arg overload" }
  if ($rpc11[0].service_role_exec -ne $true) { throw "ABORT rpc11 service_role EXECUTE missing" }
  if ($rpc11[0].public_exec -eq $true -or $rpc11[0].anon_exec -eq $true -or $rpc11[0].authenticated_exec -eq $true) {
    throw "ABORT rpc11 leaked EXECUTE to public/anon/authenticated"
  }

  Add-Report "--- APPLY ---"
  $applyText = Invoke-NodeJson "scripts/pr0-preview/apply-service-role-rsvp-grants.mjs"
  Add-Report $applyText.TrimEnd()

  Add-Report "--- POSTCHECK ---"
  $postText = Invoke-NodeJson "scripts/pr0-preview/precheck-service-role-privileges.mjs"
  Add-Report $postText.TrimEnd()
  $postJson = $postText | ConvertFrom-Json

  if ($postJson.privileges.schema_usage_service_role -ne $true) { throw "POSTFAIL schema USAGE" }
  if ($postJson.privileges.guests_select -ne $true) { throw "POSTFAIL guests SELECT" }
  if ($postJson.privileges.guests_insert -ne $true) { throw "POSTFAIL guests INSERT" }
  if ($postJson.privileges.guests_update -ne $true) { throw "POSTFAIL guests UPDATE" }
  if ($postJson.privileges.guests_delete -eq $true) { throw "POSTFAIL guests DELETE unexpectedly true" }
  if ($postJson.counts.events -ne 7 -or $postJson.counts.guests -ne 139 -or $postJson.counts.migrations -ne 19) {
    throw "POSTFAIL counts changed"
  }

  $rpc11b = @($postJson.rpcOverloads | Where-Object { $_.pronargs -eq 11 })[0]
  if ($rpc11b.service_role_exec -ne $true -or $rpc11b.public_exec -eq $true -or $rpc11b.anon_exec -eq $true -or $rpc11b.authenticated_exec -eq $true) {
    throw "POSTFAIL rpc grants changed"
  }

  Add-Report "--- SERVICE_ROLE READ PROBE (no writes) ---"
  $probeText = Invoke-NodeJson "scripts/pr0-preview/probe-service-role-select.mjs"
  Add-Report $probeText.TrimEnd()

  Add-Report "STATUS=OK"
  Write-Host ""
  Write-Host "Grants applied and validated. Reply in Cursor: APPLY_OK" -ForegroundColor Green
  Write-Host ("Report: {0}" -f $Report)
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
