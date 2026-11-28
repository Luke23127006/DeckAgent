# Task 34: Refresh the Browser from providers notices report

Read this file to learn how the Browser reacts to a `providers` notice and to `PROVIDERS_STALE`, and the result of each check.

## Files changed

- `apps/web/src/browser/boot.ts`: the function `onNotice` of `ChangeWatcher` has a `providers` branch. The branch returns when the notice version is not above `navigation.settings.providersVersion`. Otherwise it calls `navigation.refresh()` and `controls()`.
- `apps/web/src/browser/features/providers/settings-panel.ts`: when `perform` catches a `ManagementError` with the code `PROVIDERS_STALE`, it calls `refresh(panel, panel.dom.chooser.value)` before it shows the message.
- `apps/web/src/browser/features/providers/provider-errors.ts`: `saveFailure` returns the text for `PROVIDERS_STALE`.
- `e2e/browser-smoke.test.mjs`: the helper `openProviderChanges` and two tests, one for the `providers` notice and one for `PROVIDERS_STALE`. The helper has one added `await delay(500)` after the boot check. See the section `Deviations and retries`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 34 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-34-refresh-browser-from-providers-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-34-refresh-browser-from-providers-notices.md`: this report.
- `CHANGELOG.md`: records the change.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 33 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 33. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 2 | `node --test --test-name-pattern="providers notice\|PROVIDERS_STALE" e2e/browser-smoke.test.mjs` | 1 | `# tests 2`, `# pass 0`, `# fail 2`. Both tests stop at `pickerShowsOther`. |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | The same `node --test` command | 0 | `# tests 2`, `# pass 2`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 build`, then the same `node --test` command, without the `providers` branch | 1 | First attempt: `# pass 1`, `# fail 1`. Full attempt after the helper change: `# pass 0`, `# fail 2`. See the section `Deviations and retries`. |
| 4 | `corepack pnpm@11.28.5 build`, then the same `node --test` command, without the new `refresh` call of `perform` | 1 | `# pass 1`, `# fail 1`. |
| 5 | `corepack pnpm@11.28.5 exec biome format --write <each changed code and test file>` | 0 | `Formatted 3 files in 35ms. No fixes applied.` Biome checks no file of `e2e/`, because `biome.json` includes `apps`, `packages`, `scripts` and `tests` only. |
| 5 | The same `biome format` command without `--write` | 0 | `Checked 3 files in 17ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `corepack pnpm@11.28.5 lint` | 0 | The command prints the `oxlint` line only. No finding. |
| 5 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 236 file(s) checked, 0 error(s) in 0 file(s)`. |
| 6 | The nineteen suite commands of the table below | 0 | Every suite gives `# fail 0`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 237 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

## Suites after the change

| Suite | Exit code | Pass and fail |
| --- | --- | --- |
| test:http-edge | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | 0 | `# pass 20`, `# fail 0` |
| test:local-web | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | 0 | `# pass 54`, `# fail 0` |
| test:model-requests | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | 0 | `# pass 11`, `# fail 0` |
| test:attachments | 0 | `# pass 29`, `# fail 0` |
| test:research | 0 | `# pass 5`, `# fail 0` |
| test:images | 0 | `# pass 39`, `# fail 0` |
| test:outline-workflow | 0 | `# pass 6`, `# fail 0` |
| test:brief-foundation | 0 | `# pass 15`, `# fail 0` |
| test:deck-review | 0 | `# pass 21`, `# fail 0` |
| test:generation-publication | 0 | `# pass 72`, `# fail 0` |
| test:slide-pipeline | 0 | `# pass 7`, `# fail 0` |
| test:session-persistence | 0 | `# pass 7`, `# fail 0` |
| test:opencode-resources | 0 | `# pass 3`, `# fail 0` |
| test:layouts | 0 | `# pass 10`, `# fail 0` |
| test:browser-smoke | 0 | `# pass 17`, `# fail 0` |
| test:env-startup | 0 | `# pass 2`, `# fail 0` |

## Deviations and retries

1. Step 4, item 1, first attempt: the task expects `# fail 2` and the output gave `# fail 1`. The first test does not detect the missing `providers` branch. After the boot check, the first `chats` notice of `GET /api/changes` calls `navigation.refresh()`. Its settings read usually completes after the `PUT` of the test, so the model picker shows the new provider with no `providers` branch. The person who owns the task approved one change of the helper `openProviderChanges`: `await delay(500)` after the boot check. The checks and the names of both tests did not change. The second attempt gives `# fail 2`.
2. Step 5: the `biome` commands check 3 files. The file `e2e/browser-smoke.test.mjs` is not in the `includes` list of `biome.json`, as in Task 33.

No STOP condition occurred. The task has no table and no decision table item.

`python` is not on this machine. The STE lint command ran with `python3.12`.

## What the commands do not prove

- The tests use one Browser tab and one HTTP client, not two Browser tabs.
- No test checks a removal that gets `PROVIDERS_STALE`, because a removal opens a `confirm` dialog.
- The first test now waits 500 ms after the boot check. A slower machine could show the boot refresh later than this wait. The second test does not depend on the wait for its stale check.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
