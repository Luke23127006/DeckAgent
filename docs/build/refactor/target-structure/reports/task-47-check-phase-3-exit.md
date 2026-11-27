# Task 47: Record the helmet decision and check the Phase 3 exit condition report

Read this file to learn the changes, the Phase 3 exit checks and the results for Task 47.

## Files changed

- `AGENTS.md`: the `helmet` bullet of `## Tech Stack` is two bullets. One bullet records that Local Host uses `setSecurityHeaders` in `apps/host/src/http/app.ts` and does not use `helmet`. The other bullet keeps the target libraries.
- `docs/build/refactor/target-structure/plan/README.md`: the row of Task 47 is `Done`.
- `docs/build/refactor/target-structure/plan/task-47-check-phase-3-exit.md`: every step is `- [x]`.
- `docs/build/refactor/target-structure/reports/README.md`: one new row links this report.
- `CHANGELOG.md`: one new line under `### Added`.
- `docs/build/refactor/target-structure/reports/task-47-check-phase-3-exit.md`: this report.

## Commands run

Commands ran in PowerShell from the repository root `C:/Users/Duy/Desktop/DeckAgent`.
The package command prefix is `corepack pnpm@11.28.5`.
The Node.js version was v22.23.5.

| Step | Command | Exit code | Result |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "\| 46 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line. |
| 3.1 | `git ls-files apps/host/src/modules` | 0 | Six module folders. |
| 3.2 | `git ls-files apps/host/src/features apps/host/src/integrations` | 0 | Every line starts with an allowed folder. |
| 3.3 | `git grep -n -E "WebManagement\|BriefManagement\|deck-routes\|management-routes" -- apps packages` | 1 | No line. |
| 3.4 | `git ls-files packages/host/api/src` | 0 | Only the eleven allowed paths. |
| 3.5 | `git grep -n "topic:" -- apps/host/src/server.ts` | 0 | All eight topics. |
| 3.6 | `git grep -n "notify(.*, 1)" -- packages/presentation/deck/src` | 1 | No line. |
| 3.7 | `build` | 0 | Build passes. |
| 3.7 | `lint` | 0 | No lint finding. |
| 3.7 | `check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 3.7 | `check:docs` | 0 | `262 file(s) checked, 0 error(s) in 0 file(s)`. |
| 3.7 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# pass 49`, `# fail 0`. |
| 5 | `check:docs` after the index row | 0 | `0 error(s)`. |
| 5 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | `0 violations`. |

## Phase 3 exit checks

| Check | Command | Result |
| --- | --- | --- |
| 1. Six domain modules with routes, service, errors and index | `git ls-files apps/host/src/modules` | PASS. `attachments`, `chats`, `deck`, `providers`, `research` and `workspaces` exist. Each module has `*.routes.ts`, `*.service.ts`, `*.errors.ts` and `index.ts`. |
| 2. Only the three old folders remain | `git ls-files apps/host/src/features apps/host/src/integrations` | PASS. The lines start with `features/requests/`, `features/sources/` or `integrations/opencode/`. |
| 3. `WebManagement`, `BriefManagement`, `deck-routes.ts` and `management-routes.ts` removed | `git grep -n -E "WebManagement\|BriefManagement\|deck-routes\|management-routes" -- apps packages` | PASS. No line. |
| 4. Only the allowed paths remain in `packages/host/api/src/` | `git ls-files packages/host/api/src` | PASS. The list has `contract-sync.ts`, `index.ts`, four `lifecycle/*` files and eight `transport/*` files. |
| 5. Eight change topics wired in `apps/host/src/server.ts` | `git grep -n "topic:" -- apps/host/src/server.ts` | PASS. `workspaces`, `chats`, `providers`, `preferences`, `draft`, `brief`, `outline` and `deck` are present. |
| 6. No hardcoded `notify(..., 1)` call in `@deckagent/deck` | `git grep -n "notify(.*, 1)" -- packages/presentation/deck/src` | PASS. No line. |
| 7. Build, lint, boundaries, docs and boundary tests | `build`, `lint`, `check:boundaries`, `check:docs`, `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | PASS. Exit code 0, `0 violation(s)`, `0 error(s)`, `# fail 0`. |

## Regression suites

Each suite ran one time.

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
| `test:browser-smoke` | 22 | 0 |
| `test:env-startup` | 2 | 0 |

## The helmet decision

Local Host keeps the `setSecurityHeaders` function in `apps/host/src/http/app.ts` and does not install `helmet`.
The reasons are:

- `helmet` does not set `cache-control: no-store`.
- `helmet` adds ten headers outside the tested HTTP contract in `e2e/http-edge.test.mjs`.
- `helmet` enables `upgrade-insecure-requests` by default. This directive breaks loopback HTTP.

`setSecurityHeaders` sets `cache-control`, `x-content-type-options`, `referrer-policy` and `content-security-policy`.

## Phase 4 shell

`packages/host/api/` stays as a Phase 4 shell.
It keeps `lifecycle/`, `request-routes.ts`, `session-routes.ts` history and the HTTP helpers.
Phase 4 moves `lifecycle/` into `apps/host/src/runs/`.

## STOP conditions and retries

No STOP condition occurred.
No retry occurred.

## Limits

The commands do not prove these points:

- `packages/host/api/` is not removed yet, because its `lifecycle/` code belongs to Phase 4.
- `DECK_STALE` has no manual slide-edit HTTP route until canvas editing (UC-007) exists.
