"use client";

import type { AccountWithStatus } from "~/lib/types";

interface MetricsBarProps {
  accounts: AccountWithStatus[];
}

export function MetricsBar({ accounts }: MetricsBarProps) {
  const total = accounts.length;
  const primaryCount = accounts.filter((a) => a.isPrimary).length;
  const isolatedCount = total - primaryCount;
  const activeAccount = accounts.find((a) => a.isRunning);
  const totalRam = accounts.reduce((acc, a) => acc + (a.memoryMb || 0), 0);

  return (
    <section className="my-3.5 border border-border bg-surface">
      <div className="grid grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border sm:grid-cols-4 items-stretch">
        {/* Cell 1: Profiles */}
        <div className="p-2.5 sm:px-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
            01. Configured Profiles
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono font-bold text-base text-foreground tabular-nums">
              {total.toString().padStart(2, "0")}
            </span>
            <span className="text-[11px] text-muted font-sans">
              ({primaryCount} Primary / {isolatedCount} Sandbox)
            </span>
          </div>
        </div>

        {/* Cell 2: Active Session */}
        <div className="p-2.5 sm:px-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
            02. Active Process
          </div>
          <div className="mt-1 flex items-center gap-1.5 min-w-0">
            <span
              className={`h-1.5 w-1.5 shrink-0 ${
                activeAccount ? "bg-positive" : "bg-muted-dim"
              }`}
            />
            <span
              className="font-mono font-semibold text-xs text-foreground truncate"
              title={activeAccount ? activeAccount.label : "Standby"}
            >
              {activeAccount ? activeAccount.label : "STANDBY (IDLE)"}
            </span>
            {activeAccount?.pid && (
              <span className="font-mono text-[10px] text-muted">
                #{activeAccount.pid}
              </span>
            )}
          </div>
        </div>

        {/* Cell 3: RAM Working Set */}
        <div className="p-2.5 sm:px-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
            03. Resident RAM
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono font-bold text-base text-foreground tabular-nums">
              {totalRam}
            </span>
            <span className="text-[10px] font-mono text-muted uppercase">
              MB Working Set
            </span>
          </div>
        </div>

        {/* Cell 4: Hotkeys Deck */}
        <div className="p-2.5 sm:px-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
            04. Key Deck
          </div>
          <div className="mt-1 flex items-center gap-1">
            {accounts.map((_, i) => (
              <kbd
                key={i}
                className="border border-border bg-surface-subtle px-1.5 py-0.2 text-[10px] font-mono font-bold text-claude tabular-nums"
              >
                [{i + 1}]
              </kbd>
            ))}
            <span className="text-[10px] font-mono text-muted ml-1 hidden md:inline">
              Instant Switch
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
