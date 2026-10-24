# Tasks — Claude Multi-Account Setup

## Task: Auto-Close Switching & Single-Account Guard Across All Launch Vectors

### Status: COMPLETED ✅

---

### Description
Configured seamless 1-click / 1-trigger account switching with automatic closing of existing accounts across all launch vectors:
1. When opening any account while another account is open, the system automatically and gracefully closes the active account, waits for data/lock flushing, terminates any orphan helper processes, cleans stale PID markers, and launches the target account cleanly.
2. If the user launches or clicks the *same* account that is already active, it simply brings that account's window to the foreground without closing or restarting.

---

### Updated Files
1. `Launch-ClaudeAccount.ps1` — Central launch engine updated with Section 3c: auto-closing of existing Claude instances with graceful `CloseMainWindow()` + force fallback + PID marker cleanup + settlement delay.
2. `launch_mdisaahamedsan.ph.ps1` — Delegated to `Launch-ClaudeAccount.ps1 -IsPrimary`.
3. `launch_shanisaa491411.ps1` — Delegated to `Launch-ClaudeAccount.ps1`.
4. `launch_glordgotnfsheat.ps1` — Delegated to `Launch-ClaudeAccount.ps1`.
5. `launch_isaahamedsanextra1.ps1` — Delegated to `Launch-ClaudeAccount.ps1`.
6. `server.js` — Updated `closeInstance` for clean shutdown and `/api/switch` to auto-close any active account before launching the target account.
7. `public/app.js` & `public/index.css` — Replaced locked states with active 1-click "Switch to Account" buttons, styled switch mode, and enabled keyboard hotkeys [1]-[4] for direct seamless switching.
8. Desktop shortcuts (`Create-Shortcuts.ps1`) — Refreshed and pointing directly to the updated launcher scripts.

---

### Protection & Switching Matrix

| Launch Vector | Auto-Closes Existing Account First? | Protection Level | Status |
|---|---|---|---|
| **Web Switcher UI (`http://localhost:3842`)** | ✅ YES — 1-click switch button | 🛡️ Protected & Seamless | ✅ Active |
| **Switcher Hotkeys [1] – [4]** | ✅ YES — Instant switch on keypress | 🛡️ Protected & Seamless | ✅ Active |
| **Switcher Backend API (`/api/switch`)** | ✅ YES — Gracefully closes active account | 🛡️ Protected & Seamless | ✅ Active |
| **Task Scheduler (`Claude-Launch-*`)** | ✅ YES — Auto-close in `Launch-ClaudeAccount.ps1` | 🛡️ Protected & Seamless | ✅ Active |
| **Desktop Shortcuts (`.lnk` files)** | ✅ YES — Calls delegated `launch_*.ps1` | 🛡️ Protected & Seamless | ✅ Active |
| **Manual PowerShell (`launch_*.ps1`)** | ✅ YES — Calls delegated `Launch-ClaudeAccount.ps1` | 🛡️ Protected & Seamless | ✅ Active |
| **Protocol Handler (`claude-switch:...`)** | ✅ YES — Calls `Launch-ClaudeAccount.ps1` | 🛡️ Protected & Seamless | ✅ Active |

---

*Updated: 2026-10-24*
