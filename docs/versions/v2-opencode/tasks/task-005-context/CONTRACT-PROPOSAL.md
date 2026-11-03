# Context contract proposal

Status: option A selected by owner on 3 November 2026; implemented opt-in, acceptance pending.
Baseline: committed Task 004, `019a027`. Working tree was clean at kickoff.
G-002 and G-004 remain NOT VERIFIED. The owner requested Task 005 preparation;
this does not retrospectively accept either gate or authorize a default switch.

Accepted architecture: [manual context checkpoints](../../../../adr/0005-manual-context-checkpoints.md).
Option A uses a separate context.sqlite. Option B was not selected.

## Proposed public contract

- ContextUsage: Chat ID, captured selection, source estimate/unknown, usedTokens
  and contextWindow only when known, percentage only for a calculable total,
  component estimates and unknown contributions, current checkpoint metadata.
- Context query: authenticated Chat-scoped operation with bounded draft text and
  attachment IDs. Validate ownership without reading referenced source files or
  invoking a model. No mutation or permission prompt during measurement.
- Compact: authenticated explicit Chat action, returning a normal request ID.
  Reject running/awaiting/compacting Chats. Reuse request snapshots, activities,
  watch and Stop. No queued compact and no hidden retry on another backend.
- Compact success: atomically replace the selection checkpoint after revision,
  history and cancellation checks. No public history, deck or material mutation.
- Errors: unavailable backend/model, busy Chat, empty context, stale checkpoint,
  failed/oversized summary and cancellation. Return static actionable messages;
  never expose raw provider bodies or source contents in diagnostic logs.

## Delivered names and payloads

`ContextUsage` is exported by `@deckagent/host-api`. Optional `HostOptions.context`
exposes usage; the Host-only `AgentRequest.contextAction` discriminates Compact.
The general request JSON parser still rejects that field. Only the explicit
authenticated Compact route creates it.

| Operation | Route | Body / result |
| --- | --- | --- |
| Usage | POST /api/sessions/:id/context | `{input?:string,attachmentIds?:string[],referenceIds?:string[]}` -> ContextUsage |
| Compact | POST /api/sessions/:id/compact | `{}` -> normal RequestSnapshot with requestId |
| Watch/Stop | Existing request routes | Existing SSE snapshots and Stop semantics |

Example estimate: `{sessionId:"chat",source:"estimate",usedTokens:2400,contextWindow:10000,percentage:24,suggestCompact:false,canCompact:true,breakdown:{conversation:1600,draft:100,materials:200,systemAndTools:500},unknown:[]}`.
This is a contract example, not a test or provider observation.
Unknown responses omit usedTokens and percentage, keep known component estimates,
and list missing contributions. Known usage with unknown capacity omits percentage.

ContextStore owns checkpoints and prompt byte observations. ContextService queries
usage and opens the existing CLI handle. Compact commits at finalization after
process disposal, cancellation and stale-state checks. Its summary never enters
the readable SessionStore. Only checkpoint metadata is shown after restart;
in-flight compact work is not replayed. No Web database request row is created
for Compact; its normal request snapshot is retained by RequestController.

## Delivered file ownership

Single implementer; A/B/C remain responsibility labels, not concurrent editors.

| Lane | Files | Responsibility |
| --- | --- | --- |
| A | apps/local-web/src/context/store.ts (option A), context/service.ts; index.ts; web-request.ts; opencode/history.ts; packages/host/api/src/contracts.ts, index.ts, request-controller.ts | Persistence, projection, cancellation and admission |
| B | packages/client/runtime/src/context-meter.ts, boot.ts | Usage labels, Compact/Stop interaction, draft preservation |
| C | tests/context.test.mjs, context-browser.test.mjs, opencode-context.test.mjs, context-live.test.mjs | Atomicity, isolation, bounds, pin controls and fidelity |
| A | package.json, scripts/test-opencode.mjs; task documents | Commands and evidence |

No new workspace package, third-party dependency or inference loop is needed.
Additional files must have a task-related reason recorded in the handoff.

## Verification slices

1. Store checkpoint, read full unchanged history, reopen and detect stale/wrong-Chat
   or wrong-selection checkpoints. Reject unknown/foreign schemas without reset.
2. Query estimates/unknowns with draft text and materials; 85 percent only suggests.
   Context access cannot read unapproved references or start inference.
3. Compact idle Chat through pinned CLI with no tools. Success changes the next
   provider prompt; failure, Stop and conflicts preserve the old checkpoint.
4. Prove active/awaiting rejection and other-Chat availability. Restart never
   replays work. Confirmed outline, material IDs and edit revisions remain intact.
5. Real browser: labels, explicit compact, preserved draft, unchanged conversation,
   action failures and Chat switching. No compact on warning or reopening.
6. Pinned CLI overflow fixture: no automatic compaction or hidden summary call.
   Live source-backed summary/continue tests remain separate from fixture PASS.

Every result needs a candidate, command and evidence. G-005 remains NOT VERIFIED
until required coverage and prerequisite gates are accepted.
