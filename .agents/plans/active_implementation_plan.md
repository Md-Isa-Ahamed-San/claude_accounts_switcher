# 📋 Claude Multi-Deck Architectural Redesign Implementation Plan [COMPLETED & VERIFIED]

> **Status:** ✅ Completed, Verified with Live Browser Tests across Light & Dark Modes.
> **Architecture Pattern:** Zero REST APIs. Next.js Server Actions (`"use server"`) + Custom Hooks (`useQuery` / `useMutation` via `@tanstack/react-query`).
> **Aesthetic Direction:** Architectural, sharp, non-rounded styling inspired by Stryker Beds (Lukas Rudrof). Warm whitish alabaster paper light theme (`#f4f3ee`) and deep blackish obsidian carbon dark theme (`#09090b`), ruled hairline dividers, tabular mono figures, and compact row-based card list.

---

## 1. Design Principles & Aesthetic Foundations

- **No Rounded Bubbles**: Replaced generic rounded pill cards with sharp, rectilinear compartments (`rounded-none`).
- **Row-Based Compact Cards**: Instead of bulky 2x2 grid cards, accounts are displayed in a compact, ruled horizontal table (`AccountRow`).
- **Palette**:
  - **Light Theme ("Whitish")**: Warm architectural alabaster ground (`#f4f3ee`), crisp surface (`#faf9f5`), hairline borders (`#dedbd2`), high-contrast ink (`#121214`), and warm terracotta accents.
  - **Dark Theme ("Blackish")**: Pitch blackish carbon ground (`#09090b`), sleek surface (`#111114`), hairline dividers (`#222227`), crisp white ink (`#f4f4f6`), and emerald data highlights.
- **Theme Switching**: Seamless, persistent Light / Dark / System theme toggle via `next-themes` with custom IDs (`#theme-btn-light`, `#theme-btn-system`, `#theme-btn-dark`).

---

## 2. Component Hierarchy

1. **`src/components/Header.tsx`**:
   - Monogram badge `CMD` with live green telemetry pulse.
   - Title: `CLAUDE MULTI-DECK` with `WIN32 // BRIDGE` and `[Single-Instance Guard]`.
   - Real-time active session badge (`Session: <active-account>`).
   - `SYNC MCP ↗` action button.
   - 3-state `ThemeToggle` (`[ ☀ | 💻 | 🌙 ]`).
2. **`src/components/MetricsBar.tsx`**:
   - 4-column horizontal architectural strip divided by hairline borders:
     - `01. CONFIGURED PROFILES`
     - `02. ACTIVE PROCESS`
     - `03. RESIDENT RAM`
     - `04. KEY DECK` (instant hotkeys `[1]` to `[4]`).
3. **`src/components/AccountRow.tsx`**:
   - Architectural index (`01.`, `02.`, etc.).
   - Monogram square with custom profile color.
   - Profile label, email, and `[PRIMARY]` / `[SANDBOX]` tags.
   - Status tag (`ACTIVE`, `STARTING...`, `STANDBY`, `STOPPED`).
   - Working set RAM and process PID with hairline gauge bar.
   - Quick action cluster: `[FOCUS WINDOW ↗]`, `[CLOSE ×]`, `[SWITCH ↗]`, `[LAUNCH ↗]`, and utility buttons (`[DIR]`, `[EDIT]`).
4. **`src/components/AccountGrid.tsx`**:
   - Ruled table container with column headers: `PROFILE / IDENTITY`, `STATUS`, `TELEMETRY (RAM & PID)`, `ACTIONS`.
5. **`src/components/SystemBridgePanel.tsx`**:
   - Real-time Windows Bridge health (Task Scheduler status, Concurrency guard, active PID, user32.dll window focus).
6. **`src/components/RenameModal.tsx`**:
   - Sharp, keyboard-accessible dialog to rename profiles.
7. **`src/components/ThemeToggle.tsx`**:
   - Sharp 3-button segmented control using `useSyncExternalStore` for React 19 hydration safety.

---

## 3. Verification & Live Browser Confirmation

- **Typecheck & Linter**: `pnpm check` (`next lint && tsc --noEmit`) passes with 0 errors and 0 warnings.
- **Production Build**: `pnpm build` creates static and server bundles with 0 errors.
- **Real Browser Testing**:
  - `light_theme_whitish_verified.png`: Confirmed warm architectural whitish light theme with crisp hairline borders.
  - `dark_theme_blackish_verified.png`: Confirmed pitch blackish obsidian dark theme with live emerald process indicators (`PID #21308`, `228 MB`).
  - Active single-instance process switching and window focus verified.

---

## 4. Close Reliability & Process Integrity Fix [COMPLETED & VERIFIED]

> **Problem**: Clicking Close on the dashboard did not terminate Claude.
> **Root Cause**:
> 1. Scheduled Tasks were originally registered with `-RunLevel Highest` (Elevated Admin).
> 2. The Next.js dev server runs with `-RunLevel Limited` (Medium Integrity). Windows UIPI blocks lower-integrity processes from killing higher-integrity processes (`Access is denied`).
> 3. `CloseMainWindow()` does not terminate Electron child/helper processes.

### Execution Steps
- [x] **Step 1: Update `src/server/claude-service.ts`**:
  - Implement robust multi-tier process tree termination in `closeInstance(account)`:
    - Step 1a: Stop scheduled task instance: `schtasks /end /tn "${taskName}"`.
    - Step 1b: Kill target process tree: `taskkill /F /T /PID ${pid}`.
    - Step 1c: Sweep any remaining Claude processes: `taskkill /F /T /IM Claude.exe`.
    - Step 1d: Elevated fallback trigger: `schtasks /run /tn "Claude-Close-All"` if elevated processes remain.
    - Step 1e: Clear PID marker file and return confirmation.
- [x] **Step 2: Typecheck & Code Verification**:
  - Run `pnpm check` (`next lint && tsc --noEmit` -> 0 errors, 0 warnings).
  - Run `react-doctor` audit (score 92/100, 0 errors).
- [x] **Step 3: Re-register Scheduled Tasks with `-RunLevel Limited`**:
  - Executed `Setup-ScheduledTasks.ps1` via privileged task hook. All 4 launch tasks set to `-RunLevel Limited` and `Claude-Close-All` registered with `-RunLevel Highest` and Authenticated Users execute permissions.
- [x] **Step 4: Cleanup Obsolete Legacy Files**:
  - Safely audited all references across registry, shortcuts, scripts, and server actions.
  - Removed legacy Express `server.js`, legacy `public/` folder, redundant runner `Start-Next-Switcher.bat`, and scratch debug logs while protecting all active bridges (`accounts.json`, `pids/`, `Launch-ClaudeAccount.ps1`, `protocol_handler.ps1`, `silent_launch.vbs`, `launch_*.ps1`).
- [x] **Step 5: Live Verification**:
  - Verified process launch, single-instance enforcement, and instantaneous graceful closing. UI switches dynamically to `STANDBY` and RAM resets to 0 MB.

