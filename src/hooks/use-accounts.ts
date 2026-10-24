"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import {
  getAccountsAction,
  getTaskStatusAction,
  switchAccountAction,
  closeAccountAction,
  closeAllAccountsAction,
  syncMcpAction,
  renameAccountAction,
  openProfileFolderAction,
} from "~/server/actions";
import type { AccountWithStatus } from "~/lib/types";

export function useAccounts() {
  return useQuery<AccountWithStatus[]>({
    queryKey: ["accounts"],
    queryFn: () => getAccountsAction(),
    refetchInterval: 2500,
  });
}

export function useTaskStatus() {
  return useQuery({
    queryKey: ["task-status"],
    queryFn: () => getTaskStatusAction(),
    staleTime: 60000,
  });
}

export function useAccountOperations() {
  const queryClient = useQueryClient();
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const switchMutation = useMutation({
    mutationFn: async ({
      accountId,
      label,
      activeAccount,
    }: {
      accountId: string;
      label: string;
      activeAccount?: AccountWithStatus | null;
    }) => {
      setLaunchingId(accountId);

      if (activeAccount && activeAccount.id !== accountId) {
        toast.info(
          `Switching to ${label}... (closing ${activeAccount.label})`,
          { duration: 4000 }
        );
      } else {
        toast.info(`Launching ${label}...`, { duration: 3000 });
      }

      const res = await switchAccountAction({ accountId });
      if (!res.success) {
        throw new Error(res.error || "Failed to switch account");
      }
      return { ...res, targetLabel: label };
    },
    onSuccess: (data) => {
      if (data.action === "focused") {
        setLaunchingId(null);
        toast.success(`Focused window for ${data.targetLabel}`);
      } else {
        toast.success(
          `${data.targetLabel} launched! Window will appear on desktop shortly.`
        );
        // Fast-poll accounts for a few seconds to detect process window
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        let polls = 0;
        pollTimerRef.current = setInterval(async () => {
          polls++;
          const fresh = await queryClient.fetchQuery({
            queryKey: ["accounts"],
            queryFn: () => getAccountsAction(),
          });
          const targetRunning = fresh.find(
            (a) => a.id === data.account?.id && a.isRunning
          );
          if (targetRunning || polls >= 12) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setLaunchingId(null);
          }
        }, 1500);
      }
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => {
      setLaunchingId(null);
      toast.error(err.message || "Could not switch account");
    },
  });

  const closeMutation = useMutation({
    mutationFn: async ({ accountId }: { accountId: string; label: string }) => {
      toast.info("Closing Claude instance...", { duration: 2500 });
      const res = await closeAccountAction({ accountId });
      if (!res.success) {
        throw new Error(res.error || "Failed to close account");
      }
      return res;
    },
    onSuccess: async () => {
      toast.success("Account closed cleanly. All accounts are now idle.");
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to close instance");
    },
  });

  const closeAllMutation = useMutation({
    mutationFn: async () => {
      toast.info("Terminating all active Claude instances...", { duration: 2500 });
      const res = await closeAllAccountsAction();
      if (!res.success) {
        throw new Error(res.error || "Failed to terminate all instances");
      }
      return res;
    },
    onSuccess: async () => {
      toast.success("All Claude instances closed.");
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to close all instances");
    },
  });

  const syncMcpMutation = useMutation({
    mutationFn: async () => {
      toast.info("Syncing primary MCP config to secondary accounts...", {
        duration: 3500,
      });
      const res = await syncMcpAction();
      if (!res.success) {
        throw new Error(res.error || "Failed to sync MCP configuration");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("MCP configuration successfully synchronized!");
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["task-status"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "MCP sync encountered errors");
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({
      oldName,
      newName,
    }: {
      oldName: string;
      newName: string;
    }) => {
      const res = await renameAccountAction({ oldName, newName });
      if (!res.success) {
        throw new Error(res.error || "Failed to rename account");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Account profile renamed successfully!");
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to rename account");
    },
  });

  const openFolderMutation = useMutation({
    mutationFn: async ({ accountId }: { accountId: string }) => {
      const res = await openProfileFolderAction({ accountId });
      if (!res.success) throw new Error(res.error || "Could not open folder");
      return res;
    },
    onSuccess: () => {
      toast.success("Opened profile data directory");
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to open directory");
    },
  });

  return {
    launchingId,
    switchAccount: (
      accountId: string,
      label: string,
      activeAccount?: AccountWithStatus | null
    ) => switchMutation.mutate({ accountId, label, activeAccount }),
    isSwitching: switchMutation.isPending,
    closeAccount: (accountId: string, label: string) =>
      closeMutation.mutate({ accountId, label }),
    isClosing: closeMutation.isPending,
    closeAllAccounts: () => closeAllMutation.mutate(),
    isClosingAll: closeAllMutation.isPending,
    syncMcp: () => syncMcpMutation.mutate(),
    isSyncingMcp: syncMcpMutation.isPending,
    renameAccount: (oldName: string, newName: string) =>
      renameMutation.mutate({ oldName, newName }),
    isRenaming: renameMutation.isPending,
    openProfileFolder: (accountId: string) =>
      openFolderMutation.mutate({ accountId }),
  };
}

