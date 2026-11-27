# Task 15 Report: Enable role-file-symbol for providers and research and check Phase 4

Read this file to know how Task 15 enabled `role-file-symbol` for `providers` and `research`, and to review the Phase 4 exit check results.

**Status:** Blocked at the phase-exit check. Implementation, formatting, build, lint, boundary checks, docs check and 18 of 19 non-live test suites passed. Two failures in `test:browser-smoke` occur outside Phase 4 (`apps/web/` and `e2e/browser-smoke.test.mjs`).

## Files changed

- `scripts/check-boundaries.mjs`: appended `'providers', 'research'` to `ROLE_FILE_MODULES` while keeping `'chats', 'attachments', 'workspaces'`.
- `tests/check-boundaries.test.mjs`: replaced the unlisted `providers` fixture with `apps/host/src/modules/deck/deck.service.ts` and added `checkBoundaries applies role symbol checks to providers and research by default`.
- `apps/host/src/modules/research/research.service.ts`, `apps/host/tests/research.test.mjs`, `tests/check-boundaries.test.mjs`: formatted with Biome.
- `docs/build/refactor/naming-and-grouping/plan/task-15-enable-providers-research-role-check-and-verify-phase-4.md`: marked Steps 1 to 4 and Step 6 as done; kept Step 5 open.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set Task 15 status to `Blocked: implementation complete, exit check failed` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 15.
- `docs/build/refactor/naming-and-grouping/reports/task-15-enable-providers-research-role-check-and-verify-phase-4.md`: this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs` (Step 2, before change) | 1 | `checkBoundaries applies role symbol checks to providers and research by default` failed (`[]` vs 5 violations). `# tests 31`, `# pass 30`, `# fail 1`. |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs` (Step 3) | 0 | `# tests 31`, `# pass 31`, `# fail 0`. |
| `git grep -n -E "ProviderConfigurations\|ProviderOperations\|\bProviderFailure\b\|mapProviderFailure\|ResearchCoordinator\|ResearchOperations\|ResearchSessionStore\|ResearchFailure\|mapResearchFailure" -- apps/host/src apps/host/tests e2e` | 1 | No line. |
| `corepack pnpm@11.28.5 exec biome format --write ...` then `biome format ...` | 0 | `Checked 35 files in 102ms. No fixes applied.` |
| `corepack pnpm@11.28.5 build` | 0 | `tsc -b` and `scripts/build-workspace.mjs` built all packages and `apps/web/dist`. |
| `corepack pnpm@11.28.5 lint` | 0 | `Found 0 warnings and 0 errors.` |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 344 file(s) checked, 0 error(s) in 0 file(s)` |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native` | 0 | `Test Files 5 passed (5)`, `Tests 13 passed (13)`. |

## Non-live test suites (Step 5)

| Script | Exit code | Tests passed |
| --- | --- | --- |
| `test:local-foundation` | 0 | 63/63 |
| `test:model-requests` | 0 | 57/57 |
| `test:source-permissions` | 0 | 11/11 |
| `test:attachments` | 0 | 32/32 |
| `test:research` | 0 | 8/8 |
| `test:images` | 0 | 39/39 |
| `test:outline-workflow` | 0 | 6/6 |
| `test:brief-foundation` | 0 | 16/16 |
| `test:deck-review` | 0 | 25/25 |
| `test:generation-publication` | 0 | 72/72 |
| `test:slide-pipeline` | 0 | 9/9 |
| `test:session-persistence` | 0 | 8/8 |
| `test:tools-browser` | 0 | 26/26 |
| `test:opencode-resources` | 0 | 3/3 |
| `test:browser-smoke` | 1 | 20/22 (2 failed outside Phase 4) |
| `test:env-startup` | 0 | 2/2 |
| `test:http-edge` | 0 | 12/12 |
| `test:local-web` | 0 | 14/14 |
| `test:layouts` | 0 | 10/10 |

## STOP and retry

- `biome format` and `corepack pnpm@11.28.5 build` failed with `Access is denied. (os error 5)` inside the Windows sandbox; ran both outside the sandbox and they exited 0.
- During the first full-suite run, concurrent edits in `apps/web/` caused a temporary `TS2379` build error, a Vitest failure in `apps/web/tests/settings-page.test.tsx`, and transient failures in `test:images` and the final 4 scripts. After the concurrent `apps/web/` changes stabilized, `build`, `vitest` (13/13), `test:images` (39/39), `test:env-startup` (2/2), `test:http-edge` (12/12), `test:local-web` (14/14) and `test:layouts` (10/10) all passed.
- **STOP condition (Step 5):** `test:browser-smoke` failed 2 of 22 tests in `e2e/browser-smoke.test.mjs`, both outside Phase 4 (`providers` and `research` tests in `browser-smoke` passed):
  1. `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` (`e2e/browser-smoke.test.mjs:762`): `Explicit continuation did not finish the remaining slides`.
  2. `interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat` (`e2e/browser-smoke.test.mjs:1261`): `History discard guard missing` on the concurrent React `/settings` route.
  Per Task 15 STOP rules, these failures were recorded without modifying `apps/web/` or `e2e/browser-smoke.test.mjs`.

## What the commands do not prove

- `test:browser-smoke` did not pass all 22 tests, so Task 15 and Phase 4 remain open until those two browser-smoke tests pass or an exception is accepted.
- Live provider and research suites (`test:research-live`, `test:opencode-live`) did not run.
