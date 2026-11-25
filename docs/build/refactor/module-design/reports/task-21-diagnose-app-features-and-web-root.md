# Task 21: Non-Deck Features and Apps/Web Root Diagnosis Report

Read this file to review the deep-module diagnosis of the seven non-deck `apps/web/src/features/` folders and `apps/web/src/` root, plus the classified finding table for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 21 made no changes to production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`. The inline `node -e` scripts from Steps 1 and 2 ran via `node -` stdin heredocs in PowerShell with identical logic.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count | `0` | `fileCount: 31`, `totalLines: 3258`, `smallNonBarrelCount: 10`, `longFnTotal: 5`, `assertionTotal: 3`, `nonNullTotal: 7`, `serviceTotal: 2` |
| 2 | Barrel export usage audit across 8 entry files (`apps/`, `packages/`, `e2e/`, `tests/`) | `0` | `barrelCount: 8`, `totalBarrelExports: 33`. 5 type exports have 0 prod and 0 test callers |
| 2b | Co-change filter, shared-commit `git log`, exact import scan, and `multipart.ts` read | `0` | 1 co-change pair in scope (`apps/web/src/index.ts` and `apps/web/src/local-transport.ts`, count `3`). `packages/host/api/src/transport/multipart.ts:113-114` coerces non-`HttpError` throws to `400 INVALID_REQUEST` |
| 4 | `git status --short` | `0` | Empty output. Zero changes under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## File metrics summary

| File | Lines | Exports | Functions over 80 lines | `as` | `!` | `*Service` | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/index.ts` | 403 | 5 | `startLocalWeb` (314) | 0 | 0 | 0 | Composition root, storage bootstrap, asset loading, Host wiring, teardown |
| `apps/web/src/features/providers/provider-settings.ts` | 374 | 5 | 0 | 2 | 0 | 0 | Provider metadata persistence, credential lifecycle, connection and catalog checks |
| `apps/web/src/features/sources/source-tools.ts` | 345 | 1 | `prepareSourceTools` (293), `execute` (182) | 1 | 1 | 0 | Host-scoped source access, manifest assembly, attachment pagination, research dispatch |
| `apps/web/src/features/attachments/managed-attachments.ts` | 340 | 2 | 0 | 0 | 2 | 0 | Safe managed attachment byte storage, SHA-256 check, startup orphan recovery |
| `apps/web/src/local-transport.ts` | 301 | 4 | `mapApplicationFailure` (96) | 0 | 0 | 0 | HTTP status mapping for 13 error classes and management payload adapters |
| `apps/web/src/features/attachments/attachment-service.ts` | 275 | 2 | 0 | 0 | 0 | 1 | Cross-store attachment and draft coordinator plus `RequestStore` admission adapter |
| `apps/web/src/ui-assets.ts` | 213 | 8 | 0 | 0 | 0 | 0 | HTML shell, theme bootstrap script, and core CSS stylesheets |
| `apps/web/src/features/research/research-service.ts` | 177 | 1 | 0 | 0 | 0 | 1 | Tavily configuration, credential lifecycle, serialized search/image queues, budget guard |
| `apps/web/src/cli.ts` | 165 | 0 | `main` (100) | 0 | 1 | 0 | CLI flag parsing, fixture loading, signal handling, OS browser launch |
| `apps/web/src/web-state.ts` | 135 | 5 | 0 | 0 | 3 | 0 | `web.sqlite` schema and PRAGMA guard, theme preferences, `lastSelection`, `WebSession` projection |
| `apps/web/src/storage-root.ts` | 81 | 6 | 0 | 0 | 0 | 0 | Application Storage path resolution and directory write probe |
| `apps/web/src/features/requests/prepare-runtime.ts` | 75 | 5 | 0 | 0 | 0 | 0 | Request pre-flight checks (session readability, model selection, OpenCode availability) |
| `apps/web/src/draft-store.ts` | 71 | 4 | 0 | 0 | 0 | 0 | In-memory volatile per-chat draft store (`MemoryDraftStore`, `DraftError`) |
| `apps/web/src/features/chats/index.ts` | 58 | 5 | 0 | 0 | 0 | 0 | Chat creation, model selection, listing, search, and browser projection |
| `apps/web/src/features/workspaces/index.ts` | 53 | 4 | 0 | 0 | 0 | 0 | Workspace registry operations with active-request guards and chat ungrouping |
| `apps/web/src/features/providers/built-in-providers.ts` | 36 | 1 | 0 | 0 | 0 | 0 | Fixed built-in provider template catalog |
| `apps/web/src/sample-slides.ts` | 29 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: static sample slide HTML assets |
| `apps/web/src/features/chats/contracts.ts` | 25 | 4 | 0 | 0 | 0 | 0 | Small non-barrel: `ChatWorkflowError` and `ChatOperations` |
| `apps/web/src/features/workspaces/contracts.ts` | 18 | 3 | 0 | 0 | 0 | 0 | Small non-barrel: `WorkspaceWorkflowError` and `WorkspaceOperations` |
| `apps/web/src/outline-style.ts` | 16 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: CSS string for outline workflow |
| `apps/web/src/features/attachments/failures.ts` | 9 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: `AttachmentFailure` class |
| `apps/web/src/features/providers/failures.ts` | 9 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: `ProviderFailure` class |
| `apps/web/src/features/research/failures.ts` | 9 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: `ResearchFailure` class |
| `apps/web/src/features/sources/failures.ts` | 9 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: `SourceToolFailure` class |
| `apps/web/src/research-style.ts` | 8 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: CSS string for public research dialog and controls |
| `apps/web/src/attachment-style.ts` | 7 | 1 | 0 | 0 | 0 | 0 | Small non-barrel: CSS string for attachment draft and preview |
| `apps/web/src/features/requests/index.ts` | 6 | 5 | 0 | 0 | 0 | 0 | Barrel for `features/requests/` |
| `apps/web/src/features/attachments/index.ts` | 4 | 4 | 0 | 0 | 0 | 0 | Barrel for `features/attachments/` |
| `apps/web/src/features/providers/index.ts` | 3 | 6 | 0 | 0 | 0 | 0 | Barrel for `features/providers/` |
| `apps/web/src/features/research/index.ts` | 2 | 2 | 0 | 0 | 0 | 0 | Barrel for `features/research/` |
| `apps/web/src/features/sources/index.ts` | 2 | 2 | 0 | 0 | 0 | 0 | Barrel for `features/sources/` |

