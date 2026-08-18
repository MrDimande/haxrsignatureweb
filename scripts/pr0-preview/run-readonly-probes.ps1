#Requires -Version 5.1
<#
  Read-only probe matrix for Core + Edition Preview. Values/secrets never printed.
#>
$ErrorActionPreference = "Continue"
$CORE = (Get-Content (Join-Path $env:TEMP "haxr-pr0-core-preview-url.txt") -Raw).Trim().Replace("https://","")
$ED = (Get-Content (Join-Path $env:TEMP "haxr-pr0-edition-preview-url.txt") -Raw).Trim().Replace("https://","")
$Report = Join-Path $env:TEMP "haxr-pr0-readonly-probes.txt"
if (Test-Path $Report) { Remove-Item $Report -Force }

function Probe-Core([string]$Path, [string]$Method = "GET", [string]$Body = $null, [hashtable]$Headers = @{}) {
  $args = @("vercel","curl","--deployment",$CORE,"--yes",$Path,"-i","-X",$Method)
  foreach ($k in $Headers.Keys) {
    $args += @("-H", ("{0}: {1}" -f $k, $Headers[$k]))
  }
  if ($null -ne $Body) {
    $args += @("-H","Content-Type: application/json","--data-binary",$Body)
  }
  $out = & npx @args 2>$null | Out-String
  $status = if ($out -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
  $hasProd = $out.Contains("oxsrdmydlqyvnueedgtl")
  $hasSecretLeak = $out -match 'service_role|Bearer eyJ|proxy.secret|protection-bypass'
  Add-Content $Report ("CORE {0} {1} status={2} prodLeak={3} secretish={4} len={5}" -f $Method,$Path,$status,$hasProd,$hasSecretLeak,$out.Length)
  Write-Host ("CORE {0} {1} -> {2}" -f $Method,$Path,$status)
  return $status
}

function Probe-Edition([string]$Path) {
  Push-Location C:\project-x\projecto_haxrsignature
  try {
    $out = & npx vercel curl --deployment $ED --yes $Path -i 2>$null | Out-String
  } finally { Pop-Location }
  $status = if ($out -match 'HTTP/\S+\s+(\d+)') { $Matches[1] } else { "?" }
  $hasProd = $out.Contains("oxsrdmydlqyvnueedgtl")
  $hasReserved = $out.Contains("reservedBy")
  Add-Content $Report ("EDITION GET {0} status={1} prodLeak={2} reservedBy={3} len={4}" -f $Path,$status,$hasProd,$hasReserved,$out.Length)
  Write-Host ("EDITION GET {0} -> {1}" -f $Path,$status)
  return @{ status=$status; body=$out }
}

Set-Location C:\project-x\haxrsignature
Write-Host "Core=$CORE"
Write-Host "Edition=$ED"

# Core API rejects
Probe-Core "/api/v1/edition/rsvp" "GET" | Out-Null
Probe-Core "/api/v1/edition/rsvp" "POST" '{"slug":"jessicaesamueltraditionalwedding","fullName":"x","attending":false}' | Out-Null
Probe-Core "/api/v1/edition/rsvp" "POST" '{"slug":"jessicaesamueltraditionalwedding","fullName":"x","attending":false}' @{ Authorization = "Bearer invalid" } | Out-Null
Probe-Core "/api/v1/edition/rsvp" "POST" 'not-json' @{ Authorization = "Bearer invalid" } | Out-Null

# Edition pages
$trad = Probe-Edition "/jessicaesamueltraditionalwedding"
$unknown = Probe-Edition "/this-slug-does-not-exist-pr0"
$draft = Probe-Edition "/lobolo-jessica-samuel"
$gifts = Probe-Edition "/api/gifts"

Add-Content $Report ("tradHasPrimavera=" + $trad.body.Contains("primavera"))
Add-Content $Report ("tradHasRsvpFormHint=" + ($trad.body -match 'RSVP|Confirmar|attending|nome'))
Add-Content $Report "DONE"
Write-Host "Report=$Report"
