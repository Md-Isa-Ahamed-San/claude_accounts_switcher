---
name: planning-and-task-breakdown
description: >-
  Use this skill when breaking down an approved specification into actionable tasks.
  It produces an ordered task list with component breakdown and implementation sequence.
---

# Planning & Task Breakdown

Convert an approved spec into an ordered, implementable task list.

## Steps

1. **Read the Spec** — Load the approved `active_implementation_plan.md`.
2. **Identify Components** — List every file that needs to be created or modified.
3. **Order Tasks** — Sequence tasks so each builds on the previous:
   - Database schema changes first
   - Server-side procedures (tRPC routers) second
   - UI components third
   - Integration and wiring last
4. **Write Task File** — Create `.agents/plans/active_tasks.md` with:
   - Numbered task list
   - For each task: file(s) to touch, what to do, and acceptance criteria
5. **Get Approval** — Present to user. Do NOT start building until approved.

## Task Format

```markdown
### Task 1: [Brief title]
- **Files:** `path/to/file.ts`
- **Action:** [Create/Modify/Delete] — [description]
- **Done when:** [Specific verification criteria]
```
