# Task 53: Add deck run plans and contributions report

Read this file to check the deck run plans, the targeted checks and the deferred suite verification.

## Result

Task 53 adds deck review and generation plans for `RunController`.
The source grant test covers all sixteen flag combinations against the legacy permission policy.
The legacy HTTP workflows remain active until Task 54.

The user requires separate task commits before the complete suite run.
The complete suite run remains deferred until Tasks 53 through 57 finish.
The parent agent performs the review, commit and push.
No review subagent ran.

## Files changed

| File | Change |
| --- | --- |
| `apps/host/src/modules/deck/deck-prompts.ts` | Add `sourceKindsForBrief`. |
| `apps/host/src/modules/deck/deck-run-plan.ts` | Add deck preconditions, staging contribution, image recovery plan and proposal finalization. |
| `apps/host/src/modules/deck/generation-run-plan.ts` | Add generation contribution, source restrictions, runtime override, settlement and closing report. |
| `apps/host/src/modules/deck/deck-tool-session.ts` | Separate recovery preparation and settlement from legacy runtime execution. |
| `apps/host/src/modules/deck/index.ts` | Export the plan builders and their public types. |
| `apps/host/tests/deck-run-plan.test.mjs` | Add four lifecycle tests, including sixteen source grant combinations. |
| `package.json` | Include the new test file in `test:deck-review`. |
| Plan and report indexes, task file and changelog | Record the task result and the deferred complete suite run. |

The parent authorized the helper scope extension in `deck-tool-session.ts`.
The existing helper combined recovery preparation, runtime execution and settlement in one operation.
The new plan needs separate operations because `RunController` executes each pass.
The legacy helper still calls those operations in its original order.
Its exception path keeps the failed activity before the incomplete-recovery notice.

## Commands and results

All package commands used `corepack pnpm@11.28.5` from the repository root.

| Command | Exit | Result |
| --- | --- | --- |
| `git status --short` at the start | 0 | Clean workspace. |
| `node --test apps/host/tests/deck-run-plan.test.mjs` before the first implementation | 1 | Missing `sourceKindsForBrief` export. |
| `typecheck` after the optional property correction | 0 | TypeScript passed. |
| `build` after the final production edit | 0 | TypeScript and workspace builds passed. |
| Biome format with `--write`, then without `--write`, on changed code and tests | 0 | Final check reported `No fixes applied`. |
| `lint` | 0 | Oxlint passed. |
| `check:boundaries` | 0 | `0 violation(s)`. |
| `check:docs` after the report | 0 | 279 files checked, `0 error(s)`. |
| `node --test apps/host/tests/deck-run-plan.test.mjs` after all mutations | 0 | 4 passed, 0 failed. |
| Report STE lint with `uv run python -I` | 0 | `0 violations`. |
| `git diff --check` | 0 | No whitespace errors. |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 56 passed, 0 failed. |
| `test:deck-review` | 0 | 25 passed, 0 failed. |
| `node --test --test-concurrency=1 e2e/image-recovery-http.test.mjs` | 0 | 7 passed, 0 failed. |

## Test evidence

The new tests use real deck SQLite stores and fake runtime, source-service and request-store boundaries.
The generation test reads one selected source and records a fact with its returned `evidenceId`.
It denies the unselected source before the source executor runs.
It also checks the incomplete generation state and the closing report.
The recovery test registers the real source contribution and checks the exact tools of both passes.
The restore test checks zero additional runtime calls and a committed Brief version.

Each mutation changed generated JavaScript temporarily.
Each run used `node --test apps/host/tests/deck-run-plan.test.mjs`.
The mutation script restored the original file after each run.

| Mutation | Exit | Failed tests |
| --- | --- | --- |
| Return no source kinds for material | 1 | 1 |
| Enable runtime execution for restore | 1 | 1 |
| Enable workspace tools during recovery | 1 | 1 |
| Remove the proposal commit | 1 | 2 |
| Remove generation settlement | 1 | 1 |
| Bypass the selected-file check | 1 | 1 |
| Remove evidence IDs from source reads | 1 | 1 |

## Corrections during execution

- TypeScript rejected an explicit undefined optional `tools` property. Conditional spread fixed the call. The next typecheck passed.
- The initial deck fixture used unsupported `:memory:` storage. The test now uses a temporary SQLite file.
- The first staging fixture omitted the explicit model-knowledge choice. The request now supplies that choice.
- The generation fixture used invalid source IDs and omitted artifact storage. Valid source IDs and local artifact storage fixed the fixture.
- A temporary Python edit used the Windows default encoding. An explicit UTF-8 read fixed the edit.
- The first report check found a UTF-8 BOM before its heading. Removing the BOM fixed the docs check.
- The final Biome check found line-ending changes after a test header edit. Formatting fixed those changes.
- Direct parent review found a changed recovery exception order. The helper now preserves the original order and failed activity status.

No unresolved STOP condition remains.
No decision table applies.

## What the commands do not prove

- Live HTTP requests still use `DeckWorkflow` and `GenerationWorkflow` until Task 54 connects the new builders.
- The tests do not run a live provider or the real OpenCode CLI.
- The runtime override has type coverage but no separate successful override test.
- The complete suite run remains deferred until all five tasks finish.
- The parent agent still owns the commit and push.
