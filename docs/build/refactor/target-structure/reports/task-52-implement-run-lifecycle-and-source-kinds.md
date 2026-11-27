# Task 52: Implement runs/lifecycle RunController and sourceKinds in apps/host/src/tools report

Read this file to learn the changes, the check results and the open limits of Task 52.

## Files changed

- `apps/host/src/runs/ports.ts`: new `RunLifecycleContext`, `RunStartOptions` and `RunSnapshot`. `RunPlan` reads `skipRuntime`, `beforeRun`, `finalize` and the context of `next`. `RuntimeAvailability` and `RunFailure` read an optional `detail`. New `summarizedNotice`.
- `apps/host/src/runs/lifecycle/run-controller.ts`: new. It owns admission for each owner, the release wait and the busy owner cap. It resolves the provider before admission and runs the background loop with `RunPlan.next` and `finalize`. It also owns approvals, Stop, the budget abort, the serialized tool capability and the terminal status.
- `apps/host/src/runs/lifecycle/index.ts`: new. It exports `RunController` and `RunControllerOptions`.
- `apps/host/src/runs/index.ts`: it exports the run controller and the five new run types.
- `apps/host/src/runtimes/opencode/agent-runtime.ts`: `availability()` returns `detail: { version }` for `RUNTIME_VERSION_UNSUPPORTED`.
- `apps/host/src/runtimes/opencode/stream-tracker.ts`: it imports `summarizedNotice` from `../../runs/ports.ts`.
- `apps/host/src/tools/executors/source-tools.ts`: `SourceToolOptions` reads `sourceKinds`. New `SourceToolsContributionOptions`, `createSourceToolsContribution` and `mapSourceToolFailure`. `buildSourceSchemas` and `buildSourceManifest` read the granted kinds. `prepareSourceTools` keeps the legacy `PreparedTools` shape.
- `apps/host/src/tools/index.ts`: it exports `createSourceToolsContribution`, `mapSourceToolFailure` and `SourceToolsContributionOptions`.
- `apps/host/tests/run-lifecycle.test.mjs`: new. Thirteen tests.
- `apps/host/tests/opencode-adapter.test.mjs`: the availability test now expects `detail: { version: '9.9.9' }`. The task does not list this file in its Files block. The Decisions section gives the reason.
- `package.json`: `test:model-requests` runs the new test file.
- `docs/build/refactor/target-structure/plan/task-52-implement-run-lifecycle-and-source-kinds.md`: this task marks the eight steps as done.
- `docs/build/refactor/target-structure/plan/README.md`: Task 52 is `Done` and links this report.
- `docs/build/refactor/target-structure/reports/README.md`: new index row.
- `docs/build/refactor/target-structure/reports/task-52-implement-run-lifecycle-and-source-kinds.md`: this report.
- `CHANGELOG.md`: one line under `## [Unreleased]` and `### Added`.

## Commands run

The commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell 5.1. The package command prefix is `corepack pnpm@11.28.5`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` at start | 0 | No line. |
| `git grep -n "^| 51 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the Task 51 row. |
| `node --test apps/host/tests/run-lifecycle.test.mjs` before the implementation | 1 | `ERR_MODULE_NOT_FOUND` for `lib/types/runs/lifecycle/index.js`. |
| `exec biome format --write` on nine code and test files | 0 | `Formatted 9 files`, `Fixed 3 files`. |
| `exec biome format` on the same files | 0 | `No fixes applied`. |
| `build` in Step 5 | 0 | Each package reports `Build complete`. |
| `node --test apps/host/tests/run-lifecycle.test.mjs` in Step 5 | 0 | 13 pass, `# fail 0`. |
| `git grep --untracked -n "sessionId:" -- apps/host/src/runs` | 1 | No line. |
| `build`, `lint`, `check:boundaries`, `check:docs` in Step 6 | 0 | `0 violation(s)` and `277 file(s) checked, 0 error(s)`. |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 56 pass, `# fail 0`. |
| `test:model-requests` in Step 7, first run | 1 | 57 pass, 1 fail. See the Retries section. |
| `test:model-requests` in Step 7, second run | 0 | 58 pass, `# fail 0`. |
| The other 18 suites of Step 7 | 0 | Each output has `# fail 0`. The Required suites section gives each count. |

## Test coverage

