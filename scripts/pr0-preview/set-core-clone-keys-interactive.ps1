#Requires -Version 5.1
<#
.SYNOPSIS
  Prompt only for clone anon + service_role and set branch-specific Core Preview envs.
#>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$BRANCH = "feature/admin-edition-phase0"
$Report = Join-Path $env:TEMP "haxr-core-preview-keys-report.txt"

function ConvertFrom-SecureStringPlain([Security.SecureString]$Secure) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
}

function Get-SafeCliText([string]$Text, [string]$Secret) {
  if ([string]::IsNullOrEmpty($Text)) { return "" }
  if ([string]::IsNullOrEmpty($Secret)) { return $Text }
  return $Text.Replace($Secret, "[REDACTED]")
}

function Set-Env([string]$Name, [string]$Value) {
  # Native CLI writes npm/vercel banners to stderr; with $ErrorActionPreference=Stop
  # PowerShell promotes that to a terminating error and loses the real exit cause.
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $rawOut = $null
  $code = -1
  try {
    # Prefer --value to avoid fragile stdin piping through npx on Windows.
    $rawOut = & npx vercel env add $Name preview $BRANCH --yes --force --sensitive --value $Value 2>&1
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $prev
  }

  $text = ($rawOut | ForEach-Object { "$_" }) -join "`n"
  $safe = Get-SafeCliText -Text $text -Secret $Value
  if ($code -ne 0) {
    throw ("fail {0} exit={1} detail={2}" -f $Name, $code, $safe)
  }
  Add-Content $Report ("SET name={0} branch={1}" -f $Name, $BRANCH)
  Write-Host ("OK {0} Preview/{1}" -f $Name, $BRANCH) -ForegroundColor Green
}

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

  if (-not (Test-Path ".vercel\project.json") -and -not (Test-Path ".vercel\repo.json")) {
    throw "Project not linked (.vercel/project.json or .vercel/repo.json missing). Run: npx vercel link --yes --project haxrsignatureweb --scope alberto-dimandes-projects"
  }

  if (Test-Path ".vercel\repo.json") {
    $repo = Get-Content ".vercel\repo.json" -Raw | ConvertFrom-Json
    $linked = @($repo.projects) | Where-Object { $_.name -eq "haxrsignatureweb" -or $_.id -like "prj_*" }
    if (-not $linked) {
      throw "Linked repo.json does not include haxrsignatureweb"
    }
    Write-Host ("Linked via repo.json -> {0}" -f (($linked | Select-Object -First 1).name)) -ForegroundColor Green
  } elseif (Test-Path ".vercel\project.json") {
    Write-Host "Linked via project.json" -ForegroundColor Green
  }

  Write-Host "Clone keys only. Values hidden. Never paste into Cursor chat." -ForegroundColor Yellow
  Write-Host "Project: $CLONE_REF | Production blocked: $PRODUCTION_REF" -ForegroundColor Cyan
  Write-Host "Target: Preview / $BRANCH" -ForegroundColor Cyan
  Write-Host ""

  $anonSecure = Read-Host -AsSecureString "Clone NEXT_PUBLIC_SUPABASE_ANON_KEY"
  $svcSecure = Read-Host -AsSecureString "Clone SUPABASE_SERVICE_ROLE_KEY"
  $anon = ConvertFrom-SecureStringPlain $anonSecure
  $svc = ConvertFrom-SecureStringPlain $svcSecure
  if ([string]::IsNullOrWhiteSpace($anon) -or [string]::IsNullOrWhiteSpace($svc)) {
    throw "empty key"
  }
  if ($anon -match $PRODUCTION_REF -or $svc -match $PRODUCTION_REF) {
    throw "ABORT production ref detected in key material"
  }
  # JWT shape check without printing
  if ($anon -notmatch '^eyJ' -or $svc -notmatch '^eyJ') {
    throw "ABORT: keys do not look like Supabase JWTs (expected eyJ...)"
  }

  Set-Env "NEXT_PUBLIC_SUPABASE_ANON_KEY" $anon
  Set-Env "SUPABASE_SERVICE_ROLE_KEY" $svc
  $anon = $null
  $svc = $null
  Add-Content $Report "STATUS=OK"
  Write-Host "Keys set for Preview/$BRANCH (values not printed)." -ForegroundColor Green
  Write-Host "Report: $Report"
  Write-Host 'Reply "keys set" in Cursor to continue redeploy + validation.' -ForegroundColor Cyan
  exit 0
}
catch {
  $msg = $_.Exception.Message
  # Never echo key material if somehow present
  Write-Host ("ERROR: " + $msg) -ForegroundColor Red
  Add-Content $Report ("STATUS=FAIL message={0}" -f $msg)
  exit 1
}
finally {
  Remove-Variable anon, svc, anonSecure, svcSecure -ErrorAction SilentlyContinue
}
