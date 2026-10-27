# TASK-004 — Per-Chat Permission Policy and Step Approval

**Outcome:** Enforce the two approved presets and user approvals at tool execution, with durable per-Chat grants and no original-file writes.  
**Sequence:** task group 4 of 7. **Dependency:** G-003.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

G-003 PASS; per-Chat work/source roots and per-Chat request state exist.

**Mapped requirements:** UC-014 MF/A1/A2/A3; UC-003 A45; FR-075/076/077; BR-009; NFR-003/004/006/007.

## Shared contract for A/B/C (freeze before coding)

**P1 — Permission:** `{sessionId, preset: 'workspace-access'|'provided-materials-only', grants: Grant[]}`. Grant includes a normalized file/folder target, action `read`/allowed write target, explicit scope, creation time and revocation state; no grant may access another Chat's data or original project files.

**P2 — Policy:** `authorize(action, target, requestSnapshot)` returns `allow | deny | approval-required`, before any file/network operation. Prompt instructions never authorize.

**P3 — Approval:** durable `approvalId`, `requestId`, `sessionId`, action/target/reason and version. Answers: deny, allow once, allow this named scope for this Chat. No implicit approval from missing response.

**P4 — Execution:** an active request waits on approval and cannot continue past the blocked step; snapshot permission remains stable for that request.

These are **proposed V2 interfaces and semantics**, not declarations that the existing code already exports these names. At group kickoff, A records the final public names in this README and supplies small mock fixtures. B and C start immediately using those fixtures; they do not wait for A's full production implementation. Changes to this contract require an explicit cross-lane review.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-004-A](TASK-004-A.md) | A — Platform / Host | Permission domain, persisted grants and approval lifecycle |
| [TASK-004-B](TASK-004-B.md) | B — Client / UX | Permission selector and inline approval interaction |
| [TASK-004-C](TASK-004-C.md) | C — Tools / Security / QA | Tool-boundary filesystem permission enforcement |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-004 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-004 — Acceptance gate

- A new Chat defaults to Workspace Access, and user can change it to Provided Materials Only without changing the conversation/draft.
- Reading an outside file requires explicit approval; Allow once does not authorize another step; continuing grant is scoped and revocable.
- A denied/unanswered step makes no change and never reports approval.
- Attempt to read another Chat or write original project files is rejected even if the user attempts to approve it.
- Permission changes during running requests apply only to the next request.

**Commands:** `pnpm build`, `pnpm test:tools-browser`, `pnpm test:agent-runtime`, `pnpm test:local-web`, `pnpm test:slide-pipeline`.

## Risks and non-goals

Approval and question are distinct interactions. An approval cannot be represented as an ordinary clarification response with no operation identity. The existing `RequestController.reply` schema may need a separate approval reply type without changing clarification semantics.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
