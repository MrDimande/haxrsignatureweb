#Requires -Version 5.1
<#
.SYNOPSIS
  Remove HAXR_CORE_VERCEL_BYPASS_SECRET from Edition Preview branch env.
#>
$ErrorActionPreference = "Stop"
$BRANCH = "feature/edition-phase0-security-slugs"
$Report = Join-Path $env:TEMP "haxr-pr0-edition-bypass-env-remove-report.txt"
$EditionRoot = "C:\project-x\projecto_haxrsignature"

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  if (-not (Test-Path $EditionRoot)) { throw "Edition repo not found: $EditionRoot" }
  Set-Location $EditionRoot

  Write-Host "Removing Edition Preview HAXR_CORE_VERCEL_BYPASS_SECRET..." -ForegroundColor Cyan
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  # Non-interactive remove for preview + specific git branch when supported
  $out = & npx vercel env remove HAXR_CORE_VERCEL_BYPASS_SECRET preview $BRANCH --yes 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    # Fallback: remove without branch arg (may target all preview) — abort rather than broad delete
    Add-Content $Report ("REMOVE_ATTEMPT=" + ($out -replace '[A-Za-z0-9]{20,}', '[REDACTED]'))
    throw ("env remove failed exit={0}" -f $LASTEXITCODE)
  }
  $ErrorActionPreference = $prev

  Add-Content $Report "STATUS=OK"
  Add-Content $Report ("REMOVED=HAXR_CORE_VERCEL_BYPASS_SECRET env=preview branch={0}" -f $BRANCH)
  Write-Host "Edition bypass env removed from Preview branch." -ForegroundColor Green
  Write-Host ("Report: {0}" -f $Report)
  exit 0
}
catch {
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  Add-Content $Report ("STATUS=FAIL message={0}" -f $_.Exception.Message)
  exit 1
}
