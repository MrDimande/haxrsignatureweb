function Read-Pr3PasswordIfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string]$EnvName,
        [Parameter(Mandatory = $true)]
        [string]$Prompt
    )

    $existing = [Environment]::GetEnvironmentVariable($EnvName, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($existing)) {
        Write-Output "Credential $EnvName already in session (not printed)."
        return
    }

    Write-Output ""
    Write-Output "${Prompt}:"
    $secure = Read-Host -Prompt $Prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        Set-Item -Path "Env:$EnvName" -Value ([Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr))
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) | Out-Null
    }
}

function Clear-Pr3SensitiveEnv {
    Remove-Item Env:PR3_SOURCE_PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PR3_DEST_PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PR3_SOURCE_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:PR3_DEST_DATABASE_URL -ErrorAction SilentlyContinue
}
