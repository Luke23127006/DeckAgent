# Task 39: Move the research module, credentials and settings routes report

Read this file to learn the changes and check results for Task 39.

## Files changed

- `apps/host/src/modules/research/`: the service, SQL store, Tavily client, routes, error map and public exports.
- `apps/host/src/credential-store.ts`: the unchanged credential implementation at its new path.
- `apps/host/src/settings-routes.ts`: the three settings and preferences routes.
- `apps/host/src/server.ts`: module construction, router registration and error-map registration.
- `apps/host/src/local-transport.ts`: remove research operations and the research error map.
- `apps/host/src/modules/providers/providers.service.ts`: the credential import path.
- `apps/host/src/features/sources/source-tools.ts`: the research import paths.
- `apps/host/src/features/deck/image-research.ts` and `image-review-run.ts`: the research import paths.
- `apps/host/src/integrations/images/image-source.ts`: the research import path.
- `apps/host/tests/fixtures/b02-helpers.mjs`: the credential import path.
- `apps/host/tests/research.test.mjs` and `image-research.test.mjs`: the Tavily import paths.
- `packages/host/api/src/transport/contracts.ts`: remove research, preferences and settings from `WebManagement`.
- `packages/host/api/src/transport/management-routes.ts`: keep activities and requests only.
- Remove the old research feature, research integration and credentials integration folders.
- The task file, plan index, report index and `CHANGELOG.md`: record task completion.

## Moved files

| Old path | New path | Symbols |
| --- | --- | --- |
| `apps/host/src/integrations/credentials/credential-store.ts` | `apps/host/src/credential-store.ts` | Credential store classes, types and functions |
| `apps/host/src/integrations/research/tavily.ts` | `apps/host/src/modules/research/tavily.ts` | `TavilyClient`, `TavilyError`, `ResearchResult`, `ImageSearchCandidate` |
| `apps/host/src/features/research/research-coordinator.ts` | `apps/host/src/modules/research/research.service.ts` | `ResearchCoordinator`, `ResearchFailure` |
| Research SQL in the coordinator | `apps/host/src/modules/research/research.store.ts` | `SqliteResearchStore` |
| Research routes in management routes | `apps/host/src/modules/research/research.routes.ts` | `createResearchRoutes` |
| Research status map in local transport | `apps/host/src/modules/research/research.errors.ts` | `mapResearchFailure` |
| Settings routes in management routes | `apps/host/src/settings-routes.ts` | `createSettingsRoutes`, `SettingsRoutesOptions` |

## Commands run

Commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell.
The package manager prefix for every package command is `corepack pnpm@11.28.5`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before changes | 0 | No line |
| `git grep -n "^| 38 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One task row |
| `git mv` for the three implementation files | 0 | No error |
| `git grep --untracked` for the three old folder paths in apps, packages, e2e and scripts | 1 | No line |
| `git grep --untracked` for forbidden persistence, file-tools and SQLite imports in research service and routes | 1 | No line |
| `git grep` for research symbols in local transport | 1 | No line |
| `Resolve-Path apps/host/lib,packages/host/api/lib` | 0 | Both paths are inside the repository |
| `Move-Item` for both generated folders to a unique TEMP folder | 0 | Both original paths absent before build |
| `exec biome format --write` on the 20 changed code and test files | 0 | Formatted 20 files |
| `exec biome format` on the same files | 0 | No fixes applied |
| First `build` | 2 | An old research import in image-review-run.ts failed to resolve |
| First `check:boundaries` | 1 | One unresolved import |
| `exec biome format --write` on image-review-run.ts, then format without write | 0 | No fixes applied on the second command |
| Second `build` | 0 | All bundles complete |
| `lint` | 0 | No error |
| Second `check:boundaries` | 0 | 0 violation(s) |
| `check:docs` before report creation | 0 | 249 files, 0 error(s) |
| `git diff --check HEAD` | 0 | No error |
| `check:docs` after report creation | 0 | 250 files, 0 error(s) |
| `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | 0 violations |
| The same STE command on the review prompt in TEMP | 0 | 0 violations |

## Suites

All 19 required suites passed on the first run.

| Command | Exit code | Pass | Fail |
| --- | --- | --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 | 0 |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | 22 | 0 |
| `corepack pnpm@11.28.5 test:local-web` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | 54 | 0 |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | 29 | 0 |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:attachments` | 0 | 31 | 0 |
| `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 |
| `corepack pnpm@11.28.5 test:images` | 0 | 39 | 0 |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 15 | 0 |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | 21 | 0 |
| `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 | 0 |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 |
| `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 |
| `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 19 | 0 |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 |

## Retries and deviations

- The first edit command could not find `python`. The same script ran with `uv run python -I`.
- Shell policy rejected recursive deletion of the generated build folders. Both folders moved to TEMP instead.
- The first build and boundary check found an old import in `image-review-run.ts`.
- The orchestrator approved the mapped import correction and one validation retry.
- The import correction resolved all four TypeScript errors. The build retry and boundary check passed.
- No unresolved STOP condition remains.
- No mapping item required a new design decision.
- The user-approved execution scope excludes commit and push. Neither command ran.
- The final workspace contains the task changes for review. A clean final Git status is therefore not expected.

## Review

A separate agent reviewed the diff against the applicable conventions and the `review-change` checklist.
The review found no defect. It checked route order and error-map order manually.
Tests changed import paths only. No assertion, expected value or simulation changed.
The review prompt passed STE lint with 0 violations.

## What the commands do not prove

No new test checks route order or error-map order. Existing suites check the HTTP contract.
The independent review checks those registration orders by reading `server.ts`.
