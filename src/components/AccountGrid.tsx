"use client";

import type { AccountWithStatus } from "~/lib/types";
import { AccountRow } from "./AccountRow";
import { Layers } from "lucide-react";

interface AccountGridProps {
  accounts: AccountWithStatus[] | undefined;
  isLoading: boolean;
  launchingId: string | null;
  onSwitch: (accountId: string, label: string) => void;
  onClose: (accountId: string, label: string) => void;
  onOpenRename: (account: AccountWithStatus) => void;
  onOpenFolder: (accountId: string) => void;
}

export function AccountGrid({
  accounts,
  isLoading,
  launchingId,
  onSwitch,
  onClose,
  onOpenRename,
  onOpenFolder,
}: AccountGridProps) {
  if (isLoading) {
    return (
      <div className="border border-border bg-surface divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 bg-surface-subtle" />
              <div className="h-6 w-6 bg-surface-subtle" />
              <div className="space-y-1">
                <div className="h-3 w-28 bg-surface-subtle" />
                <div className="h-2 w-20 bg-surface-subtle" />
              </div>
            </div>
            <div className="h-6 w-16 bg-surface-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border p-8 text-center bg-surface">
        <Layers className="h-6 w-6 text-muted mb-2" />
        <h3 className="text-xs font-mono uppercase font-bold text-foreground">
          No Profiles Found
        </h3>
        <p className="mt-1 text-[11px] text-muted max-w-sm font-sans">
          No Claude accounts were discovered in <code className="text-claude">accounts.json</code>.
          Add profile entries to begin switching.
        </p>
      </div>
    );
  }

  const activeAccount = accounts.find((a) => a.isRunning) || null;

  return (
    <div className="border border-border bg-surface">
      {/* Table Column Headers (Architectural Grid) */}
      <div className="hidden md:flex items-center justify-between px-3.5 py-1.5 border-b border-border bg-surface-subtle text-[10px] font-mono font-bold text-muted uppercase tracking-wider">
        <div className="w-5/12 lg:w-4/12">Profile / Identity</div>
        <div className="w-2/12">Status</div>
        <div className="w-2/12">Telemetry (RAM & PID)</div>
        <div className="w-3/12 text-right">Actions</div>
      </div>

      {/* Ruled Row-Based Account List */}
      <div className="divide-y divide-border">
        {accounts.map((acc, index) => (
          <AccountRow
            key={acc.id}
            account={acc}
            index={index}
            activeAccount={activeAccount}
            isLaunching={launchingId === acc.id}
            onSwitch={onSwitch}
            onClose={onClose}
            onOpenRename={onOpenRename}
            onOpenFolder={onOpenFolder}
          />
        ))}
      </div>
    </div>
  );
}
