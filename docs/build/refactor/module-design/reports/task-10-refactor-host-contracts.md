# Task 10: Host Contracts Refactor Report

Read this file to review the execution results, file changes, before/after metrics, and verification outputs for Task 10 in `packages/host/contracts/` and `apps/web/` [[1]](#ref-1) [[2]](#ref-2).

## Summary

- Split `packages/host/contracts/src/validation.ts` (766 lines) into `validation-primitives.ts`, `request-validation.ts`, `brief-validation.ts`, `outline-validation.ts`, and `generation-validation.ts` using Zod schemas while preserving `INVALID_RESPONSE` and `INVALID_GENERATION_RESPONSE` errors.
- Added pure `decodeAgentRequest` and `RequestValidationError` (`INVALID_REQUEST`, `REQUEST_EMPTY`, `REQUEST_TEXT_TOO_LONG`) in `request-validation.ts`.
- Removed the 6 `@deckagent/presentation-document` re-exports from `packages/host/contracts/src/index.ts`, added `"@deckagent/presentation-document": "workspace:*"` to `apps/web/package.json` and `apps/web/tsconfig.browser.json`, and updated `apps/web/src/browser/transport/deck-client.ts` to import directly from `@deckagent/presentation-document`.
- Narrowed the 15 unused nested type exports from `packages/host/contracts/src/index.ts`, reducing root exports from 65 to 47.
- Added unit tests in `packages/host/contracts/tests/validation.test.mjs` and wired them into `test:tools-browser` in `package.json`.

## Files changed

| Action | Path |
| --- | --- |
| Created | `packages/host/contracts/src/validation-primitives.ts` |
| Created | `packages/host/contracts/src/request-validation.ts` |
| Created | `packages/host/contracts/src/outline-validation.ts` |
| Created | `packages/host/contracts/src/generation-validation.ts` |
| Created | `packages/host/contracts/tests/validation.test.mjs` |
| Created | `docs/build/refactor/module-design/reports/task-10-refactor-host-contracts.md` |
| Modified | `packages/host/contracts/src/brief-validation.ts` |
| Modified | `packages/host/contracts/src/index.ts` |
| Modified | `apps/web/src/browser/transport/deck-client.ts` |
| Modified | `apps/web/package.json` |
| Modified | `apps/web/tsconfig.browser.json` |
| Modified | `pnpm-lock.yaml` |
| Modified | `package.json` |
| Modified | `docs/build/refactor/module-design/plan/README.md` |
| Modified | `docs/build/refactor/module-design/plan/task-10-refactor-host-contracts.md` |
| Modified | `docs/build/refactor/module-design/reports/README.md` |
| Removed | `packages/host/contracts/src/validation.ts` |

## Before and after metrics (`packages/host/contracts/`)

| Metric | Before (Task 6) | After (Task 10) |
| --- | --- | --- |
| Production files | 7 | 10 |
| Total lines | — | 1472 |
| Root exports | 65 | 47 |
| Files over 400 lines | 1 (`validation.ts`) | 0 |
| Functions over 80 lines | 1 (`decodeBoundProposal`) | 0 |
| Type assertions | 0 | 0 |

## Verification results

| Check | Result | Notes |
| --- | --- | --- |
| `corepack pnpm@11.28.5 install --offline` | Pass (`0`) | Linked `@deckagent/presentation-document` into `apps/web` |
| `corepack pnpm@11.28.5 build` | Pass (`0`) | Run outside sandbox after `EPERM` on `tsconfig.tsbuildinfo` inside sandbox |
| `corepack pnpm@11.28.5 check:boundaries` | Pass (`0`) | `0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | Pass (`0`) | `0 warnings and 0 errors` across 248 files |
| `npx biome format` (touched files) | Pass (`0`) | Formatted and verified 12 files in touched paths; repo-wide `format:check` reports CRLF diffs on untouched Windows checkout files |
| Browser bundle Node-free check (`apps/web/lib/browser/boot.js`) | Pass (`0`) | `{"nodeImports":[]}` |
| `node scripts/scan-module-design.mjs --json` | Pass (`0`) | `files: 10`, `lines: 1472`, `filesOver400: 0`, `functionsOver80: 0`, `typeAssertions: 0`, `maxExports: 47` |
| `corepack pnpm@11.28.5 test:tools-browser` | Pass (`0`) | `14` passed, `0` failed, `0` skipped |
| `corepack pnpm@11.28.5 test:brief-foundation` | Pass (`0`) | `15` passed, `0` failed, `0` skipped (run outside sandbox after `EPERM` on attachment upload temp dir) |
| `corepack pnpm@11.28.5 test:outline-workflow` | Pass (`0`) | `6` passed, `0` failed, `0` skipped |
| `corepack pnpm@11.28.5 test:deck-review` | Pass (`0`) | `21` passed, `0` failed, `0` skipped (run outside sandbox after `EBUSY` on temp dir cleanup) |
| `corepack pnpm@11.28.5 test:slide-pipeline` | Pass (`0`) | `7` passed, `0` failed, `0` skipped |

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 10 Plan](../plan/task-10-refactor-host-contracts.md)
