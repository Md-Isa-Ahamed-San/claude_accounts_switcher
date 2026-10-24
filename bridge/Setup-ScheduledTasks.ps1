<#
.SYNOPSIS
    One-time setup: Registers Windows Task Scheduler tasks for each Claude account.
    This is the ONLY reliable way to launch a visible GUI window from a background
    Node.js process on Windows 11 (Session 0 isolation bypass).

.DESCRIPTION
    Each task:
    - Runs as the current interactive user (visible desktop window)
    - Is triggered on-demand only (schtasks /run /tn "TaskName")
    - Requires no password (interactive session token)
    - Has Execute permission granted to all users so the Node.js server can trigger it

.NOTES
    Run this ONCE. It will auto-elevate to Administrator via UAC prompt.
    After that, the Node.js server can trigger any task without elevation.
#>

# Check administrator status
$currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Running as current user. Registering tasks with Limited run-level..." -ForegroundColor Yellow
}
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Claude Multi-Account Task Scheduler Setup  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running as: $currentUser" -ForegroundColor Gray
Write-Host "Script dir: $scriptDir" -ForegroundColor Gray
Write-Host ""

# Read accounts from accounts.json
$accountsFile = Join-Path $scriptDir "accounts.json"
if (-not (Test-Path $accountsFile)) {
    Write-Error "accounts.json not found at $accountsFile"
    exit 1
}
$accounts = Get-Content $accountsFile -Raw | ConvertFrom-Json

function Register-ClaudeTask {
    param(
        [string]$AccountId,
        [bool]$IsPrimary,
        [string]$ScriptDir,
        [string]$RunAsUser
    )

    $taskName = "Claude-Launch-$AccountId"
    $launchScript = Join-Path $ScriptDir "Launch-ClaudeAccount.ps1"
    
    if ($IsPrimary) {
        $psArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launchScript`" -AccountName `"$AccountId`" -IsPrimary"
    } else {
        $psArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launchScript`" -AccountName `"$AccountId`""
    }

    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

    # Create the task action: PowerShell launches Claude
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument $psArgs `
        -WorkingDirectory $ScriptDir

    # Settings: allow on-demand run, no time limit, run only when user is logged in
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
        -MultipleInstances IgnoreNew

    # Principal: run as the current user, only when logged in (interactive = visible window)
    # Principal: run as current interactive user at Limited level so standard user processes can control/close it
    $principal = New-ScheduledTaskPrincipal `
        -UserId $RunAsUser `
        -LogonType Interactive `
        -RunLevel Limited

    # Register the task
    $task = Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Settings $settings `
        -Principal $principal `
        -Force

    if ($task) {
        Write-Host "  [OK] Registered task: $taskName" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Failed to register: $taskName" -ForegroundColor Red
        return $false
    }

    # Grant Execute + Read permission to all Authenticated Users
    # This lets the Node.js server (non-admin) trigger the task via schtasks /run
    try {
        $schedule = New-Object -ComObject "Schedule.Service"
        $schedule.Connect()
        $taskObj = $schedule.GetFolder("\").GetTask($taskName)
        $sd = $taskObj.GetSecurityDescriptor(0xF)
        # Append ACE: Allow Authenticated Users (AU) Generic Read + Execute
        if ($sd -notmatch 'AU.*GRGX' -and $sd -notmatch 'GRGX.*AU') {
            $sd = $sd + "(A;;GRGX;;;AU)"
            $taskObj.SetSecurityDescriptor($sd, 0)
        }
        Write-Host "  [OK] Permissions set for: $taskName" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Could not set permissions for $taskName`: $_" -ForegroundColor Yellow
        Write-Host "         The server may need to run with elevated privileges to trigger this task." -ForegroundColor Yellow
    }

    return $true
}

$successCount = 0
foreach ($acc in $accounts) {
    Write-Host "Registering task for account: $($acc.id)" -ForegroundColor White
    $ok = Register-ClaudeTask `
        -AccountId $acc.id `
        -IsPrimary ([bool]$acc.isPrimary) `
        -ScriptDir $scriptDir `
        -RunAsUser $currentUser
    if ($ok) { $successCount++ }
    Write-Host ""
}

# Register elevated emergency close task: "Claude-Close-All"
try {
    $closeTaskName = "Claude-Close-All"
    Unregister-ScheduledTask -TaskName $closeTaskName -Confirm:$false -ErrorAction SilentlyContinue

    $closeAction = New-ScheduledTaskAction `
        -Execute "cmd.exe" `
        -Argument "/c taskkill /F /T /IM Claude.exe"

    $closeSettings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

    $closePrincipal = New-ScheduledTaskPrincipal `
        -UserId $currentUser `
        -LogonType Interactive `
        -RunLevel Highest

    $closeTask = Register-ScheduledTask `
        -TaskName $closeTaskName `
        -Action $closeAction `
        -Settings $closeSettings `
        -Principal $closePrincipal `
        -Force

    if ($closeTask) {
        $schedule = New-Object -ComObject "Schedule.Service"
        $schedule.Connect()
        $cTaskObj = $schedule.GetFolder("\").GetTask($closeTaskName)
        $sd = $cTaskObj.GetSecurityDescriptor(0xF)
        if ($sd -notmatch 'AU.*GRGX' -and $sd -notmatch 'GRGX.*AU') {
            $sd = $sd + "(A;;GRGX;;;AU)"
            $cTaskObj.SetSecurityDescriptor($sd, 0)
        }
        Write-Host "  [OK] Registered elevated emergency terminator: $closeTaskName" -ForegroundColor Green
    }
} catch {
    Write-Host "  [WARN] Could not register Claude-Close-All`: $_" -ForegroundColor Yellow
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete: $successCount / $($accounts.Count) tasks registered" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now use the web dashboard to launch and close Claude accounts." -ForegroundColor Green
Write-Host "Each account runs at standard user level, allowing instant seamless closing." -ForegroundColor Green
Write-Host ""
Write-Host "To verify tasks, open Task Scheduler (taskschd.msc)" -ForegroundColor Gray
Write-Host "and look for tasks named 'Claude-Launch-*' and 'Claude-Close-All'" -ForegroundColor Gray
