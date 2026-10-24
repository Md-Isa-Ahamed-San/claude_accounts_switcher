---
name: t3-stack-patterns
description: >-
  Use this skill when writing or modifying code in this Next.js project.
  It covers Next.js App Router conventions, TypeScript standards, Tailwind CSS 4,
  Server Actions, TanStack Query custom hooks, and safe Windows OS automation.
---

# Next.js Server Actions & App Patterns for Claude Multi-Deck

This project uses Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS 4 with a **Server Actions First** architecture.

## Server Actions (`src/server/actions.ts`)

- Mark all server actions with `"use server"` at the top of the file or function.
- All OS commands (PowerShell, WMI queries, `schtasks`) run server-side inside `src/server/claude-service.ts`.
- Validate all input parameters using Zod.
- Always return clean, typed serializable data.

```typescript
"use server";

import { z } from "zod";
import { switchInstance } from "./claude-service";

const switchSchema = z.object({
  accountId: z.string().min(1),
});

export async function switchAccountAction(input: { accountId: string }) {
  const { accountId } = switchSchema.parse(input);
  return await switchInstance(accountId);
}
```

## Client Data Fetching via React Query Custom Hooks (`src/hooks/use-accounts.ts`)

- Never use raw REST APIs for internal app logic.
- Wrap Server Actions directly in TanStack React Query `useQuery` and `useMutation` hooks.
- Use `refetchInterval` for live background polling (2500ms).
- Use optimistic updates in mutations for instantaneous UI responsiveness.

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountsAction, switchAccountAction } from "~/server/actions";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccountsAction(),
    refetchInterval: 2500,
  });
}
```

## Safe Windows OS Automation

- Use Base64 `-EncodedCommand` for all dynamic PowerShell commands.
- Apply bounded timeouts (`15000` to `30000` ms) to prevent hanging execution.
- Single-account safety: automatically terminate conflicting running instances before launching another.
