# Task 27: Non-Deck Features Refactor Report

Read this file to review the folded failure and contract files, the narrowed feature barrels, the split `source-tools.ts`, and the renamed attachment and research coordinators [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/features/attachments/attachment-coordinator.ts` (284 lines) — `AttachmentCoordinator` replaces `AttachmentService` and keeps the `AttachmentManagement` interface, the `RequestStore` adapter, and the preparation cancellation map. It owns `AttachmentFailure`, and `attachmentView` is now internal.
- `apps/web/src/features/research/research-coordinator.ts` (186 lines) — `ResearchCoordinator` replaces `ResearchService` and owns `ResearchFailure`. The stored configuration, the credential reference, and the serialized search and image queues are unchanged.

Removed:

- `apps/web/src/features/attachments/attachment-service.ts`
- `apps/web/src/features/attachments/failures.ts`
- `apps/web/src/features/providers/failures.ts`
- `apps/web/src/features/research/research-service.ts`
- `apps/web/src/features/research/failures.ts`
- `apps/web/src/features/sources/failures.ts`
- `apps/web/src/features/chats/contracts.ts`
- `apps/web/src/features/workspaces/contracts.ts`

Modified:

- `apps/web/src/features/attachments/index.ts` — exports `AttachmentFailure`, `AttachmentCoordinator`, and `ManagedAttachments`. `AttachmentUpload` is no longer exported.
- `apps/web/src/features/attachments/managed-attachments.ts` — `recover` binds `match[1]` once to `id` and checks `id` with the file-ID pattern instead of two non-null assertions.
- `apps/web/src/features/providers/provider-settings.ts` (378 lines) — owns `ProviderFailure` and `isProviderProtocol`. `parse` rejects a non-protocol value through the predicate and binds `const protocol = value.protocol` without a type assertion.
- `apps/web/src/features/providers/index.ts` — exports `ProviderFailure`, `ProviderStore`, `protocols`, `ProviderConnection`, and `ProviderStoreOptions`.
- `apps/web/src/features/research/index.ts` — exports `ResearchFailure` and `ResearchCoordinator`.
- `apps/web/src/features/sources/source-tools.ts` (394 lines) — owns `SourceToolFailure`, the new exported `SourceToolOptions` type, `buildDeniedRoots`, `buildSourceManifest`, `buildSourceSchemas`, `loadChatAttachments`, `executeResearchTool`, `loadPreparedAttachment`, `readAttachmentPart`, and `readFileSource`. `execute` validates model arguments with `record` instead of an `as Record<string, unknown>` assertion.
- `apps/web/src/features/sources/index.ts` — exports `SourceToolFailure` and `prepareSourceTools`.
- `apps/web/src/features/chats/index.ts` — `ChatWorkflowErrorCode`, `ChatWorkflowError`, `ChatOperations`, and `createChatOperations` live in this file. `ChatWorkflowErrorDetail` stays internal.
- `apps/web/src/features/workspaces/index.ts` — `WorkspaceWorkflowError`, `WorkspaceOperations`, and `createWorkspaceOperations` live in this file. `WorkspaceWorkflowErrorCode` stays internal.
- `apps/web/src/features/requests/index.ts` — exports `RequestPreparationFailure`, `createRequestRuntime`, and `RequestPreparationFailureCode` only.
- `apps/web/src/features/deck/image-research.ts` — `WebImageResearch` depends on `Pick<ResearchCoordinator, 'imageSearch'>`.
- `apps/web/src/index.ts` — imports and constructs `AttachmentCoordinator` and `ResearchCoordinator`.
- `docs/build/refactor/module-design/plan/README.md` — Task 27 is `Done`.
- `docs/build/refactor/module-design/plan/task-27-refactor-non-deck-features.md` — Steps 1 to 7 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 27 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `attachments/attachment-coordinator.ts` | Chat binding, draft saves, upload admission, attachment preparation and cancellation, previews, and `RequestStore` admission |
| `attachments/managed-attachments.ts` | Managed attachment files, staging recovery, and file removal |
| `providers/provider-settings.ts` | Provider validation, saved metadata, credential references, key checks, and model catalogs |
| `research/research-coordinator.ts` | Research preferences, the key source, serialized search and image calls, and research receipts |
| `sources/source-tools.ts` | Source tool schemas, manifest, context hash, model argument validation, and the four read tools |
| `chats/index.ts` | Chat creation, model selection, listing, search, and draft flags |
| `workspaces/index.ts` | Workspace registry changes, active-request checks, and chat ungrouping |
| `requests/index.ts` | The request runtime surface |

## Design notes and deviations from the plan text

- The plan named seven helpers for `source-tools.ts`. Two more exist so that every function stays under 80 lines and the file stays under 400 lines: `loadChatAttachments` groups the sent and named attachments, and the former inline text branch of `readAttachmentPart` is part of that function instead of a separate `readTextPart`.
- `buildSourceSchemas` also holds the four base schemas, which were the `schemas` constant before the split. Keeping one owner avoids spreading schema data across two declarations and keeps the file under 400 lines.
- `SourceToolOptions` is exported from `source-tools.ts` because `prepareSourceTools` and `buildDeniedRoots` take the same shape, and the build emits declarations. The barrel still exports only `SourceToolFailure` and `prepareSourceTools`.
- `readAttachmentPart` splits a text slice at a UTF-16 surrogate boundary with `const prev = part.text[end - 1]` and a `prev !== undefined` guard. The previous `!` assertion is gone.
- `buildSourceManifest` projects attachments with destructured parameters. The JSON field names and order stay `attachmentId`, `name`, `type`, and `preparation`.

## Behaviour preservation

- Every error class keeps its name, code field, optional detail field, and message behaviour.
- No error code string changed. `SOURCE_ARGUMENTS_INVALID`, `SOURCE_NOT_FOUND`, `SOURCE_UNREADABLE`, `IMAGE_INPUT_UNAVAILABLE`, `STEP_REFUSED`, `TOOL_NOT_ALLOWED`, and the `RESEARCH_*` fallback keep their conditions.
- The tool schemas, the manifest instructions, the context hash inputs, the 16,384-character text slice, and the image byte limit are unchanged.
- `execute` still rejects a foreign session, a missing argument object, an unknown field, a malformed cursor, and an empty path before any read.
- `recover` still deletes an unreferenced attachment file and keeps a retained `bin` or `parsed` file.
- No HTTP status, wire payload, database schema, or provider request changed.

## Metrics

The Step 6 AST sweep reads `scripts/scan-module-design.mjs --json` for `apps/web/src/features/` and counts non-null expressions with the TypeScript API.

| Measure | After Task 27 |
| --- | --- |
| `fileCount` | 29 |
| Files over 400 lines (`over400`) | 0 |
| Functions over 80 lines (`longFn`) | 0 |
| Non-barrel files under 30 lines (`smallNonBarrel`) | `["apps/web/src/features/deck/failures.ts"]` |
| Type assertions (`as`) | 0 |
| Non-null assertions (`!`) | 0 |
| `*Service` declarations | 0 |

The Task 21 baseline counted 3 type assertions, 7 non-null assertions, and 2 `*Service` declarations across the non-deck features and `apps/web/src/` root [[2]](#ref-2). This table covers `apps/web/src/features/` only.

Changed files:

| File | Lines | Functions over 80 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- |
| `attachments/attachment-coordinator.ts` | 284 | 0 | 0 | 0 | 2 |
| `attachments/index.ts` | 2 | 0 | 0 | 0 | 3 |
| `attachments/managed-attachments.ts` | 337 | 0 | 0 | 0 | 1 |
| `chats/index.ts` | 73 | 0 | 0 | 0 | 4 |
| `providers/index.ts` | 2 | 0 | 0 | 0 | 5 |
| `providers/provider-settings.ts` | 378 | 0 | 0 | 0 | 5 |
| `requests/index.ts` | 2 | 0 | 0 | 0 | 3 |
| `research/index.ts` | 1 | 0 | 0 | 0 | 2 |
| `research/research-coordinator.ts` | 186 | 0 | 0 | 0 | 2 |
| `sources/index.ts` | 1 | 0 | 0 | 0 | 2 |
| `sources/source-tools.ts` | 394 | 0 | 0 | 0 | 3 |
| `workspaces/index.ts` | 65 | 0 | 0 | 0 | 3 |

`source-tools.ts` is the longest changed file. Its longest functions are `prepareSourceTools` (65 lines), `readAttachmentPart` (65 lines), and `buildSourceSchemas` (48 lines).

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | `0 warnings and 0 errors` |
| `npx biome format --write apps/web/src/features/ apps/web/src/index.ts` | `0` | `Formatted 30 files`, `Fixed 3 files` on the first run; no change on the final run |
| Step 6 AST sweep on `apps/web/src/features/` | `0` | `over400: 0`, `longFn: 0`, `as: 0`, `nn: 0`, `services: 0`, `smallNonBarrel: [deck/failures.ts]` |
| `corepack pnpm@11.28.5 test:local-foundation` | `0` | `# tests 43`, `# pass 43`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:local-web` | `0` | `# tests 8`, `# pass 8`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:attachments` | `0` | `# tests 29`, `# pass 29`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:source-permissions` | `0` | `# tests 11`, `# pass 11`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:research` | `0` | `# tests 5`, `# pass 5`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:model-requests` | `0` | `# tests 29`, `# pass 29`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |

## What the commands do not prove

- No new test was added. The six suites exercise the existing seams and show that the moved code keeps its behaviour for their fixtures.
- No suite asserts the exact tool manifest text or the schema descriptions. A future edit to those strings needs its own assertion.
- No suite forces the `recover` branch that keeps a retained `bin` or `parsed` file. The guard is checked by reading the code only.
- The AST sweep counts files in `apps/web/src/features/` only. It does not prove that `providers/provider-settings.ts` stays under 400 lines after the next change there.
- `check:docs` verifies structure, purpose lines, and links only. It does not verify that the report numbers match a later rescan.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 27 Plan](../plan/task-27-refactor-non-deck-features.md)
