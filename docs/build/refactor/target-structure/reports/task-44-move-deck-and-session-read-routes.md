# Task 44: Move deck and session-read routes and remove WebManagement report

Read this file to learn the changes and check results for Task 44.

## Files changed

- `apps/host/src/modules/deck/deck.service.ts`: expose deck operations through Host contracts.
- `apps/host/src/modules/deck/deck.routes.ts`: register ten deck routes with shared route context.
- `apps/host/src/modules/deck/index.ts`: export the operations and route factory.
- `apps/host/src/modules/deck/brief-coordinator.ts`: remove the old management interface.
- `apps/host/src/modules/chats/chats.service.ts`: check session existence before activity and request reads.
- `apps/host/src/modules/chats/chats.routes.ts`: register activity and request reads.
- `apps/host/src/local-transport.ts`: remove session-read management wiring.
- `apps/host/src/server.ts`: construct deck operations and pass the deck route factory.
- `packages/host/api/src/index.ts`: mount routers and context factories.
- `packages/host/api/src/transport/contracts.ts`: add route context and registrar contracts.
- `packages/host/api/src/transport/session-routes.ts`: retain history reads only.
- Remove `packages/host/api/src/transport/deck-routes.ts` and `management-routes.ts`.
- `apps/host/tests/http-server.test.mjs`: test an existing Router beside a context factory.
- The task file, plan index and report index record Task 44 completion.

## Moved routes

| Method | Path | New file |
| --- | --- | --- |
| POST | `/api/sessions/:sessionId/deck/confirm` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/interview` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/brief` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/brief/versions/:version` | `apps/host/src/modules/deck/deck.routes.ts` |
| PUT | `/api/sessions/:sessionId/brief` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/deck` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/deck/slides/:slideId/revisions/:revision` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/deck/events` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/outlines/:outlineId/images/:imageId` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/outline` | `apps/host/src/modules/deck/deck.routes.ts` |
| GET | `/api/sessions/:sessionId/activities` | `apps/host/src/modules/chats/chats.routes.ts` |
| GET | `/api/sessions/:sessionId/requests` | `apps/host/src/modules/chats/chats.routes.ts` |

## Commands run

Commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell.
The package command prefix is `corepack pnpm@11.28.5`.
Node commands used `C:/dev_env/nvm/v22.23.5` in `PATH` with sandbox escalation.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before changes | 0 | No changed file |
| `git grep` for Task 43 Done | 0 | Task 43 row |
| `git rm` for both obsolete route files | 0 | Both files removed |
| `git grep --untracked` for removed symbols | 1 | No match |
| `git grep --untracked` for deck imports in routes and transport | 1 | No match |
| `exec biome format --write` on changed code and tests | 0 | Formatted 12 files |
| `exec biome format` on those files | 0 | No fixes applied |
| `Resolve-Path` and `Move-Item` on both build outputs | 0 | Host and Host API outputs moved to unique TEMP folders |
| First `build` | 1 | TS7006 on the route factory context parameter |
| Final format and `build` | 0 | Explicit context type accepted and bundles complete |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | 0 violation(s) |
| `check:docs` before the report | 0 | 259 files, 0 error(s) |
| Focused registrar test before mutation | 0 | 1 pass, 0 fail |
| Focused registrar test with the planned typeof-only mutant | 1 | 0 pass, 1 fail |
| Focused registrar test after restoration | 0 | 1 pass, 0 fail |
| `git diff --check` | 0 | No whitespace error |
| Final `check:docs` after the report | 0 | 260 files, 0 error(s) |
| `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | 0 violations |

## Required suites

Every command below exited with code 0 and reported `# fail 0`.
No suite needed a retry.
Logs are in `TEMP` as `deckagent-task44-<suite>.log`.

| Command | Pass | Fail | Skipped |
| --- | --- | --- | --- |
| `test:http-edge` | 12 | 0 | 0 |
| `test:tools-browser` | 24 | 0 | 0 |
| `test:local-web` | 11 | 0 | 0 |
| `test:local-foundation` | 57 | 0 | 0 |
| `test:model-requests` | 29 | 0 | 0 |
| `test:source-permissions` | 11 | 0 | 0 |
| `test:attachments` | 31 | 0 | 0 |
| `test:research` | 5 | 0 | 0 |
| `test:images` | 39 | 0 | 0 |
| `test:outline-workflow` | 6 | 0 | 0 |
| `test:brief-foundation` | 15 | 0 | 0 |
| `test:deck-review` | 21 | 0 | 0 |
| `test:generation-publication` | 72 | 0 | 0 |
| `test:slide-pipeline` | 7 | 0 | 0 |
| `test:session-persistence` | 7 | 0 | 0 |
| `test:opencode-resources` | 3 | 0 | 0 |
| `test:layouts` | 10 | 0 | 0 |
| `test:browser-smoke` | 21 | 0 | 0 |
| `test:env-startup` | 2 | 0 | 0 |

## Plan corrections, STOP conditions and retries

- Express Router is callable. The planned `typeof entry === 'function'` test also matches existing routers.
- The orchestrator authorized a structural guard that checks the Router `handle` method.
- The guard uses no type assertion.
- The orchestrator authorized a regression test in `apps/host/tests/http-server.test.mjs`.
- The first build reported TS7006 because the callable union gives no contextual type to the factory parameter.
- The orchestrator authorized an explicit `HostRouteContext` annotation in `server.ts`.
- The next build passed.
- No unresolved STOP condition remains.
- No required suite failed. No suite needed a retry.

## Mutation evidence

The regression mounts an existing Express Router beside a factory that receives route context.
It checks both HTTP responses and one factory invocation.
The test uses the real Express Router and Host.

The mutant changed the built Host API mount expression to the exact planned typeof-only expression.
The test failed with `TypeError: argument callback is required` during Host construction.
The built product returned to its original contents in a `finally` block.
The restored product passed the same test.

## Items outside the mapping

The orchestrator authorized the Router guard and regression test described above.
No other item needed a change outside the move rules.

## What the commands do not prove

No new test checks route registration order.
Existing suites check routes over HTTP.
Direct inspection shows the deck factory after settings routes.
Deck SSE uses `context.streams`, and confirmation mounts only when `context.submit` exists.

## Commit handoff

The root orchestrator owns independent review, the changelog entry, commit and push.
This executor did not commit or push.
