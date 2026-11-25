# Task 23: Integrations OpenCode, Images, and Credentials Refactor Report

Read this file to review the `ProviderRunSettings` move, the `opencode/stream-tracker.ts` extraction, the `process.ts` and `mcp-bridge.ts` splits, the `images/` helper extraction, the removed assertions, and the narrowed unused integration exports [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/integrations/opencode/stream-tracker.ts` (219 lines) — `AttemptResult`, `AttemptTimer`, `createAttemptTimer`, `StreamTracker`, `StreamTracking`, `createStreamTracker`. It owns the approval-pausable attempt clock and the FR-079 compaction state machine.

Modified:

- `apps/web/src/integrations/providers/provider-catalog.ts` — added `ProviderRunSettings` after `ProviderEndpoint`.
- `apps/web/src/integrations/providers/index.ts` — exports `ProviderRunSettings` with `ProviderEndpoint`.
- `apps/web/src/features/providers/provider-settings.ts` — imports `ProviderEndpoint` and `ProviderRunSettings` from `integrations/providers/`; the local interface is removed.
- `apps/web/src/features/providers/index.ts` — no longer re-exports `ProviderRunSettings`.
- `apps/web/src/integrations/opencode/contracts.ts`, `config.ts`, `provider.ts`, `runtime.ts` — `ProviderRunSettings` now comes from `../providers/index.ts`.
- `apps/web/src/integrations/opencode/config.ts` — the agent check reads `agent[name]` through the `record` guard instead of an `as` assertion.
- `apps/web/src/integrations/opencode/resources.ts` — local `hasCode` and `record` guards replace two `as` assertions.
- `apps/web/src/integrations/opencode/index.ts` — exports 7 symbols; `OpenCodeErrorCode`, `OpenCodeErrorDetail`, and `RuntimeSessionAccess` are removed.
- `apps/web/src/integrations/opencode/process.ts` — `createLineReader` (46 lines) owns JSON line framing and size caps; `spawnCliProcess` owns the spawn call. The `stdin`, `stdout`, and `stderr` streams are bound and guarded, so no `!` remains.
- `apps/web/src/integrations/opencode/mcp-bridge.ts` — `isAuthorized`, `readJsonBody`, `createToolServer`, and `forwardMcpRequest` are extracted; `openToolBridge` is 55 lines.
- `apps/web/src/integrations/opencode/runtime.ts` — 470 to 294 lines. `execute` binds `resumeSessionId`, `attempt` delegates to `createAttemptTimer` and `createStreamTracker`, and `auditConfiguration` owns the configuration audit.
- `apps/web/src/integrations/images/commons-images.ts` — `extMetadataValue`, `buildSearchUrl`, and `parseCandidatePage` are extracted; `candidates` is 27 lines and holds no `as` assertion.
- `apps/web/src/integrations/images/public-image-reader.ts` — `parsePublicUrl`, `resolvePublicAddress`, `fetchPinnedHttps`, and `readBoundedBody` are extracted; the three `!` assertions are replaced with guards.
- `apps/web/src/integrations/images/image-source.ts` — `match?.[1]` and `match?.[2]` are bound and guarded; the `!` assertion is removed.
- `apps/web/src/integrations/credentials/index.ts` — exports 4 symbols; `UnavailableCredentialStore` is no longer re-exported (the class stays internal to `credential-store.ts`).
- `docs/build/refactor/module-design/plan/README.md` — Task 23 is `Done`.
- `docs/build/refactor/module-design/plan/task-23-refactor-integrations-opencode-images-credentials.md` — Steps 1 to 7 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 23 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `providers/provider-catalog.ts` | Endpoint validation, model listing, and the frozen per-request provider settings |
| `opencode/stream-tracker.ts` | Attempt clock, approval-wait pause and resume, FR-079 summary state, and outcome classification |
| `opencode/process.ts` | CLI spawn, stdio framing, line and output caps, and process-tree termination |
| `opencode/mcp-bridge.ts` | Loopback MCP listener, bearer authorization, request body caps, and tool dispatch |
| `images/commons-images.ts` | Commons search URL, candidate metadata parsing, licence rules, and bounded image reads |
| `images/public-image-reader.ts` | URL parsing, pinned public-address resolution, pinned HTTPS fetch, redirects, and bounded bodies |

## Metrics

`scripts/scan-module-design.mjs --json` and the Step 6 AST sweep report these counts for `apps/web/src/integrations/`, excluding `rendering/`:

| Metric | Before | After |
| --- | --- | --- |
| `files` | 20 | 21 |
| `lines` | 2,253 | 2,416 |
| `filesOver400` | 1 | 0 |
| `functionsOver80` | 8 | 0 |
| `typeAssertions` | 4 | 0 |
| `nonNullTotal` | 10 | 0 |
| `importsFeature` | `true` (4 files) | `false` |

`runtime.ts` falls from 470 to 294 lines and `stream-tracker.ts` is 219 lines. The longest functions are `runProcess` (64 lines), `attempt` (59 lines), `openToolBridge` (55 lines), `fetchPinnedHttps` (52 lines), and `parseCandidatePage` (43 lines). Every function stays under the task limits: 75 lines in `process.ts`, `runtime.ts`, and `stream-tracker.ts`; 70 lines in `mcp-bridge.ts` and `public-image-reader.ts`; 60 lines in `CommonsImages.candidates`. The scanner threshold is 80, so the stricter limits are checked with an AST span measurement; the scan counts 0 functions over 80.

`integrations/providers/index.ts` exports `ProviderRunSettings`, so `integrations/` no longer imports `features/`. `opencode/index.ts` keeps 7 exports: `pinnedVersion`, `OpenCodeError`, `OpenCodeExecutor`, `openToolBridge`, `OpenCodeRuntime`, `findExecutable`, and `OpenCodeOptions`. `credentials/index.ts` keeps 4 exports: `CredentialError`, `ProtectedFileCredentialStore`, `defaultCredentialStore`, and `CredentialStore`.

## Behaviour preservation

- `createAttemptTimer` keeps the exact arithmetic from `runtime.ts`: the timer is armed with `timeoutMs`, an approval wait clears it and subtracts elapsed time with `Math.max(1, ...)`, and resume re-arms with the remaining time.
- `createStreamTracker` keeps every event rule: session binding and mismatch detection, assistant message tracking, summary `waiting` to `writing` transition, `summary-N` activities, the single `summarizedNotice`, identical text frame suppression, duplicate tool status suppression, `deckagent_` tool filtering, and the summary failure codes.
- `classify` keeps the guard order: run abort, timeout, start failure, protocol failure, local abort, recorded failure, exit code 1 after a summary, and the final completion check.
- The audit check keeps `REQUEST_TIMEOUT` versus `STOPPED`, `RUNTIME_UNAVAILABLE`, and `RUNTIME_CONFIG_UNSAFE`, and still runs before any model work.
- `runProcess` keeps the 16 MiB output cap, the 2 MiB line cap, the malformed-line stop, the 3-second kill fallback, stdout collection, and the aborted-signal result. A missing stdio stream now returns `startFailed` instead of dereferencing a null stream.
- Commons licence rules, host allowlists, size caps, image MIME checks, Pexels identity rules, and the pinned public-address checks are unchanged. The content-length check moved before the body read inside `readBoundedBody`.
- The MCP bridge keeps the bearer length plus timing-safe comparison, host check, origin rejection, 405 and 413 responses, 64 KiB body cap, tool allowlist, `REQUEST_CLOSED`, `TOOL_FAILED`, and `TOOL_NOT_ALLOWED`.
- No product behaviour, database schema, wire payload, or error code changed.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | oxlint reported no diagnostics |
| `npx biome format --write apps/web/src/integrations/opencode/ apps/web/src/integrations/images/ apps/web/src/integrations/credentials/ apps/web/src/integrations/providers/ apps/web/src/features/providers/provider-settings.ts apps/web/src/features/providers/index.ts` | `0` | 21 files checked; `No fixes applied` on the final check |
| Step 6 AST sweep on `integrations/` excluding `rendering/` | `0` | `over400: false`, `longFn: 0`, `as: 0`, `nn: 0`, `importsFeature: false` on every file |
| `corepack pnpm@11.28.5 test:model-requests` | `0` | `# tests 29`, `# pass 29`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:source-permissions` | `0` | `# tests 11`, `# pass 11`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:opencode-resources` | `0` | `# tests 3`, `# pass 3`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:images` | `0` | `# tests 39`, `# pass 39`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:research` | `0` | `# tests 5`, `# pass 5`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |

The five suites total 87 tests with `# fail 0` and `# skipped 0`.

## What the commands do not prove

- The approval-wait pause and resume arithmetic, the summary timing, and the process kill fallback are not asserted by a test with a real clock. The suites exercise the runtime only through fake CLIs and HTTP fixtures.
- No live provider, Commons, or public image host is called. TLS pinning, DNS answers, and redirect limits against the real network are not exercised; `test:images` uses local fixtures and the injected lookup.
- No live OpenCode CLI runs; `test:opencode-live` is out of scope, so the pinned CLI's actual event stream is not replayed.
- The 75-line and 220-line limits are not enforced by `scripts/scan-module-design.mjs`, whose thresholds are 400 and 80. The stricter numbers come from one AST span measurement and can drift without a failing check.
- `check:docs` verifies structure, purpose lines, and links only; it does not verify that the report numbers match a later rescan.
- The commands do not prove that no test outside the five suites depends on the removed barrel exports; `test:model-requests`, `test:source-permissions`, `test:opencode-resources`, `test:images`, and `test:research` cover the touched paths.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 23 Plan](../plan/task-23-refactor-integrations-opencode-images-credentials.md)
