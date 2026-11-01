# V2 OpenCode — Progress

Planning snapshot: 2 November 2026. Documentation prepared; implementation has not started under this plan.
Candidate baseline: dev `be0d649e74b13f4bc4508ef6659ce67e35c1c205`.
POC source: `poc/opencode-integration` at `092b799`.
Authority: [scope](SCOPE.md), [task mapping](BASELINE-AUDIT.md), [dependencies](IMPLEMENTATION-PLAN.md).

## Inherited state: do not reset

| Function / original work | Functional implementation | Historical acceptance | OpenCode verification |
|---|---|---|---|
| V1 foundation/runtime/providers/session/tools (001–003) | Implemented | G-001–003 PASS | Limited POC; full parity NOT VERIFIED |
| V1 Local Web/deck/outline/recovery/editing (004–007) | Implemented | G-004–007 NOT_VERIFIED | POC subset PASS; full migration NOT VERIFIED |
| V2 workspace (001) | Implemented | Owner-confirmed PASS; exact manual SHA absent | Full workspace/import matrix NOT VERIFIED |
| V2 chat lifecycle (002) | Implemented | Owner-confirmed PASS; exact manual SHA absent | POC isolation/Stop subset PASS; concurrent matrix NOT VERIFIED |
| V2 providers/models (003) | Implemented | Owner-confirmed PASS; exact manual SHA absent | Gemini POC PASS; other protocols/options NOT VERIFIED |
| V2 permissions (004) | Implemented; automated PASS | Manual acceptance pending | POC security subset PASS; full live approval acceptance NOT VERIFIED |
| V2 materials (005) | Not implemented | NOT STARTED | NOT STARTED |
| V2 general research (006) | Not implemented | NOT STARTED | Deferred; narrow image route considered separately |
| V2 context (007 A/B) | Not implemented | NOT STARTED | NOT STARTED |
| V2 final integration (007 C) | Not completed | NOT STARTED | Reassigned to new baseline/final gates |
| Direct editor, export/images, external product Skills, thesis evaluation | No accepted implementation found | NOT VERIFIED | New delivery work |

## POC evidence carried forward

Local `.local-only/opencode-integration/latest-evidence.json` records PASS for outline before confirmation, two slides,
slide-two-only edit, separate sessions, Host Stop, restart persistence and unique native-session mapping.
Active model-tool cancellation records zero mutations and no accepted late call, observed for 2 seconds.
Recorded regression result: 135 passed, zero failed. Build/typecheck/lint passed on Node 22.17.1.
This is below the supported minimum. It is historical evidence, not a fresh run on the current production candidate.
The POC is Gemini-only, Windows-only, with fresh native sessions. No OS sandbox, full protocol parity or long-history guarantee follows.
[Audit](BASELINE-AUDIT.md) records evidence paths and transfer requirements.

## New work dashboard

A/B/C values below mean new migration or missing-feature work, not inherited code status.

| Group | A | B | C | Integration acceptance |
|---|---|---|---|---|
| [001 — Port and qualify the OpenCode adapter](tasks/task-001-runtime-foundation/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-001 NOT VERIFIED |
| [002 — Restore provider and session compatibility](tasks/task-002-provider-session-parity/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-002 NOT VERIFIED |
| [003 — Accept inherited V1/V2 behavior on OpenCode](tasks/task-003-baseline-acceptance/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-003 NOT VERIFIED |
| [004 — Complete source-to-presentation input](tasks/task-004-materials/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-004 NOT VERIFIED |
| [005 — Complete bounded context and manual compaction](tasks/task-005-context/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-005 NOT VERIFIED |
| [006 — Add direct editing with controlled revisions](tasks/task-006-direct-editing/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-006 NOT VERIFIED |
| [007 — Deliver images and usable export](tasks/task-007-images-export/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-007 NOT VERIFIED |
| [008 — Package reusable presentation Agent Skills](tasks/task-008-presentation-skills/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-008 NOT VERIFIED |
| [009 — Switch default and retire legacy dependencies](tasks/task-009-runtime-retirement/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-009 NOT VERIFIED |
| [010 — Evaluate and hand over the thesis product](tasks/task-010-thesis-acceptance/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-010 NOT VERIFIED |

## Next actionable task

Start **TASK-001-A/B/C — Port and qualify the POC**, with A as integrator.
Before code, assign named owners, pin baseline/POC SHAs, archive sanitized local evidence and agree the existing AgentHandle/MCP contract.
Port only adapter/tests/wiring/dependency changes needed for opt-in reproduction. Preserve old-version docs.
Run on supported Node with the pinned executable and trusted model credentials.
B prepares snapshot/client fixtures; C prepares provider tool-list capture and cancellation tests alongside A.
G-001 is open; creating these planning files does not pass it.

## Decisions and blockers

- Team runtime direction is decided. Production seam, distribution/OS coverage and package changes still need the decisions listed in [DECISIONS.md](DECISIONS.md).
- Four-protocol/options compatibility is an implementation gap, not a reason to erase completed provider work.
- Full live permission acceptance remains outstanding. Do not close it from POC denial tests alone.
- Export format, direct-editor operations, image route and external Skills host need bounded decisions in their owning tasks.
- Attachment product limits and release default model IDs remain unresolved; no arbitrary defaults are approved here.
- Central active-version list remains V1 because this change is restricted to the new folder.
- PDF and POC evidence are local-only; team access must be established without publishing private material.

## Updates and verification

Record each lane and gate in its HANDOFF.md with candidate, environment, automated/manual/live results and limitations.
Only update a gate to PASS when its dependencies and acceptance cases have evidence.
Keep historical statuses unchanged. Link Issues after authorized publication.

Planning verification: scope/source/POC review and local documentation consistency checks only.
Local checks PASS: 57 Markdown files, 10 complete group folders, 30 subtask files, 42 distinct historical A/B/C audit rows,
all local document links resolved, no dependency cycle, no trailing whitespace, and `git diff --check` clean.
Git reports only the new `docs/versions/v2-opencode/` directory; no existing tracked file changed.
No application tests, model calls or migration were run for this documentation change.
