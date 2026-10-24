param (
    [Parameter(Mandatory = $true)]
    [string]$OldName,

    [Parameter(Mandatory = $true)]
    [string]$NewName
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopPath = [Environment]::GetFolderPath('Desktop')
$vbsPath = Join-Path $scriptDir "silent_launch.vbs"

if ($OldName -eq $NewName) {
    Write-Output "Old name and new name are identical ($OldName). Nothing to rename."
    exit 0
}

Write-Host "Renaming Claude instance from '$OldName' to '$NewName'..." -ForegroundColor Cyan

# 1. Check if the instance is currently running
$running = Get-CimInstance Win32_Process -Filter "Name = 'Claude.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*Claude-$OldName*"
}

if ($running) {
    Write-Error "Claude instance for '$OldName' is currently running! Please fully close it before renaming."
    exit 1
}

# 2. Check if primary or secondary
$oldLauncher = Join-Path $scriptDir "launch_$OldName.ps1"
$isPrimary = $false
if (Test-Path $oldLauncher) {
    $content = Get-Content $oldLauncher -Raw
    if ($content -match "-IsPrimary") {
        $isPrimary = $true
    }
}

# 3. Handle folder renames for secondary accounts
if (-not $isPrimary) {
    $oldProfileDir = Join-Path $env:APPDATA "Claude-$OldName"
    $newProfileDir = Join-Path $env:APPDATA "Claude-$NewName"
    if (Test-Path $oldProfileDir) {
        Rename-Item -Path $oldProfileDir -NewName "Claude-$NewName" -Force
        Write-Output "Renamed profile data folder: $oldProfileDir -> $newProfileDir"
    }

    $oldLocalApp = Join-Path $env:USERPROFILE ".claude-$OldName-localappdata"
    $newLocalApp = Join-Path $env:USERPROFILE ".claude-$NewName-localappdata"
    if (Test-Path $oldLocalApp) {
        Rename-Item -Path $oldLocalApp -NewName ".claude-$NewName-localappdata" -Force
        Write-Output "Renamed LocalAppData cache folder: $oldLocalApp -> $newLocalApp"
    }
} else {
    Write-Output "Note: Primary account keeps the default Claude profile folder untouched."
}

# 4. Generate new launcher script
$newLauncher = Join-Path $scriptDir "launch_$NewName.ps1"
if ($isPrimary) {
    $launcherCode = @"
`$scriptDir = Split-Path -Parent `$MyInvocation.MyCommand.Path
& "`$scriptDir\Launch-ClaudeAccount.ps1" -AccountName "$NewName" -IsPrimary
"@
} else {
    $launcherCode = @"
`$scriptDir = Split-Path -Parent `$MyInvocation.MyCommand.Path
& "`$scriptDir\Launch-ClaudeAccount.ps1" -AccountName "$NewName"
"@
}
Set-Content -Path $newLauncher -Value $launcherCode -Encoding UTF8
Write-Output "Created new launcher script: $newLauncher"

if (Test-Path $oldLauncher) {
    Remove-Item -Path $oldLauncher -Force
    Write-Output "Removed old launcher script: $oldLauncher"
}

# 5. Create new Desktop shortcut and remove old shortcut
# Resolve Claude app path for icon
$appPkg = Get-AppxPackage Claude -ErrorAction SilentlyContinue
if ($appPkg) {
    $iconPath = Join-Path $appPkg.InstallLocation "app\Claude.exe"
} else {
    $iconPath = Join-Path $env:LOCALAPPDATA "AnthropicClaude\claude.exe"
}

$wshell = New-Object -ComObject WScript.Shell
$newShortcutFile = Join-Path $desktopPath "Claude - $NewName.lnk"
$shortcut = $wshell.CreateShortcut($newShortcutFile)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`" `"$newLauncher`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Claude Desktop Instance - $NewName"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Save()
Write-Output "Created updated Desktop shortcut: $newShortcutFile"

$oldShortcutFile = Join-Path $desktopPath "Claude - $OldName.lnk"
if (Test-Path $oldShortcutFile) {
    Remove-Item -Path $oldShortcutFile -Force
    Write-Output "Removed old Desktop shortcut: $oldShortcutFile"
}

Write-Host "Rename from '$OldName' to '$NewName' completed successfully!" -ForegroundColor Green
