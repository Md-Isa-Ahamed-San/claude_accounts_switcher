# Script to create or refresh Windows Desktop shortcuts for all Claude account instances

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $scriptDir "silent_launch.vbs"
$desktopPath = [Environment]::GetFolderPath('Desktop')

# Resolve Claude app path for icon
$appPkg = Get-AppxPackage Claude -ErrorAction SilentlyContinue
if ($appPkg) {
    $iconPath = Join-Path $appPkg.InstallLocation "app\Claude.exe"
} else {
    $iconPath = Join-Path $env:LOCALAPPDATA "AnthropicClaude\claude.exe"
}

$accounts = @("mdisaahamedsan.ph", "shanisaa491411", "glordgotnfsheat", "isaahamedsanextra1")
$wshell = New-Object -ComObject WScript.Shell

foreach ($acc in $accounts) {
    $shortcutFile = Join-Path $desktopPath "Claude - $acc.lnk"
    $targetPs1 = Join-Path $scriptDir "launch_$acc.ps1"

    $shortcut = $wshell.CreateShortcut($shortcutFile)
    $shortcut.TargetPath = "wscript.exe"
    $shortcut.Arguments = "`"$vbsPath`" `"$targetPs1`""
    $shortcut.WorkingDirectory = $scriptDir
    $shortcut.Description = "Claude Desktop Instance - $acc"
    if (Test-Path $iconPath) {
        $shortcut.IconLocation = "$iconPath,0"
    }
    $shortcut.Save()
    Write-Output "Created shortcut: $shortcutFile"
}

# Create Web Switcher Shortcut
$switcherShortcut = Join-Path $desktopPath "Claude Multi-Deck Switcher.lnk"
$switcherPs1 = Join-Path $scriptDir "Start-Switcher.ps1"
$swShortcutObj = $wshell.CreateShortcut($switcherShortcut)
$swShortcutObj.TargetPath = "wscript.exe"
$swShortcutObj.Arguments = "`"$vbsPath`" `"$switcherPs1`""
$swShortcutObj.WorkingDirectory = $scriptDir
$swShortcutObj.Description = "Open Claude Multi-Deck Web Switcher"
if (Test-Path $iconPath) {
    $swShortcutObj.IconLocation = "$iconPath,0"
}
$swShortcutObj.Save()
Write-Output "Created shortcut: $switcherShortcut"

Write-Output "All shortcuts created successfully on Desktop."
