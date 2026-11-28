# Task 11: Host API Refactor Report

Read this file to review the execution results, file changes, before/after metrics, and verification outputs for Task 11 in `packages/host/api/` and `apps/web/` [[1]](#ref-1) [[2]](#ref-2).

## Summary

- Isolated request lifecycle modules (`contracts.ts`, `request-controller.ts`, `request-failure.ts`, `tool-contracts.ts`) under `packages/host/api/src/lifecycle/` with zero HTTP imports.
- Added compile-time contract parity verification in `packages/host/api/src/contract-sync.ts` across all 9 shared `@deckagent/host-contracts` and `@deckagent/session-persistence` types.
- Moved `DeckError` HTTP status mapping to `apps/web/src/local-transport.ts` and passed `failureMessage: deckFailureMessage` from `apps/web/src/index.ts`, removing the runtime `@deckagent/deck` import from `packages/host/api/`.
- Split HTTP/SSE transport into focused modules under `packages/host/api/src/transport/` (`contracts.ts`, `http-error.ts`, `multipart.ts`, `sse.ts`, `http-io.ts`, `error-response.ts`, `deck-routes.ts`, `management-routes.ts`, `session-routes.ts`, `request-routes.ts`), sharing `openSseStream` and removing all 24 non-null assertions.
- Narrowed `packages/host/api/src/index.ts` exports from 56 to 22 own symbols and updated the 14 `apps/web/src/` callers to import wire DTOs directly from `@deckagent/host-contracts`.

## Files changed

| Action | Path |
| --- | --- |
| Created | `packages/host/api/src/contract-sync.ts` |
| Created | `packages/host/api/src/lifecycle/contracts.ts` |
| Created | `packages/host/api/src/lifecycle/request-controller.ts` |
| Created | `packages/host/api/src/lifecycle/request-failure.ts` |
| Created | `packages/host/api/src/lifecycle/tool-contracts.ts` |
| Created | `packages/host/api/src/transport/contracts.ts` |
| Created | `packages/host/api/src/transport/http-error.ts` |
| Created | `packages/host/api/src/transport/multipart.ts` |
| Created | `packages/host/api/src/transport/sse.ts` |
| Created | `packages/host/api/src/transport/http-io.ts` |
| Created | `packages/host/api/src/transport/error-response.ts` |
| Created | `packages/host/api/src/transport/deck-routes.ts` |
| Created | `packages/host/api/src/transport/management-routes.ts` |
| Created | `packages/host/api/src/transport/session-routes.ts` |
| Created | `packages/host/api/src/transport/request-routes.ts` |
| Created | `docs/build/refactor/module-design/reports/task-11-refactor-host-api.md` |
| Modified | `packages/host/api/src/index.ts` |
| Modified | `packages/host/api/tests/request-failure.test.mjs` |
| Modified | `apps/web/tsconfig.json` |
| Modified | `apps/web/src/index.ts` |
| Modified | `apps/web/src/local-transport.ts` |
| Modified | `apps/web/src/features/attachments/attachment-service.ts` |
| Modified | `apps/web/src/features/deck/brief-service.ts` |
| Modified | `apps/web/src/features/deck/confirmation-service.ts` |
| Modified | `apps/web/src/features/deck/deck-workflow.ts` |
| Modified | `apps/web/src/features/deck/generation-report.ts` |
| Modified | `apps/web/src/features/deck/generation-workflow.ts` |
| Modified | `apps/web/src/features/providers/built-in-providers.ts` |
| Modified | `apps/web/src/features/providers/provider-settings.ts` |
| Modified | `apps/web/src/features/requests/prepare-runtime.ts` |
| Modified | `apps/web/src/integrations/opencode/contracts.ts` |
| Modified | `apps/web/src/integrations/opencode/provider.ts` |
| Modified | `apps/web/src/integrations/opencode/runtime.ts` |
| Modified | `apps/web/src/integrations/providers/provider-catalog.ts` |
| Modified | `docs/build/refactor/module-design/plan/README.md` |
| Modified | `docs/build/refactor/module-design/plan/task-11-refactor-host-api.md` |
| Modified | `docs/build/refactor/module-design/reports/README.md` |
| Removed | `packages/host/api/src/contracts.ts` |
| Removed | `packages/host/api/src/request-controller.ts` |
| Removed | `packages/host/api/src/request-failure.ts` |
| Removed | `packages/host/api/src/tool-contracts.ts` |
| Removed | `packages/host/api/src/http-error.ts` |
| Removed | `packages/host/api/src/multipart.ts` |
| Removed | `packages/host/api/src/deck-routes.ts` |

## Before and after metrics (`packages/host/api/`)

| Metric | Before (Task 6) | After (Task 11) |
| --- | --- | --- |
| Production files | 8 | 16 |
| Total lines | — | 1506 |
| Root exports | 56 | 22 |
| Files over 400 lines | 2 (`index.ts`, `request-controller.ts`) | 0 |
| Functions over 80 lines | 4 | 1 (`receiveAttachment` in `transport/multipart.ts`) |
| Type assertions (`as`) | 0 | 0 |
| Non-null assertions (`!`) | 24 | 0 |
| Runtime `@deckagent/deck` imports | 1 | 0 |

## Verification results

| Check | Result | Notes |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | Pass (`0`) | Run outside sandbox after `EPERM` on `tsconfig.tsbuildinfo` inside sandbox |
| `corepack pnpm@11.28.5 check:boundaries` | Pass (`0`) | `0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | Pass (`0`) | `0 warnings and 0 errors` across 256 files |
| `npx biome format --write` (touched files) | Pass (`0`) | Formatted 32 touched files outside sandbox (`Access is denied` inside sandbox) |
| AST check (`runtimeDeck` and `nonNull`) | Pass (`0`) | `{"runtimeDeck":0,"nonNull":0}` |
| `node scripts/scan-module-design.mjs --json` | Pass (`0`) | `files: 16`, `lines: 1506`, `filesOver400: 0`, `functionsOver80: 1`, `typeAssertions: 0`, `maxExports: 22` |
| `corepack pnpm@11.28.5 test:tools-browser` | Pass (`0`) | `14` passed, `0` failed, `0` skipped |
| `corepack pnpm@11.28.5 test:model-requests` | Pass (`0`) | `29` passed, `0` failed, `0` skipped (run outside sandbox) |
| `corepack pnpm@11.28.5 test:local-web` | Pass (`0`) | `8` passed, `0` failed, `0` skipped |
| `corepack pnpm@11.28.5 test:local-foundation` | Pass (`0`) | `43` passed, `0` failed, `0` skipped (run outside sandbox after `EPERM` on symlink/attachments in sandbox) |
| `corepack pnpm@11.28.5 test:attachments` | Pass (`0`) | `29` passed, `0` failed, `0` skipped (run outside sandbox) |
| `corepack pnpm@11.28.5 test:source-permissions` | Pass (`0`) | `11` passed, `0` failed, `0` skipped (run outside sandbox) |
| `corepack pnpm@11.28.5 test:brief-foundation` | Pass (`0`) | `15` passed, `0` failed, `0` skipped (run outside sandbox) |
| `corepack pnpm@11.28.5 test:outline-workflow` | Pass (`0`) | `6` passed, `0` failed, `0` skipped |
| `corepack pnpm@11.28.5 test:slide-pipeline` | Pass (`0`) | `7` passed, `0` failed, `0` skipped |

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 11 Plan](../plan/task-11-refactor-host-api.md)
