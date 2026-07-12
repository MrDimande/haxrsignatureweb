# PR.4 — exporta PR4_* da sessão actual para pr4-env.local (gitignored).
# Valores NUNCA são impressos. Executar no terminal onde as variáveis já estão definidas.

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outFile = Join-Path $root "pr4-env.local"

$names = @("PR4_SOURCE_DATABASE_URL", "PR4_DATABASE_URL")
$lines = New-Object System.Collections.Generic.List[string]

foreach ($name in $names) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not $value) {
        Write-Error "Variável em falta na sessão: $name"
        exit 1
    }
    $lines.Add("$name=$value")
}

[System.IO.File]::WriteAllLines($outFile, $lines.ToArray())
Write-Output "pr4-env.local escrito ($($lines.Count) chaves, valores omitidos)"
