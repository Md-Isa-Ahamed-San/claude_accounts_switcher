---
name: debugging-and-error-recovery
description: >-
  Use this skill when diagnosing bugs, fixing errors, or debugging runtime/build issues.
  It provides a structured approach to root-cause analysis and prevents blind fix-stacking.
---

# Debugging & Error Recovery

A structured approach to finding and fixing bugs.

## Protocol

1. **Reproduce** — Understand and reproduce the exact error. Read the full error message/stack trace.
2. **Hypothesize** — Form a root-cause hypothesis with evidence from the code/data flow. Write it down.
3. **Verify Hypothesis** — Trace the code path to confirm the hypothesis before writing any fix.
4. **Fix** — Apply the minimal fix that addresses the root cause.
5. **Validate** — Run `npx tsc --noEmit` and test the fix.
6. **If Fix Fails** — Do NOT stack another fix. Instead:
   - Document why the hypothesis was wrong
   - Re-trace from the data flow
   - Form a new hypothesis
   - After 2 failed attempts → STOP and ask the user

## Anti-Patterns to Avoid

- Guessing without reading the code
- Adding `try/catch` to suppress errors instead of fixing them
- Stacking fixes without validating each one
- Blaming the framework before checking your own code
