# Task 14 Report: Convert ResearchService and split the research ports

Read this file to know how Task 14 renamed `ResearchCoordinator` to `ResearchService`, split `ResearchSessionStore` into `ResearchChats` and `ResearchRuns`, and narrowed `research/index.ts`.

## Files changed

- `apps/host/src/modules/research/research.service.ts`: replaced `ResearchSessionStore` with `ResearchChats` and `ResearchRuns`, removed `ResearchOperations`, renamed `ResearchCoordinator` to `ResearchService`, updated the constructor to accept `(store, credentials, chats, runs, environmentKey, client, onPreferencesChanged)` and replaced `this.sessions.getInfo` / `this.sessions.requests.` with `this.chats.getInfo` / `this.runs.`.
- `apps/host/src/modules/research/research.routes.ts`: imported `type { ResearchService }` and changed `createResearchRoutes` to take `research: ResearchService`.
- `apps/host/src/modules/research/index.ts`: narrowed exports to the 9 names: `SqliteResearchStore`, `ResearchService`, `type ResearchChats`, `type ResearchSourceRecord`, `TavilyClient`, `type ImageSearchCandidate`, `createResearchRoutes`, `ResearchError`, `mapResearchError`.
- `apps/host/src/modules/chats/chats.service.ts`: imported `type { ResearchChats }` from `../research/index.ts` and added `ResearchChats` to `ChatService`'s `implements` clause.
- `apps/host/src/modules/deck/image-research.ts`: replaced `ResearchCoordinator` with `ResearchService`.
- `apps/host/src/server.ts`: replaced `ResearchCoordinator` with `ResearchService` and passed `chats, sessions.runs` to `new ResearchService(...)`.
- `apps/host/tests/research.test.mjs`: added `ResearchService reads chats through ResearchChats and records sources through ResearchRuns` and `research index exports ResearchService and only the operations that callers use`.
- `docs/build/refactor/naming-and-grouping/plan/task-14-convert-research-service-and-ports.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set Task 14 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 14.
- `docs/build/refactor/naming-and-grouping/reports/task-14-convert-research-service-and-ports.md`: this report.

No table is requested by the task, and no decision table sends an item to this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap apps/host/tests/research.test.mjs` (Step 2, before source change) | 1 | `app.ResearchService is not a constructor`; index exported `ResearchCoordinator` and `TavilyError`. `# tests 8`, `# pass 6`, `# fail 2`. |
| `corepack pnpm@11.28.5 build` (Step 4) | 0 | `tsc -b` and `scripts/build-workspace.mjs` built all packages and `apps/web/dist`. |
| `node --test --test-reporter=tap apps/host/tests/research.test.mjs apps/host/tests/image-research.test.mjs apps/host/tests/research-image-generation.test.mjs e2e/source-requests.test.mjs` (Step 4) | 0 | `# tests 33`, `# pass 33`, `# fail 0`. |
| `git grep -n -E "ResearchCoordinator\|ResearchOperations\|ResearchSessionStore" -- apps/host/src apps/host/tests e2e` | 1 | No line. |
| `corepack pnpm@11.28.5 lint` | 0 | `Found 0 warnings and 0 errors.` |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |

## STOP and retry

- Step 4: `corepack pnpm@11.28.5 build` and the Step 4 test command ran outside the sandbox because `rolldown` and headless Chromium require OS permissions blocked by the Windows sandbox. Both exited 0.

## What the commands do not prove

- The full non-live test suite did not run in this task. Per user instructions and Global Constraints, the full non-live suite runs after all code changes are mounted.
- `check:boundaries` does not include `research` in `ROLE_FILE_MODULES` yet. Task 15 adds that check.
