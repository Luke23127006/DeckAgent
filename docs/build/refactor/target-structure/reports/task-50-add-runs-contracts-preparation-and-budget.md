# Task 50: Add apps/host/src/runs contracts, preparation composer, budget monitor and boundary rules report

Read this file to learn the changes, the check results and the open limits of Task 50.

## Files changed

- `apps/host/src/runs/ports.ts`: new. It defines the Phase 1 contracts of `docs/architecture/10-agent-core.md` and it holds `ProviderRunSettings`.
- `apps/host/src/runs/preparation/index.ts`: new. It composes contribution parts into one `RunInput`.
- `apps/host/src/runs/budget/index.ts`: new. It tracks `RunUsage` against optional limits.
- `apps/host/src/runs/index.ts`: new. It re-exports the public contracts, `prepareRunInput` and `createRunBudget`.
- `apps/host/src/modules/providers/provider-catalog.ts`: it re-exports `ProviderRunSettings` from `runs/ports.ts`.
- `apps/host/src/modules/providers/index.ts`: it re-exports `ProviderRunSettings` from `runs/ports.ts`.
- `apps/host/src/runtimes/opencode/config.ts`, `contracts.ts`, `provider.ts`, `runtime.ts`: they import `ProviderRunSettings` from `../../runs/ports.ts`.
- `.oxlintrc.json`: it adds `../runs/**` to the `http/` override, `../../modules/**` to the `runtimes/` override and the new override for `apps/host/src/runs/`.
- `apps/host/tests/runs-preparation.test.mjs`: new. It tests the composer, the budget monitor and `runOwnerKey`.
- `tests/oxlint-boundaries.test.mjs`: it adds two tests for the new import rules.
- `docs/conventions/project-structure.md`: it records the rule for `runs/` and the module rule for `runtimes/` in `## Enforcement`.
- `package.json`: it adds the new test file to `test:model-requests`.
- This task file, the plan index, the report index and `CHANGELOG.md` record the result.

## Commands run

The commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell 5.1. The package command prefix is `corepack pnpm@11.28.5`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` at start | 0 | No line |
| `git grep -n "^| 49 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the Task 49 row |
| `node --test apps/host/tests/runs-preparation.test.mjs` before the implementation | 1 | `ERR_MODULE_NOT_FOUND` for `lib/types/runs/index.js` |
| `exec biome format --write` on the changed code and test files | 0 | `Formatted 12 files`, `Fixed 2 files` |
| `exec biome format` on the same files | 0 | `No fixes applied` |
| `build` | 0 | Every package reports `Build complete` |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `check:docs` | 0 | 269 files, `0 error(s)` |
| `node --test apps/host/tests/runs-preparation.test.mjs tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 63 pass, `# fail 0` |
| `git grep --untracked -n "sessionId:" -- apps/host/src/runs` | 1 | No line |

## Decisions

The task does not give three values. The table gives each value with its source and reason.

| Item | Value | Source and reason |
| --- | --- | --- |
| `runOwnerKey` format | `chat:<id>` | The task names the function only. The value is stable, and it keeps the kind and the ID readable for the folder and binding key of Task 51. |
| Budget limit comparison | Strict `>` | The task and `docs/architecture/10-agent-core.md` say "exceed". A usage value equal to the limit does not fire `onExceeded`. |
| Merged tool context | One sha256 digest of the set contexts | The task says "hash each context with sha256". One digest keeps the value at 64 characters and stays stable for the same input order. |

## Retries

1. The first Step 6 run of `runs-preparation.test.mjs` failed 2 tests. The fake `ToolSet` in the new test put `execute` at the top level. The contract puts it at `executor.execute`. I fixed the test fake and the next run passed 7 tests. This was a test defect.
2. The first Step 7 run of `test:model-requests` failed 1 test with `approved is not defined`. I removed that unused variable while the suite started. I fixed the test and the rerun reported 36 pass and 0 fail.
3. The first Step 7 run of `test:generation-publication` failed 1 test with `EBUSY` in the cleanup hook of `e2e/portable-generation-http.test.mjs` (`CrashpadMetrics-active.pma`). The rerun reported 72 pass and 0 fail. A file lock in the temporary folder caused the failure, and the test made no failed assertion.

No STOP condition prevented completion.

## Test coverage

| Test | Behavior |
| --- | --- |
| `prepareRunInput follows registration order, then plan order, and binds tool calls to the ToolContext` | The order of contributions, the order of instructions and resources, the provider result, the merged schemas and manifest, the tool routing and the `TOOL_NOT_ALLOWED` refusal |
| `prepareRunInput binds approve into every tool execution` | The `approve` function of the options reaches `ToolContext.approve` and its result reaches the executor |
| `prepareRunInput refuses two contributions that use the same tool name` | `RunFailure` with `TOOL_NAME_CONFLICT` |
| `createRunBudget keeps the latest usage and stays silent without limits` | The latest `RunUsage` and no callback without limits |
| `createRunBudget fires once when model calls exceed the limit` | One callback with `model-calls` and the limit boundary |
| `createRunBudget reports the first exceeded token limit and keeps the last usage` | `input-tokens`, `output-tokens` and the last usage |
| `runOwnerKey keeps the owner kind and ID distinct` | The key value `chat:chat-1` |
| `agent core runs rejects modules, runtimes, Express, SQL, HTTP and storage` | 6 refused imports in `apps/host/src/runs/preparation/index.ts` |
| `runtime adapter rejects a module import and accepts the runs port` | The refusal of `modules/providers/` and the acceptance of `runs/ports.ts` |

The new test file also failed 2 deliberate faults before the final pass. A reversed contribution order failed test 1. A budget monitor that ignores its limits failed tests 5 and 6. I reverted both faults.

## Required suites

Every command below exited with code 0 and reported `# fail 0` in the final run.

| Command | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 36 | 0 |
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

- `runs/lifecycle/` does not use the new contracts yet. Revision 4b wires `runs/lifecycle/` to `server.ts`.
- The oxlint tests prove that the rules refuse the named fixture imports. They do not prove that a future production file stays clear of these imports. The `lint` command covers the current files only.
- `RunStore`, `RunRecord` and `RunBudgetLimits` have no production consumer yet. The tests cover `createRunBudget` and `prepareRunInput` only.
- The suites show no regression on the tested paths. They do not prove an HTTP path with no test.
- Live OpenCode 1.19.5 token fields stay unmeasured. Task 51 covers them.

## Commit handoff

The task file commits and pushes this report. The commit message is `feat: add runs contracts, preparation composer, budget monitor and boundary rules`.
