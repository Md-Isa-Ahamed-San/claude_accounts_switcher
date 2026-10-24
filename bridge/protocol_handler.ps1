param(
    [string]$UriArg
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $UriArg) { exit 0 }

# Strip URI scheme and slashes: claude-switch:acc or claude-switch://launch/acc
$cleaned = $UriArg -replace '^claude-switch:/{0,2}', ''
$cleaned = $cleaned.TrimEnd('/')
$cleaned = $cleaned -replace '^launch/', ''

if (-not $cleaned) { exit 0 }

if ($cleaned -eq "all") {
    $accounts = @("mdisaahamedsan.ph", "shanisaa491411", "glordgotnfsheat", "isaahamedsanextra1")
    foreach ($acc in $accounts) {
        if ($acc -eq "mdisaahamedsan.ph") {
            & "$scriptDir\Launch-ClaudeAccount.ps1" -AccountName $acc -IsPrimary
        } else {
            & "$scriptDir\Launch-ClaudeAccount.ps1" -AccountName $acc
        }
        Start-Sleep -Seconds 2
    }
    exit 0
}

if ($cleaned -eq "mdisaahamedsan.ph") {
    & "$scriptDir\Launch-ClaudeAccount.ps1" -AccountName $cleaned -IsPrimary
} else {
    & "$scriptDir\Launch-ClaudeAccount.ps1" -AccountName $cleaned
}
