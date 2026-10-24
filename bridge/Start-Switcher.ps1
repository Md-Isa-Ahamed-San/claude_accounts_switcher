# Starts Claude Multi-Deck Next.js Switcher and opens browser
$bridgeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Split-Path -Parent $bridgeDir

# Check if port 3000 is already active
$active = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $active) {
    Start-Process -FilePath "pnpm.cmd" -ArgumentList "dev" -WorkingDirectory $appDir -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# Open browser to Next.js app
Start-Process "http://localhost:3000"
