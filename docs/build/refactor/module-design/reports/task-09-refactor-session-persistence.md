# Task 9: Session Persistence Refactor Report

Read this file to review the execution results, file changes, before/after metrics, and verification outputs for Task 9 in `packages/session/persistence/` and `apps/web/` [[1]](#ref-1) [[2]](#ref-2).

## Summary

- Moved volatile `MemoryDraftStore` and `DraftSnapshot` from `packages/session/persistence/` to `apps/web/src/draft-store.ts` with a dedicated `DraftError` mapped in `apps/web/src/local-transport.ts`, and moved its unit test to `apps/web/tests/draft-store.test.mjs`.
- Split `packages/session/persistence/src/requests.ts` into `request-validation.ts`, `request-queries.ts`, `runtime-bindings.ts`, `request-sources.ts`, and the `RequestLog` facade `requests.ts`.
- Replaced all 4 type assertions and all non-null assertions in `requests.ts` with type predicates (`isRequestStatus`, `isActivityStatus`), `parseResearchSource` (`SESSION_CORRUPT`), and explicit undefined guards.
- Narrowed root exports in `packages/session/persistence/src/index.ts` from 32 to 19 symbols; kept `ResearchSource` exported after `tsc -b` reported `TS2883` on `apps/web/src/features/research/research-service.ts` declaration emit (approved by owner).

## Files changed

| Action | Path |
| --- | --- |
| Created | `apps/web/src/draft-store.ts` |
| Created | `apps/web/tests/draft-store.test.mjs` |
| Created | `packages/session/persistence/src/request-validation.ts` |
| Created | `packages/session/persistence/src/request-queries.ts` |
| Created | `packages/session/persistence/src/runtime-bindings.ts` |
| Created | `packages/session/persistence/src/request-sources.ts` |
| Created | `docs/build/refactor/module-design/reports/task-09-refactor-session-persistence.md` |
| Modified | `packages/session/persistence/src/requests.ts` |
| Modified | `packages/session/persistence/src/contracts.ts` |
| Modified | `packages/session/persistence/src/index.ts` |
| Modified | `packages/session/persistence/tests/chat-persistence.test.mjs` |
| Modified | `apps/web/src/index.ts` |
| Modified | `apps/web/src/local-transport.ts` |
| Modified | `apps/web/src/features/attachments/attachment-service.ts` |
| Modified | `apps/web/src/features/attachments/managed-attachments.ts` |
| Modified | `apps/web/src/features/chats/index.ts` |
| Modified | `apps/web/tests/fixtures/b02-helpers.mjs` |
| Modified | `e2e/attachment-storage.test.mjs` |
| Modified | `package.json` |
| Modified | `docs/build/refactor/module-design/plan/README.md` |
| Modified | `docs/build/refactor/module-design/plan/task-09-refactor-session-persistence.md` |
| Modified | `docs/build/refactor/module-design/reports/README.md` |
| Removed | `packages/session/persistence/src/draft-store.ts` |

## Before and after metrics (`packages/session/persistence/`)

| Metric | Before (Task 7) | After (Task 9) |
| --- | --- | --- |
| Production files | 9 | 12 |
| Total lines | 1875 | 1975 |
| Root exports | 32 (23 type, 9 runtime) | 19 (15 type, 4 runtime) |
| Files over 400 lines | 1 | 0 |
| Functions over 80 lines | 0 | 0 |
| Type assertions (`as`) | 4 | 0 |

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Build | `corepack pnpm@11.28.5 build` | Exit `0` (run outside sandbox due to Windows `EPERM`) |
| Boundaries | `corepack pnpm@11.28.5 check:boundaries` | Exit `0`, `0 violation(s)` |
| Lint | `corepack pnpm@11.28.5 lint` | Exit `0`, `0 warnings`, `0 errors` across 244 files |
| Format | `corepack pnpm@11.28.5 format` + `format:check` on the 16 touched files | Exit `0`, `Checked 16 files in 32ms. No fixes applied.` |
| Scanner | `node scripts/scan-module-design.mjs --json` | `over400: 0`, `fnOver80: 0`, `typeAssertions: 0` |
| Session persistence tests | `corepack pnpm@11.28.5 test:session-persistence` | `7` tests, `7` pass, `0` fail, `0` skipped |
| Local foundation tests | `corepack pnpm@11.28.5 test:local-foundation` | `43` tests, `43` pass, `0` fail, `0` skipped |
| Attachment tests | `corepack pnpm@11.28.5 test:attachments` | `29` tests, `29` pass, `0` fail, `0` skipped |
| Model request tests | `corepack pnpm@11.28.5 test:model-requests` | `29` tests, `29` pass, `0` fail, `0` skipped |
| Source permission tests | `corepack pnpm@11.28.5 test:source-permissions` | `11` tests, `11` pass, `0` fail, `0` skipped |
| Research tests | `corepack pnpm@11.28.5 test:research` | `5` tests, `5` pass, `0` fail, `0` skipped |

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 9 Plan](../plan/task-09-refactor-session-persistence.md)
