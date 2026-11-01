# V2 OpenCode — Progress

Planning snapshot: 2 November 2026. TASK-001 opt-in implementation and automated qualification are complete.
Owner-confirmed manual smoke PASS closes TASK-001 A/B/C and G-001 on 2 November 2026.
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
| [001 — Port and qualify the OpenCode adapter](tasks/task-001-runtime-foundation/README.md) | PASS | PASS | PASS | G-001 PASS; COMPLETE, owner-confirmed smoke |
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

Start **TASK-002 — Restore provider and session compatibility**. G-001 is closed after owner-confirmed smoke PASS.
Use the contracts, qualification records and known limitations in
[the handoff](tasks/task-001-runtime-foundation/HANDOFF.md).
Codex completed the A/B/C implementation on branch `feat/v2-opencode`, based on `4511be5` and POC `092b799`.
The old backend remains the default. No production-default switch or historical progress reset occurred.
Supported Node 22.19.0 qualification passed: 16 distinct CLI cases, 3 live-model cases,
173 affected legacy tests and 8 existing browser smoke cases. Later fixes passed 16 CLI cases and a Vietnamese live-model retest.
The owner confirmed manual smoke PASS; browser version, exact manual SHA and itemized results were not supplied.
The [sanitized evidence](tasks/task-001-runtime-foundation/evidence.json) includes candidate source hashes and limits.
TASK-002 is unblocked by G-001. Full inherited baseline acceptance still follows TASK-002 and belongs to TASK-003.

## Decisions and blockers

- Team runtime direction is decided. Production seam, distribution/OS coverage and package changes still need the decisions listed in [DECISIONS.md](DECISIONS.md).
- Four-protocol/options compatibility is an implementation gap, not a reason to erase completed provider work.
- Full live permission acceptance remains outstanding. Do not close it from POC denial tests alone.
- Export format, direct-editor operations, image route and external Skills host need bounded decisions in their owning tasks.
- Attachment product limits and release default model IDs remain unresolved; no arbitrary defaults are approved here.
- Central active-version list remains V1. Activating the version pointer is outside this bounded opt-in implementation.
- PDF and POC evidence are local-only; team access must be established without publishing private material.

## Updates and verification

Record each lane and gate in its HANDOFF.md with candidate, environment, automated/manual/live results and limitations.
Only update a gate to PASS when its dependencies and acceptance cases have evidence.
Keep historical statuses unchanged. Link Issues after authorized publication.

Planning verification: scope/source/POC review and local documentation consistency checks only.
Local checks PASS: 57 Markdown files, 10 complete group folders, 30 subtask files, 42 distinct historical A/B/C audit rows,
all local document links resolved, no dependency cycle, no trailing whitespace, and `git diff --check` clean.
Git reports only the new `docs/versions/v2-opencode/` directory; no existing tracked file changed.
No application tests, model calls or migration were run for the original documentation change.

Implementation update: TASK-001 adds the app-local opt-in adapter, request-local MCP bridge and qualification tests.
Build/typecheck/lint passed on Node 22.19.0. Actual provider capture contains only phase-authorized MCP tools.
Live-model tests passed outline/confirmation/two slides/scoped edit, MCP failure/recovery, active Stop and restart persistence.
No UI source, Host API, DeckService, database schema, V1/V2 history or default runtime was changed.
See the handoff for the revocation race fix, fixture corrections, fresh-install limitation and client error normalization gap.
Formatting passes for the 12 new source/test files. Full-file checks still fail for four edited legacy files;
the same formatter changes each HEAD version. That existing drift was kept outside this port.

Manual-test convenience follow-up: `pnpm.cmd start:opencode` selects supported Node and the existing spike binary,
builds, loads optional `.env` through Host and reuses a separate profile. `--fresh` selects a new profile without deletion.
Prerequisite/help checks and launcher lint/format passed; no model calls or gate acceptance were added by this follow-up.

Manual report follow-up: the supplied Vietnamese edit prompt was refused and tool outputs appeared unassigned.
The existing scope guard blocks both "thêm" and "không" anywhere in the request; the supplied test prompt triggers it.
This inherited business-rule limitation is reproduced and unresolved. A short explicit edit without those words selects only slide two.
The OpenCode bridge also used bare tool Activity IDs instead of the existing client convention `tool-<toolCallId>`.
That adapter mismatch is fixed for new executions with a regression test; old saved activities were not migrated.
At that checkpoint G-001 remained NOT VERIFIED, pending review and retest.

Owner closure: on 2 November 2026 the owner confirmed "ok đã pass smoke test, đánh dấu là hoàn thành đi".
TASK-001 A/B/C and G-001 are now PASS / COMPLETE, based on that confirmation plus recorded automated evidence.
No additional per-step manual results, browser version or exact manual SHA were supplied; none are inferred.
The scope-guard limitation, old saved Activity records, fresh-install gap and broader compatibility checks remain recorded.
Closure does not switch the default backend or approve full production migration. Next task: TASK-002.