## Export audit (8 entry files, 33 exports)

The table below counts real `import` statements across the workspace. It separates true imports from Step 2 regex matches (such as the plain word `protocols` or same-directory imports from `apps/web/src/cli.ts`).

| Entry file | Export | Kind | Prod importers | Test importers | Audit note |
| --- | --- | --- | --- | --- | --- |
| `features/attachments/index.ts` | `AttachmentFailure` | class | 1 (`local-transport.ts:13`) | 0 | Mapped to HTTP statuses in `local-transport.ts` |
| `features/attachments/index.ts` | `AttachmentService` | class | 1 (`index.ts:39`) | 0 | `*Service` name. Rename to `AttachmentCoordinator` |
| `features/attachments/index.ts` | `ManagedAttachments` | class | 2 (`index.ts:39`, `source-tools.ts:9`) | 2 (`b02-helpers.mjs:10`, `attachment-storage.test.mjs:8`) | Core attachment storage seam |
| `features/attachments/index.ts` | `AttachmentUpload` | type | 0 | 0 | Unused barrel export |
| `features/chats/index.ts` | `ChatWorkflowError` | class | 1 (`local-transport.ts:14`) | 0 | Mapped in `local-transport.ts` |
| `features/chats/index.ts` | `ChatOperations` | type | 1 (`local-transport.ts:15`) | 0 | Contract for `chatManagement` |
| `features/chats/index.ts` | `ChatWorkflowErrorCode` | type | 1 (`local-transport.ts:15`) | 0 | Exhaustive status map key in `local-transport.ts:40` |
| `features/chats/index.ts` | `ChatWorkflowErrorDetail` | type | 0 | 0 | Unused barrel export |
| `features/chats/index.ts` | `createChatOperations` | function | 1 (`index.ts:25`) | 0 | Wired in `startLocalWeb` |
| `features/providers/index.ts` | `ProviderFailure` | class | 1 (`local-transport.ts:17`) | 0 | Mapped in `local-transport.ts` |
| `features/providers/index.ts` | `ProviderStore` | class | 2 (`index.ts:28`, `prepare-runtime.ts:5`) | 0 | Provider settings owner |
| `features/providers/index.ts` | `protocols` | const | 1 (`cli.ts:7`) | 0 | Valid protocol list shared by CLI and `ProviderStore` |
| `features/providers/index.ts` | `ProviderConnection` | type | 1 (`index.ts:29,59`) | 0 | Re-exported by `apps/web/src/index.ts` for `cli.ts` and callers |
| `features/providers/index.ts` | `ProviderRunSettings` | type | 4 (`integrations/opencode/{config,contracts,provider,runtime}.ts`) | 0 | Frozen per-request provider settings |
| `features/providers/index.ts` | `ProviderStoreOptions` | type | 1 (`index.ts:29`) | 0 | Used in `LocalWebOptions['providerAccess']` |
| `features/requests/index.ts` | `RequestPreparationFailure` | class | 1 (`local-transport.ts:18`) | 0 | Also duck-typed by name string in `confirmation-service.ts:127` |
| `features/requests/index.ts` | `createRequestRuntime` | function | 1 (`index.ts:30`) | 0 | Wired in `startLocalWeb` |
| `features/requests/index.ts` | `RequestPreparationFailureCode` | type | 1 (`local-transport.ts:19`) | 0 | Exhaustive status map key in `local-transport.ts:67` |
| `features/requests/index.ts` | `RequestPreparationFailureDetail` | type | 0 | 0 | Unused barrel export |
| `features/requests/index.ts` | `RuntimePreparationDependencies` | type | 0 | 0 | Unused barrel export |
| `features/research/index.ts` | `ResearchFailure` | class | 3 (`local-transport.ts:20`, `source-tools.ts:10`, `deck/image-research.ts:13`) | 0 | Mapped in `local-transport.ts` and caught in tool/image seams |
| `features/research/index.ts` | `ResearchService` | class | 3 (`index.ts:42`, `source-tools.ts:11`, `deck/image-research.ts:14`) | 0 | `*Service` name. Rename to `ResearchCoordinator` |
| `features/sources/index.ts` | `SourceToolFailure` | class | 1 (`local-transport.ts:21`) | 0 | Mapped in `local-transport.ts` |
| `features/sources/index.ts` | `prepareSourceTools` | function | 1 (`index.ts:40`) | 0 | Wired as `startHost({ requests: { prepareTools } })` |
| `features/workspaces/index.ts` | `WorkspaceWorkflowError` | class | 1 (`local-transport.ts:22`) | 0 | Mapped in `local-transport.ts` |
| `features/workspaces/index.ts` | `WorkspaceOperations` | type | 1 (`local-transport.ts:23`) | 0 | Contract for `workspaceManagement` |
| `features/workspaces/index.ts` | `WorkspaceWorkflowErrorCode` | type | 0 | 0 | Unused barrel export |
| `features/workspaces/index.ts` | `createWorkspaceOperations` | function | 1 (`index.ts:26`) | 0 | Wired in `startLocalWeb` |
| `apps/web/src/index.ts` | `StorageError` | class | 1 (`cli.ts:5`) | 2 (`local-foundation.test.mjs:8`, `local-web.test.mjs:6`) | Public package error class |
| `apps/web/src/index.ts` | `resolveStorageRoot` | function | 1 (`cli.ts:5`) | 1 (`local-foundation.test.mjs:8`) | Public package storage path helper |
| `apps/web/src/index.ts` | `ProviderConnection` | type | 1 (`cli.ts:6`) | 0 | Public option type for `LocalWebOptions['connections']` |
| `apps/web/src/index.ts` | `LocalWebOptions` | type | 1 (`cli.ts:6`) | 0 | Public option type for `startLocalWeb` |
| `apps/web/src/index.ts` | `startLocalWeb` | function | 1 (`cli.ts:5`) | 14 (`apps/web/tests/` and `e2e/`) | Primary package entry point |

