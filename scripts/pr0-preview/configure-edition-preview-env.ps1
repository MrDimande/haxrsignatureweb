#Requires -Version 5.1
<#
.SYNOPSIS
  Configure Edition Preview branch-specific env after Core Preview redeploy.
#>
$ErrorActionPreference = "Stop"

$BRANCH = "feature/edition-phase0-security-slugs"
$SMOKE_EVENT = "64b791b4-49c4-4b55-a8a0-99424c3d7167"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$Report = Join-Path $env:TEMP "haxr-edition-preview-env-report.txt"
$ProxyStore = Join-Path $env:TEMP "haxr-pr0-preview-proxy-secret.txt"
$BypassStore = Join-Path $env:TEMP "haxr-pr0-core-protection-bypass.txt"

function Add-BranchEnv {
  param(
    [string]$Name,
    [string]$Value,
    [switch]$Sensitive
  )
  $vercelArgs = @("vercel", "env", "add", $Name, "preview", $BRANCH, "--yes", "--force")
  if ($Sensitive) { $vercelArgs += "--sensitive" }
  $Value | & npx @vercelArgs 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to set $Name (exit=$LASTEXITCODE)"
  }
  Add-Content -Path $Report -Value ("SET name={0} env=preview branch={1} sensitive={2}" -f $Name, $BRANCH, [bool]$Sensitive)
}

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\..\projecto_haxrsignature"))

  Write-Host "=== Edition Preview branch-specific env ===" -ForegroundColor Cyan
  Write-Host "Branch: $BRANCH"
  Write-Host "Smoke event id: $SMOKE_EVENT"

  $coreUrl = Read-Host "Exact Core Preview URL (https://....vercel.app, no trailing slash)"
  $coreUrl = $coreUrl.Trim().TrimEnd("/")
  if ($coreUrl -notmatch '^https://[a-z0-9-]+\.vercel\.app$') {
    throw "ABORT: Core URL must be https://<deployment>.vercel.app"
  }
  if ($coreUrl -match $PRODUCTION_REF -or $coreUrl -match 'haxrsignature\.com') {
    throw "ABORT: Core URL looks like production"
  }

  if (-not (Test-Path $ProxyStore)) { throw "Missing proxy secret store. Run Core env script first." }
  if (-not (Test-Path $BypassStore)) { throw "Missing bypass store. Run create-core-protection-bypass.ps1 first." }
  $proxy = (Get-Content $ProxyStore -Raw).Trim()
  $bypass = (Get-Content $BypassStore -Raw).Trim()
  if (-not $proxy -or -not $bypass) { throw "Empty secret stores" }

  Add-BranchEnv -Name "HAXR_API_BACKEND" -Value "proxy"
  Add-BranchEnv -Name "HAXR_CORE_API_BASE_URL" -Value $coreUrl
  Add-BranchEnv -Name "HAXR_EDITION_PROXY_SECRET" -Value $proxy -Sensitive
  Add-BranchEnv -Name "HAXR_CORE_VERCEL_BYPASS_SECRET" -Value $bypass -Sensitive
  Add-BranchEnv -Name "EDITION_EVENT_JESSICA_TRADITIONAL_ID" -Value $SMOKE_EVENT
  Add-BranchEnv -Name "HAXR_PROXY_FALLBACK" -Value "false"

  $proxy = $null
  $bypass = $null
  Add-Content $Report "STATUS=OK"
  Write-Host "Edition Preview envs configured (names only in report)." -ForegroundColor Green
  Write-Host "Report: $Report"
  exit 0
}
catch {
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  Add-Content $Report ("STATUS=FAIL message={0}" -f $_.Exception.Message)
  exit 1
}
