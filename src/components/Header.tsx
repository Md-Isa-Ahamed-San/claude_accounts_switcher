"use client";

import { RefreshCw, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onSyncMcp: () => void;
  isSyncingMcp: boolean;
  activeAccountLabel: string | null;
}

export function Header({
  onSyncMcp,
  isSyncingMcp,
  activeAccountLabel,
}: HeaderProps) {
  return (
    <header className="border-b border-border pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Monogram */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center bg-foreground text-ground text-xs font-mono font-bold tracking-tight">
            CMD
            <span
              className="absolute -top-1 -right-1 flex h-2 w-2"
              title="Telemetry online"
            >
              <span className="relative inline-flex h-2 w-2 bg-positive" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold tracking-wider text-foreground font-mono uppercase">
                Claude Multi-Deck
              </h1>
              <span className="border border-border bg-surface px-1.5 py-0.2 text-[10px] font-mono text-muted uppercase tracking-widest">
                Win32 // Bridge
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 border border-positive-border bg-positive-bg px-1.5 py-0.2 text-[10px] font-mono text-positive tracking-tight">
                <span>[Single-Instance Guard]</span>
              </span>
            </div>

            <p className="text-[11px] text-muted tracking-tight font-sans">
              Windows desktop profile controller & instant workspace switcher
            </p>
          </div>
        </div>

        {/* Global Action Cluster */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="hidden md:flex items-center gap-1.5 border border-border bg-surface px-2.5 py-1 text-xs text-muted font-mono">
            <span className="text-muted-dim uppercase text-[10px] tracking-wider">
              Session:
            </span>
            <span className="text-foreground font-semibold tabular-nums text-[11px]">
              {activeAccountLabel ? activeAccountLabel : "Idle (Standby)"}
            </span>
          </div>

          <button
            onClick={onSyncMcp}
            disabled={isSyncingMcp}
            className="inline-flex h-7 items-center gap-1.5 border border-border bg-surface px-2.5 text-xs font-mono text-foreground uppercase tracking-wider transition-colors hover:bg-surface-hover active:bg-border disabled:cursor-not-allowed disabled:opacity-50"
            title="Sync primary MCP server configurations to all secondary accounts"
          >
            <RefreshCw
              className={`h-2.5 w-2.5 text-claude ${
                isSyncingMcp ? "animate-spin" : ""
              }`}
            />
            <span className="text-[10px] font-semibold">
              {isSyncingMcp ? "Syncing..." : "Sync MCP"}
            </span>
            <ArrowUpRight className="h-2.5 w-2.5 text-muted" />
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
