# Task 7: Session Persistence Diagnosis Report

Read this file to review the read-only deep-module diagnosis of `packages/session/persistence/` and its seam with `packages/host/api/`, the classified findings, and the owner decisions that Revision 2b uses [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 7 changed no source, test, or convention file. Only the checkboxes of the task file changed during diagnosis. The `node -e` commands of the task were run as scratch scripts because of shell escaping, with identical logic.

| Step | Command | Exit code | Result |
| --- | --- | --- | --- |
| 1 | File, line, and importer measurement over `scripts/scan-module-design.mjs --json` | `0` | `fileCount` 9, `totalLines` 1875, `assertionCount` 4 (all in `requests.ts`). Importers: 35 files of `@deckagent/session-persistence` |
| 2 | Symbol usage of every `session-persistence` root export | `0` | `exportCount` 32, `testOnlyExports` `[]`, 13 exports with zero external importer by name |
| 4 | `git status --short` | `0` | Only the task file was modified |

## Export audit

**`@deckagent/session-persistence` (32 exports: 23 type, 9 runtime)**

- **19 exports with production importers:** `ApprovalView`, `ChatSummary`, `Message`, `ModelSelection`, `AttachmentRecord`, `AttachmentLog` (type-only), `ActivityStatus`, `RequestEvent`, `RequestEventBody`, `RequestRecord`, `RuntimeBinding`, `RequestStatus`, `TerminalStatus`, `SessionError`, `MemoryDraftStore`, `summarizedNotice`, `ApprovalStep`, `RequestStore`, `SqliteSessionStore`.
- **13 exports with zero external importer by name:**
  - **9 types:** `JsonValue`, `ProviderState`, `SessionInfo`, `ToolCall`, `AttachmentPreparation`, `DraftSnapshot`, `SourceRef`, `ActivityRecord`, `ResearchSource`. Most are nested parts of parent types used by callers.
  - **4 leaked internals:** `RequestLog`, `validateEvent`, `draftLimit`, `chatTitle`. `chatTitle` is imported only by the in-package test `packages/session/persistence/tests/chat-persistence.test.mjs` (lines 7 and 93).

## Type assertions in `requests.ts`

| Line | Assertion | Behavior on unexpected data | Proposed boundary guard |
| --- | --- | --- | --- |
| 44 | `value.status as RequestStatus` | `statuses.includes(...)` returns `false`; `validateEvent` throws `REQUEST_EVENT` | `isRequestStatus(unknown)` type predicate |
| 56 | `value.status as ActivityStatus` | `activityStatuses.includes(...)` returns `false`; `validateEvent` throws `REQUEST_EVENT` | `isActivityStatus(unknown)` type predicate |
| 516 | `JSON.parse(String(row.payload)) as ResearchSource` | Malformed JSON throws `SyntaxError` (wrapped as `SESSION_STORAGE`); valid JSON with wrong shape passes unchecked | Validate shape and throw `SESSION_CORRUPT`, matching `event()` (lines 537-546) |
| 562 | `String(row.status) as RequestStatus` | Line 563 throws `SESSION_CORRUPT`, but the cast runs before the guard | Use `isRequestStatus` before constructing `RequestRecord` |

## Contract duplication across the Host seam

| Concept | `session/persistence/src/contracts.ts` | `host/contracts/src/requests.ts` | Notes |
| --- | --- | --- | --- |
| `ModelSelection` | lines 44-47 | lines 3-6 | Identical |
| `RequestStatus`, `ActivityStatus`, `TerminalStatus` | lines 85-87 | lines 67-69 | Identical |
| `RequestEventBody` | lines 90-101 | lines 72-83 | Identical |
| `ApprovalView` | lines 103-110 | lines 57-64 | Identical |
| `RequestEvent` | lines 112-117 | lines 85-90 | Identical |
| `RequestRecord` / `StoredRequest` | lines 135-154 | lines 104-118 | Same fields |
| `ActivityRecord` / `StoredActivity` | lines 157-164 | lines 120-127 | Same fields |

`packages/host/api/src/contracts.ts` (lines 29-39) re-exports the `host-contracts` definitions, while `RequestStore` uses the `session-persistence` definitions. Structural typing keeps them compatible. `host/contracts/` cannot import `session/persistence/` because the Browser imports `host/contracts/` (`docs/conventions/project-structure.md` lines 96, 125, 136).

## Four deep-module answers

1. **Interface width.** Root exports 32 symbols (23 types, 9 values). `SqliteSessionStore` exposes 14 public methods, `.requests` (`RequestLog`, 18 methods + `.approvals` with 5 methods), and `.attachments` (`AttachmentLog`, 9 methods). Callers must distinguish `SqliteSessionStore.bind` (model selection) from `RequestLog.bind` (runtime binding), and `list` from `chats`.
2. **Deletion test.** No file is under 30 lines (smallest is `request-store.ts` at 48 lines). `request-store.ts` protects a real two-adapter seam (`AttachmentService.requestStore()` in `apps/web/src/features/attachments/attachment-service.ts` lines 232-260 and the test fake in `apps/web/tests/browser-runtime.test.mjs` lines 55-94). `draft-store.ts` (56 lines) has 5 callers across `apps/web/` and `e2e/` (ownership tension, see P9). Three separate `Access` interfaces exist in `requests.ts` line 96, `attachments.ts` line 38, and `approvals.ts` line 6.
3. **Locality.**
   - **Scenario A (new `RequestEventBody` variant):** ~4 files: `session/persistence/src/contracts.ts` (lines 90-101), `requests.ts` (`validateEvent` lines 38-89), `host/contracts/src/requests.ts` (lines 72-83), and the `requestEvent` decoder in `host/contracts`. SQLite schema needs no change because `request_events.payload` stores JSON (`schema.ts` lines 30-33).
   - **Scenario B (new persisted column or state transition):** ~6 files: `schema.ts` (DDL lines 21-40, `schemaVersion` line 5, migration lines 110-122, `LIMIT 0` checks lines 133-153), `requests.ts` (`read()` lines 554-578, `admit`/`settle`), `contracts.ts` (lines 135-154), `host/contracts/src/requests.ts` (lines 104-118), and migration tests hardcoding version 7 (`chat-persistence.test.mjs` line 53, `step-approval.test.mjs` line 141), plus `approvals.ts` line 111 if approval states change.
   - **Co-change:** Scanner pairs (`host/api/src/contracts.ts <-> session/persistence/src/index.ts`: 8; `host/api/src/index.ts <-> index.ts`: 7; `host/api/src/request-controller.ts <-> index.ts`: 7; `index.ts <-> schema.ts`: 7) are inferred from code structure: `index.ts` wires `RequestLog` and `AttachmentLog`, `RequestStore` changes cross into `host/api`, and `sessions` schema changes cross into `SqliteSessionStore.info()`.
4. **Action classification and convention fit.** See the finding table. Dependency categories use `.agents/skills/codebase-design/DEEPENING.md`.

## Classified findings and owner decisions

| ID | Location | Signal | Dependency | Proposed action | Decision |
| --- | --- | --- | --- | --- | --- |
| P1 | `packages/session/persistence/src/index.ts` lines 35-37 | `RequestLog`, `validateEvent`, `draftLimit`, `chatTitle` have no production importer | Local-substitutable (`RequestLog`), In-process (others) | Focused refactor (narrow export surface); check `chatTitle` against `Testware` and run `tsc -b` first | Approved for Revision 2b |
| P2 | `packages/session/persistence/src/index.ts` lines 12-39 | 9 types have no external importer by name | In-process | Focused refactor (narrow export surface) after `tsc -b` confirms declaration emit | Approved for Revision 2b |
| P3 | `packages/session/persistence/src/requests.ts` (579 lines) | Mixes 6 responsibilities: event validation, request lifecycle, queries, runtime binding, source reads, and research | Local-substitutable | Focused refactor (split responsibility) | Approved for Revision 2b |
| P4 | `packages/session/persistence/src/requests.ts` lines 44, 56, 562 | Type assertions without narrowing predicates | In-process | Focused refactor (replace type assertion with boundary guard) | Approved for Revision 2b |
| P5 | `packages/session/persistence/src/requests.ts` line 516 | `JSON.parse(...) as ResearchSource` lacks shape validation and wraps `SyntaxError` as `SESSION_STORAGE` | Local-substitutable | Focused refactor (replace type assertion with boundary guard); throw `SESSION_CORRUPT` on invalid rows | Approved for Revision 2b |
| P8 | `packages/session/persistence/src/contracts.ts` lines 44-164 vs `host/contracts/src/requests.ts` | Request vocabulary duplicated across two packages without an ownership or sync rule | In-process | Convention update (`docs/conventions/project-structure.md`, `packages/` rows `host/contracts/` and `session/persistence/`): keep both copies, add a type-level equality check | Approved by owner |
| P9 | `packages/session/persistence/src/draft-store.ts` vs `project-structure.md` line 102 | Volatile in-memory `MemoryDraftStore` sits in the durable-record package; all production callers live in `apps/web/` | In-process | Focused refactor: move `MemoryDraftStore` to `apps/web/` so `session/persistence/` owns only durable records | Approved by owner |
| P10 | `packages/session/persistence/src/request-store.ts` | `RequestStore` seam has production and test adapters | Local-substitutable | No action | Approved |
| P11 | `approvals.ts`, `attachments.ts`, `schema.ts`, `message.ts` | Cohesive modules with no function over 80 lines | In-process | No action | Approved |

## Items sent to the report

- `approvals?` in `RequestStore` forces 3 defensive branches in `packages/host/api/src/request-controller.ts` (lines 150, 155, 323) and mixes distinct authorities (`docs/conventions/code.md` line 45).
- `draftRevision` leaks into `RequestStore.admit` (`request-store.ts` line 39) while `RequestLog.admit` ignores it.
- Error codes (`DRAFT_CONFLICT`, `ATTACHMENT_COUNT_EXCEEDED`, `REQUEST_EMPTY`) are thrown by `apps/web` (`attachment-service.ts` lines 239-254) and matched by string `code` in `request-controller.ts` (lines 94-105, 174-176, 382-383) without a typed contract on `RequestStore`.
- Duplicated helpers: `record()` (`requests.ts` line 33, `message.ts` line 5), attachment ID regex (`message.ts` line 91, `draft-store.ts` line 42), error code regex (`requests.ts` line 30, `attachments.ts` line 167).
- 15 non-null assertions (`index.ts` 8, `schema.ts` 3, `requests.ts` 3, `attachments.ts` 1); `docs/conventions/code.md` line 22 forbids them, while the scanner counts only `as`.
- Vietnamese UI copy inside persistence (`requests.ts` line 356: `Không thực hiện vì bạn đã từ chối: ...`).
- Overloaded names: `bind` (model selection vs runtime binding) and `list` vs `chats`.

## What the commands do not prove

- Static inspection and regex symbol counts work at file level and can understate unused exports; run `tsc -b` before narrowing exports.
- No SQLite runtime tests ran, so this report does not prove behavioral equivalence after a refactor.
- Co-change explanations are inferred from code structure rather than single-commit diffs.
- The `requestEvent` decoder in `host-contracts` and `StoredRequest` mapping in `apps/web` were not read in this task.

## References

1. <a id="ref-1"></a>[Task 7: Diagnose session/persistence module design and host seam](../plan/task-07-diagnose-session-persistence.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
