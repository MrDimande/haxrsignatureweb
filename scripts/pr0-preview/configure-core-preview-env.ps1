#Requires -Version 5.1
<#
.SYNOPSIS
  Configure Core Preview branch-specific env for clone + synthetic proxy secret.
  Sensitive values via SecureString; never printed.
#>
$ErrorActionPreference = "Stop"

$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$BRANCH = "feature/admin-edition-phase0"
$CLONE_URL = "https://$CLONE_REF.supabase.co"
$Report = Join-Path $env:TEMP "haxr-core-preview-env-report.txt"
$SecretStore = Join-Path $env:TEMP "haxr-pr0-preview-proxy-secret.txt"

function Clear-Sensitive {
  Remove-Item Env:HAXR_TMP_ANON -ErrorAction SilentlyContinue
  Remove-Item Env:HAXR_TMP_SERVICE -ErrorAction SilentlyContinue
  Remove-Item Env:HAXR_TMP_PROXY -ErrorAction SilentlyContinue
}

function ConvertFrom-SecureStringPlain([Security.SecureString]$Secure) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
  }
}

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
  Clear-Sensitive
  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
  Set-Location $RepoRoot

  Write-Host "=== Core Preview branch-specific env ===" -ForegroundColor Cyan
  Write-Host "Branch: $BRANCH"
  Write-Host "Clone URL: $CLONE_URL"
  Write-Host "Production ref blocked: $PRODUCTION_REF"
  Write-Host ""
  Write-Host "Paste clone keys from Supabase Dashboard (hidden). Do NOT paste into Cursor chat." -ForegroundColor Yellow
  Write-Host ""

  $anonSecure = Read-Host -AsSecureString "Clone NEXT_PUBLIC_SUPABASE_ANON_KEY"
  $svcSecure = Read-Host -AsSecureString "Clone SUPABASE_SERVICE_ROLE_KEY"

  $anon = ConvertFrom-SecureStringPlain $anonSecure
  $svc = ConvertFrom-SecureStringPlain $svcSecure
  if ([string]::IsNullOrWhiteSpace($anon) -or [string]::IsNullOrWhiteSpace($svc)) {
    throw "ABORT: empty key"
  }
  if ($anon -match $PRODUCTION_REF -or $svc -match $PRODUCTION_REF) {
    throw "ABORT: key material mentions production ref"
  }

  $proxyBytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($proxyBytes)
  $proxy = ([BitConverter]::ToString($proxyBytes) -replace "-", "").ToLowerInvariant()
  Set-Content -Path $SecretStore -Value $proxy -Encoding ascii
  # Restrict ACL to current user on Windows
  icacls $SecretStore /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null

  Write-Host "Writing branch-specific Preview envs (no values printed)..." -ForegroundColor Cyan
  Add-BranchEnv -Name "NEXT_PUBLIC_SUPABASE_URL" -Value $CLONE_URL
  Add-BranchEnv -Name "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Value $anon -Sensitive
  Add-BranchEnv -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $svc -Sensitive
  Add-BranchEnv -Name "HAXR_EDITION_PROXY_SECRET" -Value $proxy -Sensitive
  Add-BranchEnv -Name "HAXR_REQUIRE_EDITION_PROXY_AUTH" -Value "true"
  Add-BranchEnv -Name "EMAIL_SEND_MODE" -Value "disabled"

  $anon = $null
  $svc = $null
  $proxy = $null
  Clear-Sensitive

  Add-Content -Path $Report -Value ("PROXY_SECRET_STORE={0}" -f $SecretStore)
  Add-Content -Path $Report -Value "STATUS=OK"
  Write-Host "Done. Report: $Report" -ForegroundColor Green
  Write-Host "Proxy secret stored for Edition sync at temp path (not printed)." -ForegroundColor Green
  exit 0
}
catch {
  Clear-Sensitive
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  Add-Content -Path $Report -Value ("STATUS=FAIL message={0}" -f $_.Exception.Message)
  exit 1
}
finally {
  Clear-Sensitive
}
