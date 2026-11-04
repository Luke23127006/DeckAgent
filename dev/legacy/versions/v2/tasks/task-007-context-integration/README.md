# TASK-007 — Manual Context Compaction and V2 Integration

**Outcome:** Show trustworthy context usage, compact only when requested and finish with complete V2/V1 regression evidence.  
**Sequence:** task group 7 of 7. **Dependency:** G-006.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

G-006 PASS; selected model metadata and durable Session/Deck/Attachment storage exist.

**Mapped requirements:** UC-015 MF/A1/A2/A3; UC-003 A46; FR-078/079; BR-010; NFR-008; cross-feature regressions.

## Shared contract for A/B/C (freeze before coding)

**C1 — Context projection:** `{sessionId, modelKey, usedTokens?, contextWindow?, percentage?, source: 'provider'|'estimate'|'unknown', breakdown?}`. No displayed percent when capacity or usage is unknown.

**C2 — Compact operation:** user-initiated Chat-scoped action, rejected while that Chat has a running or awaiting request. Produces summary and a durable checkpoint/segment marker without deleting conversation messages.

**C3 — History projection:** next model request uses summary for the compacted span plus newer messages; user-visible/exportable Session history stays unchanged. Outline/Deck/Attachments remain stored independently.

**C4 — Failure:** unsuccessful compact preserves previous context projection, summary, history and deck. No queued or automatic compact.

These are **proposed V2 interfaces and semantics**, not declarations that the existing code already exports these names. At group kickoff, A records the final public names in this README and supplies small mock fixtures. B and C start immediately using those fixtures; they do not wait for A's full production implementation. Changes to this contract require an explicit cross-lane review.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-007-A](TASK-007-A.md) | A — Platform / Host | Context projection, manual compact API and durable checkpoint |
| [TASK-007-B](TASK-007-B.md) | B — Client / UX | Context meter, compact interaction and final UI alignment |
| [TASK-007-C](TASK-007-C.md) | C — Tools / Security / QA | V2 end-to-end gates, privacy and V1 regression evidence |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-007 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-007 — Acceptance gate

- Context UI differentiates provider-reported values, DeckAgent estimates and Unknown. Suggest compact at `BR-010` only when percentage is calculable.
- Successful compact alters only later model-context projection and records its checkpoint; earlier conversation remains readable and exportable.
- Compact during running/awaiting request is rejected; failed compact changes nothing; no automatic compact or queued compact.
- All V2 selected-flow tests and security scenarios pass, or remaining gaps are explicitly marked BLOCKED/FAIL instead of shipping as complete.
- Existing UC-001 outline confirmation, slide publishing, request stop/recovery and deck restoration still work.

**Commands:** `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test:agent-runtime`, `pnpm test:model-providers`, `pnpm test:session-persistence`, `pnpm test:tools-browser`, `pnpm test:local-web`, `pnpm test:outline-workflow`, `pnpm test:slide-pipeline`, `pnpm test:recovery-editing`.

## Risks and non-goals

Provider token usage may refer to different accounting moments than estimated prompt occupancy. Do not display any estimate as exact. Never overwrite durable `messages` with a summary; do not lose outline/tool decisions.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
