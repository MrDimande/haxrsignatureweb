# Refresh PATH for the official Windows Supabase CLI (not the broken npx wrapper).
# Usage (current PowerShell session):
#   . .\scripts\use-supabase-cli.ps1
#   supabase --version

$cliDir = Join-Path $env:LOCALAPPDATA "supabase-cli"
$exe = Join-Path $cliDir "supabase.exe"

if (-not (Test-Path $exe)) {
  Write-Error "Supabase CLI not found at $exe. Install the official Windows amd64 release first."
  return
}

if ($env:Path -notlike "*$cliDir*") {
  $env:Path = "$cliDir;$env:Path"
}

Write-Host "supabase -> $((Get-Command supabase).Source)"
supabase --version
