# Task 4: Apply the layout script to the repository report

Read this file to review the files, the commands and the checks of Task 4 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

- Changed 71 files under `apps/`, `packages/`, `scripts/` and `tests/` with `node scripts/format-layout.mjs --write`. The table `Changed files` lists them with the number of added lines.
- The change adds 354 blank lines and removes no line. `git diff --stat` prints `71 files changed, 354 insertions(+)`.
- Marked the 6 steps as complete in [Task 4: Apply the layout script to the repository](../plan/task-04-apply-layout-script.md).
- Changed the row of Task 4 to `Done` in the [plan README](../plan/README.md).
- Added the row of Task 4 to [Code Layout Reports](README.md).
- Created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | no line |
| 2 | `node scripts/format-layout.mjs --check > /tmp/layout-before.txt` | `1` | `format-layout: 354 finding(s)` |
| 2 | `grep -c " <rule> " /tmp/layout-before.txt` | `0` | the counts of the table `Findings by rule` |
| 3 | `node scripts/format-layout.mjs --write` (first run) | `0` | `format-layout: 71 file(s) changed` |
| 3 | `node scripts/format-layout.mjs --write` (second run) | `0` | `format-layout: 0 file(s) changed` |
| 4 | `git diff -U0 --ignore-blank-lines -- apps packages scripts tests \| grep -E '^@@'` | `1` | no line (`grep` found no match) |
| 4 | `git diff -U0 -- apps packages scripts tests \| grep -E '^-' \| grep -v -E '^---'` | `1` | no line |
| 4 | `git diff -U0 -- apps packages scripts tests \| grep -E '^\+.*[^[:space:]]' \| grep -v -E '^\+\+\+'` | `1` | no line |
| 5 | `node scripts/format-layout.mjs --check` | `0` | `format-layout: 0 finding(s)` |
| 5 | `corepack pnpm@11.28.5 format:check` | `0` | `Checked 312 files in 521ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed; `vite build` built 335 modules |
| 5 | `corepack pnpm@11.28.5 lint` | `0` | `$ oxlint -c .oxlintrc.json apps packages scripts tests e2e`, no warning or error |
| 5 | `node scripts/format-layout.mjs --dense apps/host/src apps/web/src packages/*/*/src \| tail -n 1` | `0` | `format-layout: 261 dense function bodies` |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 369 file(s) checked, 0 error(s) in 0 file(s)` |

## Findings by rule

The count comes from `/tmp/layout-before.txt`, before the first `--write` run.

| Rule | Count |
| --- | --- |
| `layout-after-imports` | 7 |
| `layout-between-declarations` | 245 |
| `layout-between-members` | 102 |
| Total | 354 |

The total equals `format-layout: 354 finding(s)` and the 354 added lines. This commit is the second of the 7 commits whose subject starts with `style(format):` or `style(layout):`; Task 12 records the 7 commits in `.git-blame-ignore-revs`.

## Dense function bodies

`node scripts/format-layout.mjs --dense apps/host/src apps/web/src packages/*/*/src` prints `format-layout: 261 dense function bodies`. Tasks 7 to 11 add the blank lines between the steps of these bodies.

