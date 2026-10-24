---
name: spec-driven-development
description: >-
  Use this skill when the user requests a new feature, module, or significant code change.
  It guides the agent through writing a specification document (requirements, non-goals,
  architecture decisions, success criteria) before writing any code.
---

# Spec-Driven Development

Before implementing any significant feature or change, create a specification first.

## Steps

1. **Gather Requirements** — Ask the user what they want. Clarify ambiguous points.
2. **Write the Spec** — Create `.agents/plans/active_implementation_plan.md` with:
   - **Goal:** What we're building and why
   - **Requirements:** Numbered list of must-haves
   - **Non-Goals:** What we're explicitly NOT doing
   - **Architecture:** Key design decisions, data models, component structure
   - **Success Criteria:** How we know it's done
3. **Get Approval** — Present the spec to the user. Do NOT write code until approved.
4. **Implement** — Build incrementally, one task at a time, verifying types after each.
5. **Verify** — Run `npx tsc --noEmit` and confirm all success criteria are met.
