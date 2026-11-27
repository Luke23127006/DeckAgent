# Task 51: Implement the AgentRuntime port, usage tracking and error categories in apps/host/src/runtimes/opencode report

Read this file to learn the changes, the check results and the open limits of Task 51.

## Files changed

- `apps/host/src/runtimes/opencode/agent-runtime.ts`: new. It holds `OpenCodeAgentRuntime`, `OwnerRuntimeBinding`, `OwnerBindingStore` and the folder, resume guard and configuration audit of one owner run.
- `apps/host/src/runtimes/opencode/events.ts`: `step_finish` reads the optional `tokens` field. New `classifyProviderError` returns a `RunError`. `errorCode` returns the code of `classifyProviderError`.
- `apps/host/src/runtimes/opencode/stream-tracker.ts`: it counts model calls and tokens, it calls `onUsage` after each `step_finish`, and it records a `RunError` for each failure condition. `classify` returns `ClassifiedAttempt`, which adds `runResult` to `AttemptResult`. `createStreamTracker` and `createAttemptTimer` accept the narrow shapes `RunStream` and `AttemptRun`.
- `apps/host/src/runtimes/opencode/config.ts`: `runtimeConfiguration` accepts an optional `stepLimit`.
- `apps/host/src/runtimes/opencode/history.ts`: new `seedConversationPrompt`. `seedPrompt` delegates to it.
- `apps/host/src/runtimes/opencode/index.ts`: it exports `OpenCodeAgentRuntime`, `OwnerRuntimeBinding`, `OwnerBindingStore` and `OpenCodeAgentRuntimeOptions`.
- `apps/host/tests/opencode-adapter.test.mjs`: nine new tests.
- `docs/build/refactor/target-structure/plan/task-51-implement-opencode-agent-runtime.md`: this task marks the seven steps as done.
- `docs/build/refactor/target-structure/plan/README.md`: Task 51 is `Done` and links this report.
- `docs/build/refactor/target-structure/reports/README.md`: new index row.
- `docs/build/refactor/target-structure/reports/task-51-implement-opencode-agent-runtime.md`: this report.
- `CHANGELOG.md`: one line under `## [Unreleased]` and `### Added`.

## Commands run

The commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell 5.1. The package command prefix is `corepack pnpm@11.28.5`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` at start | 0 | No line. |
| `git grep -n "^| 50 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the Task 50 row. |
| `node --test apps/host/tests/opencode-adapter.test.mjs` before the implementation | 1 | `does not provide an export named 'OpenCodeAgentRuntime'`. |
| `exec biome format --write` on the six code files and the test file | 0 | `Formatted 7 files`, `Fixed 2 files`. |
| `exec biome format` on the same files | 0 | `No fixes applied`. |
| `build` | 0 | Each package reports `Build complete`. |
| `lint` | 0 | No error. |
| `check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| `check:docs` in step 5 | 0 | `check-docs: 270 file(s) checked, 0 error(s) in 0 file(s)`. |
| `node --test apps/host/tests/opencode-adapter.test.mjs tests/oxlint-boundaries.test.mjs` | 0 | 46 pass, `# fail 0`. |
| Fault injection in the built `stream-tracker.js`, then `node --test apps/host/tests/opencode-adapter.test.mjs` | 1 | `# pass 12`, `# fail 4`. The two faults were a wrong summary category and a dropped `modelCalls`. I reverted both faults and ran `build` again. |
| `check:docs` in step 7 | 0 | `check-docs: 271 file(s) checked, 0 error(s) in 0 file(s)`. |

## Decisions

The task does not give five values. The table gives each value with its source and reason.

| Item | Value | Source and reason |
| --- | --- | --- |
| `runResult` on the attempt | New `ClassifiedAttempt extends AttemptResult` | `apps/host/src/runtimes/opencode/runtime.ts` is not in the Files block of the task. A required `runResult` on `AttemptResult` breaks the three inline results of that file. The new type keeps the field required for the new runtime and leaves `OpenCodeRuntime` unchanged. |
| Current request text | The last message of the `conversation` resource | `RunInput` in `apps/host/src/runs/ports.ts` has no text field for the request. The runtime seeds the messages before the last one and sends the last message as the request. |
| `modelCalls` | The count of model steps | Step 4 of the task says "track `modelCalls` (from `modelSteps`)". A summary step is not a model step in the tracker. |
| Token totals | The sum of the `tokens` field of each `step_finish`, summary steps included | The provider billed those calls. The field is optional, so a run without the field reports no tokens. |
| Constructor | `(executable, runtimeRoot, bindings, options)` | It matches `OpenCodeRuntime`, so `server.ts` can switch to the new class in Revision 4b with a small change. |

## Retries

1. Step 6, `test:images`: 1 of 39 tests failed in the batch run. The rerun passed 39 of 39. The failing test is outside the OpenCode adapter area, and the batch ran many browser suites in a row.
2. Step 6, `test:generation-publication`: the test `real local renderer blocks malicious, out-of-theme, missing and overflowing content without replacing the published revision` failed in the batch run. The file passed alone (3 of 3), and the full suite passed on the rerun (72 of 72).
3. Step 6, `test:browser-smoke`: 1 of 22 tests failed and the runner cancelled 1 test in the batch run. The rerun passed 22 of 22.

No STOP condition occurred.

## Test coverage

