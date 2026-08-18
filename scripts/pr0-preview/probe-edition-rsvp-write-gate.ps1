#Requires -Version 5.1
<#
  Phase 1B: probe Edition → Core RSVP with write-gate expectations.
  Does not print secrets. Optional clone count via interactive password elsewhere.
#>
$ErrorActionPreference = "Continue"
$EditionFile = Join-Path $env:TEMP "haxr-pr0-edition-preview-url.txt"
$CoreFile = Join-Path $env:TEMP "haxr-pr0-core-preview-url.txt"
if (-not (Test-Path $EditionFile)) {
  Set-Content $EditionFile "https://projecto-haxrsignature-edition-2qxptd42p.vercel.app"
}
$ED = ((Get-Content $EditionFile -Raw).Trim()).Replace("https://", "").TrimEnd("/")
$email = "pr0-phase1b+{0}@example.invalid" -f [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$body = (@{
  slug = "jessicaesamueltraditionalwedding"
  name = "PR0 Phase1B Gate"
  email = $email
  phone = "8401990001"
  attending = $false
  guests = 1
} | ConvertTo-Json -Compress)
$tmp = Join-Path $env:TEMP "haxr-phase1b-rsvp.json"
[System.IO.File]::WriteAllText($tmp, $body)

Push-Location C:\project-x\projecto_haxrsignature
try {
  $out = & npx vercel curl --deployment $ED --yes /api/rsvp -i -X POST -H "Content-Type: application/json" --data-binary "@$tmp" 2>&1 | Out-String
} finally {
  Pop-Location
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

$status = if ($out -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
$hasCode = $out -match 'edition_rsvp_writes_disabled'
$persisted = $out -match '"persisted"\s*:\s*true'
$success = $out -match '"success"\s*:\s*true'
Write-Host ("editionRsvp status={0} success={1} persisted={2} writesDisabledCode={3}" -f $status,$success,$persisted,$hasCode)
# Redacted short body
if ($out -match '\{[^\n]*"success"[^\n]*\}') {
  $j = $Matches[0]
  Write-Host ("body=" + ($j -replace 'eyJ[A-Za-z0-9._-]+','[JWT]'))
}
