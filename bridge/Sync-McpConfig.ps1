param (
    [string]$TargetAccount = "all"
)

$primaryConfig = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"
if (-not (Test-Path $primaryConfig)) {
    Write-Warning "Primary claude_desktop_config.json not found in $primaryConfig."
    exit 0
}

$accounts = @("shanisaa491411", "glordgotnfsheat", "isaahamedsanextra1")
if ($TargetAccount -ne "all") {
    $accounts = @($TargetAccount)
}

foreach ($acc in $accounts) {
    $targetDir = Join-Path $env:APPDATA "Claude-$acc"
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }
    $targetFile = Join-Path $targetDir "claude_desktop_config.json"
    Copy-Item -Path $primaryConfig -Destination $targetFile -Force
    Write-Host "Copied MCP configuration to Claude-${acc}: $targetFile" -ForegroundColor Green
}
