# V2 OpenCode — Progress

Planning snapshot: 2 November 2026. TASK-001 opt-in implementation and automated qualification are complete.
Owner-confirmed manual smoke PASS closes TASK-001 A/B/C and G-001 on 2 November 2026.
TASK-002 implementation and automated coverage are in place; Gemini manual smoke is owner-confirmed PASS. G-002 remains NOT VERIFIED pending remaining protocol and extended acceptance.
TASK-003 independent baseline regression work is in progress on `7796d3e`; no production code changed.
Automated fixture/browser checks and owner-confirmed six-case smoke pass. The earlier automated presentation failure remains recorded; full G-003 remains NOT VERIFIED.
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
| [002 — Restore provider and session compatibility](tasks/task-002-provider-session-parity/README.md) | PASS | Gemini smoke PASS; extended pending | BLOCKED: live credentials | G-002 NOT VERIFIED; code/wire and Gemini smoke complete |
| [003 — Accept inherited V1/V2 behavior on OpenCode](tasks/task-003-baseline-acceptance/README.md) | IN PROGRESS; automated subset PASS | Gemini smoke PASS; extended pending | IN PROGRESS; automated subset PASS | G-003 NOT VERIFIED; G-002 still pending |
| [004 — Complete source-to-presentation input](tasks/task-004-materials/README.md) | Implemented opt-in; automated subset PASS | Browser PASS; manual pending | Fixtures/vision PASS; latest source-generation live FAIL | G-004 NOT VERIFIED; G-003 and acceptance pending |
| [005 - Complete bounded context and manual compaction](tasks/task-005-context/README.md) | Implemented opt-in; checkpoint/accounting PASS | Browser and basic owner smoke PASS; extended pending | CLI subset and focused live PASS; full live FAIL before Compact | G-005 NOT VERIFIED; entry gates and full acceptance pending |
| [006 — Add direct editing with controlled revisions](tasks/task-006-direct-editing/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-006 NOT VERIFIED |
| [007 — Deliver images and usable export](tasks/task-007-images-export/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-007 NOT VERIFIED |
| [008 — Package reusable presentation Agent Skills](tasks/task-008-presentation-skills/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-008 NOT VERIFIED |
| [009 — Switch default and retire legacy dependencies](tasks/task-009-runtime-retirement/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-009 NOT VERIFIED |
| [010 — Evaluate and hand over the thesis product](tasks/task-010-thesis-acceptance/README.md) | NOT STARTED | NOT STARTED | NOT STARTED | G-010 NOT VERIFIED |

## Next actionable task

Current owner-directed work: **TASK-005 manual acceptance and full live qualification**.
Use the [context handoff](tasks/task-005-context/HANDOFF.md) and
[manual smoke](tasks/task-005-context/MANUAL-ACCEPTANCE.md). The implementation is opt-in.
A focused live compact/continue PASS does not replace the failed full source-to-deck
scenario or waive G-002/G-004. No runtime-default switch is authorized.

Earlier acceptance work remains outstanding:

Finish **TASK-002 remaining live/extended acceptance** and **TASK-003 bounded acceptance**, as requested by the owner.
G-001 stays owner-confirmed PASS. Task 003 independent preparation does not waive G-002.
Use the [Task 003 handoff](tasks/task-003-baseline-acceptance/HANDOFF.md), evidence and manual checklist for current work.
Use the contracts, qualification records and known limitations in
[the handoff](tasks/task-001-runtime-foundation/HANDOFF.md).
Codex completed the A/B/C implementation on branch `feat/v2-opencode`, based on `4511be5` and POC `092b799`.
The old backend remains the default. No production-default switch or historical progress reset occurred.
Supported Node 22.19.0 qualification passed: 16 distinct CLI cases, 3 live-model cases,
173 affected legacy tests and 8 existing browser smoke cases. Later fixes passed 16 CLI cases and a Vietnamese live-model retest.
The owner confirmed manual smoke PASS; browser version, exact manual SHA and itemized results were not supplied.
The [sanitized evidence](tasks/task-001-runtime-foundation/evidence.json) includes candidate source hashes and limits.
TASK-002 now maps all four protocol families with explicit fail-closed option limits and controlled portable history.
See its [compatibility matrix](tasks/task-002-provider-session-parity/COMPATIBILITY.md) for wire/live distinctions and known gaps.
Set local credential/model pairs for standard Chat Completions, Responses and Anthropic, then run `test:opencode:parity:live`.
Do not send keys in chat. Owner manual acceptance must also cover Settings/effort, clear rejection, drafts and active selection.
Full TASK-003 integration is still gated by G-002; independent fixture preparation can continue.

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

TASK-002 evidence update (2 November 2026): implementation is in place; G-002 remains NOT VERIFIED.
Final CLI parity: 24 PASS; default parity: 9 PASS / 15 SKIP; post-encoding Gemini: 1 PASS / 4 SKIP.
A real CLI canary exposed file/env substitution before tool filtering; JSON literal encoding fixes this path.
The owner confirmed only Gemini credentials are available. Other protocol live tests and Settings/effort manual acceptance remain pending.
See Task 002 handoff and evidence for source hashes and earlier regression results.

TASK-002 follow-up: current-candidate targeted browser checks PASS 2/2, including rejected-draft/model reload and Settings validation.
A concrete manual acceptance checklist is now in the task folder. G-002 remains NOT VERIFIED with the same live-credential and owner-acceptance blockers.

TASK-002 manual incident: Gemini HTTP 503 and a subsequent whole-turn deadline blocked context smoke.
Fixed deadline classification from OPENCODE_FAILED to PROVIDER_TIMEOUT, with safe timedOut evidence.
Real-CLI deadline/API regressions 2 PASS; process checks 3 PASS; build and direct lint PASS.
Provider recovery is not proven. G-002 remains NOT VERIFIED.

Owner update (2 November 2026): Task 002 Gemini smoke PASS, confirmed before the owner commits.
The previous Gemini manual-smoke blocker is resolved by this report; incident evidence remains historical.
Three remaining live protocol families and extended effort/model-switch acceptance are still unverified.
G-002 remains NOT VERIFIED. No exact manual SHA, browser version or itemized outcomes were supplied.

TASK-003 update (2 November 2026): independent regression preparation runs on committed Task 002 baseline `7796d3e`.
No production code, default runtime, schema or business rule changed. New CLI/Host/MCP/browser checks are repeatable through
`test:opencode:baseline`; `test:opencode:baseline:live` separately requires Gemini credentials.
Baseline command: 6 PASS; expanded MCP suite: 4 PASS with two overlapping cases; eight distinct baseline cases total.
Inherited regression selection: 72 PASS; inherited browser: 9 PASS. Build/typecheck/lint/changed-file format pass.
Final Gemini permission run: PASS for once/deny/grant/restart/isolation/revoke/Stop; earlier failed attempts remain in evidence.
Separate live presentation run: FAIL with OPENCODE_FAILED on the first outline turn; cause unresolved, no provider status or deadline.
Owner manual acceptance, combined killed-Host recovery and exact Stop/publication boundary checks remain outstanding.
A IN PROGRESS, B AWAITING MANUAL, C IN PROGRESS. G-003 NOT VERIFIED; G-002 is still a prerequisite.
See the Task 003 handoff/evidence for source fingerprints, environment, fixture corrections and limitations.

Owner smoke update (2 November 2026): all six supplied Task 003 smoke cases PASS, confirmed before commit.
Outline/confirmation/two slides, scoped edit, Chat isolation, Stop and reload/restart are accepted within that report.
This resolves the six-case manual smoke requirement; it does not erase the earlier automated presentation failure.
Exact manual SHA, browser/model details, itemized results and API HTML/revision evidence were not supplied.
Extended manual/interruption checks and G-002 remain pending; G-003 stays NOT VERIFIED.
The bounded Task 003 smoke/test change is ready for owner commit. No automatic commit or push occurred.

TASK-004 kickoff (2 November 2026): Task 003 is committed at `36335d9`; working tree was clean.
Prepared ADR 0004, material contract/file-ownership proposal and initial parser/license/fixture review.
No production code or dependencies changed. Owner agreement is required before shared storage/API implementation,
as explicitly required by Task 004-A. Attachment limits remain unset; historical 10/request and 20 MiB/file are benchmark candidates only.
Pinned CLI --file existence is confirmed, but image delivery, isolation and live vision remain unverified.
G-003 and G-004 stay NOT VERIFIED. Next action: owner contract decision, then isolated qualification and implementation.

TASK-004 checkpoint (3 November 2026): owner selected separate-store option A; bounded implementation is in place.
Added storage/API/snapshots, source references, seven-format worker parsers, MCP read_material, image input and Composer interaction.
Latest material acceptance: 24 PASS. Inherited regression: 116 PASS / 14 SKIP; inherited browser: 9 PASS;
CLI/MCP/process subset: 13 PASS; final targeted contract/browser checks recorded in evidence.
Image wire and independent Gemini vision PASS. The stricter source live run read the unhinted source fact into an outline,
then failed confirmed generation with OPENCODE_FAILED. Cause unresolved; earlier broad live PASS remains historical.
Source and image live cases are now separate. No automatic retry, product default limit, old database schema change or runtime-default switch.
Intake requires explicit trial bounds. Manual acceptance, representative corpus/limit selection and G-003 remain outstanding.
G-004 stays NOT VERIFIED; Task 004 is not accepted as complete. See its handoff, evidence and manual checklist.

Task 004 owner manual update (3 November 2026): smoke cases 1–4 PASS, including source-to-slides.
Case 5 showed a rejected reference before approval. Fixed the misleading client corruption message for unavailable references;
targeted browser RED/GREEN passes without changing permissions. Actual workspace/file-path confirmation and retest remain pending.
The earlier failed automated generation run stays recorded. G-004 remains NOT VERIFIED.
# Material reference follow-up (2026-11-03)

Manual case 5 exposed rejection of a valid file reference when the model also
supplied its matching relative path. The reader and tool guidance are corrected.
A targeted pinned-CLI/Host/MCP regression passes for deny, allow-once and rejection
of another path. The provider is a local fixture; manual retry remains pending.
G004 remains NOT VERIFIED. Earlier owner-confirmed cases 1–4 remain PASS.

Owner confirmed manual reference/permission case 5 PASS on 3 November 2026 after the matching-path fix. Smoke cases 1?5 are now owner-confirmed PASS. Remaining manual coverage and gate prerequisites are unchanged; G-004 remains NOT VERIFIED.

Owner confirmed the image-reading manual smoke PASS on 3 November 2026. The tested format was not supplied, so separate PNG and JPEG manual PASS is not claimed. Restart and Stop manual checks remain unconfirmed; G-004 and its prerequisites remain unchanged. No automated tests were rerun for this status update.

TASK-005 checkpoint (4 November 2026): owner selected separate context.sqlite.
Manual Compact reuses OpenCodeAgentHandle without tools; history is unchanged.
Context estimates include draft/material components and observed system/tool bytes;
unknown costs suppress the total percentage. Host retains admission and Stop.
Automated evidence and the focused live fidelity case pass; full source-to-deck
live failed OPENCODE_FAILED at its initial outline request, before Compact.
Owner smoke, full live acceptance and entry gates remain pending. G-005 NOT VERIFIED.

Owner checkpoint (4 November 2026): the quick manual Compact/continue smoke is PASS. The owner confirmed retention of the supplied four-fact context, unsent draft, readable history and checkpoint indication for that scenario. No separate artifacts or exact manual candidate/browser/model were supplied. Stop, restart/model isolation and source-backed deck editing are not covered by this quick confirmation. The earlier full live failure and pending entry gates remain recorded; G-005 stays NOT VERIFIED. No code changes or automated reruns were needed for this update.