Note: `apps/web/src/features/attachments/attachment-service.ts:10` also exports `attachmentView`, which is not re-exported by `attachments/index.ts` and has 0 external importers.

## Deletion-test table (10 small non-barrel files)

| File | Lines | Sole consumer(s) | Deletion or fold effect | Verdict |
| --- | --- | --- | --- | --- |
| `apps/web/src/attachment-style.ts` | 7 | `apps/web/src/index.ts:41,260` | Fold into `apps/web/src/ui-assets.ts`. Removes 1 root file and 1 import in `index.ts` | Fold into `ui-assets.ts` |
| `apps/web/src/research-style.ts` | 8 | `apps/web/src/index.ts:44,261` | Fold into `apps/web/src/ui-assets.ts`. Removes 1 root file and 1 import in `index.ts` | Fold into `ui-assets.ts` |
| `apps/web/src/outline-style.ts` | 16 | `apps/web/src/index.ts:37,254` | Fold into `apps/web/src/ui-assets.ts`. Removes 1 root file and 1 import in `index.ts` | Fold into `ui-assets.ts` |
| `apps/web/src/sample-slides.ts` | 29 | `apps/web/src/index.ts:36,241` | Fold into `apps/web/src/ui-assets.ts` (total ~273 lines). Removes 1 root file and 1 import in `index.ts` | Fold into `ui-assets.ts` |
| `apps/web/src/features/attachments/failures.ts` | 9 | `attachment-service.ts:7`, `attachments/index.ts:1` | Fold `AttachmentFailure` into `attachment-service.ts` (`managed-attachments.ts` throws `SessionError`). Zero external caller impact | Fold into `attachment-service.ts` |
| `apps/web/src/features/providers/failures.ts` | 9 | `provider-settings.ts:4`, `providers/index.ts:1` | Fold `ProviderFailure` into `provider-settings.ts`. Zero external caller impact | Fold into `provider-settings.ts` |
| `apps/web/src/features/research/failures.ts` | 9 | `research-service.ts:8`, `research/index.ts:1` | Fold `ResearchFailure` into `research-service.ts`. Zero external caller impact | Fold into `research-service.ts` |
| `apps/web/src/features/sources/failures.ts` | 9 | `source-tools.ts:12`, `sources/index.ts:1` | Fold `SourceToolFailure` into `source-tools.ts`. Zero external caller impact | Fold into `source-tools.ts` |
| `apps/web/src/features/chats/contracts.ts` | 25 | `chats/index.ts:7-8,10-11` | Fold into `chats/index.ts` (~80 lines total) and drop unused `ChatWorkflowErrorDetail`. Zero external caller impact | Fold into `chats/index.ts` |
| `apps/web/src/features/workspaces/contracts.ts` | 18 | `workspaces/index.ts:4-5,7-8` | Fold into `workspaces/index.ts` (~68 lines total) and drop unused `WorkspaceWorkflowErrorCode`. Zero external caller impact | Fold into `workspaces/index.ts` |

