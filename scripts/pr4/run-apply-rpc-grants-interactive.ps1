#Requires -Version 5.1
<#
.SYNOPSIS
  Apply clone RPC grant hardening + re-audit (SecureString password).
#>
$ErrorActionPreference = "Stop"

$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$reportPath = Join-Path $env:TEMP "haxr-rpc-apply-report.txt"
$bootPath = Join-Path $env:TEMP "haxr-rpc-apply-boot.txt"
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
  Write-Boot "GO_AUTHORIZED=true"

  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
  Set-Location $RepoRoot
  Write-Boot ("repo=" + $RepoRoot.Path)
  Clear-CloneAuditCredentials

  if ($env:PR4_SOURCE_DATABASE_URL) {
    throw "ABORT: PR4_SOURCE_DATABASE_URL is set."
  }

  Write-Host "=== APPLY clone RPC grants (authorized) ===" -ForegroundColor Cyan
  Write-Host "Clone: $CLONE_REF"
  Write-Host "Production blocked: $PRODUCTION_REF"
  Write-Host "Scope: GRANT/REVOKE only on submit_edition_rsvp"
  Write-Host ""
  Write-Host "Enter clone DB password (hidden)." -ForegroundColor Yellow

  $secure = Read-Host -AsSecureString "Clone DB password"
  if (-not $secure -or $secure.Length -eq 0) { throw "ABORT: empty password." }
  Write-Boot "password_received_secure"

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
  }
  if ([string]::IsNullOrWhiteSpace($plain)) { throw "ABORT: empty password after SecureString." }

  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  Remove-Variable plain -ErrorAction SilentlyContinue
  Write-Boot "env_set_in_memory"

  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT: production URL." }
  if ($env:PR4_DATABASE_URL -notmatch $CLONE_REF) { throw "ABORT: not clone URL." }
  if ($env:PR4_DATABASE_URL -match ":[^/@]+@") { throw "ABORT: password in URL." }

  Write-Host "Applying patch..." -ForegroundColor Cyan
  Write-Boot "apply_start"
  & node ".\scripts\pr4\apply-clone-rpc-grants.mjs" *>&1 | Tee-Object -FilePath $reportPath
  if ($LASTEXITCODE -ne 0) {
    Write-Boot ("apply_exit=" + $LASTEXITCODE)
    throw "ABORT: apply failed; transaction should have rolled back."
  }
  Write-Boot "apply_ok"

  Write-Host "Re-running readiness audit..." -ForegroundColor Cyan
  Write-Boot "audit_start"
  & node ".\scripts\pr4\audit-clone-readiness.mjs" *>&1 | Tee-Object -FilePath $reportPath -Append
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) { $exitCode = 0 }
  Write-Boot ("audit_exit=" + $exitCode)
} catch {
  $exitCode = 1
  Write-Boot ("error=" + $_.Exception.Message)
  Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
  "FAIL=$($_.Exception.Message)" | Add-Content -Path $reportPath -Encoding utf8
} finally {
  Clear-CloneAuditCredentials
  Write-Boot "credentials_cleared"
  Write-Host "CREDENTIALS_CLEARED=true" -ForegroundColor Green
  Write-Host "productionTouched=false"
  Add-Content -Path $reportPath -Value "CREDENTIALS_CLEARED=true" -Encoding utf8
  Add-Content -Path $reportPath -Value "productionTouched=false" -Encoding utf8
  Add-Content -Path $reportPath -Value ("WRAPPER_EXIT=" + $exitCode) -Encoding utf8
  Start-Sleep -Seconds 10
}

exit $exitCode
