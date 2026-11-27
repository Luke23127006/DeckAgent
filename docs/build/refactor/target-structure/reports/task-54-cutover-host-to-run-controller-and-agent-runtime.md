# Task 54: Cut over Host runs and runtime report

Read this file to check the Host cutover, its regression evidence and the deferred suite verification.

## Result

The live Host uses `RunController` and `OpenCodeAgentRuntime`.
Chat services own request preparation and history projection.
Deck plans own review, generation, recovery and confirmation behavior.
The legacy request feature, deck workflows and OpenCode runtime wrappers no longer exist in source.

The user requires separate task commits before the complete suite run.
The complete suite run remains deferred until Tasks 53 through 57 finish.
The parent agent performs the review, commit and push.
No review subagent ran.

## Files changed

| Area | Change |
| --- | --- |
| `apps/host/src/modules/chats/` | Add request routes, conversation contribution, preparation checks and request projection. |
| `apps/host/src/modules/deck/` | Connect confirmation and generation plans and remove legacy workflow wrappers. |
| `apps/host/src/runtimes/opencode/` | Keep the AgentRuntime adapter and remove legacy contracts and runtime. |
| `apps/host/src/tools/executors/source-tools.ts` | Return ToolSet without host-api types. |
| `apps/host/src/server.ts` | Wire runtime, lifecycle, source contributions, temporary storage adapters and failure maps. |
| `apps/host/src/http/` | Support module-only route mounting and lifecycle shutdown. |
| `apps/host/src/web-state.ts` | Own the WebState failure map. |
| `apps/host/tests/opencode-adapter.test.mjs` | Check conversation projection and explicit step limits. |
| `apps/host/tests/deck-run-plan.test.mjs` | Compare source grants with literal expected tool sets. |
| `e2e/confirmation-host.test.mjs` | Check one override preparation across concurrent confirmation and replay. |
| `packages/host/api/src/index.ts` | Export existing cursor, request decoding and parameter helpers. |
| Plan and report indexes, task file and changelog | Record the task and deferred complete suite run. |

## Scope adjustments

The parent authorized the `generation-prompts.ts` type import change.
The parent authorized exports for existing HTTP helpers in `packages/host/api/src/index.ts`.
These exports avoid private package imports until Task 55 moves the helpers.

The HTTP boundary rejects imports from `runs/`.
The parent directed the RunFailure HTTP map into `server.ts` through `mapApplicationFailure`.
No HTTP status map entered the runs contract.

The parent authorized a preparation-count assertion in the existing confirmation test.
Prepared overrides stay local to each confirmation operation.
The provider fallback accepts only selections returned by the explicit generation override.
Ordinary chat preparation still requires a selectable model.

## Commands and results

All package commands used `corepack pnpm@11.28.5` from the repository root.

| Command | Exit | Result |
| --- | --- | --- |
| `git status --short` at the start | 0 | Clean workspace. |
| `typecheck` after correcting route narrowing and unused arguments | 0 | TypeScript passed. |
| `build` after the preparation reuse change | 0 | TypeScript and workspace builds passed. |
| Biome format with `--write`, then without `--write`, on changed code and tests | 0 | Final check reported `No fixes applied`. |
| `lint` after the HTTP map correction | 0 | Oxlint passed. |
| `check:boundaries` | 0 | `0 violation(s)`. |
| Final `check:docs` | 0 | 280 files checked, `0 error(s)`. |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 56 passed, 0 failed. |
| `node --test apps/host/tests/opencode-adapter.test.mjs apps/host/tests/deck-run-plan.test.mjs` | 0 | 20 passed, 0 failed. |
| `test:model-requests` | 0 | 58 passed, 0 failed. |
| `test:research` | 0 | 5 passed, 0 failed. |
| `test:http-edge` | 0 | 12 passed, 0 failed. |
| `test:generation-publication` after recovery and admission corrections | 0 | 72 passed, 0 failed. |
| Serial confirmation, artifact rendering and image recovery files | 0 | 13 passed, 0 failed. |
| Concurrent confirmation test before preparation reuse | 1 | Preparation count was 2 instead of 1. |
| Concurrent confirmation test after preparation reuse | 0 | 1 passed, 0 failed. |

## Failure evidence and corrections

The first typecheck rejected route narrowing and an unused argument.
An explicit router type guard and the removed argument corrected those failures.

The first lint rejected a runs import inside the HTTP error handler.
The composition-root callback corrected the boundary violation.

The first adapter run failed its old implicit generation step-limit assertion.
Task 54 requires an explicit step limit and removes tool-name inference.
The test now checks the explicit value and the default value independently.

The first generation suite had six failures.
Five failures involved the explicit generation override.
The sixth failure involved replay after Stop during image recovery.
The parent authorized recovery from these STOP conditions without changing expected errors.

A diagnostic probe showed `ProviderFailure MODEL_NOT_SELECTABLE` before override admission.
The temporary provider adapter now accepts only the prepared override selection.
The next check exposed `SESSION_STORAGE` instead of the legacy `REQUEST_NOT_SAVED` error.
The temporary store adapter now keeps the legacy admission error allowlist.

A replay probe showed duplicate activities for `stage_brief`, `stage_outline` and `select_slide_image`.
The stream reached backpressure at sequence 27 before its terminal frame.
The helper layer no longer duplicates lifecycle tool activities.
Recovery preparation retains its separate activity.
The affected files then passed all thirteen tests.
The generation suite then passed all seventy-two tests.

The preparation-count assertion failed before the override reuse correction.
It passed after confirmation reused its own prepared override.
No shared preparation cache serves concurrent chats.

Temporary probes changed generated JavaScript only.
Each probe restored the original file.
No diagnostic logging remains in production source.

The execution policy rejected the PowerShell command to remove empty source folders.
A Python operation checked repository containment and removed only empty folders without recursion.

No unresolved STOP condition remains.

## Mutation evidence

Each mutation changed generated JavaScript temporarily and restored it after the test.

| Mutation | Test | Exit | Failed tests |
| --- | --- | --- | --- |
| Retain tool messages in conversation resources | Conversation contribution and seeding | 1 | 1 |
| Infer generation step limits from `publish_slide` | Run configuration step limits | 1 | 1 |

## What the commands do not prove

- `packages/host/api/` still supplies HTTP helpers and legacy test harnesses until Task 55 moves them.
- `packages/session/persistence/` still supplies storage until Task 56 splits it.
- The checks do not run live providers or the real OpenCode CLI.
- The complete suite run remains deferred until all five tasks finish.
- The parent agent still owns the commit and push.
