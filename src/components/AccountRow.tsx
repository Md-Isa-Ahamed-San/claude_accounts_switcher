"use client";

import {
  Monitor,
  Power,
  RefreshCw,
  Edit2,
  Folder,
  ArrowUpRight,
  Shield,
  FolderLock,
} from "lucide-react";
import type { AccountWithStatus } from "~/lib/types";

interface AccountRowProps {
  account: AccountWithStatus;
  index: number;
  activeAccount: AccountWithStatus | null;
  isLaunching: boolean;
  onSwitch: (accountId: string, label: string) => void;
  onClose: (accountId: string, label: string) => void;
  onOpenRename: (account: AccountWithStatus) => void;
  onOpenFolder: (accountId: string) => void;
}

export function AccountRow({
  account,
  index,
  activeAccount,
  isLaunching,
  onSwitch,
  onClose,
  onOpenRename,
  onOpenFolder,
}: AccountRowProps) {
  const isRunning = account.isRunning;
  const isAnotherRunning = Boolean(activeAccount && activeAccount.id !== account.id);
  const initial = (account.label || account.id).charAt(0).toUpperCase();
  const accentColor = account.color || "#c65324";
  const indexStr = (index + 1).toString().padStart(2, "0");

  // Estimated memory percentage against typical Claude working set (~500MB)
  const memoryPercent = Math.min(
    100,
    Math.round(((account.memoryMb || 0) / 500) * 100)
  );

  return (
    <div
      className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-3 px-3.5 py-3 border-b border-border transition-colors duration-100 ${
        isRunning
          ? "bg-positive-bg/40 border-l-2 border-l-positive"
          : isLaunching
          ? "bg-warning-bg/40 border-l-2 border-l-warning"
          : "bg-surface hover:bg-surface-hover border-l-2 border-l-transparent"
      }`}
    >
      {/* 1. Index & Profile Identity */}
      <div className="flex items-center gap-3 min-w-0 md:w-5/12 lg:w-4/12">
        {/* Architectural Index: 01, 02, etc. */}
        <span className="shrink-0 font-mono text-xs font-bold text-muted group-hover:text-foreground transition-colors tabular-nums">
          {indexStr}.
        </span>

        {/* Monogram Square */}
        <div
          className="relative flex h-7 w-7 shrink-0 items-center justify-center text-xs font-mono font-bold text-white shadow-2xs"
          style={{ backgroundColor: accentColor }}
        >
          {initial}
          {isRunning && (
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 bg-positive" />
          )}
        </div>

        {/* Name & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className="truncate text-xs font-bold text-foreground tracking-tight font-sans"
              title={account.label || account.id}
            >
              {account.label || account.id}
            </h3>
            {account.isPrimary ? (
              <span className="inline-flex items-center gap-0.5 border border-claude/40 bg-claude-subtle px-1 py-0.2 text-[9px] font-mono text-claude uppercase">
                <Shield className="h-2 w-2" />
                <span>Primary</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 border border-border bg-surface-subtle px-1 py-0.2 text-[9px] font-mono text-muted uppercase">
                <FolderLock className="h-2 w-2" />
                <span>Sandbox</span>
              </span>
            )}
          </div>
          <p
            className="truncate text-[11px] text-muted font-mono"
            title={account.email || `${account.id}@gmail.com`}
          >
            {account.email || `${account.id}@gmail.com`}
          </p>
        </div>
      </div>

      {/* 2. Status Badge */}
      <div className="flex items-center gap-2 shrink-0 md:w-2/12">
        {isLaunching ? (
          <span className="inline-flex items-center gap-1 border border-warning-border bg-warning-bg px-2 py-0.5 text-[10px] font-mono font-semibold text-warning uppercase">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            <span>Starting...</span>
          </span>
        ) : isRunning ? (
          <span className="inline-flex items-center gap-1 border border-positive-border bg-positive-bg px-2 py-0.5 text-[10px] font-mono font-bold text-positive uppercase">
            <span className="h-1.5 w-1.5 bg-positive animate-pulse" />
            <span>Active</span>
            {account.hasWindow && (
              <span title="Desktop window attached">
                <Monitor className="h-2.5 w-2.5 text-positive ml-0.5" />
              </span>
            )}
          </span>
        ) : isAnotherRunning ? (
          <span className="inline-flex items-center border border-border bg-surface-subtle px-2 py-0.5 text-[10px] font-mono text-muted uppercase">
            Standby
          </span>
        ) : (
          <span className="inline-flex items-center border border-border bg-surface-subtle px-2 py-0.5 text-[10px] font-mono text-muted uppercase">
            Stopped
          </span>
        )}
      </div>

      {/* 3. Process & Memory Telemetry */}
      <div className="flex items-center gap-3 shrink-0 text-xs font-mono md:w-2/12">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted uppercase tracking-wider">
            {account.pid ? `PID #${account.pid}` : "PID —"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              {isRunning || isLaunching ? `${account.memoryMb} MB` : "0 MB"}
            </span>
            {isRunning && (
              <div
                className="h-1 w-7 bg-border overflow-hidden"
                title={`${memoryPercent}% estimated footprint`}
              >
                <div
                  className="h-full bg-positive transition-[width] duration-300"
                  style={{ width: `${memoryPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Action Controls */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 md:w-3/12">
        {isLaunching ? (
          <button
            disabled
            className="inline-flex h-6.5 items-center gap-1 border border-warning-border bg-warning-bg px-2.5 text-[10px] font-mono font-semibold text-warning uppercase opacity-80 cursor-wait"
          >
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            <span>Spawning...</span>
          </button>
        ) : isRunning ? (
          <>
            <button
              id={`btn-focus-${account.id}`}
              onClick={() => onSwitch(account.id, account.label || account.id)}
              className="inline-flex h-6.5 items-center gap-1 bg-positive px-2.5 text-[10px] font-mono font-bold text-white uppercase tracking-wider transition-colors hover:opacity-90 active:scale-[0.99]"
              title="Bring active Claude desktop window to front"
            >
              <span>Focus Window</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>

            <button
              id={`btn-close-${account.id}`}
              onClick={() => onClose(account.id, account.label || account.id)}
              className="inline-flex h-6.5 items-center gap-1 border border-negative-border bg-negative-bg px-2 text-[10px] font-mono font-medium text-negative uppercase transition-colors hover:bg-negative hover:text-white"
              title="Close this Claude process gracefully"
            >
              <Power className="h-2.5 w-2.5" />
              <span className="hidden lg:inline">Close</span>
            </button>
          </>
        ) : isAnotherRunning ? (
          <button
            id={`btn-switch-${account.id}`}
            onClick={() => onSwitch(account.id, account.label || account.id)}
            className="inline-flex h-6.5 items-center gap-1 border border-claude bg-claude-subtle px-2.5 text-[10px] font-mono font-semibold text-claude uppercase tracking-wider transition-colors hover:bg-claude hover:text-white"
            title={`Close active instance and switch to ${account.label}`}
          >
            <span>Switch</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        ) : (
          <button
            id={`btn-launch-${account.id}`}
            onClick={() => onSwitch(account.id, account.label || account.id)}
            className="inline-flex h-6.5 items-center gap-1 bg-foreground px-2.5 text-[10px] font-mono font-semibold text-ground uppercase tracking-wider transition-colors hover:opacity-90"
          >
            <span>Launch</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}

        {/* Directory & Rename Tools */}
        <div className="flex items-center gap-0.5 ml-1 border-l border-border pl-1">
          <button
            onClick={() => onOpenFolder(account.id)}
            className="flex h-6.5 w-6.5 items-center justify-center text-muted hover:bg-surface-hover hover:text-foreground transition-colors border border-transparent hover:border-border"
            title="Open profile data directory in Windows Explorer"
          >
            <Folder className="h-3 w-3" />
          </button>
          <button
            onClick={() => onOpenRename(account)}
            className="flex h-6.5 w-6.5 items-center justify-center text-muted hover:bg-surface-hover hover:text-foreground transition-colors border border-transparent hover:border-border"
            title="Rename profile"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
