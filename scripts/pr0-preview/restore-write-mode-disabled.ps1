#Requires -Version 5.1
<# Restore WRITE_MODE=disabled on Core Preview branch and trigger Git redeploy. #>
$ErrorActionPreference = "Stop"
$BRANCH = "feature/admin-edition-phase0"
Set-Location C:\project-x\haxrsignature
"disabled" | npx vercel env add HAXR_EDITION_RSVP_WRITE_MODE preview $BRANCH --yes --force 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "failed to set disabled" }
Write-Host "SET write_mode=disabled"
Set-Location C:\project-x\haxrsignature-phase0-clean
git commit --allow-empty -m "chore(preview): restore edition RSVP write mode disabled after Phase 1B"
git push origin HEAD
Write-Host "PUSH_OK — wait for Vercel Preview, then probe 503"
