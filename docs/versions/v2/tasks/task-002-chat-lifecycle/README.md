# TASK-002 — Chat Lifecycle, Request Continuity and Activity Log

**Outcome:** Switch between Chats without cancelling other work; preserve per-Chat draft, waiting approval/question, request status and Activity details.  
**Sequence:** task group 2 of 7. **Dependency:** G-001.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

G-001 PASS and stable `workspaceId`/`sessionId` ownership. Do not change deck-generation semantics.

**Mapped requirements:** UC-006 MF/A1-A8; UC-012 MF; UC-003 MF/A11/A12/A13/A14/A31/A38; FR-014/048/049/053/054/070.

## Shared contract for A/B/C (freeze before coding)

**L1 — Session snapshots:** include `activeRequestId?`, latest persisted request state, `workspaceId?`, and unread/completed indicator where available. No global active-Chat lock.

**L2 — Request lifecycle:** `submit(sessionId, request)`, `reply(requestId, questionId, version)`, `stop(requestId)`, history/activity access and SSE updates remain scoped by Session/Request IDs.

**L3 — UI state:** client subscription belongs to a viewed Chat; switching UI selection does not cancel Host request. Draft input belongs to Chat ID.

**L4 — Recovery:** host restart does not resume interrupted work; persisted active states become `unknown`, not success.

These are **proposed V2 interfaces and semantics**, not declarations that the existing code already exports these names. At group kickoff, A records the final public names in this README and supplies small mock fixtures. B and C start immediately using those fixtures; they do not wait for A's full production implementation. Changes to this contract require an explicit cross-lane review.

### Implemented candidate contracts — 27-10-2026

The owner requested this group after confirming G-001 passed. These additive interfaces implement the planned lifecycle contract inside existing packages.

- Host exports `RequestSummary`: `{requestId,status,sequence,revision?}`. `WebSession.latestRequest?` reports the latest durable request, including completed, failed, cancelled and unknown outcomes. `sequence` is its database admission order.
- `RequestSnapshot.revision?` and `StoredRequest.revision?` increase for running, awaiting, reply and terminal transitions. Restart increments the persisted revision when active work becomes unknown. This revision is separate from the question's own version.
- `StoredActivity.startedAt?/endedAt?` are recorded epoch milliseconds. The client shows elapsed time only when the needed timestamps exist. Interrupted legacy activities receive no invented finish time.
- Existing management/history/activity endpoints and request/SSE routes remain. There is still at most one active request per Chat; different Chats run independently. Disconnecting a view never calls Stop.
- Client loading generations reject obsolete history/activity results. Request revisions reject older state snapshots. Late send/reply receipts update only the originating Chat's draft and state.
- Each question option carries the rendered question ID/version. An option retained from another view cannot answer the current Chat's question.
- Background state refresh updates Chat indicators. Terminal results not yet viewed carry a tab-local unread marker, saved in sessionStorage. This marker is not synchronized across browsers.

Compatibility: the new fields are optional when reading older Hosts or saved records. No database table/schema version, package boundary or model selection format changed. Existing producers, client validators and integration tests were updated together. Older clients can ignore the added fields; they retain their previous navigation behavior.

Executable fixtures: [concurrent lifecycle tests](../../../../../tests/v2-concurrent-chat.test.mjs), the `Chats and Workspaces remain navigable` case in [browser smoke](../../../../../tests/browser-smoke.test.mjs), and response identity validation in [browser client tests](../../../../../tests/browser-runtime.test.mjs). After build, use `pnpm.cmd test:chat-lifecycle`; Chrome coverage remains in `test:browser-smoke`.

See [implementation evidence and manual acceptance](HANDOFF.md). The owner confirmed G-002 passed on 28-10-2026; the exact manual-run SHA and separate artifact were not supplied.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-002-A](TASK-002-A.md) | A — Platform / Host | Per-chat Host lifecycle and durable request projection |
| [TASK-002-B](TASK-002-B.md) | B — Client / UX | Unblocked Chat navigation and activity presentation |
| [TASK-002-C](TASK-002-C.md) | C — Tools / Security / QA | Request lifecycle, Activity and recovery contract tests |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-002 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-002 — Acceptance gate

- Chat X running: switch to Chat Y, send a request in Y, return to X and see correct live/final status and Activities.
- Chat X awaiting a question: switch to Y, return and reply only to X; stale reply cannot answer a different request.
- Browser reload does not cancel an active Host request; Host restart does not claim that interrupted work completed.
- Activity detail open/close does not send a request; failed activity is not automatically a failed request.
- No global navigation block remains, and existing request stop semantics survive.

**Commands:** `pnpm build`, `pnpm test:local-web`, `pnpm test:tools-browser`, `pnpm test:recovery-editing`, `pnpm test:browser-smoke`.

## Risks and non-goals

`boot.ts` currently blocks navigation through `switchingBlocked()`. Keep per-Session subscriptions and do not reuse one pending question for a different Chat. RequestController is already session-aware; avoid a rewrite.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
