# Task 12: Record the test baseline before Phase 2 report

Read this file to learn which checks and non-live test suites pass before Phase 2 changes code.

A later task compares its result with this table. A suite that fails after Phase 2 changes code is a regression only when this table shows PASS.

## Files changed

- `docs/build/refactor/target-structure/plan/task-12-record-http-test-baseline.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 12 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-12-record-http-test-baseline.md`: added this report.

## Start state

The last commit is `e6d910f`. The working tree had no change before this task. The Node.js version is `v22.23.5`.

## Suite results

Each command ran from the repository root in PowerShell 5.1 on Windows. `Duration` is the wall time in seconds on this machine. `-` means the output has no such line.

| Suite | Command | Exit code | Pass | Fail | Duration | Result |
| --- | --- | --- | --- | --- | --- | --- |
| build | `corepack pnpm@11.28.5 build` | 0 | - | - | 5.2 | PASS |
| lint | `corepack pnpm@11.28.5 lint` | 0 | - | - | 2.1 | PASS |
| check:boundaries | `corepack pnpm@11.28.5 check:boundaries` | 0 | - | - | 6.1 | PASS |
| boundary fixtures | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 35 | 0 | 4.8 | PASS |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | 14 | 0 | 22.1 | PASS |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | 8 | 0 | 24.7 | PASS |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | 43 | 0 | 24.3 | PASS |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | 29 | 0 | 33.2 | PASS |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 | 17.3 | PASS |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | 29 | 0 | 46.5 | PASS |
| test:research | `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 | 15.0 | PASS |
| test:images | `corepack pnpm@11.28.5 test:images` | 0 | 39 | 0 | 93.5 | PASS |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 | 3.3 | PASS |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 15 | 0 | 9.8 | PASS |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | 0 | 21 | 0 | 26.4 | PASS |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 | 0 | 127.5 | PASS |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 7 | 0 | 10.1 | PASS |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 | 2.5 | PASS |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 | 17.1 | PASS |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 | 10.0 | PASS |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 13 | 0 | 136.3 | PASS |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 | 10.0 | PASS |

The first run of `build` compiled every package from scratch. Its duration is not measured. The duration in the table is from a later run, which reused the build output. The duration of `lint` is also from a later run with a warm cache.

## Failed tests

No suite wrote a `not ok` line. No command needed a second run after a failure.

## What the commands do not prove

- One run does not prove that a suite is stable. A suite that passed one time can fail under load or on a slower machine.
- The commands do not run a script with `live` in its name. The table says nothing about the live suites.
- `build`, `lint` and `check:boundaries` write no `# pass` line. Their exit code is the only signal.
- A pass shows that the current expectations hold. It does not show that the expectations are correct. Phase 2 keeps the expected values of the HTTP tests, so a wrong expectation stays wrong after the move.