## Type assertions, non-null assertions, and `*Service` symbols

### Type assertions (3)

| # | Location | Expression | Proposed replacement |
| --- | --- | --- | --- |
| 1 | `apps/web/src/features/providers/provider-settings.ts:80` | `value.protocol as ProviderProtocol` | Add `function isProviderProtocol(value: unknown): value is ProviderProtocol` using `protocols.some(item => item === value)` and call it in the `if` guard |
| 2 | `apps/web/src/features/providers/provider-settings.ts:91` | `value.protocol as ProviderProtocol` | Reuse `isProviderProtocol(value.protocol)` from guard #1 so `const protocol: ProviderProtocol` narrows without a cast |
| 3 | `apps/web/src/features/sources/source-tools.ts:165` | `args as Record<string, unknown>` | Use `record(args)` type predicate (same check already on line 164) so `args` narrows to `Record<string, unknown>` without a cast |

### Non-null assertions (7)

| # | Location | Expression | Proposed guard |
| --- | --- | --- | --- |
| 1 | `apps/web/src/cli.ts:49` | `protocols.find(protocol => protocol === value.protocol)!` | Bind `const protocol = protocols.find(item => item === value.protocol)` before the `if` check at line 16, check `!protocol`, and return `protocol` |
| 2 | `apps/web/src/features/attachments/managed-attachments.ts:332` | `fileId.test(match[1]!)` | Bind `const id = match?.[1]` before the `if`, then check `id && fileId.test(id)` |
| 3 | `apps/web/src/features/attachments/managed-attachments.ts:333` | `!retained.has(match[1]!)` | Reuse `id` from guard #2 (`!retained.has(id)`) |
| 4 | `apps/web/src/features/sources/source-tools.ts:300` | `/[\uD800-\uDBFF]/.test(part.text[end - 1]!)` | Bind `const prev = part.text[end - 1]` and check `end < part.text.length && prev !== undefined && /[\uD800-\uDBFF]/.test(prev)` |
| 5 | `apps/web/src/web-state.ts:45` | `this.db.prepare('PRAGMA application_id').get()!.application_id` | Bind `const ownerRow = this.db.prepare('PRAGMA application_id').get()` and throw `new WebStateError('SETTINGS_SCHEMA')` if `!ownerRow`, then read `Number(ownerRow.application_id)` |
| 6 | `apps/web/src/web-state.ts:46` | `this.db.prepare('PRAGMA user_version').get()!.user_version` | Bind `const versionRow = this.db.prepare('PRAGMA user_version').get()` and throw `new WebStateError('SETTINGS_SCHEMA')` if `!versionRow`, then read `Number(versionRow.user_version)` |
| 7 | `apps/web/src/web-state.ts:61` | `this.db.prepare('PRAGMA quick_check').get()!.quick_check` | Read `this.db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok'` directly (no `!` needed) |

### `*Service` symbols (2)

