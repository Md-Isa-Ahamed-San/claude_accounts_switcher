---
name: code-review-and-quality
description: >-
  Use this skill after implementing a feature or completing a set of changes.
  It guides the agent through a multi-axis code review covering correctness,
  type safety, dead code, and best practices.
---

# Code Review & Quality Check

Run this review after completing any implementation work.

## Review Checklist

### 1. Type Safety
- [ ] Run `npx tsc --noEmit` — zero errors
- [ ] No `any` types — use proper typing
- [ ] No `@ts-ignore` or `@ts-nocheck`

### 2. Import Health
- [ ] All imports resolve to real exports (grep to verify)
- [ ] No unused imports
- [ ] Using `@/` aliases, not relative paths

### 3. Dead Code
- [ ] No unused variables or functions
- [ ] No commented-out code blocks
- [ ] No leftover `console.log` statements

### 4. React Patterns (if applicable)
- [ ] Server components by default, `"use client"` only when needed
- [ ] No deprecated patterns (useFormState, sync params)
- [ ] Proper error boundaries and loading states

### 5. Performance
- [ ] No unnecessary re-renders (check dependency arrays)
- [ ] Database queries are efficient (no N+1)
- [ ] Proper use of `prefetch` for tRPC queries
