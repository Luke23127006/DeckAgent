# Upstream

- Repository: https://github.com/cursor/plugins
- Path: `pstack/skills/correct`
- Pinned commit: `bf0c7cd80abdbf7fe47b634978a7d1b4071f71a7` (last commit touching the path: `e5136d82418d2db3165ea1050d17577cd618cc05`, 2026-10-15; pstack 0.15.42)
- License: MIT, `LICENSE` copied from `pstack/LICENSE`

## Files

Included: `SKILL.md`.

## Modifications

### 1. Commits, CI and inline exceptions

- Original: "Then fix the most frequent classes now, one commit each. Prove each new check fails on a real past mistake. Run the same command locally and in CI. Exceptions go on the offending line with a reason, an expiry date, and a human's approval."
- Reason: the project permits commits only when requested and prohibits inline exceptions. The user reserves the full repository check for explicit requests.
- Change: use one reviewable change per class. Run relevant checks locally under `AGENTS.md` and keep applicable checks in CI. Run `pnpm check` only on explicit request. Keep exception rules in `eslint.config.js` with user approval.
- Impact: exceptions are visible in one config file instead of scattered across source.

### 2. Rule table location

- Original: "Last, keep a table in the agent instruction file that pairs each rule with what enforces it."
- Reason: `CLAUDE.md` must not duplicate conventions already defined in the Development Guide (`CLAUDE.md` Coding Conventions 03), and Lesson Learned entries require user approval.
- Change: rules and their enforcement live in the convention files in `docs/conventions/` (marked *(lint)* or *(check-docs)*); process mistakes that the output file does not show become Lesson Learned entries.
- Impact: none on the method.

### 3. Model invocation and single-correction path

- Original: frontmatter `disable-model-invocation: true`; the description is "Use for /correct" only.
- Reason: this skill replaces the project's former `lesson-manager` skill, which the agent loaded on its own when the user pointed out a mistake. Two skills for the same trigger gave two procedures with different thresholds and destinations.
- Change: removed `disable-model-invocation`; the description also triggers on a user correction and on Lesson Learned requests. "Find the mistake classes" now names two modes: a sweep keeps the upstream two-occurrence threshold; a single operator correction counts after one occurrence and skips the sweep. Task-only feedback is not a class in either mode.
- Impact: the agent can apply the ladder on any correction, not only on an explicit `/correct`.

### 4. Lessons Learned section

- Original: level 4 is "Write docs or agent rules last, only for judgment calls."
- Reason: the project keeps unenforceable rules in `LESSONS.md`, which requires user approval for every change (`CLAUDE.md` Lesson Learned & Pitfalls).
- Change: level 4 names where each kind of rule goes; added the "Lessons Learned (level 4)" section (approval gate, no lessons in `CLAUDE.md`, amend over duplicate, repeat handling, deprecation when a higher level takes over, `git diff`, review checklist).
- Impact: prose rules have one destination and one approval flow.
