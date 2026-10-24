"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface TaskSetupBannerProps {
  missingTasks: string[];
}

export function TaskSetupBanner({ missingTasks }: TaskSetupBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || missingTasks.length === 0) return null;

  return (
    <div className="mb-3.5 flex items-start justify-between gap-3 border border-warning-border bg-warning-bg p-3 text-xs text-foreground">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Windows Session Bridge Setup Recommended
          </p>
          <p className="text-[11px] text-muted font-sans">
            Windows requires registered scheduled tasks for newly launched accounts to render an interactive desktop window ({missingTasks.length} task(s) missing).
            Run <code className="bg-surface px-1.5 py-0.2 font-mono text-claude border border-border">Setup-ScheduledTasks.ps1</code> once as Administrator in PowerShell.
          </p>
        </div>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 text-muted hover:bg-surface hover:text-foreground transition-colors"
        title="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
