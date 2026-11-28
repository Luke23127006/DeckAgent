# Task 57: Mark ADR-001 to ADR-004 Accepted and check the Phase 4 exit condition report

Read this file to see the files changed, the command outputs, the Phase 4 exit criteria and the test counts for Task 57.

## Files changed

- `docs/architecture/30-decisions.md`
- `docs/architecture/10-agent-core.md`
- `docs/conventions/project-structure.md`
- `docs/build/refactor/target-structure/plan/task-57-accept-adrs-and-check-phase-4-exit.md`
- `docs/build/refactor/target-structure/plan/README.md`
- `docs/build/refactor/target-structure/reports/task-57-accept-adrs-and-check-phase-4-exit.md`
- `docs/build/refactor/target-structure/reports/README.md`
- `CHANGELOG.md`

## Phase 4 exit criteria

| Criterion | Evidence | Status |
| --- | --- | --- |
| TS-04: Agent core uses ports and adapters, and `runs/` imports no module, Express or SQL driver | `corepack pnpm@11.28.5 lint` (0 errors), `corepack pnpm@11.28.5 check:boundaries` (0 violations), `tests/oxlint-boundaries.test.mjs` and `tests/check-boundaries.test.mjs` (`# pass 64`, `# fail 0`) | PASS |
| TS-05: Agent core isolates lifecycle, capability policy, tool executors and runtime adapter | `oxlint` rules for `apps/host/src/tools/executors/`, `apps/host/src/runs/` and `apps/host/src/runtimes/` plus `runtime-private-import` in `check:boundaries` (`# pass 64`, `# fail 0`) | PASS |
| TS-09: Tools enforce every boundary rule with negative fixtures | `corepack pnpm@11.28.5 lint`, `corepack pnpm@11.28.5 check:boundaries` (`0 violation(s)`) and `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` (`# pass 64`, `# fail 0`) | PASS |
| TS-13: Run uses a general owner and `runs/` has no `sessionId:` field | `git grep -n "sessionId:" -- apps/host/src/runs` returned no line | PASS |
| ADR-001 to ADR-004 carry status `Accepted` | `git grep -n "Status:\*\* Proposed" -- docs/architecture/30-decisions.md` returned no line | PASS |
| Legacy folders and files removed (`packages/host/api/`, `packages/tools/`, `packages/session/`, `apps/host/src/features/`, `apps/host/src/integrations/`, `apps/host/src/local-transport.ts`) | `git ls-files` returned no line | PASS |

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` | 0 | No line |
| `git grep -n "^\| 56 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | Line 378 matched |
| `git grep -n "Status:\*\* Proposed" -- docs/architecture/30-decisions.md` | 1 | No line |
| `git grep -n "sessionId:" -- apps/host/src/runs` | 1 | No line |
| `git ls-files packages/host/api packages/tools packages/session apps/host/src/features apps/host/src/integrations apps/host/src/local-transport.ts` | 0 | No line |
| `corepack pnpm@11.28.5 build` | 0 | `tsc -b` and `build-workspace.mjs` passed |
| `corepack pnpm@11.28.5 lint` | 0 | `Found 0 warnings and 0 errors.` on 306 files |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 287 file(s) checked, 0 error(s) in 0 file(s)` |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 64`, `# pass 64`, `# fail 0` |
| `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-57-accept-adrs-and-check-phase-4-exit.md` | 0 | `0 violations` |

## Test suites

All 19 suites passed with 421 passing tests and 0 failures.

| Suite | Exit code | `# pass` | `# fail` |
| --- | --- | --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 | 0 |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | 24 | 0 |
| `corepack pnpm@11.28.5 test:local-web` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | 59 | 0 |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | 57 | 0 |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:attachments` | 0 | 31 | 0 |
| `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 |
| `corepack pnpm@11.28.5 test:images` | 0 | 39 | 0 |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 16 | 0 |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | 25 | 0 |
| `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 | 0 |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 9 | 0 |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 |
| `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 |
| `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 22 | 0 |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 |

## STOPs and retries

- No STOP condition occurred.
- Step 5 retry: `corepack pnpm@11.28.5 build` failed inside the Windows sandbox with `Access is denied. (os error 5)` in rolldown. The retry outside the sandbox passed with exit code 0.
- Step 6 retry: 11 suites hit Windows sandbox limits on junctions, child processes or local Chromium CDP. The retries outside the sandbox passed for 10 suites, while `test:generation-publication` hit 3 renderer timeouts under parallel load. The isolated retry of `test:generation-publication` passed with `# pass 72` and `# fail 0`.

## What the commands do not prove

- Live provider suites (`test:opencode-live`, `test:research-live`) did not run.
- Real OpenCode 1.19.5 `tokens` output did not run.
- Phase 5 Browser React work did not start.
