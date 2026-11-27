# Task 5 Report: Add api/client.ts, api/changes.ts and text.ts

Read this file to know which files Task 5 added, which commands ran, their results and what those checks do not prove.

## Files changed

- Create `apps/web/src/api/client.ts`: `CLIENT_ERROR_CODES` (109 codes), `ApiClientError`, `ApiClientConfig`, `SseFrameOptions`, `readTokenFromHash`, `configureApiClient`, `getApiClientConfig`, `apiFetch`, `apiJson` and `readSseFrames`.
- Create `apps/web/src/api/changes.ts`: `watchHostChanges`, `watchChatChanges` and `queryKeyPrefixesForNotice`.
- Create `apps/web/src/text.ts`: `appText`, `errorText` (one label for each of the 109 codes) and `formatClientError`.
- Create `apps/web/tests/api-client.test.ts`: the three tests of the task, with the header comment that `docs/conventions/testware.md` requires.
- Change `docs/build/refactor/web-react/plan/task-05-add-api-client-changes-and-text.md`, `plan/README.md` and `reports/README.md`.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/api-client.test.ts` (Step 2) | 1 | `Failed to resolve import "../src/api/changes.ts"`, `Tests no tests` |
| Same command, fault injection: the `/api/ok` handler changed to `/api/wrong` | 1 | `intercepted a request without a matching request handler`, `ECONNREFUSED 127.0.0.1:4321`, `1 failed \| 2 passed` |
| Same command after the revert | 0 | `Test Files 1 passed (1)`, `Tests 3 passed (3)` |
| `corepack pnpm@11.28.5 exec biome format <4 new files>` (extra check) | 1 | `Would have printed` two line joins in `client.ts` |
| `corepack pnpm@11.28.5 exec biome format --write <4 new files>` | 0 | `Formatted 4 files`, `Fixed 1 file` |
| Same Vitest command, final run | 0 | `Test Files 1 passed (1)`, `Tests 3 passed (3)` |
| `corepack pnpm@11.28.5 lint` | 0 | no output |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 typecheck` (extra check) | 0 | no output |
| `node <temp script>` that compares the code union (extra check, script outside the repository) | 0 | `host 38, management 51, feedback 71, expected 109, actual 109`, `missing []`, `extraInClient []`, `duplicates []` |
| `corepack pnpm@11.28.5 check:docs` (after this report) | 0 | `check-docs: 323 file(s) checked, 0 error(s) in 0 file(s)` |

The fault injection follows `docs/conventions/testware.md`: it changes one handler path, proves that the test uses the MSW handler, then restores the path before the next run. The header comment of the test file records the fault and the failure.

## STOP and retry

- Step 3, no STOP. The first `biome format` check found two long signatures in `client.ts`. `biome format --write` joined the lines. That is a format fix, not a STOP.
- The fault injection run failed on purpose. It is not a STOP.
- No STOP occurred.

## What the commands do not prove

- No test covers `watchHostChanges`, `watchChatChanges` or `readSseFrames`. The frame split, the 64 KiB limit, the `AUTH_REQUIRED` branch on a stream, `CHANGES_CONNECTION_LOST` and the abort path run first in Task 6.
- The test only proves that each `errorText` value is non-empty. It does not judge the Vietnamese copy. A person reviews the copy, and the long detail sentences stay in `request-feedback.ts` until a later phase reads them.
- The temp script proves that the 109 code names match the four source lists. It does not prove that `errorText` has a label for each code. `tsc -b` proves that, because `errorText` has the type `Readonly<Record<ClientErrorCode, string>>`.
- `credentials: 'omit'` and `redirect: 'error'` are set in `apiFetch`, and no assertion reads them. MSW does not expose those request options to the test.
- `readTokenFromHash` uses `URLSearchParams`. The tests do not cover a hash with a repeated `token` parameter or a hash without a leading `#`.
- No browser, Vite build or Host request ran. The tasks that mount the screens prove the integration.
