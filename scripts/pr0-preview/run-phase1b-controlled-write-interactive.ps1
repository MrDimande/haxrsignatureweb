#Requires -Version 5.1
<#
  Phase 1B controlled write: create + idempotency against Edition Preview.
  Cleanup via clone DB (SecureString). Expects WRITE_MODE=preview_clone on Core.
#>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167"
$ED = ((Get-Content (Join-Path $env:TEMP "haxr-pr0-edition-preview-url.txt") -Raw).Trim()).Replace("https://","").TrimEnd("/")

function Invoke-EdRsvp([string]$Json, [string]$Label) {
  $tmp = Join-Path $env:TEMP ("haxr-p1b-{0}.json" -f [guid]::NewGuid().ToString("N"))
  [System.IO.File]::WriteAllText($tmp, $Json)
  Push-Location C:\project-x\projecto_haxrsignature
  $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  try {
    $out = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: application/json" --data-binary "@$tmp" 2>&1 | Out-String
  } finally {
    $ErrorActionPreference = $prev
    Pop-Location
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
  $status = if ($out -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
  $success = $out -match '"success"\s*:\s*true'
  $persisted = $out -match '"persisted"\s*:\s*true'
  $blocked = $out -match 'edition_rsvp_writes_disabled'
  Write-Host ("RSVP {0} status={1} success={2} persisted={3} blocked={4}" -f $Label,$status,$success,$persisted,$blocked)
  return @{ status=$status; success=$success; persisted=$persisted; blocked=$blocked }
}

try {
  Set-Location C:\project-x\haxrsignature
  Write-Host "Clone DB password for counts/cleanup." -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }

  $before = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Write-Host ("BEFORE " + $before.Trim())
  $bj = $before | ConvertFrom-Json
  if ($bj.guests -ne 139) { throw ("Expected guests=139 before, got {0}" -f $bj.guests) }

  $email = "pr0-phase1b-write+{0}@example.invalid" -f [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $phone = "840188{0}" -f (Get-Random -Minimum 1000 -Maximum 9999)
  $payload = (@{ slug="jessicaesamueltraditionalwedding"; name="PR0 Phase1B Write"; email=$email; phone=$phone; attending=$false; guests=1 } | ConvertTo-Json -Compress)

  $c = Invoke-EdRsvp $payload "create"
  if (-not ($c.status -eq "200" -and $c.success -and $c.persisted -and -not $c.blocked)) {
    throw "create failed"
  }

  Start-Sleep -Seconds 2
  $mid = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Write-Host ("AFTER_CREATE " + $mid.Trim())
  if (($mid | ConvertFrom-Json).guests -ne 140) { throw "expected 140 after create" }

  $i1 = Invoke-EdRsvp $payload "idempotent"
  if (-not ($i1.status -eq "200" -and $i1.persisted)) { throw "idempotent failed" }
  $mid2 = node scripts/pr0-preview/clone-counts.mjs | Out-String
  if (($mid2 | ConvertFrom-Json).guests -ne 140) { throw "idempotent changed count" }

  $env:HAXR_SMOKE_EVENT = $SMOKE
  $env:HAXR_RSVP_EMAIL = $email
  $verify = node scripts/pr0-preview/verify-synthetic-rsvp.mjs | Out-String
  Write-Host $verify
  $vj = $verify | ConvertFrom-Json
  if (-not $vj.guest.onSmoke) { throw "guest not on smoke" }
  $env:HAXR_GUEST_ID = $vj.guest.id
  $cleanup = node scripts/pr0-preview/cleanup-synthetic-guest.mjs | Out-String
  Write-Host $cleanup
  $cu = $cleanup | ConvertFrom-Json
  if ($cu.deleted -ne 1 -or $cu.counts.guests -ne 139) { throw "cleanup failed" }

  Write-Host "PHASE1B_WRITE_OK"
  exit 0
}
catch {
  Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
finally {
  Remove-Item Env:PR4_DATABASE_URL,Env:PGPASSWORD,Env:HAXR_SMOKE_EVENT,Env:HAXR_RSVP_EMAIL,Env:HAXR_GUEST_ID -ErrorAction SilentlyContinue
}