| # | Location | Current name | Assessment | Proposed concrete name |
| --- | --- | --- | --- | --- |
| 1 | `apps/web/src/features/attachments/attachment-service.ts:56` | `AttachmentService` | Coordinates `SqliteSessionStore`, `MemoryDraftStore`, `ManagedAttachments`, `AttachmentParser`, per-attachment preparation cancellation, and the `RequestStore` admission adapter. Not a thin wrapper | `AttachmentCoordinator` |
| 2 | `apps/web/src/features/research/research-service.ts:18` | `ResearchService` | Coordinates `web.sqlite` research preferences, `CredentialStore`, `SqliteSessionStore.requests` budget and recording, and serialized `TavilyClient` search and image queues. Not a thin wrapper | `ResearchCoordinator` |

## Deep-module diagnosis

### 1. Interface width

The 8 entry files in scope expose **33** barrel exports (`4` attachments, `5` chats, `6` providers, `5` requests, `2` research, `2` sources, `4` workspaces, `5` web root). Five of those 33 exports have **0** production callers and **0** test callers (`AttachmentUpload`, `ChatWorkflowErrorDetail`, `RequestPreparationFailureDetail`, `RuntimePreparationDependencies`, `WorkspaceWorkflowErrorCode`). One non-barrel helper (`attachmentView` in `attachment-service.ts:10`) carries an unused `export` keyword.

`apps/web/src/local-transport.ts` maps **13 distinct error classes** in `mapApplicationFailure` (`lines 145-240`): `WorkspaceWorkflowError`, `WorkspaceError`, `ChatWorkflowError`, `SessionError`, `ProviderFailure`, `RequestPreparationFailure`, `ResearchFailure`, `AttachmentFailure`, `SourceToolFailure`, `DeckError`, `DeckWorkflowFailure`, `DraftError`, and `WebStateError`. Five feature failure classes use untyped `code: string` (`ProviderFailure`, `ResearchFailure`, `AttachmentFailure`, `SourceToolFailure`, `DeckWorkflowFailure`). By contrast, `ChatWorkflowError`, `WorkspaceWorkflowError`, and `RequestPreparationFailure` use typed string literal unions.

`apps/web/src/index.ts` (`startLocalWeb`, lines 90-403) imports 9 separate CSS exports across 5 files (`ui-assets.ts`, `outline-style.ts`, `attachment-style.ts`, `research-style.ts`, `sample-slides.ts`). It also defines an inline `preparedImage` attachment bridge (`lines 123-144`) over a late-bound mutable variable (`artifactAttachments`, line 236). In addition, it throws `HttpError(404, 'SESSION_NOT_FOUND')` inline for three management endpoints (`lines 318-336`). It constructs `defaultCredentialStore(layout.root)` twice (`lines 173, 223`) and `new GenerationWorkflow(runtime, store)` twice (`lines 282, 296`). Finally, it repeats a 6-level nested `try/finally` close chain (`lines 350-378` and `380-401`).

### 2. Deletion test

- **All 10 small non-barrel files under 30 lines:** Every standalone file fails the deletion test. Folding the 4 root asset files into `ui-assets.ts` removes 4 files with zero external caller impact. Folding the 4 single-caller `failures.ts` files into their sibling feature modules and the 2 `contracts.ts` files into `chats/index.ts` and `workspaces/index.ts` removes 6 more files with zero external caller impact. By contrast, three sibling files (`brief-service.ts`, `confirmation-service.ts`, `deck-workflow.ts`) import `features/deck/failures.ts` (12 lines, Task 20 `FD8`), so keeping `deck/failures.ts` prevents an import cycle.
- **`toAttachmentHttpError` and `attachmentManagement` in `local-transport.ts:277-301`:** Inspection of `packages/host/api/src/transport/multipart.ts:110-114` shows why `toAttachmentHttpError` exists. `receiveAttachment` catches every non-`HttpError` thrown by `attachments.upload` and replaces it with `new HttpError(400, 'INVALID_REQUEST')`. Removing `toAttachmentHttpError` from `upload` today breaks 404/409/413/422 upload status codes unless `multipart.ts` forwards mapped errors. However, `get`, `remove`, and `preview` (`packages/host/api/src/transport/session-routes.ts:57-77`) bypass `multipart.ts` and reach `error-response.ts:36`, which already calls `mapApplicationFailure` (`local-transport.ts:197-203`). Wrapping `get`, `remove`, and `preview` in `toAttachmentHttpError` is redundant.
- **Thin forwarding layers across `chats/`, `workspaces/`, `requests/`, and root:**
  - `chats/index.ts` (58 lines) is **not** a thin wrapper. It enforces `FR-053` last-selection fallback, selectability checks, `hasSlides` and `hasDraft` projection, and search filtering across 5 owners (`sessions`, `registry`, `web`, `decks`, `drafts`).
  - `workspaces/index.ts` (53 lines) is **not** a thin wrapper. It enforces `UC-013 A5` active-request refusal before `relink` and `remove`, plus chat ungrouping. Removing either feature dumps workflow rules back into `index.ts`.
  - `requests/prepare-runtime.ts` (75 lines) is **not** a thin wrapper. It owns `FR-046` model-selection refusal reasons (`no-provider`, `no-model`, `model-removed`, `no-selection`), session readability checks, and OpenCode availability translation.
  - `chatManagement` (`local-transport.ts:257-275`) and `workspaceManagement` (`local-transport.ts:242-255`) earn their keep as HTTP body-validation adapters before typed feature operations.

