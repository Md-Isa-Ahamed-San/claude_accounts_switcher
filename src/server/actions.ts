"use server";

import { z } from "zod";
import {
  getAccountsWithStatus,
  checkTasksRegistered,
  switchInstance,
  closeInstance,
  closeAllInstances,
  syncMcp,
  renameAccount,
  getAccounts,
  openProfileFolder,
} from "./claude-service";
import type {
  AccountWithStatus,
  SwitchResult,
  TaskStatusResult,
  ActionResult,
} from "~/lib/types";

const accountIdSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
});

const renameSchema = z.object({
  oldName: z.string().min(1, "Old name is required"),
  newName: z.string().min(1, "New name is required"),
});

export async function getAccountsAction(): Promise<AccountWithStatus[]> {
  try {
    return await getAccountsWithStatus();
  } catch (error) {
    console.error("[Action Error] getAccountsAction:", error);
    return [];
  }
}

export async function getTaskStatusAction(): Promise<TaskStatusResult> {
  try {
    return await checkTasksRegistered();
  } catch (error) {
    console.error("[Action Error] getTaskStatusAction:", error);
    return { allRegistered: false, missing: [], taskCount: 0 };
  }
}

export async function switchAccountAction(input: {
  accountId: string;
}): Promise<SwitchResult> {
  try {
    const { accountId } = accountIdSchema.parse(input);
    return await switchInstance(accountId);
  } catch (error) {
    console.error("[Action Error] switchAccountAction:", error);
    return {
      success: false,
      action: "launched",
      error: error instanceof Error ? error.message : "Failed to switch account",
    };
  }
}

export async function closeAccountAction(input: {
  accountId: string;
}): Promise<ActionResult> {
  try {
    const { accountId } = accountIdSchema.parse(input);
    const accounts = getAccounts();
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, error: "Account not found" };
    }
    return await closeInstance(target);
  } catch (error) {
    console.error("[Action Error] closeAccountAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to close account",
    };
  }
}

export async function closeAllAccountsAction(): Promise<ActionResult> {
  try {
    return await closeAllInstances();
  } catch (error) {
    console.error("[Action Error] closeAllAccountsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to close all accounts",
    };
  }
}

export async function syncMcpAction(): Promise<ActionResult> {
  try {
    return await syncMcp();
  } catch (error) {
    console.error("[Action Error] syncMcpAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync MCP configuration",
    };
  }
}

export async function renameAccountAction(input: {
  oldName: string;
  newName: string;
}): Promise<ActionResult> {
  try {
    const { oldName, newName } = renameSchema.parse(input);
    return await renameAccount(oldName, newName);
  } catch (error) {
    console.error("[Action Error] renameAccountAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rename account",
    };
  }
}

export async function openProfileFolderAction(input: {
  accountId: string;
}): Promise<ActionResult> {
  try {
    const { accountId } = accountIdSchema.parse(input);
    return await openProfileFolder(accountId);
  } catch (error) {
    console.error("[Action Error] openProfileFolderAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open folder",
    };
  }
}

