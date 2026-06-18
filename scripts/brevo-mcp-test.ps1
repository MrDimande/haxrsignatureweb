# Testar Brevo MCP — modo OAuth-only (sem header Bearer conflituoso)
# Uso: powershell -File scripts/brevo-mcp-test.ps1 [-OAuthOnly]
param([switch]$OAuthOnly)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

# Limpar lockfiles
$lockDir = Join-Path $env:LOCALAPPDATA "mcp-remote"
if (Test-Path $lockDir) {
  Remove-Item -Recurse -Force $lockDir -ErrorAction SilentlyContinue
  Write-Host "Lockfiles removidos"
}

if ($OAuthOnly) {
  Write-Host "Modo OAuth-only (sem header Bearer)..."
  Write-Host "Se funcionar, a chave API REST nao e token MCP — OAuth basta."
  Write-Host ""
  npx -y mcp-remote@latest https://mcp.brevo.com/v1/brevo/mcp
  exit $LASTEXITCODE
}

$envFile = Join-Path $root ".env.local"
$token = $null
$mcpToken = $null
foreach ($line in Get-Content $envFile) {
  if ($line -match '^BREVO_MCP_TOKEN=(.+)$') { $mcpToken = $Matches[1].Trim() }
  if ($line -match '^BREVO_API_KEY=(.+)$') { $token = $Matches[1].Trim() }
}
$use = if ($mcpToken) { $mcpToken } else { $token }
if (-not $use) { Write-Error "BREVO_MCP_TOKEN ou BREVO_API_KEY em falta" }

if (-not $mcpToken) {
  Write-Host "AVISO: BREVO_MCP_TOKEN em falta — a usar BREVO_API_KEY."
  Write-Host "Se der 401, cria chave MCP no Brevo (checkbox MCP) e define BREVO_MCP_TOKEN."
  Write-Host ""
}

$env:BREVO_MCP_TOKEN = $use
Write-Host "A ligar com Bearer ...$($use.Substring($use.Length - 8))"
npx -y mcp-remote@latest `
  https://mcp.brevo.com/v1/brevo/mcp `
  --header "Authorization: Bearer ${env:BREVO_MCP_TOKEN}"
