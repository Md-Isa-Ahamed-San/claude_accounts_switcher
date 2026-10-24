# Claude Multi-Deck & Account Switcher — Workspace Rules

> Desktop management hub and 1-click account switcher for multiple Claude Desktop MSIX / Windows instances. Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Next.js Server Actions, TanStack React Query 5, and Node.js OS automation. Styled under `design-taste-frontend` (DevTools / Data-Terminal dark aesthetic).

---

## Architecture Principles

1. **Server Actions First (No REST APIs)**:
   - All server mutations and data fetching use Next.js Server Actions (`"use server"`) in `src/server/actions.ts`.
   - Never create REST Route Handlers (`src/app/api/...`) for internal app logic.
   - Client components interact with Server Actions via typed custom React Query hooks (`src/hooks/use-accounts.ts`).
2. **React Query State Management**:
   - Polling via `useQuery({ queryKey: ['accounts'], queryFn: () => getAccountsAction(), refetchInterval: 2500 })`.
   - Mutations (`useMutation`) with optimistic updates and instant UI responsiveness during launch, switch, focus, close, and rename.
3. **Design Taste & Anti-Slop (DevTools / Data-Terminal)**:
   - High-taste, purposeful dark theme: deep obsidian ground (`#121316`), raised cards (`#191a1e` / `#1f2025`), crisp 1px borders (`#27282e`), tabular numbers (`font-variant-numeric: tabular-nums`).
   - Honest data display: real PIDs (`#12345`), live memory footprint (`248 MB`), active window indicator (`HWND`).
   - Restrained, purposeful color: color is reserved for identity (account accent avatars) and data state (emerald for active, amber for launching, muted for idle).
   - Flat surfaces: no muddy drop shadows or generic gradients; clean 1px hairline dividers.
   - Single-click action efficiency: 1-click switch with automatic teardown of conflicting instances.

---

## Directory & File Layout

```
claude_accounts_switcher/
├── .agents/                    # Workspace agent guidelines, plans, and skills
│   ├── AGENTS.md               # Workspace rules (this file)
│   ├── plans/
│   │   ├── active_implementation_plan.md
│   │   └── component_architecture.md
│   └── skills/
├── public/                     # Static assets (favicons, icons)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, theme, fonts, QueryProvider, Toaster
│   │   └── page.tsx            # Main Switcher dashboard view
│   ├── server/                 # Server Actions & backend services (Node.js runtime only)
│   │   ├── actions.ts          # "use server" Server Actions for React Query
│   │   └── claude-service.ts   # Core PowerShell, schtasks, WMI, PID marker engine
│   ├── hooks/                  # Custom React Query client hooks
│   │   └── use-accounts.ts     # useAccounts, useSwitchAccount, useCloseAccount, etc.
│   ├── components/             # Reusable UI components
│   │   ├── Header.tsx          # Brand monogram, status pulse, Sync MCP action
│   │   ├── MetricsBar.tsx      # Total accounts, active account, RAM footprint, hotkey tips
│   │   ├── AccountGrid.tsx     # Grid container for accounts
│   │   ├── AccountCard.tsx     # Account card with status pill, PID, RAM, action buttons
│   │   ├── TaskSetupBanner.tsx # Setup warning if scheduled tasks are missing
│   │   ├── RenameModal.tsx     # Dialog for renaming account profiles
│   │   └── Providers.tsx       # QueryClientProvider, Toaster (Sonner)
│   ├── lib/
│   │   ├── types.ts            # TypeScript interfaces (Account, ProcessInfo, ActionResults)
│   │   └── utils.ts            # Helper functions (cn, formatting, colors)
│   ├── env.js                  # T3 env validation schema
│   └── styles/
│       └── globals.css         # Tailwind CSS 4 theme & data-terminal design tokens
├── package.json
└── tsconfig.json
```

---

## Coding Standards

### Always Do
- Use `~/` or `@/` path aliases for imports.
- TypeScript strict mode — explicit types, zero `any`, no `@ts-ignore`.
- Server-side OS commands (`powershell.exe`, `schtasks`, `fs`) must ONLY be called in server files (`src/server/...`).
- Dynamic PowerShell commands must use base64 `-EncodedCommand` to prevent escaping/injection issues on Windows.
- Always include execution timeouts (`timeout: 15000` or `30000`) on PowerShell and CLI exec calls.
- Single Account Policy: When switching accounts, gracefully close the currently running instance and clear its PID marker before launching the requested account.
- Keyboard navigation: Number keys (`1` - `9`) immediately switch or focus the corresponding account (ignoring input fields).
- Run `pnpm check` (`next lint && tsc --noEmit`) to verify zero errors before completing.

### Never Do
- Never create REST Route Handlers (`src/app/api/...`) for application features.
- Never use `useEffect` for data fetching — React Query manages all server state.
- Never use generic placeholder templates, rainbow gradients, or rounded toy cards.
- Never block the UI thread during PowerShell operations — always use async promises.
