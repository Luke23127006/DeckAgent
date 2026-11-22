---
name: correct
description: "Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint whose error names the fix, then a test, and write docs or a Lesson Learned last. Prove each check fails on a real past mistake. Use for /correct, when the user points out a mistake an agent made, or when the user asks to record, review, or update a Lesson Learned in LESSONS.md."
---

# Correct

The operator keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent can't make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

## Find the mistake classes

The evidence depends on how the skill was started:

- **Sweep** (`/correct` without a specific mistake): read recent commits, reverts, review comments, agent instruction files, and comments that explain workarounds. Group the mistakes into classes. A class counts once it has happened twice, because a single occurrence in history may be a one-off.
- **Single correction** (the operator points out one mistake): the correction itself is the evidence, so the class counts after one occurrence; skip the sweep. The operator has already judged it worth fixing.

Feedback that applies only to the current task, or a temporary preference, is not a class in either mode: fix it within the task and briefly tell the user why nothing else changes.

## Fix each class at the highest level that works

1. **Eliminate it with architecture.** Give each piece of state one owner and each task one supported way. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
2. **Enforce it with types so the bad state can't be written.** If bad code still compiles, add a lint or CI check whose error names the file, type, or function to use instead. If the pattern is already common, fail only when a change adds more.
3. **Test the behavior.** Fix or delete any test that still passes when the behavior it checks breaks, or that fails when only the internals change.
4. **Write docs or agent rules last, only for judgment calls.** Nothing fails when an agent skips them. A rule that you can check by looking at the output file goes in the convention file for that output in `docs/conventions/` (see `docs/conventions/README.md` for the layers). A mistake in the process that the output file does not show becomes a Lesson Learned (see below).

## Fix and prove

Then fix the most frequent classes now, one reviewable change per class. Do not commit unless the user asks. Prove each new check fails on a real past mistake. Add new checks to the CI aggregate when applicable. Run only the relevant checks locally, as specified in `AGENTS.md`, section `Kiểm chứng theo thay đổi`. Run `pnpm check` only when the user explicitly requests that command. No inline exceptions (`eslint-disable`, `@ts-expect-error`): when a rule is wrong in one context, narrow the rule's scope in `eslint.config.js` with the user's approval.

## Keep the rule table

Keep the rules and their enforcement in the convention files in `docs/conventions/`: each rule states what enforces it (for example *(lint)* or *(check-docs)*). When the operator corrects you, fix the mistake and add the rule. If the rule was already there and nothing enforces it, that's a repeat, so fix it at the highest level in the same change. Drop a rule once its mistake can't happen.

## Lessons Learned (level 4)

`LESSONS.md` is the single source of truth for Lesson Learned entries; its `Quy ước` section defines the template, IDs, Scope values, and `Status: Deprecated`. Read it before proposing anything.

- **Never write to `LESSONS.md` until the user has approved the exact content.** Present the full entry (or the changed parts of an existing one, with its ID) and wait.
- Write lessons only to `LESSONS.md`, never to `AGENTS.md`. Do not turn existing `AGENTS.md` conventions into lessons unless the user asks.
- Prefer amending an existing lesson over adding a duplicate. A rule must be specific and verifiable, not so broad that it removes useful flexibility.
- When a lesson that is already in `LESSONS.md` is violated again, it is a repeat: look again for a level 1-3 fix before strengthening the text.
- When a mistake can no longer happen because a higher level now prevents it, propose marking the lesson `Status: Deprecated — <what enforces it now>`.
- After an approved write, show the change with `git diff -- LESSONS.md`.

To review `LESSONS.md`, check each lesson for duplication or conflict (with other lessons or `AGENTS.md`), vague or unverifiable rules, missing Problem/Rule/examples, a mistake that a level 1-3 check now prevents, and fit with the current project. Report a table of ID, issue, and proposed change; edit nothing until approved.

**Reply:** each class with its evidence, the level you picked, and why a higher level didn't work.
