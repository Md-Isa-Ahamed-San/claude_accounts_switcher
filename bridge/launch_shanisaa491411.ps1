# ============================================================
# Claude Launcher — shanisaa491411
# Delegates to Launch-ClaudeAccount.ps1 for single-instance guard,
# auto-close of other accounts, and proper window focusing.
# ============================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$scriptDir\Launch-ClaudeAccount.ps1" -AccountName "shanisaa491411"
