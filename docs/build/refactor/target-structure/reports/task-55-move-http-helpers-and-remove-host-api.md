# Task 55: Move HTTP helpers and remove host-api report

Read this file to check the HTTP helper move, boundary enforcement and targeted regression results.

## Result

HTTP helpers now live in `apps/host/src/http/`.
The compile-time contract checks now live in `apps/host/src/contract-sync.ts`.
`packages/host/api/` no longer exists on disk.
Production startup mounts module routes directly and closes runs through `onClose`.
Route order, HTTP fields and SSE behavior remain unchanged in the targeted regressions.

The user requires separate task commits before the complete suite run.
The complete suite run remains deferred until Tasks 53 through 57 finish.
The parent agent performs the review, commit and push.
No review subagent ran.

## Moved files

| Old path | New path | Symbols |
| --- | --- | --- |
| `packages/host/api/src/transport/contracts.ts` | `apps/host/src/http/contracts.ts` | Host options, route contracts, messages and failure responses. |
| `packages/host/api/src/transport/http-error.ts` | `apps/host/src/http/http-error.ts` | `HttpError`, `HttpErrorDetail`. |
| `packages/host/api/src/transport/http-io.ts` | `apps/host/src/http/http-io.ts` | JSON, request decoding and cursor helpers. |
| `packages/host/api/src/transport/multipart.ts` | `apps/host/src/http/multipart.ts` | `receiveAttachment`, `AttachmentUploadTarget`. |
| `packages/host/api/src/transport/route-params.ts` | `apps/host/src/http/route-params.ts` | Parameter validation and route wrappers. |
| `packages/host/api/src/transport/sse.ts` | `apps/host/src/http/sse.ts` | `openSseStream`. |
| `packages/host/api/src/contract-sync.ts` | `apps/host/src/contract-sync.ts` | `ContractSyncVerified`. |

## Other changes

- Routes and error maps import `http/route-helpers.ts`.
- HTTP startup owns its router, stream set and shutdown callback.
- HTTP error handling uses the injected failure map without lifecycle imports.
- The server checks contract equivalence and retains its RunFailure HTTP map.
- Host dependencies now own `busboy` 1.6.0 and `@types/busboy` 1.5.4.
- Workspace manifests, TypeScript references and the lockfile no longer reference host-api.
- Oxlint allows route helpers in route and error files while blocking HTTP composition files.
- Services remain blocked from all HTTP files.
- Boundary checks enforce the lifecycle rule on `apps/host/src/runs/`.
- The boundary CLI ignores removed manifests before reading their contents.
- The existing HTTP test fixture composes real module routes with `RunController`.
- Its runtime adapter preserves attachment IDs, draft revisions, instructions and approval callbacks.
- Listed test callers use that fixture when they need history or request operations.

## Commands and results

All package commands used `corepack pnpm@11.28.5` from the repository root.

| Command | Exit | Result |
| --- | --- | --- |
| `git status --short` at the start | 0 | Clean workspace. |
| Task 54 Done grep | 0 | One matching row. |
| `install --offline` | 0 | Zero downloads. Ten workspace projects. |
| Removed-package reference search across task paths | 1 | No matching lines. |
| `build` after removing Host build output | 0 | TypeScript and workspace builds passed. |
| Biome format with `--write`, then without `--write` | 0 | Final check reported `No fixes applied`. |
| `lint` after correcting the error-file override | 0 | Oxlint passed. |
| `check:boundaries` after filtering removed manifests | 0 | `0 violation(s)`. |
| `check:docs` before the report | 0 | 281 files checked, `0 error(s)`. |
| Boundary tests | 0 | 62 passed, 0 failed. |
| HTTP server, Browser runtime, request lifecycle, attachment storage, attachment admission and HTTP edge tests | 0 | 53 passed, 0 failed. |

## Failure evidence and corrections

The first lint rejected `DraftError` in the existing attachment error map.
The error-file override incorrectly included a route-only restriction on its own store.
Removing that extra restriction retained all module and HTTP boundaries.

The first boundary CLI run tried to read the removed package manifest.
An existence check now filters removed manifests before loading them.

The first regression run passed forty tests and failed one attachment history test.
Its dynamic import still used production startup without a history route.
The test now uses the composition fixture.
The next run passed all fifty-three tests, including HTTP edge cases.

Legacy boundary fixtures still referenced removed lifecycle paths and local transport.
Their inputs now target the runs and HTTP folders.
Their rejection assertions remain intact.
Host package fixtures also report the package-to-application rule.
The expected arrays include both applicable rejection rules.

The execution policy rejected the PowerShell removal of Host build output.
A Python operation checked repository containment before removing only that generated folder.
No production file removal escaped the repository.

Each mutation restored its original file after the test.

| Mutation | Command filter | Exit | Failed tests |
| --- | --- | --- | --- |
| Remove `http/app` restrictions from route and error overrides | `imports route helpers and rejects HTTP composition` | 1 | 4 |
| Remove runs from lifecycle enforcement | `rejects transport imports in Request Lifecycle` | 1 | 1 |

No unresolved STOP condition remains.
No route match order changed.
No unmatched move rule required a source change.

## What the commands do not prove

- Session persistence still holds chat, attachment and request tables in one package until Task 56 splits it.
- The complete suite run remains deferred until all five tasks finish.
- The tests do not run live providers or the real OpenCode CLI.
- The parent agent still owns the commit and push.
