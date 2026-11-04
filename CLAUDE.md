# Claude Code adapter

@AGENTS.md
@WORKFLOW.md

## Known mistakes — do NOT repeat

- Use `**/*` not `*` when globbing nested directories — `*` only matches one level.
- All AGENTS.md skills exist at `.agents/skills/<name>/SKILL.md` — check before saying "not found".

- Never add a `Co-Authored-By` trailer or any attribution to Claude or any other AI agent in a commit, PR or issue (AGENTS.md "GitHub conventions").
- Edit skills in `.agents/skills/` only, then run `python .agents/scripts/sync_skill_mirrors.py`; never edit `.claude/skills/` or `.codex/skills/` directly.

## Workflow triggers

- When the user says "plan vN" or "start vN": run Phase 0 (version planning).
- When the user requests a build (e.g., "build UC-001", "build the fetch flow",
  "build FR-001"): check that Phase 0 of the active version is closed, determine the
  scope from the version spec (UC steps, alternatives, FRs, NFRs), and start Phase 1.
- When the user reports a bug fix or a small change to an existing FR: propose a light
  build.
- When the user says "close vN": run the version-close checklist.
- When the user says "continue" + a build name: read the flow tracker issue on GitHub
  first, then resume at the active phase.
- When the user says "status" + a build name: show the flow tracker status without
  making changes.

The scope can be a full UC, a subset of steps, specific alternatives, or individual FRs.
See WORKFLOW.md "Trigger and scope" for examples.
