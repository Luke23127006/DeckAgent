# Task 13 Report: Add ResearchError and the Tavily error codes

Read this file to know how Task 13 moved `ResearchError` into `research.errors.ts`, typed `TavilyErrorCode` and updated the callers.

## Files changed

- `apps/host/src/modules/research/research.errors.ts`: added `ResearchErrorCode` (11 codes) and `ResearchError`, typed `researchStatus` as `Readonly<Record<ResearchErrorCode, number>>`, renamed `mapResearchFailure` to `mapResearchError`, removed the `?? 500` fallback and removed the import of `./research.service.ts`.
- `apps/host/src/modules/research/tavily.ts`: added `TavilyErrorCode` (6 codes) and typed `TavilyError.code` and `failure(code)`.
- `apps/host/src/modules/research/research.service.ts`: removed `ResearchFailure`, imported `ResearchError` from `./research.errors.ts` and replaced all 17 `new ResearchFailure` calls with `new ResearchError`.
- `apps/host/src/modules/research/index.ts`: exported `ResearchError` and `mapResearchError` from `./research.errors.ts`.
- `apps/host/src/modules/deck/confirmation-coordinator.ts`: replaced `ResearchFailure` with `ResearchError`.
- `apps/host/src/modules/deck/image-research.ts`: replaced `ResearchFailure` with `ResearchError`.
- `apps/host/src/modules/deck/image-review-run.ts`: replaced `ResearchFailure` with `ResearchError`.
- `apps/host/src/server.ts`: replaced `mapResearchFailure` with `mapResearchError`.
- `apps/host/tests/research.test.mjs`: added imports for `ResearchError`, `mapResearchError` and `TavilyError`, and added the test `ResearchError and mapResearchError map codes to HTTP status and detail`.
- `docs/build/refactor/naming-and-grouping/plan/task-13-add-research-error-and-tavily-codes.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set Task 13 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 13.
- `docs/build/refactor/naming-and-grouping/reports/task-13-add-research-error-and-tavily-codes.md`: this report.

No table is requested by the task, and no decision table sends an item to this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap apps/host/tests/research.test.mjs` (Step 2, before source change) | 1 | `SyntaxError: The requested module '../lib/types/modules/research/research.errors.js' does not provide an export named 'ResearchError'`. `# fail 1`. |
| `corepack pnpm@11.28.5 build` (Step 4) | 0 | `tsc -b` and `scripts/build-workspace.mjs` built all packages and `apps/web/dist`. |
| `node --test --test-reporter=tap apps/host/tests/research.test.mjs apps/host/tests/image-research.test.mjs apps/host/tests/research-image-generation.test.mjs` (Step 4) | 0 | `# tests 27`, `# pass 27`, `# fail 0`. |
| `git grep -n -E "ResearchFailure\|mapResearchFailure" -- apps/host/src apps/host/tests e2e` | 1 | No line. |
| `corepack pnpm@11.28.5 lint` | 0 | `Found 0 warnings and 0 errors.` |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |

## STOP and retry

- Step 2 and Step 4: `rolldown` inside `corepack pnpm@11.28.5 build` failed with `Access is denied. (os error 5)` inside the sandbox; ran `corepack pnpm@11.28.5 build` outside the sandbox and it exited 0.
- Step 4: `research-image-generation.test.mjs` failed in the sandbox because `publish_slide` launches headless Chromium; re-ran the Step 4 test command outside the sandbox and all 27 tests passed.

## What the commands do not prove

- The full non-live test suite did not run in this task. Per user instructions and Global Constraints, the full non-live suite runs after all code changes are mounted.
- `check:boundaries` does not include `research` in `ROLE_FILE_MODULES` yet. Task 15 adds that check.
