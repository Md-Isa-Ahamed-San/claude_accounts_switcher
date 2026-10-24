"use client";

import { useEffect, useRef, useState } from "react";
import { Edit3, X } from "lucide-react";
import type { AccountWithStatus } from "~/lib/types";

interface RenameModalProps {
  account: AccountWithStatus;
  onClose: () => void;
  onRename: (oldName: string, newName: string) => void;
  isRenaming: boolean;
}

export function RenameModal({
  account,
  onClose,
  onRename,
  isRenaming,
}: RenameModalProps) {
  const [newName, setNewName] = useState(() => account.label || account.id);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed && trimmed !== account.id) {
      onRename(account.id, trimmed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md border border-border bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center bg-claude-subtle text-claude">
              <Edit3 className="h-3 w-3" />
            </div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Rename Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-muted">
              Current ID
            </span>
            <p className="mt-1 font-mono text-xs text-foreground bg-surface-subtle px-2.5 py-1.5 border border-border">
              {account.id}
            </p>
          </div>

          <div>
            <label
              htmlFor="new-name-input"
              className="block text-[10px] font-mono uppercase tracking-wider text-muted"
            >
              New Profile Label / ID
            </label>
            <input
              ref={inputRef}
              id="new-name-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isRenaming}
              className="mt-1 w-full border border-border bg-surface-subtle px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
              placeholder="e.g. personal-work"
            />
            <p className="mt-1 text-[10px] text-muted font-sans">
              Updates shortcuts, profile scripts, and accounts.json.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRenaming}
              className="border border-border px-3 py-1 text-xs font-mono uppercase text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isRenaming || !newName.trim() || newName.trim() === account.id
              }
              className="bg-foreground px-3 py-1 text-xs font-mono uppercase font-bold text-ground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRenaming ? "Renaming..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
