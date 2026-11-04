# BRANDCORE — Implementation Prompt Template

Use this template for each bounded implementation prompt after the bootstrap run. One milestone at a time.

---

## Template

```
You are the senior engineer for BRANDCORE (CodeNexus India 2026, team SMRITUNJAY837).

Read CLAUDE.md first. Then read the documents it imports.

## Current milestone

[Milestone number and name from docs/EXECUTION_PLAN.md]

## Task

[One specific task ID from TASKS.md, e.g., M1-01]

[One paragraph describing exactly what to implement.]

## Acceptance criteria

[Copy the acceptance criteria from TASKS.md for this task.]

## Files to create or modify

[List the specific files. Do not modify files outside this list.]

## Tests to write

[List the specific test IDs from docs/TEST_PLAN.md that must pass.]

## Constraints

- JavaScript/JSX only in frontend. No TypeScript.
- Parameterized D1 queries only. No SQL concatenation.
- AI output validated with Pydantic before use.
- No new dependencies without an ADR.
- Update TASKS.md and MEMORY.md when done.
- Do not deploy, push to GitHub or create Cloudflare resources without explicit approval.

## Definition of done

- The listed tests pass (show exact output).
- No TypeScript files exist.
- No secrets in any file.
- TASKS.md updated with DONE/VERIFIED status and evidence.
- MEMORY.md updated with current state.
```

---

## Usage Notes

- Replace all `[bracketed]` sections with specific content for the milestone.
- Keep the prompt focused on one task. Do not ask for multiple milestones in one prompt.
- Always include the exact test IDs that must pass.
- Always include the exact files to modify. This prevents scope creep.
- After the prompt runs, verify the output against the acceptance criteria before proceeding to the next task.
