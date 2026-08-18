#Requires -Version 5.1
<#
  Continue PR0 RSVP validation after successful create (persisted=true)
  when verify crashed. Uses existing synthetic guest on Smoke Event A.
#>
$ErrorActionPreference = "Stop"
$CLONE_REF = "rkkxfrwtmsqzpnbkshnd"
$PRODUCTION_REF = "oxsrdmydlqyvnueedgtl"
$SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167"
$Report = Join-Path $env:TEMP "haxr-pr0-rsvp-continue-report.txt"
$edFile = Join-Path $env:TEMP "haxr-pr0-edition-preview-url.txt"
if (-not (Test-Path $edFile)) {
  Set-Content $edFile "https://projecto-haxrsignature-edition-49n0e8z28.vercel.app"
}
$ED = ((Get-Content $edFile -Raw).Trim()).Replace("https://", "").TrimEnd("/")

function Clear-Creds {
  Remove-Item Env:PR4_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
function Add-Report([string]$line) {
  Add-Content $Report $line
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
  Add-Report ("RSVP {0} status={1} success={2} persisted={3} attendingFalse={4}" -f $Label,$status,$success,$persisted,$attFalse)
  return @{ status=$status; success=$success; persisted=$persisted }
}

try {
  if (Test-Path $Report) { Remove-Item $Report -Force }
  Set-Location C:\project-x\haxrsignature
  Add-Report ("Edition=$ED")

  Write-Host "Clone DB password (hidden)." -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString "Clone DB password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  $env:PR4_DATABASE_URL = "postgresql://postgres.$CLONE_REF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  $env:PGPASSWORD = $plain
  $plain = $null
  if ($env:PR4_DATABASE_URL -match $PRODUCTION_REF) { throw "ABORT prod" }

  $env:HAXR_SMOKE_EVENT = $SMOKE

  $findOut = & node scripts/pr0-preview/find-synthetic-guest.mjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw ("find failed: " + $findOut) }
  Add-Report $findOut
  $found = $findOut | ConvertFrom-Json
  if (-not $found.guest) { throw "No synthetic guest found - run full RSVP script instead" }
  if ($found.guests -ne 140) { throw ("Expected guests=140, got {0}" -f $found.guests) }

  $email = $found.guest.email
  $phone = $found.guest.phone
  $guestId = $found.guest.id
  $name = "PR0 Integration Preview"
  $env:HAXR_GUEST_ID = $guestId
  $env:HAXR_RSVP_EMAIL = $email

  $payload = (@{ slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending=$false; guests=1 } | ConvertTo-Json -Compress)
  Invoke-EditionRsvp $payload "idempotent_exact" | Out-Null
  $payloadNorm = (@{ slug="jessicaesamueltraditionalwedding"; name=$name; email=$email.ToUpperInvariant(); phone=("+258 {0} {1}" -f $phone.Substring(0,[Math]::Min(2,$phone.Length)), $phone.Substring([Math]::Min(2,$phone.Length))); attending=$false; guests=1 } | ConvertTo-Json -Compress)
  Invoke-EditionRsvp $payloadNorm "idempotent_normalize" | Out-Null

  $mid = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Add-Report ("AFTER_IDEMPOTENCY " + $mid.Trim())
  $midJ = $mid | ConvertFrom-Json
  if ($midJ.guests -ne 140) { throw "idempotency changed guest count" }

  Invoke-EditionRsvp ((@{slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending="false"; guests=1}|ConvertTo-Json -Compress)) "attending_string_false" | Out-Null
  Invoke-EditionRsvp ((@{slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending="0"; guests=1}|ConvertTo-Json -Compress)) "attending_string_0" | Out-Null
  Invoke-EditionRsvp ((@{slug="jessicaesamueltraditionalwedding"; name=$name; email=$email; phone=$phone; attending="maybe"; guests=1}|ConvertTo-Json -Compress)) "attending_invalid" | Out-Null
  Invoke-EditionRsvp ((@{slug="evento-fantasma-pr0"; name=$name; email=$email; phone=$phone; attending=$false; guests=1}|ConvertTo-Json -Compress)) "slug_invalid" | Out-Null

  Push-Location C:\project-x\projecto_haxrsignature
  $prev=$ErrorActionPreference; $ErrorActionPreference="Continue"
  $outCt = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: text/plain" --data-binary "hello" 2>&1 | Out-String
  Add-Report ("RSVP content_type_invalid status=" + $(if($outCt -match 'HTTP/\S+\s+(\d+)'){$Matches[1]}else{'?'}))
  $tmpBig = Join-Path $env:TEMP "haxr-pr0-big.json"
  [System.IO.File]::WriteAllText($tmpBig, ((@{slug="jessicaesamueltraditionalwedding"; name=("x"*20000); attending=$false}|ConvertTo-Json -Compress)))
  $outBig = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: application/json" --data-binary "@$tmpBig" 2>&1 | Out-String
  Add-Report ("RSVP body_over_limit status=" + $(if($outBig -match 'HTTP/\S+\s+(\d+)'){$Matches[1]}else{'?'}))
  Remove-Item $tmpBig -Force -ErrorAction SilentlyContinue
  $ErrorActionPreference=$prev
  Pop-Location

  $afterInv = node scripts/pr0-preview/clone-counts.mjs | Out-String
  Add-Report ("AFTER_INVALID " + $afterInv.Trim())
  if (($afterInv | ConvertFrom-Json).guests -ne 140) { throw "invalid tests changed count" }

  $cleanup = & node scripts/pr0-preview/cleanup-synthetic-guest.mjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw ("cleanup failed: " + $cleanup) }
  Add-Report $cleanup
  $cu = $cleanup | ConvertFrom-Json
  if ($cu.deleted -ne 1 -or $cu.counts.guests -ne 139 -or $cu.counts.events -ne 7 -or $cu.counts.migrations -ne 19 -or $cu.straySynthetic -ne 0) {
    throw "cleanup validation failed"
  }

  Add-Report "STATUS=OK"
  Write-Host "Reply: RSVP_OK" -ForegroundColor Green
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
