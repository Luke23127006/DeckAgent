# Task 12: Record the style commits and run the exit checks report

Read this file to review the files, the commands and the checks of Task 12 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

The task created `.git-blame-ignore-revs` with the 7 style commits. In addition, the task marked the 6 steps as complete in [Task 12](../plan/task-12-record-style-commits-and-exit.md), changed the row of Task 12 to `Done` in the [plan README](../plan/README.md), added the row of Task 12 to [Code Layout Reports](README.md) and created this report. No file under `apps/`, `packages/`, `scripts/` or `tests/` changed.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | no line |
| 2 | `git log --reverse -E --grep='^style\((format\|layout)\):' --format='%H %s'` | `0` | 7 lines |
| 3 | `grep -c -E '^[0-9a-f]{40}$' .git-blame-ignore-revs` | `0` | `7` |
| 3 | `git blame --ignore-revs-file .git-blame-ignore-revs -- package.json > /dev/null` | `0` | no output |
| 4 | `for h in $(git log -E --grep='^style\(layout\):' --format=%H); do git show -U0 --ignore-blank-lines --format= "$h" -- apps packages scripts tests \| grep -E '^@@'; done` | `0` | no line |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` complete |
| 5 | `corepack pnpm@11.28.5 lint` | `0` | `check-source-language: 239 file(s) checked, 0 finding(s)` |
| 5 | `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| 5 | `corepack pnpm@11.28.5 format:check` | `0` | `format-layout: 0 finding(s)`, `Checked 314 files in 805ms. No fixes applied.` |
| 5 | `node --test --test-reporter=tap tests/format-layout.test.mjs tests/post-edit-hook.test.mjs tests/check-docs.test.mjs` | `0` | `# tests 45`, `# pass 45`, `# fail 0` |
| 5 | `corepack pnpm@11.28.5 test:web` | `0` | `Test Files 8 passed (8)`, `Tests 33 passed (33)` |
| 5 | `node scripts/format-layout.mjs --dense apps/host/src apps/web/src packages/*/*/src \| tail -n 1` | `0` | `format-layout: 2 dense function bodies` |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 377 file(s) checked, 0 error(s) in 0 file(s)` |

An exit code of `1` for a `grep` command means that the pattern matched no line. The command of Step 4 is the expected case: the output is empty.

## Style commits

| Hash | Subject |
| --- | --- |
| `68e37e5b97c5de8b6ba55c42dfc8bf4d428975ef` | `style(format): apply biome format` |
| `3c6a67330f9c21f23d2f1afcbe27916c958f5612` | `style(layout): add blank lines between declarations and members` |
| `925f8ef5434f96b92a0218c6fdbfd1c79fd66f3a` | `style(layout): add steps in the Host deck module` |
| `f8597347d1ae32aa6bb6b470e1be20ae9dfaf703` | `style(layout): add steps in the other Host folders` |
| `9c1497dbc3338568b86cd0d747ed4ee4d1afa4db` | `style(layout): add steps in the Browser` |
| `3b90129c4e8ea8e3ecd2d0be9f85e99bee32a051` | `style(layout): add steps in the deck package` |
| `0577d59745e37e7d9766211a34aec189c04745dd` | `style(layout): add steps in the other packages` |

`.git-blame-ignore-revs` holds the same 7 hashes, in the same order, with the subject of each commit above its hash.

## Far declarations and unchanged bodies of Tasks 7 to 11

The counts come from the tables `Far declarations` and `Unchanged bodies` of the reports of Tasks 7 to 11.

| Task | Far declarations | Unchanged bodies |
| --- | --- | --- |
| 7 | 16 | 0 |
| 8 | 51 | 0 |
| 9 | 69 | 0 |
| 10 | 41 | 2 |
| 11 | 15 | 0 |
| Total | 192 | 2 |

The 2 unchanged bodies are `packages/presentation/deck/src/artifact-store.ts:257` `assertStageReadyForBuild` and `packages/presentation/deck/src/interview.ts:24` `interviewState`. The command of Step 5 finds the same 2 bodies, so the count of the command agrees with the count of the reports.

## Items that a decision table sent to the report

None. The task has no decision table.

## STOP and retry

none

## What the commands do not prove

- Step 4 proves that each layout commit adds only blank lines in the files under `apps/`, `packages/`, `scripts/` and `tests/`. It does not prove that a blank line sits between the correct statements. A person must read the diff to check the position.
- The exit checks prove that the repository builds, passes lint, passes the boundary check, passes `format:check` and passes the tests. They do not prove that a person agrees with the blank line between each pair of steps.
- Step 3 proves that Git accepts `.git-blame-ignore-revs`. It does not prove that a clone uses the file: `git blame` reads the file only after a person runs `git config blame.ignoreRevsFile .git-blame-ignore-revs`. The task does not change `git config`.
- The command of Step 5 lists 2 dense function bodies. Those bodies come from the table `Unchanged bodies` of [Task 10](task-10-add-steps-in-deck-package.md), so the refactor leaves them for a later revision.

## For each clone

Run this command in each clone of the repository:

```sh
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

After the command, `git blame` skips the 7 style commits, so a line shows the commit that wrote the code.