### 3. Locality

- **Scenario A (add one new application failure code to a feature and map it to an HTTP status in local transport):**
  - **2 files** change for single-file features (`provider-settings.ts`, `research-service.ts`, `source-tools.ts`, `attachment-service.ts`, `prepare-runtime.ts`). You update the feature file and the status map in `apps/web/src/local-transport.ts:40-113`.
  - **3 files** currently change for `chats/` and `workspaces/` because error codes live in separate `contracts.ts` files (`features/chats/contracts.ts:3-7`, `features/chats/index.ts`, and `local-transport.ts:40-45`). Folding `contracts.ts` into `index.ts` (`FA3`) reduces this to 2 files.
  - For untyped `code: string` failure classes (`ProviderFailure`, `ResearchFailure`, `AttachmentFailure`, `SourceToolFailure`), TypeScript does not flag a missing entry in `local-transport.ts` and falls back to HTTP `500`.
- **Scenario B (add one new local SQLite store or background resource that opens during `startLocalWeb` and closes cleanly on startup failure or shutdown):**
  - **1 file** changes (`apps/web/src/index.ts`), across **4 scattered regions** inside the 314-line `startLocalWeb` function: nullable `let` declaration (`lines 94-101`), open block (`lines 103-170`), normal shutdown `try/finally` chain (`lines 350-378`), and startup-failure `catch` `try/finally` chain (`lines 380-401`). Because `startLocalWeb` duplicates the 6-level close chain, forgetting either branch leaks a file handle on Windows.
  - Note on co-change: `apps/web/src/index.ts` and `apps/web/src/local-transport.ts` co-changed **3 times** in the scanner window (`606124e`, `7474159`, `665f6e4`, plus 2 bulk commits over 20 files skipped by the scanner: `869fe72` and `6ab3e98`). When a feature workflow or error owner moves, `index.ts` (wiring) and `local-transport.ts` (error mapping and management adapters) change together.

### 4. Action classification and convention fit

