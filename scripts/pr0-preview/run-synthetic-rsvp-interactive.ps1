#Requires -Version 5.1
<#
  Synthetic RSVP Preview validation + clone verify/cleanup.
  After APPLY_OK. Secrets never printed.
#>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167"
$Report = Join-Path $env:TEMP "haxr-pr0-rsvp-final-report.txt"

$coreFile = Join-Path $env:TEMP "haxr-pr0-core-preview-url.txt"
$edFile = Join-Path $env:TEMP "haxr-pr0-edition-preview-url.txt"
if (-not (Test-Path $edFile)) {
  Set-Content -Path $edFile -Value "https://projecto-haxrsignature-edition-49n0e8z28.vercel.app"
}
$ED = ((Get-Content $edFile -Raw).Trim()).Replace("https://", "").TrimEnd("/")

function Clear-Creds {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Add-Report([string]$line) {
  Add-Content -Path $Report -Value $line
  Write-Host $line
}

function Invoke-EditionRsvp([string]$JsonBody, [string]$Label) {
  $tmpBody = Join-Path $env:TEMP ("haxr-pr0-body-{0}.json" -f [guid]::NewGuid().ToString("N"))
  [System.IO.File]::WriteAllText($tmpBody, $JsonBody)
  Push-Location C:\project-x\projecto_haxrsignature
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $out = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: application/json" --data-binary ("@{0}" -f $tmpBody) 2>&1 | Out-String
  } finally {
    $ErrorActionPreference = $prev
    Pop-Location
    Remove-Item $tmpBody -Force -ErrorAction SilentlyContinue
  }
  $status = if ($out -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
  $success = $out -match '"success"\s*:\s*true'
  $persisted = $out -match '"persisted"\s*:\s*true'
  $attFalse = $out -match '"attending"\s*:\s*false'
  $prodLeak = $out.Contains($PRODUCTION_REF)
  Add-Report ("RSVP {0} status={1} success={2} persisted={3} attendingFalse={4} prodLeak={5}" -f $Label,$status,$success,$persisted,$attFalse,$prodLeak)
  return @{ status = $status; success = $success; persisted = $persisted; raw = $out }
}

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  Set-Location C:\project-x\haxrsignature
  Add-Report ("Edition=$ED")
  Add-Report ("SmokeEvent=$SMOKE")

  Write-Host "Clone DB password for counts/verify/cleanup (hidden)." -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }

  $before = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Add-Report ("BEFORE " + $before.Trim())
  $beforeJson = $before | ConvertFrom-Json
  if ($beforeJson.events -ne 7 -or $beforeJson.guests -ne 139) {
    throw ("ABORT unexpected before counts events={0} guests={1}" -f $beforeJson.events, $beforeJson.guests)
  }

  $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $email = "pr0-integration-preview+$ts@example.invalid"
  $phone = "840199$($ts.ToString().Substring($ts.ToString().Length - 4))"
  $name = "PR0 Integration Preview"

  $payload = (@{
    slug = "jessicaesamueltraditionalwedding"
    name = $name
    email = $email
    phone = $phone
    attending = $false
    guests = 1
  } | ConvertTo-Json -Compress)

  $r1 = Invoke-EditionRsvp $payload "create"
  if (-not $r1.success -or -not $r1.persisted) {
    throw ("Create RSVP failed status={0} persisted={1}" -f $r1.status, $r1.persisted)
  }

  Start-Sleep -Seconds 2
  $env:HAXR_SMOKE_EVENT = $SMOKE
  $env:HAXR_RSVP_EMAIL = $email
  $afterCreate = & node scripts/pr0-preview/verify-synthetic-rsvp.mjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw ("verify failed: " + $afterCreate) }
  Add-Report ("AFTER_CREATE " + (($afterCreate | ForEach-Object { "$_" }) -join "`n").Trim())
  $ac = (($afterCreate | ForEach-Object { "$_" }) -join "`n") | ConvertFrom-Json
  if ($ac.matchCount -ne 1 -or $ac.counts.guests -ne 140 -or -not $ac.guest.onSmoke) {
    throw "ABORT after create verification failed"
  }
  if ($ac.guest.guest_source -ne "edition_rsvp" -or $ac.guest.status -ne "declined") {
    throw ("ABORT unexpected guest_source/status source={0} status={1}" -f $ac.guest.guest_source, $ac.guest.status)
  }
  $guestId = $ac.guest.id
  $env:HAXR_GUEST_ID = $guestId

  # Exact idempotent
  $r2 = Invoke-EditionRsvp $payload "idempotent_exact"
  # Normalize email/phone
  $payloadNorm = (@{
    slug = "jessicaesamueltraditionalwedding"
    name = $name
    email = $email.ToUpperInvariant()
    phone = ("+258 {0} {1}" -f $phone.Substring(0,2), $phone.Substring(2))
    attending = $false
    guests = 1
  } | ConvertTo-Json -Compress)
  $r3 = Invoke-EditionRsvp $payloadNorm "idempotent_normalize"

  $midCounts = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Add-Report ("AFTER_IDEMPOTENCY " + $midCounts.Trim())
  $mid = $midCounts | ConvertFrom-Json
  if ($mid.guests -ne 140) { throw ("ABORT guests changed after idempotency: {0}" -f $mid.guests) }

  # Invalid attending / slug / content-type / oversized
  $guestsBeforeInvalid = $mid.guests
  Invoke-EditionRsvp ((@{slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending="false"; guests=1} | ConvertTo-Json -Compress) ) "attending_string_false" | Out-Null
  Invoke-EditionRsvp ((@{slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending="0"; guests=1} | ConvertTo-Json -Compress) ) "attending_string_0" | Out-Null
  Invoke-EditionRsvp ((@{slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending="maybe"; guests=1} | ConvertTo-Json -Compress) ) "attending_invalid" | Out-Null
  Invoke-EditionRsvp ((@{slug="evento-fantasma-pr0"; name=$name; email=$email; phone=$phone; attending=$false; guests=1} | ConvertTo-Json -Compress) ) "slug_invalid" | Out-Null

  Push-Location C:\project-x\projecto_haxrsignature
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $outCt = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: text/plain" --data-binary "hello" 2>&1 | Out-String
  $stCt = if ($outCt -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
  Add-Report ("RSVP content_type_invalid status=$stCt")
  $big = "x" * 20000
  $tmpBig = Join-Path $env:TEMP "haxr-pr0-big.json"
  [System.IO.File]::WriteAllText($tmpBig, ((@{slug="jessicaesamueltraditionalwedding"; name=$big; attending=$false} | ConvertTo-Json -Compress)))
  $outBig = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: application/json" --data-binary "@$tmpBig" 2>&1 | Out-String
  $stBig = if ($outBig -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
  Add-Report ("RSVP body_over_limit status=$stBig")
  Remove-Item $tmpBig -Force -ErrorAction SilentlyContinue
  $ErrorActionPreference = $prev
  Pop-Location

  $afterInvalid = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Add-Report ("AFTER_INVALID " + $afterInvalid.Trim())
  $ai = $afterInvalid | ConvertFrom-Json
  if ($ai.guests -ne $guestsBeforeInvalid) { throw "ABORT invalid payloads changed guest count" }

  # Cleanup exact guest
  $env:HAXR_GUEST_ID = $guestId
  $cleanup = & node scripts/pr0-preview/cleanup-synthetic-guest.mjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw ("cleanup failed: " + $cleanup) }
  Add-Report ("CLEANUP " + (($cleanup | ForEach-Object { "$_" }) -join "`n").Trim())
  $cu = (($cleanup | ForEach-Object { "$_" }) -join "`n") | ConvertFrom-Json
  if ($cu.deleted -ne 1 -or $cu.counts.guests -ne 139 -or $cu.counts.events -ne 7 -or $cu.counts.migrations -ne 19 -or $cu.straySynthetic -ne 0) {
    throw "ABORT cleanup validation failed"
  }

  Add-Report "STATUS=OK"
  Write-Host "RSVP validation complete. Reply: RSVP_OK" -ForegroundColor Green
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
  Remove-Item Env:HAXR_SMOKE_EVENT,Env:HAXR_RSVP_EMAIL,Env:HAXR_GUEST_ID -ErrorAction SilentlyContinue
}
