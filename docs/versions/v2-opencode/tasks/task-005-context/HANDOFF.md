# TASK-005 — Handoff record

Implementation checkpoint: 4 November 2026. Implemented opt-in; G-005 NOT VERIFIED.
Owner selected separate context.sqlite on 3 November. Entry gates remain pending.
Inherited acceptance stays as recorded in [the audit](../../BASELINE-AUDIT.md).

| Item | Record |
|---|---|
| Candidate SHA / dirty changes | 019a027 plus local implementation; source fingerprints in evidence.json |
| Named A / B / C / integrator | Codex, single implementer across responsibility lanes |
| Contract and exact file ownership | CONTRACT-PROPOSAL.md; accepted ADR 0005 |
| Producers/consumers and compatibility | Optional Host context operations, client capability detection, app-owned store; existing schemas unchanged |
| Automated commands/results/artifacts | 62 affected regression cases PASS; four context cases PASS; CLI/browser subset PASS; see table below |
| Live model/protocol/CLI/OS/Node/tester | Gemini gemini-3.1-flash-lite; OpenCode Windows x64 1.19.5; Node 22.19.0; Codex |
| Manual and negative scenarios | Owner manual NOT RUN; automated failure, Stop, busy/awaiting and foreign-schema checks PASS |
| Data/profile and preservation checks | Disposable synthetic profiles only; no original user profile modifications |
| Lane A / B / C | IMPLEMENTED OPT-IN / AWAITING MANUAL / PARTIAL QUALIFICATION |
| Integration G-005 | NOT VERIFIED |
| Failures/limits/retest owner | Full source-to-deck live FAIL before Compact; Codex/integrator to investigate; owner manual pending |
| Next action / downstream consumer | Owner smoke, full live retest after diagnosis, outstanding G-002/G-004 qualification |
| GitHub Issue | Unpublished; authorization required |

Append dated results and retests without deleting failures. Never include credentials or private user material.

## Delivered behavior

ContextStore owns selection-specific checkpoints and prepared-prompt byte counts.
It checks its application ID/schema, uses atomic revision comparison, validates a
covered-history digest and preserves all original messages. Corrupt or unknown
stores are never reset. Model/Chat mismatches use full history. Later messages,
including complete tool call/result pairs, follow the summary unchanged.

ContextService uses the existing OpenCodeAgentHandle, ephemeral MemorySessionStore
and empty ToolRegistry. Actual provider payloads contain no tools. Native auto
compaction/pruning remain disabled by the existing audited configuration. The
overflow fixture makes one provider call and no automatic summarization/retry.

RequestController reserves the Chat through disposal/finalization. Its cancellation
check now runs after disposal, so Stop during drain cannot commit a completed
compact result. Finalization rechecks cancellation, history, selection, Host state
and checkpoint revision. A non-reducing, empty or oversized summary is rejected.
Other Chats can run concurrently. Checkpoints persist; compact requests are not
replayed after restart. No readable summary message or deck revision is appended.

The regular presentation workflow applies projected context both to ordinary
requests and to the existing isolated generation task. Current outline, deck,
material identities and permissions still come from authoritative Host stores.
Legacy execution ignores checkpoints and stays the default.

The client adds Context and explicit Compact under the Composer. It preserves the
draft, shows a durable checkpoint boundary, uses existing Stop and reports failure
with a next action. An old Host hides the optional feature. Usage query does no
model work and reads only cached attachment extraction, never source references.

## Verification

All logs below are sanitized test output, without keys or private source files.
Commands used the supported local Node executable, not the older system Node.

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript and workspace bundle | PASS | task005-final-build.log, task005-final-bundle.log |
| Context, Host, persistence, concurrent Chat, outline/edit and Web management regression | 62 PASS, zero skipped | task005-regression.log |
| Final context store/accounting/admission cases | 4 PASS | task005-context-final.log |
| Pinned CLI + browser integrated subset | 2 PASS | task005-final-cli-browser.log |
| Final browser including actionable compact failure | 1 PASS | task005-browser-final.log |
| Final Host/context cancellation and admission follow-up | 9 PASS | task005-final-host.log |
| Existing pinned-CLI confirmation, two-slide generation, scoped edit and restart | 1 PASS | task005-presentation-regression.log |
| Focused live Gemini summary and later factual answer | 1 PASS | task005-fidelity-live.log |
| Full live document -> outline -> deck -> compact -> slide-two edit | FAIL at initial outline with OPENCODE_FAILED, before Compact | task005-live.log |
| Repository lint | PASS, 172 files | task005-lint-final.log |
| Explicit new source/test formatting and diff whitespace | PASS | evidence.json |

Log paths are under .local-only. Commands are exposed as test:context,
test:context:cli and test:context:live. The focused live test used controlled
synthetic history, not actual MCP source ingestion. It verifies real model summary
and continuation fidelity for that corpus only. It does not replace full live
deck/material acceptance. The full live failure has no confirmed transport/key
cause; do not infer one from OPENCODE_FAILED.

Early checks found sandbox spawn EPERM, a Windows SQLite teardown-order error,
a test fixture using /outlines instead of /outline, and browser startup navigation
races. The fixture/lifecycle issues were corrected; subprocess checks ran through
approved escalation. These were not counted as PASS or suppressed. The initial
spawn failure does not establish a test-first behavioral RED.

## Files and compatibility

Added app context/store.ts and context/service.ts, client context-meter.ts, four
context test files and this task's decision/contracts/manual/evidence documents.
Changed app index.ts/web-request.ts for composition/projection; material store.ts
for cached draft measurement; Host contracts/index/controller for optional routes
and cancellation; client boot.ts; package scripts and test runner; progress and
the local development guide. No new runtime dependency or lockfile change.

Existing session, Web, material and deck schemas remain unchanged. New profiles
create context.sqlite only when OpenCode is enabled. Older executables ignore it
and use full history; they cannot promise the same reduced context. They do not
delete the extra store. No Cordis removal, default switch, commit or push occurred.

## Limits and next action

- Usage is UTF-8 bytes / 4, with no measured tokenizer accuracy guarantee. It uses
  the latest prepared system/tool bytes only for matching Host state. Actual
  provider formatting can differ. Unknown images/references suppress a total.
- Reported completed-call usage stays in existing adapter execution metadata; it
  is not presented as current prompt occupancy or as exact monetary cost.
- Summary is bounded to 64 KiB and must reduce the projected input. The existing
  4 MB transport guard remains; over-limit history is explicitly refused, not
  silently truncated or compacted in unbounded chunks.
- Summary fidelity is model-dependent. The tested controlled corpus is not an
  exhaustive prompt-injection, language, long-document or provider matrix.
- Process cancellation/application tool isolation are not an OS sandbox.
- Checkpoint metadata survives restart. In-memory compact request/activity state
  is not a durable compact-job queue; interrupted work never resumes itself.
- G-002/G-004, owner manual acceptance and the failed full live scenario remain
  outstanding. Use MANUAL-ACCEPTANCE.md. Do not mark G-005 PASS yet.

Owner checkpoint (4 November 2026): the quick manual Compact/continue smoke is PASS. The owner confirmed retention of the supplied four-fact context, unsent draft, readable history and checkpoint indication for that scenario. No separate artifacts or exact manual candidate/browser/model were supplied. Stop, restart/model isolation and source-backed deck editing are not covered by this quick confirmation. The earlier full live failure and pending entry gates remain recorded; G-005 stays NOT VERIFIED. No code changes or automated reruns were needed for this update.