Dependency categories follow `.agents/skills/codebase-design/DEEPENING.md` [[3]](#ref-3).

Checked `docs/conventions/project-structure.md` (`### apps/web/` lines 78-89, `### Runtime` lines 121-130, `### Package và feature` lines 132-145) and `docs/conventions/code.md` (`## Naming` line 15, `## TypeScript` line 22, `### Biểu diễn` lines 84-96, `## Pattern không bắt buộc` lines 112-114). **Task 21 needs no convention update:**
- `docs/conventions/code.md` (`### Biểu diễn`, line 96) states that custom error classes are optional and forbids a shared Error Service. Folding the 4 single-caller `failures.ts` files into their sibling feature modules obeys this rule without changing any convention.
- `docs/conventions/project-structure.md` (`### apps/web/`, line 87) states that `src/index.ts` owns startup, shutdown, and wiring, not HTTP error handling (`HttpError(404)` inline checks at `index.ts:318-336` break this boundary).
- `docs/conventions/code.md` (`## Naming`, line 15) forbids generic `*Service` names (`AttachmentService`, `ResearchService`), and (`## TypeScript`, line 22) forbids `as` and `!` assertions.
- `docs/conventions/project-structure.md` (`### Package và feature`, line 139) states that features expose public operations only when an external consumer exists (supporting removal of the 5 unused type exports).

## Classified findings and owner decisions

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| FA1 | `apps/web/src/attachment-style.ts:1-7`, `research-style.ts:1-8`, `outline-style.ts:1-16`, `sample-slides.ts:1-29` | 4 non-barrel files under 30 lines (60 lines total) imported only by `index.ts` | In-process | `focused refactor (merge or remove)`: fold all 4 files into `apps/web/src/ui-assets.ts` (~273 lines) and expose a combined stylesheet/asset helper | Update imports in `apps/web/src/index.ts:14-23,36-37,41,44,240-263`. Zero external package caller impact | Approved for Revision 4b |
| FA2 | `apps/web/src/features/attachments/failures.ts:1-9`, `providers/failures.ts:1-9`, `research/failures.ts:1-9`, `sources/failures.ts:1-9` | 4 non-barrel files under 30 lines (9 lines each), each imported by only 1 sibling file and its barrel | In-process | `focused refactor (merge or remove)`: fold each failure class into its sibling feature file (`attachment-service.ts`, `provider-settings.ts`, `research-service.ts`, `source-tools.ts`) and keep re-exporting from each feature `index.ts` | Internal feature imports only. Zero external caller impact | Approved for Revision 4b |
| FA3 | `apps/web/src/features/chats/contracts.ts:1-25`, `apps/web/src/features/workspaces/contracts.ts:1-18` | 2 non-barrel files under 30 lines imported only by their sibling `index.ts` (58 and 53 lines) | In-process | `focused refactor (merge or remove)`: fold each `contracts.ts` into its sibling `index.ts` (~80 and ~68 lines total) | Zero external caller impact | Approved for Revision 4b |
| FA4 | `apps/web/src/features/attachments/index.ts:4`, `chats/index.ts:11`, `requests/index.ts:4-5`, `workspaces/index.ts:8`, `attachment-service.ts:10` | 5 unused barrel type exports (`AttachmentUpload`, `ChatWorkflowErrorDetail`, `RequestPreparationFailureDetail`, `RuntimePreparationDependencies`, `WorkspaceWorkflowErrorCode`) and 1 unused internal `export` (`attachmentView`) | In-process | `focused refactor (split responsibility or narrow export surface)`: remove the 5 unused barrel exports and drop `export` on `attachmentView` | Zero caller impact | Approved for Revision 4b |
| FA5 | `apps/web/src/index.ts:90-403` | File over 400 lines (403) and `startLocalWeb` (314 lines) mixing storage bootstrap, inline `preparedImage` bridge (`123-144`), asset loading (`240-271`), inline `HttpError(404)` checks (`318-336`), duplicate `defaultCredentialStore`/`GenerationWorkflow` instances (`173,223,282,296`), and duplicated close chains (`350-401`) | Local-substitutable (`WorkspaceRegistry`, `SqliteSessionStore`, `DeckStore`, `WebState`, `ManagedAttachments`) + In-process | `focused refactor (split responsibility or narrow export surface)`: extract `closeResources` teardown, static asset loader, and `preparedImage` adapter. Move `SESSION_NOT_FOUND` checks out of `index.ts`. Reuse single `credentials` and `generationWorkflow` instances. Keep `index.ts` under 400 lines and `startLocalWeb` under 80 lines | Zero external caller impact (`startLocalWeb` signature and exports unchanged) | Approved for Revision 4b |
| FA6 | `apps/web/src/local-transport.ts:145-240,277-301` | Function over 80 lines (`mapApplicationFailure`, 96 lines) and redundant `toAttachmentHttpError` wrapping on `get`/`remove`/`preview` (`296-299`). Only `upload` needs it because of `multipart.ts:113-114` | In-process | `focused refactor (split responsibility or narrow export surface)` + `focused refactor (merge or remove)`: table-drive `{ code, detail }` failure lookup in `mapApplicationFailure` (under 80 lines, same file) and remove redundant `toAttachmentHttpError` wrapping from `get`, `remove`, and `preview` | Zero external caller impact (`attachmentManagement` and `mapApplicationFailure` signatures unchanged) | Approved for Revision 4b |
| FA7 | `apps/web/src/features/sources/source-tools.ts:53-345,162-343` | 2 functions over 80 lines (`prepareSourceTools` 293 lines, nested `execute` 182 lines) mixing denied-root setup, manifest assembly, 94-line attachment cursor pagination (`226-319`), and 6-tool dispatch | Local-substitutable (`SqliteSessionStore`, `WorkspaceRegistry`, `ManagedAttachments`, `createSourceAccess`) + In-process | `focused refactor (split responsibility or narrow export surface)`: extract internal helpers (`buildSourceManifest`, `readAttachmentPart`, `executeResearchTool`) so all functions stay under 80 lines | Zero external caller impact (`prepareSourceTools` signature unchanged) | Approved for Revision 4b |
| FA8 | `apps/web/src/cli.ts:54-153` | 1 function over 80 lines (`main`, 100 lines) mixing CLI arg parsing, models config loading, `--confirmed-deck` fixture loading, signal handling, and OS browser launch | Local-substitutable (filesystem, child process) + In-process | `focused refactor (split responsibility or narrow export surface)`: extract `loadConnections`, `loadConfirmedDecks`, and `openBrowser` helpers inside `cli.ts` so `main` stays under 80 lines | Zero caller impact | Approved for Revision 4b |
| FA9 | `apps/web/src/features/attachments/attachment-service.ts:56`, `apps/web/src/features/research/research-service.ts:18` | 2 `*Service` declarations (`AttachmentService`, `ResearchService`) owning real cross-store orchestration | Local-substitutable (`SqliteSessionStore`, `ManagedAttachments`, `CredentialStore`, `WebState`) + True external (`TavilyClient`) | `focused refactor (rename service or add boundary guard)`: rename `AttachmentService` to `AttachmentCoordinator` and `ResearchService` to `ResearchCoordinator` | Update imports in `apps/web/src/index.ts:39,42,221,237`, `features/sources/source-tools.ts:11`, and `features/deck/image-research.ts:14` | Approved for Revision 4b |
| FA10 | `provider-settings.ts:80,91`, `source-tools.ts:165` (3 `as`). `cli.ts:49`, `managed-attachments.ts:332-333`, `source-tools.ts:300`, `web-state.ts:45,46,61` (7 `!`) | 3 non-`as const` type assertions and 7 non-null assertions forbidden by `docs/conventions/code.md` line 22 | In-process (7) + Local-substitutable (`DatabaseSync`, filesystem, 3) | `focused refactor (rename service or add boundary guard)`: replace with `isProviderProtocol`, `record()` guard, bound locals (`protocol`, `id`, `prev`), and checked PRAGMA row reads | Zero caller impact | Approved for Revision 4b |
| FA11 | `storage-root.ts:1-81`, `draft-store.ts:1-71`, `built-in-providers.ts:1-36`, `prepare-runtime.ts:1-75` | Clean focused modules (36-81 lines, 0 long functions, 0 assertions, 0 `*Service`) protecting real startup, volatile-draft, built-in catalog, and admission boundaries | Local-substitutable + In-process | `no action`: each file protects a real invariant and moving it raises caller complexity | None | Approved |

## Items sent to the report

- **Untyped `code: string` on four feature failure classes (`AttachmentFailure`, `ProviderFailure`, `ResearchFailure`, `SourceToolFailure`):** Alongside `DeckWorkflowFailure` (noted in Task 20), these four classes accept arbitrary strings. When a developer misses or renames a code, `local-transport.ts` falls back to HTTP `500` without a compile-time check. Narrowing each `code` to a string literal union (matching `ChatWorkflowErrorCode` and `RequestPreparationFailureCode`) is optional hygiene for Revision 4b.
- **Cross-package seam in `packages/host/api/src/transport/multipart.ts:113-114`:** `receiveAttachment` swallows any non-`HttpError` into `400 INVALID_REQUEST`. That behavior is the sole reason `attachmentManagement` in `apps/web/src/local-transport.ts:277-301` exists. If a later change updates `multipart.ts` to forward mapped errors (out of Slice 2C scope because `packages/host/api/` belongs to Slice 2A), `attachmentManagement` and `toAttachmentHttpError` can be removed completely.
- **Duplicated `record()` type guard:** Identical `record(value: unknown): value is Record<string, unknown>` helpers exist in `web-state.ts:13`, `provider-settings.ts:64`, and `cli.ts:10` (as `object()`). `research-service.ts:7` and `local-transport.ts:24` already import `record` from `web-state.ts`.
- **Forward reference to `catalog` inside `WebState` callback (`apps/web/src/index.ts:150,171`):** `new WebState(..., value => catalog.selectable(value))` closes over `const catalog` declared 21 lines later. It works at runtime only because `WebState`'s constructor does not call `isSelectable`, so extracting storage bootstrap in `FA5` should keep that initialization order explicit.
- **`RequestPreparationFailure` duck-typing in `features/deck/confirmation-service.ts:127`:** `features/requests/index.ts:1` already exports `RequestPreparationFailure`, so `confirmation-service.ts` can check `error instanceof RequestPreparationFailure` instead of `error.name === 'RequestPreparationFailure'` during Revision 4b.

## What the commands do not prove

- Static AST inspection and symbol counts do not run `tsc -b`, local-web, attachment, research, or provider suites (`draft-store.test.mjs`, `research.test.mjs`, `web-management.test.mjs`, `web-session.test.mjs`, `attachment-admission.test.mjs`, `local-foundation.test.mjs`, `source-requests.test.mjs`).
- They do not prove behavioral parity, multipart error propagation, or clean Windows SQLite handle teardown after a refactor. Run `tsc -b`, `check:boundaries`, `lint`, and the full non-live test suites during Revision 4b.

## References

1. <a id="ref-1"></a>[Task 21: Diagnose non-deck features and apps/web/src root](../plan/task-21-diagnose-app-features-and-web-root.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
