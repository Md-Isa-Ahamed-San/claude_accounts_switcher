param (
    [Parameter(Mandatory = $true)]
    [string]$AccountName,

    [switch]$IsPrimary
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ---------------------------------------------------------------------------
# 0. Privileged Task Setup Hook (executes when triggered via elevated task)
# ---------------------------------------------------------------------------
$setupTrigger = Join-Path $scriptDir ".setup_trigger"
if (Test-Path $setupTrigger) {
    Remove-Item $setupTrigger -Force -ErrorAction SilentlyContinue
    $setupScript = Join-Path $scriptDir "Setup-ScheduledTasks.ps1"
    if (Test-Path $setupScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$setupScript" *>&1 | Out-File (Join-Path $scriptDir "setup_output.log") -Encoding utf8
    }
    exit 0
}

# ---------------------------------------------------------------------------
# 1. Resolve Claude Desktop executable (MSIX direct lookup)
# ---------------------------------------------------------------------------
$appPkg = Get-AppxPackage Claude -ErrorAction SilentlyContinue
if ($appPkg) {
    $exePath = Join-Path $appPkg.InstallLocation "app\Claude.exe"
} else {
    $exePath = Join-Path $env:LOCALAPPDATA "AnthropicClaude\claude.exe"
}

if (-not (Test-Path $exePath)) {
    Write-Error "Claude Desktop executable not found at: $exePath"
    exit 1
}

# ---------------------------------------------------------------------------
# 2. Configure profile paths
# ---------------------------------------------------------------------------
if ($IsPrimary) {
    $userDataDir        = Join-Path $env:APPDATA "Claude"
    $customLocalAppData = $null
} else {
    $userDataDir        = Join-Path $env:APPDATA "Claude-$AccountName"
    $customLocalAppData = Join-Path $env:USERPROFILE ".claude-$AccountName-localappdata"
}

$pidMarkerDir  = Join-Path $scriptDir "pids"
$pidMarkerFile = Join-Path $pidMarkerDir "$AccountName.pid"

# ---------------------------------------------------------------------------
# 3. Guard against duplicate & multi-account launches
# ---------------------------------------------------------------------------
# 3a. Check if THIS account is already running via PID marker
if (Test-Path $pidMarkerFile) {
    $storedPid = (Get-Content $pidMarkerFile -ErrorAction SilentlyContinue)
    if ($storedPid) { $storedPid = $storedPid.Trim() }
    if ($storedPid -match '^\d+$') {
        $existingProc = Get-Process -Id ([int]$storedPid) -ErrorAction SilentlyContinue
        if ($existingProc -and $existingProc.Name -like "claude*") {
            Write-Host "Claude ($AccountName) already running (PID $storedPid) - focusing window"
            $wsh = New-Object -ComObject WScript.Shell
            $wsh.AppActivate([int]$storedPid) | Out-Null
            exit 0
        }
    }
    Remove-Item $pidMarkerFile -Force -ErrorAction SilentlyContinue
}

# 3b. Check running Claude processes
$allClaudeProcs = Get-CimInstance Win32_Process -Filter "Name = 'Claude.exe'" -ErrorAction SilentlyContinue
$mainProcs = $allClaudeProcs | Where-Object {
    $cmd = $_.CommandLine
    if ([string]::IsNullOrEmpty($cmd)) { return $true }
    return ($cmd -notmatch '--type=')
}

# If THIS account is running, focus it and exit
$existingSame = $mainProcs | Where-Object {
    $cmd = $_.CommandLine
    if ([string]::IsNullOrEmpty($cmd)) { return $false }
    if ($IsPrimary) { return ($cmd -notmatch '--user-data-dir') }
    else            { return ($cmd -like "*Claude-$AccountName*") }
}

if ($existingSame) {
    $targetPid = $existingSame[0].ProcessId
    if (-not (Test-Path $pidMarkerDir)) {
        New-Item -ItemType Directory -Force -Path $pidMarkerDir | Out-Null
    }
    Set-Content -Path $pidMarkerFile -Value $targetPid
    Write-Host "Claude ($AccountName) already running (PID $targetPid) - focusing window"
    $wsh = New-Object -ComObject WScript.Shell
    $wsh.AppActivate([int]$targetPid) | Out-Null
    exit 0
}

# 3c. AUTO-CLOSE OTHER INSTANCES:
# If ANY Claude process is running for another account or orphaned, close it first
$allProcs = Get-Process -Name "claude" -ErrorAction SilentlyContinue
if ($allProcs) {
    Write-Host "Another Claude instance is active. Gracefully closing existing Claude instance(s)..."
    # Gracefully close main windows first so Electron flushes data cleanly
    $allProcs | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object {
        $_.CloseMainWindow() | Out-Null
    }

    # Wait up to 3 seconds for exit
    $waited = 0
    while ((Get-Process -Name "claude" -ErrorAction SilentlyContinue) -and ($waited -lt 30)) {
        Start-Sleep -Milliseconds 100
        $waited++
    }

    # Force kill any remaining helper/renderer/zombie processes
    $lingering = Get-Process -Name "claude" -ErrorAction SilentlyContinue
    if ($lingering) {
        Write-Host "Terminating lingering helper processes..."
        & taskkill.exe /F /T /IM Claude.exe 2>&1 | Out-Null
        $lingering | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }

    # Clear old PID markers from closed accounts
    if (Test-Path $pidMarkerDir) {
        Get-ChildItem -Path $pidMarkerDir -Filter "*.pid" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    }

    # Brief delay to allow Windows file system locks to settle
    Start-Sleep -Milliseconds 500
}

# ---------------------------------------------------------------------------
# 4. Launch the new instance (guaranteed to be the only running account)
# ---------------------------------------------------------------------------
if (-not (Test-Path $pidMarkerDir)) {
    New-Item -ItemType Directory -Force -Path $pidMarkerDir | Out-Null
}

if ($IsPrimary) {
    # Ensure default LOCALAPPDATA is restored if this script runs in an existing session
    $env:LOCALAPPDATA = Join-Path $env:USERPROFILE "AppData\Local"
    Write-Host "Launching primary Claude from: $exePath"
    
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $exePath
    $psi.UseShellExecute = $true
    $psi.WorkingDirectory = Split-Path -Parent $exePath
    $proc = [System.Diagnostics.Process]::Start($psi)
} else {
    if (-not (Test-Path $customLocalAppData)) {
        New-Item -ItemType Directory -Force -Path $customLocalAppData | Out-Null
    }
    if (-not (Test-Path $userDataDir)) {
        New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null
    }

    # Set isolated LOCALAPPDATA so child inherits it (bypasses Windows lock)
    $env:LOCALAPPDATA = $customLocalAppData

    Write-Host "Launching Claude ($AccountName)..."
    Write-Host "  LOCALAPPDATA : $env:LOCALAPPDATA"
    Write-Host "  user-data-dir: $userDataDir"

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $exePath
    $psi.Arguments = "--user-data-dir=`"$userDataDir`""
    $psi.UseShellExecute = $true
    $psi.WorkingDirectory = Split-Path -Parent $exePath
    $proc = [System.Diagnostics.Process]::Start($psi)
}

# Write PID marker so switcher can track this instance
if ($proc) {
    Set-Content -Path $pidMarkerFile -Value $proc.Id
    Write-Host "Launched $AccountName (PID: $($proc.Id)) - marker written to $pidMarkerFile"
}

# Explicitly exit so PowerShell process terminates immediately and does not linger
exit 0
