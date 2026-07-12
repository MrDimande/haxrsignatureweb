# PR.3 — cifra o backup pre-036 com password introduzida manualmente pelo proprietario.
# Nunca grava nem imprime a password. Nao commitar artefactos gerados (backups/ esta gitignored).
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

$BackupDir = Resolve-Path "backups/pr3-production-pre036/2026-07-12T06-48-00"
$TarPath = Join-Path (Split-Path $BackupDir -Parent) "2026-07-12T06-48-00.tar.gz"
$EncPath = "$TarPath.enc"

$OpenSslCandidates = @(
    "C:\Program Files\edb\as18\bin\openssl.exe",
    "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
    "openssl"
)

$OpenSsl = $null
foreach ($candidate in $OpenSslCandidates) {
    if ($candidate -eq "openssl") {
        $cmd = Get-Command openssl -ErrorAction SilentlyContinue
        if ($cmd) { $OpenSsl = $cmd.Source; break }
    }
    elseif (Test-Path $candidate) {
        $OpenSsl = $candidate
        break
    }
}

if (-not $OpenSsl) {
    Write-Error "ABORT: openssl nao encontrado."
    exit 1
}

Write-Output "PR.3 backup encryption"
Write-Output "Source dir: $BackupDir"
Write-Output "Output:     $EncPath"
Write-Output ""
Write-Output "A password sera pedida duas vezes. Nunca e guardada em disco nem impressa."
Write-Output ""

$secure1 = Read-Host "Password do arquivo cifrado (proprietario)" -AsSecureString
$secure2 = Read-Host "Confirmar password" -AsSecureString

function Test-SecureEqual([Security.SecureString]$a, [Security.SecureString]$b) {
    $pa = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($a)
    $pb = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($b)
    try {
        $sa = [Runtime.InteropServices.Marshal]::PtrToStringAuto($pa)
        $sb = [Runtime.InteropServices.Marshal]::PtrToStringAuto($pb)
        return $sa -ceq $sb
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pa) | Out-Null
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pb) | Out-Null
    }
}

if (-not (Test-SecureEqual $secure1 $secure2)) {
    Write-Error "ABORT: passwords nao coincidem."
    exit 1
}

$passFile = New-TemporaryFile
try {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure1)
    try {
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
        Set-Content -Path $passFile.FullName -Value $plain -NoNewline -Encoding ascii
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) | Out-Null
    }

    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
    if (Test-Path $EncPath) { Remove-Item $EncPath -Force }

    Write-Output "A criar tarball (backup original preservado)..."
    tar -czf $TarPath -C (Split-Path $BackupDir -Parent) (Split-Path $BackupDir -Leaf)
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ABORT: tar falhou."
        exit 1
    }

    Write-Output "A cifrar com AES-256-CBC + PBKDF2..."
    & $OpenSsl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 `
        -in $TarPath -out $EncPath -pass file:$($passFile.FullName)
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ABORT: openssl enc falhou."
        exit 1
    }

    Write-Output "A verificar integridade do arquivo cifrado..."
    & $OpenSsl enc -d -aes-256-cbc -pbkdf2 -iter 100000 `
        -in $EncPath -pass file:$($passFile.FullName) | tar -tzf - > $null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ABORT: verificacao do arquivo cifrado falhou."
        exit 1
    }

    Remove-Item $TarPath -Force
    Write-Output ""
    Write-Output "PASS: backup cifrado verificado."
    Write-Output "Encrypted file: $EncPath"
    Write-Output "Original backup dir preserved: $BackupDir"
    Write-Output ""
    Write-Output "Custodia:"
    Write-Output "  Autorizacao: Proprietario do projecto — Dimande"
    Write-Output "  Custodiante: Proprietario do projecto — Dimande"
    Write-Output "  Executor:    operador tecnico local sob autorizacao"
}
finally {
    Remove-Item $passFile.FullName -Force -ErrorAction SilentlyContinue
    $secure1.Dispose()
    $secure2.Dispose()
}
