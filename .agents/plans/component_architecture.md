# 🧩 Component Architecture & Data Flow (Server Actions + Custom Hooks)

> Architectural specification for Claude Multi-Deck Next.js 15 application using React 19, Server Actions, TanStack React Query 5, and design-taste-frontend tokens.

---

## Architecture Diagram

```mermaid
graph TD
    subgraph Browser["Client Components (React 19)"]
        Dashboard["page.tsx (Dashboard Shell)"]
        Header["<Header />"]
        MetricsBar["<MetricsBar />"]
        AccountGrid["<AccountGrid />"]
        AccountCard["<AccountCard />"]
        RenameModal["<RenameModal />"]
        TaskBanner["<TaskSetupBanner />"]
        Hotkeys["useHotkeys (Keys 1-9)"]
        Hooks["Custom Hooks (src/hooks/use-accounts.ts)"]
    end

    subgraph ServerActions["Next.js Server Actions (src/server/actions.ts)"]
        SA_Get["getAccountsAction()"]
        SA_Task["getTaskStatusAction()"]
        SA_Switch["switchAccountAction()"]
        SA_Close["closeAccountAction()"]
        SA_Sync["syncMcpAction()"]
        SA_Rename["renameAccountAction()"]
    end

    subgraph Service["Node.js OS Automation (src/server/claude-service.ts)"]
        PS["PowerShell -EncodedCommand Runner"]
        PID["PID Marker File Manager"]
        Win32["user32.dll WinFocus pinvoke"]
        Sch["schtasks.exe runner"]
        JSON["accounts.json storage"]
    end

    Dashboard --> Hooks
    AccountCard --> Hooks
    Header --> Hooks
    TaskBanner --> Hooks
    RenameModal --> Hooks
    Hotkeys --> Hooks

    Hooks -->|useQuery polling / useMutation| ServerActions
    ServerActions --> Service
    Service --> PS
    Service --> PID
    Service --> Win32
    Service --> Sch
    Service --> JSON
```

---

## Custom Hooks Specification (`src/hooks/use-accounts.ts`)

| Hook | Query / Mutation | Underlying Server Action | Behavior |
| :--- | :--- | :--- | :--- |
| `useAccounts()` | `useQuery` | `getAccountsAction()` | Polls every 2500ms; provides live accounts, running state, PIDs, memory. |
| `useTaskStatus()` | `useQuery` | `getTaskStatusAction()` | Cached for 60s; warns if scheduled tasks aren't registered. |
| `useSwitchAccount()` | `useMutation` | `switchAccountAction({ accountId })` | Optimistically flags account as `isLaunching`; triggers launch or focus; invalidates `accounts`. |
| `useCloseAccount()` | `useMutation` | `closeAccountAction({ accountId })` | Closes active instance; invalidates `accounts`. |
| `useSyncMcp()` | `useMutation` | `syncMcpAction()` | Runs sync script; toasts result. |
| `useRenameAccount()` | `useMutation` | `renameAccountAction({ oldName, newName })` | Updates account name; invalidates `accounts`. |

---

## Design-Taste Tokens & Hierarchy

```css
:root {
  --ground: #121316;          /* Deep obsidian background */
  --surface: #17181d;         /* Base surface panels */
  --raised: #1d1e24;          /* Elevated account cards */
  --border: #27282e;          /* 1px crisp separation */
  --control: #2b2d35;         /* Button / input backgrounds */
  --control-hover: #363842;   /* Hover state */
  --text: #f4f4f6;            /* Primary crisp text */
  --muted: #8a8c92;           /* Secondary labels & metadata */
  --accent: #e06e43;          /* Anthropic Terracotta accent */
  --positive: #44a282;        /* Running process green */
  --positive-bg: #162621;     /* Active pill background */
  --warning: #d9a441;         /* Launching amber */
  --warning-bg: #282315;      /* Launching pill background */
  --negative: #e5566f;        /* Error / close red */
  --negative-bg: #2b171c;     /* Error pill background */
}
```
