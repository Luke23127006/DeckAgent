# Task 42: Connect the Browser to preferences notices and handle PREFERENCES_STALE report

Read this file to learn the changes and check results for Task 42.

## Files changed

- `apps/web/src/browser/boot.ts`: refresh settings and preferences on a newer notice, then update theme and research controls.
- `apps/web/src/browser/theme.ts`: expose the control node and theme update operation, and recover a stale save without another write.
- `apps/web/src/browser/features/research/research-view.ts`: refresh settings and show the stale message while retaining the typed key.
- `e2e/browser-smoke.test.mjs`: test notice updates, retained dialog input, stale feedback, and one research write.
- The task file, plan index, report index, and changelog: record completion.

## Commands run

Commands ran from the repository root in PowerShell.
Every package command uses `corepack pnpm@11.28.5`.
The evidence folder is `C:/Users/Duy/AppData/Local/Temp/deckagent-task42-1288228da5ef4997abbdf45a1ab52b26`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before changes | 0 | Approved Task 39 to Task 41 changes |
| `git grep` for the Task 41 Done row | 0 | One row |
| `build` before implementation | 0 | Build complete |
| Targeted red Browser tests | 1 | Pass 0, fail 2, cancelled 0 |
| First implementation `build` | 0 | Build complete |
| First implementation Browser tests | 1 | Pass 1, fail 1, cancelled 0 |
| `build` after Unicode correction | 0 | Build complete |
| Targeted Browser tests after Unicode correction | 0 | Pass 2, fail 0, cancelled 0 |
| `build` without the preferences notice branch | 0 | Build complete |
| Notice test without the branch | 1 | Pass 0, fail 1, cancelled 0 |
| `build` without the stale message entry | 0 | Build complete |
| Stale-message test without the entry | 1 | Pass 0, fail 1, cancelled 0 |
| `exec biome format --write` on three production files | 0 | Formatted three files |
| `exec biome format` on the same files | 0 | No fixes applied |
| Biome stdin format on the E2E file | 0 | Second pass produced identical text |
| `exec tsc -b --force` after source restoration | 0 | No error |
| Final `build` | 0 | Build complete |
| Targeted Browser tests after source restoration | 0 | Pass 2, fail 0, cancelled 0 |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | 0 violation(s) |
| `check:docs` before report creation | 0 | 252 files, 0 error(s) |
| `check:docs` after report indexing | 0 | 253 files, 0 error(s) |
| Report and review prompt STE lint | 0 | 0 violations |
| New Vietnamese status string lint | 0 | 0 findings |
| `git diff --check HEAD` | 0 | No whitespace error |
| `build` with the missing-refresh mutant | 0 | Build complete |
| Stale test with the missing-refresh mutant | 1 | Pass 0, fail 1, cancelled 0 |
| Forced TypeScript rebuild after the review mutation | 0 | No error |
| `build` after the review mutation | 0 | Build complete |
| Both targeted tests after the review fix | 0 | Pass 2, fail 0, cancelled 0 |
| Format, lint, and boundaries after the review fix | 0 | No fixes applied and 0 violations |

The red, green, and restored test command was:

```text
node --test --test-name-pattern="preferences notice|PREFERENCES_STALE" e2e/browser-smoke.test.mjs
```

Biome excludes the E2E folder in the existing configuration.
The E2E file used stdin with `--stdin-file-path=apps/host/tests/format-input.mjs`.

## Suites

All 19 required suites passed on the first run.

| Command | Exit code | Pass | Fail |
| --- | --- | --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 | 0 |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | 23 | 0 |
| `corepack pnpm@11.28.5 test:local-web` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | 57 | 0 |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | 29 | 0 |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:attachments` | 0 | 31 | 0 |
| `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 |
| `corepack pnpm@11.28.5 test:images` | 0 | 39 | 0 |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 15 | 0 |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | 21 | 0 |
| `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 | 0 |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 |
| `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 |
| `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 21 | 0 |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 |

## Retries and deviations

- The approved baseline contains Task 39 to Task 41 changes. The user excluded commit and push from this execution.
- The final workspace therefore contains changes for review. Neither commit nor push ran.
- A PowerShell pipe replaced Vietnamese characters with question marks during the first implementation edit.
- The first green run detected the damaged stale message. The notice test passed, and the stale-message test failed.
- The executor extracted the strings from the UTF-8 task file and rebuilt. Both tests then passed.
- The research message uses separate sentences instead of the plan's semicolon. Its meaning stays the same.
- The project skill folder has no Vietnamese linter. The shared global skill provides it.
- The new Vietnamese status strings pass that linter with zero findings.
- No suite retry occurred. The review added one assertion and its own mutation check.
- A usage-limit interruption paused execution after the mutation. The resumed executor checked the existing files and logs first.
- No unresolved STOP condition remains.

## Mutation evidence

The notice mutant removed the preferences branch from the Browser change watcher.
Its isolated test failed because the research controls did not update after the remote write.
The log is `C:/Users/Duy/AppData/Local/Temp/deckagent-task42-1288228da5ef4997abbdf45a1ab52b26/mutation-notice-tests.log`.

The message mutant removed the PREFERENCES_STALE entry from the research messages.
Its isolated test failed because the dialog did not show the stale message.
The log is `C:/Users/Duy/AppData/Local/Temp/deckagent-task42-1288228da5ef4997abbdf45a1ab52b26/mutation-stale-tests.log`.

The review mutant removed the settings refresh from the stale catch.
The new assertion counted GET /api/settings only after the research PUT started.
The earlier notice refresh completed before the test installed the counter.
The assertion expected one read and observed zero with the mutant.
The log is `C:/Users/Duy/AppData/Local/Temp/deckagent-task42-1288228da5ef4997abbdf45a1ab52b26/mutation-refresh-tests.log`.

The executor restored all mutant sources before the final builds.
A forced TypeScript compile prevented old mutation output.
Both targeted tests then passed with zero failures and zero cancellations.

## Review

An independent reviewer found one low issue in the test name and assertions.
The test claimed to refresh settings after a stale response, but its original assertions did not observe that refresh.
The orchestrator approved a settings-read counter and a missing-refresh mutation check.
The new assertion detects that mutation. Both restored targeted tests pass.
The reviewer found no production defect.
The reviewer checked the correction and final metadata. No finding remains.

## What the commands do not prove

The tests use one Browser tab and one HTTP client. They do not use two Browser tabs.
No Browser test directly exercises PREFERENCES_STALE on the theme buttons.
The research write count covers the interval before the final assertion. It cannot prove that no future write will occur.
