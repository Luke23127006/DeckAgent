# Task 6 Report: Add change feed and host connection hooks

Read this file to know which files Task 6 added, which commands ran, their results and what those checks do not prove.

## Files changed

- Create `apps/web/src/hooks/use-change-feed.ts`: `ChangeFeedOptions` and `useChangeFeed`. The private `followStream` invalidates the query prefixes of each notice, returns on `AUTH_REQUIRED`, and reconnects with an abortable delay that doubles from `retryBaseMs` to `retryMaxMs`.
- Create `apps/web/src/hooks/use-host-connection.ts`: `useHostConnection`, which returns `getApiClientConfig()`.
- Create `apps/web/tests/use-change-feed.test.tsx`: the test of the task, with the header comment that `docs/conventions/testware.md` requires.
- Change `docs/build/refactor/web-react/plan/task-06-add-change-feed-and-connection-hooks.md`, `plan/README.md` and `reports/README.md`.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/use-change-feed.test.tsx` (Step 2) | 1 | `Failed to resolve import "../src/hooks/use-change-feed.ts"`, `Tests no tests` |
| Same command, first run after Step 3 | 1 | `expect(hostAborted).toBe(true)`: expected `true`, received `false` after the `waitFor` timeout |
| Same command, retry | 0 | `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| Same command, 15 more runs | 0 | `Tests 1 passed (1)` on each run |
| Same command, fault injection: the `/api/changes` handler path changed to `/api/wrong` | 1 | `[MSW] Warning: intercepted a request without a matching request handler`, `invalidateSpy` not called |
| Same command after the revert | 0 | `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| `corepack pnpm@11.28.5 exec biome format apps/web/src/hooks/use-change-feed.ts apps/web/src/hooks/use-host-connection.ts apps/web/tests/use-change-feed.test.tsx` | 0 | `Checked 3 files`, `No fixes applied` |
| `corepack pnpm@11.28.5 lint` | 0 | no output |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 typecheck` (extra check) | 0 | no output |
| `corepack pnpm@11.28.5 check:docs` (after this report) | 0 | `check-docs: 324 file(s) checked, 0 error(s) in 0 file(s)` |

The fault injection follows `docs/conventions/testware.md`: it changes one handler path, proves that the test uses the MSW handler, then restores the path before the next run. The header comment of the test file records the fault and the failure.

## STOP and retry

- Step 4, one retry. The first run after Step 3 failed on `expect(hostAborted).toBe(true)` after the `waitFor` timeout. The run had a cold Vite cache and took 5.80 s, with 21% of the time in the test. I added a temporary debug `console.log`, and the next run passed. I removed the log, and 15 later runs passed. Cause of the first failure: the abort event did not reach the MSW handler inside the 1 s `waitFor` window on a cold, busy run.
- The fault injection run failed on purpose. It is not a STOP.
- No other STOP occurred.

## What the commands do not prove

- The test does not prove the reconnect delay. It covers only the `AUTH_REQUIRED` branch, which returns before the delay. The invalidation assertions also do not prove that a second connection starts after a drop, because the handler returns a stream that stays open.
- The chat feed (`options.sessionId`) has no test. `watchChatChanges` and the `/api/sessions/:sessionId/changes` path run first in a later task that mounts a chat page.
- `useHostConnection` has no test. It returns `getApiClientConfig()` unchanged, and Task 7 covers the value through `LegacyBrowserMount`.
- The abort assertion depends on the MSW `request.signal` propagation. The first failing run shows that this propagation can miss the 1 s `waitFor` window on a cold machine. A real browser closes the stream through the `fetch` signal, which no test in this file observes.
- No test measures the retry doubling or the `retryMaxMs` cap. A later test with a fake clock must cover those branches.
- No browser, Vite build or Host request ran. The tasks that mount the screens prove the integration.