| Test | Behavior |
| --- | --- |
| `step_finish token counts: non-negative finite values are kept, anything else is dropped` | `parseEvent` keeps `input` and `output`, drops a negative value, a string, `null` and an absent field |
| `provider errors map to the RunError category table` | Nine provider conditions map to the nine rows of the category table |
| `run configuration applies the run step limit` | `4` sets `steps: 4`, `'none'` omits `steps`, the default stays `8`, and a `publish_slide` bridge omits `steps` |
| `stream tracker reports cumulative model calls and tokens after each finished step` | Two `step_finish` events report `modelCalls` 1 then 2, and cumulative tokens 4/2 then 7/2 |
| `stream tracker classifies a blocked summary, an unfinished summary and a refused write` | `content-filter` gives `content-blocked`, an open summary gives `context-limit`, a refused emit gives `stopped` with `REQUEST_NOT_SAVED` |
| `agent runtime availability reports a missing or unsupported CLI` | `RUNTIME_UNAVAILABLE`, `available: true` and `RUNTIME_VERSION_UNSUPPORTED` |
| `agent runtime streams a run, reports usage and binds the owner` | Events, usage 1/10/5, the seeded prompt, the folder key, the completed result, `commit` and the resumed native session |
| `agent runtime returns a categorized failure for each runtime and provider condition` | Nine failures with their category, code and usage |
| `agent runtime ends a stopped run with the stopped category` | `STOPPED` with category `stopped` after an abort |

## Error category coverage

| Code | Category | Covered by test |
| --- | --- | --- |
| `PROVIDER_AUTH` | `provider-auth` | `provider errors map to the RunError category table`. `agent runtime returns a categorized failure for each runtime and provider condition` (rejected key). |
| `PROVIDER_RATE_LIMIT` | `provider-rate-limit` | `provider errors map to the RunError category table` |
| `PROVIDER_MODEL_UNAVAILABLE` | `provider-model` | `provider errors map to the RunError category table` |
| `PROVIDER_HTTP` | `provider-other` | `provider errors map to the RunError category table` |
| `RUNTIME_FAILED` from a provider event | `provider-other` | `provider errors map to the RunError category table` |
| `CONTEXT_LIMIT` | `context-limit` | `provider errors map to the RunError category table` |
| `IMAGE_INPUT_UNAVAILABLE` | `input-unsupported` | `provider errors map to the RunError category table`. `image input refusal becomes an actionable safe code without retaining provider error text`. |
| `CONTEXT_SUMMARY_FAILED` with `content-filter` | `content-blocked` | `stream tracker classifies a blocked summary, an unfinished summary and a refused write` |
| `CONTEXT_SUMMARY_FAILED` with `error`, an open summary or an overflow during the summary | `context-limit` | `stream tracker classifies a blocked summary, an unfinished summary and a refused write`. `agent runtime returns a categorized failure for each runtime and provider condition` (overflow during the summary). |
| `REQUEST_TIMEOUT` | `timeout` | `agent runtime returns a categorized failure for each runtime and provider condition` (attempt clock expired) |
| `STOPPED` | `stopped` | `agent runtime ends a stopped run with the stopped category` |
| `REQUEST_NOT_SAVED` | `stopped` | `stream tracker classifies a blocked summary, an unfinished summary and a refused write` |
| `RUNTIME_UNAVAILABLE` | `runtime-unavailable` | `agent runtime availability reports a missing or unsupported CLI`. `agent runtime returns a categorized failure for each runtime and provider condition` (missing executable). |
| `RUNTIME_VERSION_UNSUPPORTED` | `runtime-unavailable` (availability only) | `agent runtime availability reports a missing or unsupported CLI` |
| `PROVIDER_UNSUPPORTED` | `runtime-config` | `agent runtime returns a categorized failure for each runtime and provider condition` (unsupported provider settings) |
| `RUNTIME_CONFIG_UNSAFE` | `runtime-config` | `agent runtime returns a categorized failure for each runtime and provider condition` (unsafe effective configuration) |
| `RUNTIME_FAILED` from an exit code | `runtime-failed` | `agent runtime returns a categorized failure for each runtime and provider condition` (process exit code) |
| `RUNTIME_PROTOCOL` | `runtime-protocol` | `agent runtime returns a categorized failure for each runtime and provider condition` (malformed output) |
| `RUNTIME_INCOMPLETE` | `runtime-incomplete` | `agent runtime returns a categorized failure for each runtime and provider condition` (unfinished run) |

`provider-quota` and `provider-network` have no condition in the table of `docs/architecture/10-agent-core.md`.

## Required suites

The counts come from the last run of each suite. Three suites ran a second time, as the Retries section says.

| Command | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 45 | 0 |
| `test:source-permissions` | 11 | 0 |
| `test:attachments` | 31 | 0 |
| `test:research` | 5 | 0 |
| `test:images` | 39 | 0 |
| `test:outline-workflow` | 6 | 0 |
| `test:brief-foundation` | 16 | 0 |
| `test:deck-review` | 21 | 0 |
| `test:generation-publication` | 72 | 0 |
| `test:slide-pipeline` | 9 | 0 |
| `test:session-persistence` | 7 | 0 |
| `test:opencode-resources` | 3 | 0 |
| `test:layouts` | 10 | 0 |
| `test:browser-smoke` | 22 | 0 |
| `test:env-startup` | 2 | 0 |

## Items from a decision table

No decision table applies to this task.

## What the commands do not prove

- Live OpenCode 1.19.5 token fields on `step_finish` stay unmeasured. `inputTokens` and `outputTokens` stay optional.
- `server.ts` still wires `OpenCodeRuntime` until Revision 4b moves `runs/lifecycle/`.
- The test uses an in-memory `OwnerBindingStore`. No production store implements the interface yet.
- `RunInput` has no request text field. Revision 4b must put the current user message last in the `conversation` resource. Without that message, the seed and the resume prompt are empty.
- The suites show no regression on the tested paths. They do not prove a path with no test.

## Commit handoff

The task file commits and pushes this report. The commit message is `feat: implement AgentRuntime port, usage tracking and error categories in OpenCode adapter`.
