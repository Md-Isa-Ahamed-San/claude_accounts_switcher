"use client";

import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { MetricsBar } from "~/components/MetricsBar";
import { TaskSetupBanner } from "~/components/TaskSetupBanner";
import { AccountGrid } from "~/components/AccountGrid";
import { SystemBridgePanel } from "~/components/SystemBridgePanel";
import { RenameModal } from "~/components/RenameModal";
import {
  useAccounts,
  useTaskStatus,
  useAccountOperations,
} from "~/hooks/use-accounts";
import type { AccountWithStatus } from "~/lib/types";
import { ShieldCheck, Terminal, Keyboard } from "lucide-react";

export default function SwitcherDashboard() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: taskStatus } = useTaskStatus();
  const {
    launchingId,
    switchAccount,
    closeAccount,
    syncMcp,
    isSyncingMcp,
    renameAccount,
    isRenaming,
    openProfileFolder,
  } = useAccountOperations();

  const [renameTarget, setRenameTarget] = useState<AccountWithStatus | null>(
    null
  );

  const activeAccount = accounts?.find((a) => a.isRunning) || null;

  // Global Keyboard Shortcuts (Keys 1-9 to launch or focus accounts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or contentEditable
      if (
        ["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement)?.tagName || ""
        ) ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const keyNum = parseInt(e.key, 10);
      if (
        !isNaN(keyNum) &&
        accounts &&
        keyNum >= 1 &&
        keyNum <= accounts.length
      ) {
        const target = accounts[keyNum - 1];
        if (target) {
          e.preventDefault();
          switchAccount(target.id, target.label || target.id, activeAccount);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [accounts, activeAccount, switchAccount]);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-between">
      <div>
        <Header
          onSyncMcp={syncMcp}
          isSyncingMcp={isSyncingMcp}
          activeAccountLabel={activeAccount?.label || null}
        />

        {taskStatus && !taskStatus.allRegistered && (
          <div className="mt-3">
            <TaskSetupBanner missingTasks={taskStatus.missing} />
          </div>
        )}

        <MetricsBar accounts={accounts || []} />

        {/* Studio Canvas: Compact Profile Rows (Left 8/12) + Telemetry Bridge (Right 4/12) */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Main Profiles Section (Compact Row-Based Ruled List) */}
          <section className="lg:col-span-8 space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-claude" />
                <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wider font-mono">
                  Configured Instances
                </h2>
                <span className="border border-border bg-surface px-1 py-0.2 text-[10px] font-mono text-muted">
                  [{accounts?.length || 0}]
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
                <span className="hidden sm:inline">Shortcuts:</span>
                <span className="flex items-center gap-1">
                  <kbd className="border border-border bg-surface px-1 py-0.2 text-[10px] text-claude">
                    [1]
                  </kbd>
                  <span>—</span>
                  <kbd className="border border-border bg-surface px-1 py-0.2 text-[10px] text-claude">
                    [{accounts?.length || 4}]
                  </kbd>
                </span>
              </div>
            </div>

            <AccountGrid
              accounts={accounts}
              isLoading={isLoading}
              launchingId={launchingId}
              onSwitch={(id, label) => switchAccount(id, label, activeAccount)}
              onClose={(id, label) => closeAccount(id, label)}
              onOpenRename={(acc) => setRenameTarget(acc)}
              onOpenFolder={(id) => openProfileFolder(id)}
            />
          </section>

          {/* Telemetry & System Bridge Inspector */}
          <section className="lg:col-span-4 space-y-3">
            <SystemBridgePanel
              taskStatus={taskStatus}
              activeAccountLabel={activeAccount?.label || null}
              activePid={activeAccount?.pid || null}
              onSyncMcp={syncMcp}
              isSyncingMcp={isSyncingMcp}
            />

            {/* Quick Tips Box */}
            <div className="border border-border bg-surface p-3 text-xs font-mono text-muted space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[10px] uppercase tracking-wider">
                <Keyboard className="h-3 w-3 text-claude" />
                <span>Switching Guide</span>
              </div>
              <p className="text-[10px] text-muted leading-relaxed font-sans">
                Pressing <kbd className="text-claude font-mono font-bold">[1]</kbd>–<kbd className="text-claude font-mono font-bold">[4]</kbd> closes the active profile cleanly and brings the selected instance to the foreground within 4–5s.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Safety Policy & Telemetry Footer */}
      <footer className="mt-8 border-t border-border pt-3.5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-positive shrink-0" />
          <span className="text-[11px] font-sans">
            <strong className="text-foreground font-medium">Single-Instance Guard:</strong>{" "}
            Active process lock prevention enabled. Only one Claude Desktop profile runs concurrently.
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1 text-positive">
            <span className="h-1.5 w-1.5 bg-positive" />
            <span>Polling Active (2.5s)</span>
          </span>
          <span className="text-muted-dim">/</span>
          <span className="text-muted">Win32 ChildProcess Bridge</span>
        </div>
      </footer>

      {renameTarget && (
        <RenameModal
          key={renameTarget.id}
          account={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRename={(oldName, newName) => renameAccount(oldName, newName)}
          isRenaming={isRenaming}
        />
      )}
    </main>
  );
}
