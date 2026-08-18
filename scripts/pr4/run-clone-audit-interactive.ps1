#Requires -Version 5.1
<#
.SYNOPSIS
  Prompt for clone DB password via SecureString and run read-only audit.
#>
$ErrorActionPreference = "Stop"

$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$reportPath = Join-Path $env:TEMP "haxr-clone-audit-report.txt"
$bootPath = Join-Path $env:TEMP "haxr-clone-audit-boot.txt"
$exitCode = 1

function Write-Boot([string]$msg) {
  Add-Content -Path $bootPath -Value ("{0:o} {1}" -f (Get-Date).ToUniversalTime(), $msg) -Encoding utf8
}

function Clear-CloneAuditCredentials {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSFILE -ErrorAction SilentlyContinue
}

try {
  if (Test-Path $bootPath) { Remove-Item $bootPath -Force }
  if (Test-Path $reportPath) { Remove-Item $reportPath -Force }
  Write-Boot "start"
  Write-Boot ("pwd=" + (Get-Location).Path)

  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
  Set-Location $RepoRoot
  Write-Boot ("repo=" + $RepoRoot.Path)

  Clear-CloneAuditCredentials

  if ($env:PR4_SOURCE_DATABASE_URL) {
    Write-Boot "abort: PR4_SOURCE_DATABASE_URL set"
    throw "ABORT: PR4_SOURCE_DATABASE_URL is set. Remove it before audit."
  }

  Write-Host "=== Clone read-only audit ===" -ForegroundColor Cyan
  Write-Host "Project ref: $CLONE_REF"
  Write-Host "Production ref blocked: $PRODUCTION_REF"
  Write-Host "SQL mode: SELECT-only"
  Write-Host ""
  Write-Host "Enter the clone DB password (hidden input)." -ForegroundColor Yellow
  Write-Host "Do NOT paste the password into the Cursor chat." -ForegroundColor Yellow
  Write-Host ""

  $secure = Read-Host -AsSecureString "Clone DB password"
  if (-not $secure -or $secure.Length -eq 0) {
    Write-Boot "abort: empty secure password"
    throw "ABORT: empty password."
  }
  Write-Boot "password_received_secure"

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
  }

  if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Boot "abort: empty plain password"
    throw "ABORT: empty password after SecureString."
  }

  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  Remove-Variable plain -ErrorAction SilentlyContinue
  Write-Boot "env_set_in_memory"

  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) {
    throw "ABORT: URL points to production."
  }
  if ($env:PR4_DATABASE_URL -notmatch $CLONE_REF) {
    throw "ABORT: URL does not point to clone."
  }
  if ($env:PR4_DATABASE_URL -match ":[^/@]+@") {
    throw "ABORT: password detected in URL."
  }

  Write-Host "Running read-only audit..." -ForegroundColor Cyan
  Write-Boot "node_start"
  & node ".\scripts\pr4\audit-clone-readiness.mjs" *>&1 |
    Tee-Object -FilePath $reportPath
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) { $exitCode = 0 }
  Write-Boot ("node_exit=" + $exitCode)
} catch {
  $exitCode = 1
  Write-Boot ("error=" + $_.Exception.Message)
  Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
  "FAIL=$($_.Exception.Message)" | Set-Content -Path $reportPath -Encoding utf8
} finally {
  Clear-CloneAuditCredentials
  Write-Boot "credentials_cleared"
  Write-Host "CREDENTIALS_CLEARED=true" -ForegroundColor Green
  Write-Host "productionTouched=false"
  if (Test-Path $reportPath) {
    Add-Content -Path $reportPath -Value "CREDENTIALS_CLEARED=true" -Encoding utf8
    Add-Content -Path $reportPath -Value "productionTouched=false" -Encoding utf8
    Add-Content -Path $reportPath -Value ("WRAPPER_EXIT=" + $exitCode) -Encoding utf8
  } else {
    @(
      "FAIL=no report generated",
      "CREDENTIALS_CLEARED=true",
      "productionTouched=false",
      ("WRAPPER_EXIT=" + $exitCode)
    ) | Set-Content -Path $reportPath -Encoding utf8
  }
  Write-Host ""
  Write-Host "Window closes in 12s..." -ForegroundColor DarkGray
  Start-Sleep -Seconds 12
}

exit $exitCode