The value 261 is higher than the 249 of the decision `Dense function body` in the [plan README](../plan/README.md#decisions). The scan of 2026-11-28 gave 249, and the layout pass and the Biome pass of Tasks 3 and 4 changed the source text. A body has a dense body when it has no blank line between two direct statements, and the layout pass moves lines. The count for Tasks 7 to 11 is 261.

## Changed files

| File | Added lines |
| --- | --- |
| `apps/host/src/contract-sync.ts` | 2 |
| `apps/host/src/db/chats.migrations.ts` | 3 |
| `apps/host/src/db/index.ts` | 1 |
| `apps/host/src/modules/attachments/attachment-files.store.ts` | 1 |
| `apps/host/src/modules/attachments/attachments.store.ts` | 3 |
| `apps/host/src/modules/attachments/draft.store.ts` | 1 |
| `apps/host/src/modules/deck/brief/brief-tool-protocol.ts` | 3 |
| `apps/host/src/modules/deck/brief/deck-run-tools.ts` | 2 |
| `apps/host/src/modules/deck/deck.service.ts` | 1 |
| `apps/host/src/modules/deck/generation/generation-tools.ts` | 2 |
| `apps/host/src/modules/deck/images/commons-images.ts` | 4 |
| `apps/host/src/modules/deck/images/image-research.ts` | 9 |
| `apps/host/src/modules/deck/images/image-review-run.ts` | 16 |
| `apps/host/src/modules/deck/images/public-image-reader.ts` | 5 |
| `apps/host/src/modules/providers/providers.service.ts` | 1 |
| `apps/host/src/modules/research/tavily.ts` | 1 |
| `apps/host/src/runs/index.ts` | 1 |
| `apps/host/src/runtimes/opencode/agent-runtime.ts` | 1 |
| `apps/host/src/runtimes/opencode/stream-tracker.ts` | 14 |
| `apps/host/src/storage/credential-store.ts` | 3 |
| `apps/host/src/tools/index.ts` | 1 |
| `apps/host/src/tools/policy/source-access.ts` | 3 |
| `apps/host/src/tools/sources/attachment-extraction.ts` | 2 |
| `apps/host/tests/commons-images.test.mjs` | 1 |
| `apps/host/tests/deck-run-plan.test.mjs` | 1 |
| `apps/host/tests/fixtures/b02-helpers.mjs` | 5 |
| `apps/host/tests/fixtures/fake-opencode.mjs` | 22 |
| `apps/host/tests/fixtures/http-host.mjs` | 1 |
| `apps/host/tests/image-research.test.mjs` | 5 |
| `apps/host/tests/research.test.mjs` | 1 |
| `apps/host/tests/run-lifecycle.test.mjs` | 2 |
| `apps/web/src/api/preferences.ts` | 3 |
| `apps/web/src/api/providers.ts` | 5 |
| `apps/web/src/hooks/use-deck-screens.ts` | 2 |
| `apps/web/src/hooks/use-preferences.ts` | 1 |
| `apps/web/src/hooks/use-settings.ts` | 3 |
| `apps/web/src/text.ts` | 1 |
| `apps/web/tests/app-shell-routes.test.tsx` | 4 |
| `apps/web/tests/chat-sidebar.test.tsx` | 6 |
| `apps/web/tests/deck-screens.test.tsx` | 3 |
| `apps/web/tests/settings-page.test.tsx` | 15 |
| `packages/host/contracts/src/brief-validation.ts` | 5 |
| `packages/host/contracts/src/chat-list-validation.ts` | 2 |
| `packages/host/contracts/src/deck-validation.ts` | 5 |
| `packages/host/contracts/src/index.ts` | 14 |
| `packages/host/contracts/src/preferences-validation.ts` | 2 |
| `packages/host/contracts/src/settings-validation.ts` | 7 |
| `packages/presentation/deck/src/artifact-fs.ts` | 8 |
| `packages/presentation/deck/src/artifact-stage.ts` | 14 |
| `packages/presentation/deck/src/artifact-store.ts` | 19 |
| `packages/presentation/deck/src/bound-outline.ts` | 1 |
| `packages/presentation/deck/src/brief-contracts.ts` | 4 |
| `packages/presentation/deck/src/brief.ts` | 13 |
| `packages/presentation/deck/src/errors.ts` | 2 |
| `packages/presentation/deck/src/generation-contracts.ts` | 19 |
| `packages/presentation/deck/src/generation-store.ts` | 1 |
| `packages/presentation/deck/src/image-store.ts` | 1 |
| `packages/presentation/deck/src/index.ts` | 2 |
| `packages/presentation/deck/src/outline-contracts.ts` | 2 |
| `packages/presentation/deck/tests/deck-service.test.mjs` | 1 |
| `packages/presentation/design/src/contracts.ts` | 10 |
| `packages/presentation/design/src/index.ts` | 12 |
| `packages/presentation/document/src/contracts.ts` | 10 |
| `packages/presentation/document/src/index.ts` | 8 |
| `packages/presentation/html/src/controlled-template.ts` | 1 |
| `packages/presentation/html/src/index.ts` | 11 |
| `packages/presentation/html/src/policy.ts` | 8 |
| `packages/presentation/html/tests/html-template-v3.test.mjs` | 1 |
| `packages/presentation/pptx/src/index.ts` | 3 |
| `scripts/build-workspace.mjs` | 5 |
| `tests/check-docs.test.mjs` | 2 |
| Total (71 files) | 354 |

Every added line is an empty line, and the change removes no line. The three commands of Step 4 prove this.

## Items that a decision table sent to the report

none

## STOP and retry

none

## What the commands do not prove

- The commands do not run the test suite. Task 12 runs the exit checks. The build and the lint prove that the files compile and that the lint rules hold. They do not prove the behavior of the changed files at runtime.
- Step 4 proves that each added line is a blank line. It does not prove that the script put each blank line at the correct place. The `--check` run of Step 5 proves that no finding remains. The tests of `tests/format-layout.test.mjs` prove the rule behavior, and this task does not run them.
- The layout pass adds blank lines only, so the line numbers in stack traces, in error messages and in review comments change. No document of the repository holds a line number of these files.
- The value 261 in the section `Dense function bodies` is a count, not a proof. Tasks 7 to 11 read the list of dense bodies and add the steps by hand.
