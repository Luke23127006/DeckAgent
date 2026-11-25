# Task 34: Browser Transport Refactor Report

Read this file to review the extraction of the internal HTTP/SSE helpers and management decoders, the removal of pass-through exports and assertions, and the verification output for `apps/web/src/browser/transport/` [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/browser/transport/http.ts` (78 lines) — internal `isRecord`, `fetchAuthorized`, `readJsonError`, and `readSseFrames`.
- `apps/web/src/browser/transport/management-decoders.ts` (275 lines) — `decodeSettings`, `decodeSession`, `decodeWorkspaceList`, `decodeResearchSources`, `decodeTheme`, `decodeActivities`, `decodeRequests`, `decodeDraft`, `decodeCatalog`, and `decodePreviewText`.

Removed:

- `apps/web/src/browser/transport/bound-outline-decoder.ts` (1 line) — a pass-through of `decodeBoundProposal`.

Modified:

- `apps/web/src/browser/transport/management-client.ts` (564 → 253 lines) — delegates transport and decoding to the two new modules, drops the unused `draft(id)` and `saveDraft(id, text)` methods, and keeps `ManagementError`, `allowedCodes`, and the public `ManagementClient` signatures.
- `apps/web/src/browser/transport/host-client.ts` (309 → 277 lines) — uses `fetchAuthorized`, `readJsonError` with `includeDetail: true` and `fallback401: true`, and `readSseFrames` with `matchMode: 'line'`. Removes the `decodeAttachment` and `requestEvent` re-export.
- `apps/web/src/browser/transport/deck-client.ts` (183 → 176 lines) — adds `decodeImageCredits` and `decodeStringArray`, removes both `as` assertions, and reads SSE through `readSseFrames` with `matchMode: 'prefix'`.
- `apps/web/src/browser/transport/outline-client.ts` (109 lines) — uses `fetchAuthorized` and `isRecord`, and replaces the `!` assertion on the previous proposal with a bound `previous` check.
- `apps/web/src/browser/transport/brief-client.ts` (119 → 121 lines) — uses `fetchAuthorized` and `isRecord`. Removes the `decodeBriefView` re-export.
- `apps/web/src/browser/transport/confirmation-client.ts` (122 → 124 lines) — uses `fetchAuthorized` and `isRecord`. Removes the `decodeGeneration` re-export.
- `apps/web/src/browser/transport/index.ts` (8 → 7 lines) — exports the ten approved symbols and `imageFailure`.
- `apps/web/tests/fixtures/browser-driver.mjs` — removes `decodeBriefView` and `requestEvent`.
- `apps/web/tests/brief-client.test.mjs` — imports `BriefClient` from the fixture and `decodeBriefView` from `@deckagent/host-contracts`.
- `docs/build/refactor/module-design/plan/README.md` — Task 34 is `Done`.
- `docs/build/refactor/module-design/plan/task-34-refactor-browser-transport.md` — Steps 1 to 6 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 34 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `http.ts` | Fetch defaults for authenticated calls, JSON error code and safe detail extraction, and frame reading for `text/event-stream` |
| `management-decoders.ts` | Shape validation of every management response before the UI reads it |
| `management-client.ts` | HTTP routes, request serialization, and delegation to the shared helpers |
| `host-client.ts`, `deck-client.ts`, `outline-client.ts`, `brief-client.ts`, `confirmation-client.ts` | Their endpoint routes and the response types they return to callers |
| `index.ts` | The ten symbols that the rest of `apps/web` may import |

## Behaviour preservation

- No HTTP route, status mapping, `401` fallback, timeout, or error code string changed.
- `readJsonError` copies `detail` entries only when `includeDetail` is true and a known code matched. This keeps the old rule for `ManagementClient.request` and `HostClient.request`, and keeps `attachmentRequest` without detail.
- `readSseFrames` normalizes `\r\n`, throws `invalidError` when the buffer exceeds the limit, throws `lostError` when the stream ends, and cancels and releases the reader in `finally`.
- `decodeImageCredits` still rejects a license outside the five allowed values and still requires `unknownLicense === (license === 'unknown')`. It now returns typed `ImageCredit` objects with zero assertions.
- `decodeWorkspaceList` binds `folderStatus` once and calls `invalid()` when the value is unknown, which replaces the duplicate `.some(...)` check and the `!` assertion.
- `ManagementClient.draft(id)` and `saveDraft(id, text)` had no callers in `apps/`, `packages/`, `e2e/`, or `tests/`.

## Metrics

The AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| File | Lines | Over 400 | Functions over 80 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `brief-client.ts` | 121 | false | 0 | 0 | 0 | 1 |
| `confirmation-client.ts` | 124 | false | 0 | 0 | 0 | 1 |
| `deck-client.ts` | 176 | false | 0 | 0 | 0 | 1 |
| `host-client.ts` | 277 | false | 0 | 0 | 0 | 3 |
| `http.ts` | 78 | false | 0 | 0 | 0 | 4 |
| `image-review-client.ts` | 27 | false | 0 | 0 | 0 | 1 |
| `index.ts` | 7 | false | 0 | 0 | 0 | 10 |
| `management-client.ts` | 253 | false | 0 | 0 | 0 | 2 |
| `management-decoders.ts` | 275 | false | 0 | 0 | 0 | 10 |
| `outline-client.ts` | 109 | false | 0 | 0 | 0 | 1 |

`bound-outline-decoder.ts` is absent. Every file holds the task line budget: `http.ts` under 120, `management-decoders.ts` under 280, and `management-client.ts` under 260. Comments were kept only for the security invariant that a cancelled read-only stream cannot change a Host-owned outcome, and for the public description of the management and theme methods.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/browser/transport/ apps/web/tests/fixtures/browser-driver.mjs apps/web/tests/brief-client.test.mjs` | `0` | `Formatted 12 files`, 8 of them changed |
| Step 5 AST sweep on `apps/web/src/browser/transport/` | `0` | `over400: false`, `longFn: 0`, `as: 0`, `nn: 0` on every file; `index.ts` has `exports: 10` |
| `corepack pnpm@11.28.5 test:tools-browser` | `0` | `# tests 14`, `# pass 14`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:local-web` | `0` | `# tests 8`, `# pass 8`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:brief-foundation` | `0` | `# tests 15`, `# pass 15`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | `0` | `# tests 6`, `# pass 6`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs` reported `0 error(s)` |

## What the commands do not prove

- No new test was added. The five suites prove the current client behaviour on their fixtures. They do not cover every branch of `readJsonError` and `readSseFrames`, such as the `fallback401` path when an allowed code matched, a `detail` entry that is neither string nor boolean, or a frame buffer that crosses its limit.
- The SSE suites show that normal frames and malformed frames behave as before. They do not prove that the new generator cancels the reader in every exit path.
- `lint` and `check:boundaries` check static rules only. They do not prove that the transport clients keep the same HTTP routes at runtime.
- `check:docs` checks the document structure, the purpose line, and the links. It does not check that this report still matches a later rescan of the folder.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 34 Plan](../plan/task-34-refactor-browser-transport.md)
