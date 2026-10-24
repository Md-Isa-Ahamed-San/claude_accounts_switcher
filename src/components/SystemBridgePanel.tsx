"use client";

import {
  ShieldCheck,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import type { TaskStatusResult } from "~/lib/types";

interface SystemBridgePanelProps {
  taskStatus: TaskStatusResult | undefined;
  activeAccountLabel: string | null;
  activePid: number | null;
  onSyncMcp: () => void;
  isSyncingMcp: boolean;
}

export function SystemBridgePanel({
  taskStatus,
  activeAccountLabel,
  activePid,
  onSyncMcp,
  isSyncingMcp,
}: SystemBridgePanelProps) {
  const allTasksOk = taskStatus?.allRegistered ?? true;

  return (
    <aside className="border border-border bg-surface p-3.5 space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-claude" />
          <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider font-mono">
            System Bridge
          </h3>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-mono text-positive uppercase">
          <span className="h-1.5 w-1.5 bg-positive animate-pulse" />
          <span>Active</span>
        </span>
      </div>

      {/* Bridge Item 1: Task Scheduler Status */}
      <div className="border border-border bg-surface-subtle p-2 text-xs space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-muted text-[10px] uppercase">
            Session Launcher:
          </span>
          {allTasksOk ? (
            <span className="inline-flex items-center gap-1 text-positive font-mono text-[10px] font-semibold">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Bridge Ready</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-warning font-mono text-[10px] font-semibold">
              <AlertTriangle className="h-2.5 w-2.5" />
              <span>Setup Required</span>
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted leading-tight font-sans">
          {allTasksOk
            ? "Registered in Task Scheduler. Desktop window rendering ready."
            : "Tasks missing. Run Setup-ScheduledTasks.ps1 once as Admin."}
        </p>
      </div>

      {/* Bridge Item 2: Process Concurrency Policy */}
      <div className="border border-border bg-surface-subtle p-2 text-xs space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-muted text-[10px] uppercase">
            Concurrency:
          </span>
          <span className="inline-flex items-center gap-1 text-positive font-mono text-[10px] font-semibold">
            <ShieldCheck className="h-2.5 w-2.5" />
            <span>Enforced Guard</span>
          </span>
        </div>
        <p className="text-[10px] text-muted leading-tight font-sans">
          Single-instance concurrency prevents profile SQLite lock collisions.
        </p>
      </div>

      {/* Bridge Item 3: Active Session Telemetry */}
      <div className="border border-border bg-surface-subtle p-2 text-xs space-y-1 font-mono">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted uppercase">Active Profile:</span>
          <span className="text-foreground font-bold truncate max-w-[120px]">
            {activeAccountLabel ? activeAccountLabel : "None (Idle)"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted uppercase">Process PID:</span>
          <span className="text-foreground font-bold">
            {activePid ? `#${activePid}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted uppercase">Window Focus:</span>
          <span className="text-claude">user32.dll Win32</span>
        </div>
      </div>

      {/* Quick Action: Sync MCP */}
      <button
        onClick={onSyncMcp}
        disabled={isSyncingMcp}
        className="w-full flex items-center justify-center gap-1.5 border border-border bg-surface-subtle py-1.5 text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground transition-colors hover:bg-surface-hover active:bg-border disabled:opacity-50"
      >
        <span>Sync MCP Configs</span>
        <ArrowUpRight className="h-3 w-3 text-muted" />
      </button>
    </aside>
  );
}
