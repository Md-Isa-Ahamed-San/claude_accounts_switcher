---
name: incremental-implementation
description: >-
  Use this skill when implementing a plan or building a feature step by step.
  It enforces building one task at a time with type-checking after each step
  to prevent error accumulation.
---

# Incremental Implementation

Build features one task at a time. Never batch multiple unrelated changes.

## Protocol

1. **Read the Plan** — Check `.agents/plans/active_implementation_plan.md` for the current task list.
2. **One Task at a Time** — Implement exactly one task before moving to the next.
3. **Type Gate** — After each task, run `npx tsc --noEmit`. Fix all errors before continuing.
4. **Import Verification** — After writing any new file, verify all imports resolve correctly.
5. **Update Progress** — Mark completed tasks in the plan file.

## Rules

- If a task reveals the plan needs adjustment, update the plan FIRST, then continue.
- Never skip the type check between tasks.
- Keep each task small enough to verify independently.