| Test | Behavior |
| --- | --- |
| `RunController admits one run for each owner and refuses a second start` | `RUN_OWNER_BUSY` for a second start of one owner, two owners in parallel, and `GENERATION_LINK_CONFLICT` for a saved request of another owner |
| `RunController refuses start after close` | `HOST_CLOSED` |
| `RunController refuses start before admission when the runtime is unavailable` | `RunFailure` with `code` and `detail` before `store.admit` |
| `RunController Stop saves stopped, emits closing text and refuses late events` | saved `stopped`, `closingText('stopped')` as `generation-summary`, and a refused late `sink.emit` |
| `RunController aborts the run signal when the budget is exceeded` | `sink.usage({ modelCalls: 2 })` aborts the run signal with a limit of one model call |
| `RunController runs every pass in one request, finalizes once and commits after completion` | two passes in one `requestId`, one `finalize` call, and `commit()` while the saved status is `completed` |
| `RunController serializes tool calls and emits running then completed activities` | the call order `slow`, then `fast`, and the activities `running` and `completed` |
| `RunController routes approval waits and decisions to the tool call` | `onApprovalWait(true)` then `(false)`, `decide` with `allow-once`, and the tool reads `true` |
| `RunController turns a tool storage failure into REQUEST_NOT_SAVED` | `failed` with `REQUEST_NOT_SAVED` |
| `createSourceToolsContribution returns no tools for an empty grant or another owner kind` | no `tools` for `sourceKinds: []` and for `owner.kind` `deck` |
| `createSourceToolsContribution returns only the tools of the granted kinds` | `read_attachment` for `attachments`, and `list_sources`, `read_source`, `read_external` for `workspace-files` |
| `createSourceToolsContribution grants research tools only for saved sources and the public grant` | no research tool, `read_research`, then `read_research` and `research_public` |
| `mapSourceToolFailure maps source failures and ignores other errors` | `400`, `403`, `404`, `404` with `detail`, `500`, and `undefined` |

## Decisions

The task does not give these values. The table gives each value with its source and reason.

| Item | Value | Source and reason |
| --- | --- | --- |
| Availability test file | `apps/host/tests/opencode-adapter.test.mjs` now expects `detail: { version: '9.9.9' }` | The file is not in the Files block of the task. The Interfaces section gives the new `availability()` reply with `detail`. The old assertion and the new reply cannot both pass. |
| `SourceToolsContributionOptions` | The fields of `SourceToolOptions` without `sessionId` and `sourceKinds` | The task names the type but gives no fields. The contribution reads `sessionId` from `context.owner.id` and `sourceKinds` from `context.grants`. |
| Registered contribution name | `source-tools` | It matches the entry in the contribution table of `docs/architecture/10-agent-core.md`. |
| Provider for each pass | The provider that the controller resolves before `store.admit` | Step 4 says to freeze the provider. A later pass uses the same provider settings. |
| `skipRuntime` start | No `availability()` call and no provider lookup | A skipped pass has no model run. The test of Task 53 must show zero runtime calls. |
| `skipRuntime` result | `{ status: 'completed', usage: budget.latest() }` | The plan settles `completed` and `finalize` reads the result, as a run with no model call. |
| `finalize` and `closingText` | The first definition wins: the plan of `start`, then the last pass | The deck plan defines `finalize` on the plan that it creates. A pass-2 plan has no `finalize` in the Task 53 design. |
| Unexpected run throw | `failed` with the `RunFailure` code, or `RUNTIME_FAILED` | Admission errors already map to their own codes. A failed preparation or `next` must settle the request. |
| Source manifest | Each section follows the granted kinds | The task asks for the tool set only. A manifest that names a source outside the grant tells the model about data that the run must not read. |
| `pendingApproval` in a snapshot | Only when `hasTools` is `true` | It matches the `prepareTools` guard of `RequestController`. |

## Retries

1. Step 4, `build`: the first build returned `TS2345`. The tool capability accepted a `ToolSet`, but `prepareRunInput` returns `RunTools`. The capability now reads `RunTools` and calls `tools.call`. The next build passed.
2. Step 5, `run-lifecycle.test.mjs`: the first runs failed for four test-side reasons. A test read `runtime.calls` before the run started, and it now waits with `waitFor`. A Stop test added its abort listener after the abort, and it now checks `signal.aborted` first. Two expected values were wrong. The storage failure has only the `running` activity. The `detail` argument of `SourceToolFailure` is the detail object. The file passed after these fixes.
3. Step 7, `test:model-requests`: 1 of 58 tests failed. The test `agent runtime availability reports a missing or unsupported CLI` expected `RUNTIME_VERSION_UNSUPPORTED` with no `detail`. The Decisions section gives the reason for the test change. The rerun passed 58 of 58.

No STOP condition occurred.

## Required suites

The counts come from the last run of each suite. `test:model-requests` ran a second time, as the Retries section says.

| Command | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 58 | 0 |
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

No decision table applies to this task. The Decisions section holds the items that the task does not decide.

## What the commands do not prove

- `apps/host/src/server.ts` still wires `RequestController` and `OpenCodeRuntime` until the cutover task switches it to `RunController` and `OpenCodeAgentRuntime`.
- The test uses an in-memory `RunStore` and a fake `AgentRuntime`. No production store has the `(owner_kind, owner_id)` unique index and no production adapter runs the new controller yet.
- The 16-case `sourceKinds` equivalence check against `isSourceToolAllowed` is in Task 53. This task proves only the tool names of each granted kind.
- A live OpenCode 1.19.5 run does not use `RunController` yet. The frozen provider, the budget abort and the multi-pass path have unit tests only.
- The suites show no regression on the tested paths. They do not prove a path with no test.

## Commit handoff

The task file commits and pushes this report. The commit message is `feat: implement RunController in apps/host/src/runs/lifecycle and sourceKinds in tools`.
