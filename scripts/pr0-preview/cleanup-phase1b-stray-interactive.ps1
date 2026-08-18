#Requires -Version 5.1
<# Cleanup accidental Phase1B probe guests (pr0-phase1b%) on clone only. #>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167"

Write-Host "Clone DB password (cleanup phase1b stray probes)." -ForegroundColor Yellow
$secure = Read-Host -AsSecureString "Clone DB password"
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
$env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
$env:PGPASSWORD = $plain
$plain = $null
if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }
$env:HAXR_SMOKE_EVENT = $SMOKE
Set-Location C:\project-x\haxrsignature
node scripts/pr0-preview/cleanup-phase1b-stray.mjs
Remove-Item Env:PR4_DATABASE_URL,Env:PGPASSWORD,Env:HAXR_SMOKE_EVENT -ErrorAction SilentlyContinue
