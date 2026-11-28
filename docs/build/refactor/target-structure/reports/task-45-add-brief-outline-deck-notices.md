# Task 45: Fix deck notify versions and publish brief, outline and deck change notices report

Read this file to learn the changes, test evidence and check results for Task 45.

## Files changed

- Deck options expose optional callbacks for committed deck, Brief and Outline changes.
- Deck runtime isolates transport callback failures from committed writes.
- Deck authoring reads committed versions and emits Brief and Outline notices after transactions.
- Deck generation emits committed versions and suppresses confirmation and completion replay notices.
- Deck store exposes head versions for initial session notices.
- Host composition connects the callbacks to the change feed and registers four session topics.
- Deck service tests cover callbacks, committed visibility, observer errors, version 2 and replay silence.
- The Brief Host test covers initial notices, live notices and stale-write silence.
- The attachment test expects four initial session notices.
- The architecture table records the current five aggregate notice paths and removes the hardcoded-version risk.
- The task file, plan index and report index record task progress.

## Commands run

Commands ran in PowerShell from the repository root.
Node commands used `C:/dev_env/nvm/v22.19.0` in the process PATH with sandbox escalation.
Logs are in `C:/Users/Duy/AppData/Local/Temp/` with the prefix `task45-`.
PowerShell writes these logs as UTF-16.
The package command prefix below is `corepack pnpm@11.28.5`.

| Command or check | Exit code | Result |
| --- | --- | --- |
| `git status --short` | 0 | No changed paths at task start. |
| Task 44 Done row | 0 | One matching row. |
| Initial red build | 0 | Build passes. |
| Initial red tests, 15-second deadline | 1 | Pass 5, fail 1, cancelled 1. The SSE test awaits a missing notice. |
| Explicit red tests, 30-second deadline | 1 | Pass 5, fail 2, cancelled 0. Both new tests fail. |
| Targeted green tests | 0 | Pass 15, fail 0. |
| Deck service tests with committed-read observers | 0 | Pass 3, fail 0. |
| Remove the saveBrief callback, build and test | 1 | Pass 2, fail 1. The missing Brief notice fails the new test. |
| Restore generation completion replay notices, build and test | 1 | Pass 0, fail 1. The new replay test detects an extra notice. |
| Restore valid sources and force TypeScript build | 0 | No TypeScript errors. |
| Deck service tests with the version-2 case | 0 | Pass 4, fail 0. |
| Restore the hardcoded Outline-confirmation deck version, build and test | 1 | Pass 0, fail 1. The version-2 assertion detects the defect. |
| Remove the initial Brief session topic, build and test | 1 | Pass 0, fail 1. The attachment test receives Outline instead of Brief. |
| Restore the Brief topic, force build and test | 0 | Pass 1, fail 0. |
| Isolated `e2e/portable-generation-http.test.mjs` | 0 | Pass 2, fail 0. |
| `exec biome format` on changed code and tests | 0 | No fixes applied after formatting. |
| `build` | 0 | Build passes. |
| `lint` | 0 | No lint findings. |
| `check:boundaries` | 0 | 0 violations. |
| `check:docs` | 0 | 261 files, 0 errors with this report. |

## Regression suites

Suite logs use the filename `task45-suite-<suite>.log`.
Each final suite exits with code 0.
The six final sequential runs use `task45-isolated-<suite>.log`.

| Suite | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 29 | 0 |
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
| `test:browser-smoke` | 21 | 0 |
| `test:env-startup` | 2 | 0 |

## STOP conditions and retries

- Runtime tools were absent from PATH. The installed runtime needed sandbox escalation.
- The first red SSE test cancelled at its deadline. A diagnostic rejection replaced that harness cancellation.
- Restored source timestamps caused the first green build to retain old generated output. A forced TypeScript build resolved that check failure.
- `test:model-requests` failed in an existing cleanup hook with `EBUSY` while removing a process-runner temporary directory.
- `test:images` failed both real-renderer HTTP generation tests with `ARTIFACT_RENDERER_FAILED` during parallel suite execution.
- `test:generation-publication` initially failed two renderer tests during parallel suite execution. The result was pass 70, fail 2.
- `test:browser-smoke` initially failed the known Create deck UI case. The result was pass 20, fail 1.
- The unchanged portable-generation HTTP tests passed alone. This result supports renderer resource contention as the cause of the parallel failures.
- The orchestrator authorized isolated retries. Images, model-requests, generation-publication and browser-smoke then passed sequentially.
- The first parallel group stopped before slide-pipeline. Another group stopped before env-startup. Both suites passed in the final sequential run.
- A full-file Vietnamese STE check found one existing sentence-length violation at architecture line 3. The changed rows pass with 0 findings.
- No commit or push occurred in the executor.

## Evidence commands

The explicit red command was:

```powershell
node --test --test-timeout=30000 packages/presentation/deck/tests/deck-service.test.mjs apps/host/tests/brief-host.test.mjs
```

The targeted green command also included `e2e/attachment-admission.test.mjs`.
The required Brief callback mutant used:

```powershell
node --test --test-timeout=15000 packages/presentation/deck/tests/deck-service.test.mjs
```

The additional replay and committed-version mutants selected their named tests in `deck-service.test.mjs`.
The initial-topic mutant used:

```powershell
node --test --test-timeout=15000 --test-name-pattern='draft writes and attachment preparation send draft notices' e2e/attachment-admission.test.mjs
```

The restored initial-topic test uses the same selection with a 30-second diagnostic deadline.
Each mutant build used `corepack pnpm@11.28.5 build`.
Each source restoration used `corepack pnpm@11.28.5 exec tsc -b --force`, followed by `build`.

## Limits

The Browser does not react to Brief and Outline notices yet.
Task 46 owns that behavior.
Independent review, changelog, commit and push belong to the orchestrator.
