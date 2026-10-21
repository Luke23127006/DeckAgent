# V1 Test Plan v0.1

## Purpose and delivery status

This plan turns the V1 Product Spec into a practical basis for testing during implementation. It defines scope, test methods, environment and data needs, and the conditions for starting checks and recording results. The companion [Test Scenarios and Requirements Coverage](test-scenarios.md) contains the priority scenarios, AC matrix and unresolved decisions.

- Parent task: **Test Planning**. QA-01 is this plan; QA-02 and QA-03 are the companion document.
- Status: **v0.1 for review**, dated 17-10-2026. Methods, priorities and operational test conditions below are planning proposals, not additions to Product Spec.
- Source baseline: `main`, commit `796a039529392d0a83602423ef0df522b523c547`. Remote `main` matched that commit when checked on 16-10-2026.
- Working branch: `docs/v1-test-planning`. The task owner will create the PR to `main`, link Jira and arrange review.
- No application tests have been executed for this delivery. Fixtures, detailed test cases, automation, execution reports and an official tool/framework choice are outside this task.

## Scope and authority

Expected behavior comes from [V1 scope](../../spec/00-current-scope/VERSIONS.md), the selected [use case flows](../../spec/03-use-cases/), their [functional acceptance conditions](../../spec/04-requirements/fr/), applicable [business rules](../../spec/05-business-rules/) and [NFR measurements](../../spec/04-requirements/nfr/). Implementation behavior cannot override these sources. Open questions, proposed defaults and pending values are not approved requirements.

The exact V1 selection is below. `MF` means every main-flow step, not every alternative. The companion's [flow inventory](test-scenarios.md#selected-uc-flows-and-requirement-origins) traces each selected block to its requirements and lists excluded flows.

| Use case | V1-selected flows | Testing focus |
|---|---|---|
| UC-001: initial draft | MF; A9, A10, A11, A13, A14, A18, A19, A22, A23, A24, A32, A33, A34, A39, A42 | Outline first, confirmation, clarification, factual uncertainty, incremental building, interruption, images |
| UC-002: refinement | MF; A1, A2, A3, A4, A5, A6, A7, A10, A11, A12 | Targeted and whole-deck changes, ambiguous instructions, preserved content, failures |
| UC-003: request lifecycle | MF; A3, A6, A8, A11, A13, A14, A17, A18, A19, A27, A28, A31, A38, A40, A41, A43 | Intake, one active request, questions, Stop, failure, model selection, partial material |
| UC-005: provider/model setup | MF; A1, A2, A4, A5, A7, A8, A9, A10, A11, A12, A13 | Saved and unsaved settings, credentials, model lists, selection, removal and deletion |
| UC-006: earlier chats | MF; A1, A3, A4, A6 | Restored work, isolation, unsent data, unavailable or unfinished work |
| UC-012: new chat | MF | Empty new work, preserved earlier work, independent model selection |

Export, manual slide editing, version restoration, deck Q&A, design-system setup and deck variants are outside V1's selected use cases. Unselected alternatives, including voice, connectors, presenter notes, connection-loss recovery and setup-time key refusal, are not mandatory V1 checks. A negative restriction explicitly required by a selected AC remains in scope even if the corresponding feature is not available.

The inventory contains 82 selected blocks, 66 FRs and 364 ACs: 239 deterministic and 125 judged. Two ACs have proposed-default status. Source approval and check type are retained in the matrix; this plan does not reclassify them. NFRs have separate measurement coverage and are not counted as FR ACs.

## Risk and sequencing

P0 scenarios address the first usable deck, edits affecting the wrong content, loss of completed work, duplicated or silently resumed requests, exposed credentials and cross-chat contamination. P1 scenarios extend these journeys with cancellation, empty outlines and insertion positions. These priorities propose implementation-sprint sequencing; they do not remove other confirmed requirements from V1.

Start with the controlled-provider path through outline, confirmation, build, named-slide edit and reopen. Next exercise question waits, Stop, provider failure, model changes and process/interface lifecycle. Run live-model evaluations after the deterministic lifecycle is observable. Schedule the security and persistence campaigns as soon as their observation points exist, rather than waiting for all happy paths to finish.

Use the [future priorities](test-scenarios.md#future-test-case-prioritization-and-coverage-review) and unmapped matrix rows to choose later test cases. This sprint does not promise 100% scenario coverage.

## Three distinct test methods

| Method | What establishes the result | Planned application | Evidence |
|---|---|---|---|
| Deterministic checks | Exact state, identity, count, preserved content or observable event required by the AC | Request transitions; outline confirmation; slide boundaries; retained completed work; model/provider routing; chat isolation and persistence | Before/after state snapshots, ordered conversation, request/call observations, visible status and relevant screenshots |
| Judged AI output evaluation | A reviewer evaluates meaning against the specific AC and supplied material | Instruction fidelity, relevant clarification, tone, retained facts, uncertainty disclosure and explanations | Input material, current outline/deck, full response, cited AC, reviewer rationale and supporting excerpts |
| NFR measurement | Source Conditions, Measure, Method, Target and Met when, with their approval statuses | Security, privacy, saved state, rendering, file robustness, accessibility, timing and Windows build | Named environment, observation method, raw observations and source target status |

### Deterministic checks

Use a controlled model service or equivalent test seam to return known content, pause at named phases, ask a question, and trigger an error. This is an environment capability request, not an approved architecture or framework. Engineering chooses how to expose it without bypassing the behavior under test.

Observe both the visible result and the relevant state boundary. For example, a stopped request needs retained-slide evidence and evidence that no further change occurs after Stop takes effect; a model switch needs outgoing-call attribution, not just a changed selection label. Do not invent a stop-latency threshold to decide that Stop took effect.

Use isolated snapshots for independent scenario variants. Keep the original request, current outline, completed slides, selected model and unsent draft distinguishable. Reloading the Local Web interface, closing that interface, stopping a request and ending the DeckAgent process are different events and must have separate observations.

Controlled output establishes product behavior under known inputs. It does not demonstrate that a live model understands the user's material. Conversely, a fluent live response does not prove that persistence or routing is correct.

### Judged evaluation

For each judged AC, build a small evaluation packet: the user's instruction, allowed source material, prior conversation and outline/deck state, the produced response, and the exact semantic condition to assess. Include Vietnamese and English material where relevant; these are the first languages checked, not a new complete language-support commitment.

The reviewer asks only what the mapped AC requires. Examples include whether costs were added while unrelated meaning stayed, whether conflicting figures remain unresolved, and whether a failure message accurately describes retained work. Do not require identical wording, a preferred writing style or an invented quality score.

Record each observation as meets / does not meet / inconclusive, with a rationale and source/output excerpts. Inconclusive results need a second review or an owner clarification; they are not silently counted as passes. Optional automated judging may assist a later sprint, but cannot establish a new acceptance rubric or be the sole authority in this plan.

Repeat live-model cases to explore variation, naming provider, model, available generation settings and run count. Agree the sampling size before execution and report every observed outcome. No statistical acceptance rate is established here. Do not turn repeated output into an invented product-level pass percentage. Separate a wrong product transition, an output-quality failure and an unavailable provider in triage.

### NFR measurement campaigns

These campaign IDs are planning references. They do not claim executed measurements or completed detailed test cases. For each campaign, retain all source conditions, provider coverage and repetition requirements when creating cases. A sample on one environment cannot certify every supported environment. The [NFR inventory](test-scenarios.md#nfr-scope-and-measurement-inventory) records all 29 measurement IDs and their status.

| Campaign | Source measurements and method | Official result / dependency |
|---|---|---|
| NM-01: request boundary and original files | [NFR-003/M-1, M-2](../../spec/04-requirements/nfr/NFR-003.md). Use distinct markers in two chats and an unprovided file; request forbidden reads directly and through attachment instructions, with each built-in provider and a deliberate-action model service. Observe actions, model inputs and outputs. Compare original DOCX/JPG files across generation, editing, image use, failure, Stop and unexpected exit. | Confirmed targets: no unauthorized reach or marker disclosure; original files still exist unchanged. Engineering must expose action and input evidence. |
| NM-02: rendered content | [NFR-004/M-1](../../spec/04-requirements/nfr/NFR-004.md). Show script, event markup and executable-link samples from attachments and model output in the canvas, conversation and preview. Observe isolated test effects on data, synthetic credentials and network. | Confirmed target: no sample runs or produces its effect in any zone. Use a disposable environment. |
| NM-03: local access | [NFR-005/M-1, M-2](../../spec/04-requirements/nfr/NFR-005.md). Attempt reads, writes and request starts from another LAN device and a separate website in the same browser, including an address that later resolves to the host. Compare state and request activity. | Confirmed target: every attempt fails. Product-wide requirement; successful localhost use alone is insufficient evidence. |
| NM-04: credentials and egress | [NFR-006/M-1 to M-3](../../spec/04-requirements/nfr/NFR-006.md) and [NFR-007/M-1, M-2](../../spec/04-requirements/nfr/NFR-007.md). Trace synthetic keys and content markers through requests, catalog fetches, rendered resources, failures, Stop, image requests, key replacement, normal/unexpected exits, startup, idle and setup. Inspect model content, all outgoing connections and product-written files/messages. Compare non-provider connections with the documented list. | Confirmed targets: key absent outside its permitted use/storage, each key sent only to its own base URL, content sent only to the selected provider, other connections documented and content-free. GAP-15 and GAP-20 limit assumptions; engineering must identify the allowed key store and connection inventory. |
| NM-05: saved-state recovery | [NFR-008/M-1, M-2](../../spec/04-requirements/nfr/NFR-008.md). Observe the last saved state of multiple chats/decks and model setup. Terminate at chosen/random moments, including idle, build, edit and save; include process kill and controlled power-loss conditions as specified. Repeat, reopen every chat and compare saved configurations, models and selections. | Confirmed targets: every run restores the last saved state without corruption or unfinished slide changes; chats open and accept requests. GAP-22 blocks execution until saved-state evidence is available. Last displayed state is not the oracle; no maximum data-loss interval is set. |
| NM-06: display integrity | [NFR-009/M-1 to M-4](../../spec/04-requirements/nfr/NFR-009.md). Compare stored text with shown text and bounds; review detected overlaps. Inventory resources before/after reopen and check attached/new images, default-system fonts/images, and Vietnamese/English characters with fixed content. Report live provider/model results separately. | M-3/M-4 have confirmed targets: all resources and characters show correctly. Full M-3 needs the approved default design system (GAP-06). M-1/M-2 collect evidence only; their targets are pending. |
| NM-07: file preparation | [NFR-010/M-1, M-2](../../spec/04-requirements/nfr/NFR-010.md). For every accepted type, prepare ordinary, damaged, protected, over-limit, expanding and deeply nested fixtures. During preparation try removing the file and typing; compare other attachments and chats. Measure add-to-ready/rejected using one clock on the same named computer. | M-1's responsiveness, isolation and final-state target is confirmed. GAP-04 blocks exact over-limit data and complete campaign coverage. M-2 timing has no official threshold. |
| NM-08: timing | [NFR-001](../../spec/04-requirements/nfr/NFR-001.md), [NFR-002](../../spec/04-requirements/nfr/NFR-002.md), [NFR-011](../../spec/04-requirements/nfr/NFR-011.md), [NFR-012](../../spec/04-requirements/nfr/NFR-012.md). Use each measurement's stated start/end events, controlled and provider-dependent conditions, repeated runs and named environment. Preserve raw times and report provider/model conditions separately. | Evidence only: NFR-001/002 statements are proposed and all these numeric targets are pending. Do not create a timeout, percentile or pass gate. Functional progress/Stop outcomes remain confirmed separately. |
| NM-09: accessibility | [NFR-013/M-1 to M-4](../../spec/04-requirements/nfr/NFR-013.md). Perform all listed tasks with keyboard alone, then with a screen-reader user: prepare/send with attachment, answer, confirm/cancel, Stop, review slides, configure/select models, create/reopen chats. Record focus clarity and announcements. Compare read titles, points and tables with slide text in order. | M-1 to M-3 targets are confirmed. Browser/screen-reader choice needs agreement (GAP-18). Text inside images is excluded. M-4 standard/level is pending and cannot be a conformance gate. |
| NM-10: Windows build | [NFR-014/M-1, M-2](../../spec/04-requirements/nfr/NFR-014.md). Follow published build/start steps on clean named Windows machines with only documented tools and access to public package sources; record any undocumented assistance or team-hosted service dependency. | M-1's build/start/open target is confirmed. Environment range awaits agreement (GAP-19). M-2 is proposed, so no official additional portability gate is claimed; selected functional ACs remain in scope. |

## Environment requirements

These are capabilities needed for testing, not claims that the implementation already provides them. Engineering and QA should agree concrete mechanisms before execution.

| Capability | Purpose and required record |
|---|---|
| Reproducible local Windows build | Record application commit, build steps, dependency versions, Windows version, hardware, browser and locale. Use clean and pre-populated disposable workspaces. Confirm supported combinations with the owner rather than inferring them. |
| Controlled model/provider behavior | Exercise known success output, delayed/silent output, questions, model refusal, quota, invalid key and interruption at known slide boundaries. Record the selected model and provider identity without logging actual credentials. |
| Live provider evaluation | Use approved configurations and owner-controlled test accounts with known capability/access. Record model identity, settings, run time and observed service errors. Account access and usable quota are prerequisites, not promised test outcomes. |
| State and event observation | Read conversation order, outline status, finished/unfinished slide state, active request identity, draft content, model selection and outgoing-call attribution. Observe the last saved state for NM-05. No database schema or internal module boundary is chosen here. |
| Failure and lifecycle control | Reproduce read failures, partial context, image failures, request Stop, interface reload/closure and process termination independently. Power-loss testing uses a disposable controlled host/environment, never a shared working machine. |
| Network/security observation | Use isolated test destinations, a second device and controlled test website; capture connections and product-written data safely. Identify the permitted key store and documented non-provider connections. |
| Accessibility and rendering | Named browser, display conditions and agreed screen reader, with a reviewer who uses it. Fixed slide content and resource inventory distinguish rendering defects from generation variation. |

No test harness, browser automation framework, storage format, model service or image technology is selected by this plan. Missing observation points block the affected checks; they do not justify guessing the result from UI appearance alone.

## Test data requirements

| Data family | Required variations and oracle |
|---|---|
| Initial material | Clear pilot/survey topics; missing topic/audience; explicit language; conflicting 12%/15% satisfaction figures; absent costs/sites; blank or partially readable material. Use synthetic documents with a fact inventory and known omissions. |
| Outlines and decks | Unconfirmed A/revised B, confirmed four-slide outline, empty outline, five-slide deck with named targets and snapshots, partial first draft and partially completed edits. Preserve content outside the requested scope for comparison. |
| Attachments | Each confirmed BR-001 type; ready/preparing/rejected states; protected/damaged/unsupported files; attached images and unreadable sections. Keep original-file hashes/content for preservation checks. Do not invent count/size boundaries. |
| Model setup | Synthetic providers/models/keys; saved versus unsaved edits; missing/removed selected model; multiple configurations and per-chat selections. Source labels such as M1/K1 are fixtures, not approved production model IDs or real secrets. |
| Chat history | Multiple topics, messages in known order, sent and unsent attachments, local unsent text, no earlier work, missing saved chat, saved completed slides and an interrupted request. Do not assume unsent drafts survive a process restart. |
| AI and visual content | Relevant and irrelevant facts, conflicting facts, incomplete instructions, Vietnamese accents/English text, attached/new images and dense slide content. Keep the source fact list and semantic review rationale; do not create numeric quality targets. |
| Security and reliability | Distinct non-sensitive markers, intentional forbidden-action requests, inert payloads with observable test effects, crash snapshots and hostile-file fixtures in isolation. Never put real keys or personal user data in fixtures or reports. |

Concrete request-length, attachment-size/count, design-system, protocol, built-in ID/default-model and provider-setting fixtures require the corresponding approved BR values. Until then use symbolic descriptions only and mark affected execution blocked. Do not interpret the example number of slides as a limit.

## Entry, result recording and completion conditions

### Before an individual check starts

1. Pin the application and spec revisions. Confirm the scenario's UC/flow remains selected for V1 and its AC/target is approved.
2. Create the required initial state, including inherited AC preconditions and independent reset points. Identify the expected result from the source, not from current implementation output.
3. Confirm the environment, account access, fixtures and observation points exist. Resolve required pending values for that check; otherwise record it as blocked with the gap ID and continue independent checks.
4. Assign a reviewer for judged output and agree the campaign's samples/repetitions and environment set. These execution choices do not introduce acceptance thresholds.
5. Confirm that evidence can be collected without exposing secrets and that disruptive checks use disposable data and environments.

### Record each run

Record run ID, scenario and variant, UC/flow, FR/AC or NFR/measurement, application/spec commits, timestamp, environment, provider/model, fixture version, initial state, action, observed outcome, evidence references and reviewer. Include a defect reference or gap ID where applicable.

Use **Pass**, **Fail**, **Blocked**, **Not run**, or **Inconclusive** for approved checks. Pass requires all mapped assertions for that variant; a failed independent variant cannot be hidden by a successful one. A provider outage that prevents observing the intended path is not evidence that the product passed it. Conversely, a deliberately injected provider failure with the correct product handling may pass that failure-path check.

For pending/proposed NFR targets, record **Observation only**, with raw measurements and conditions. Do not assign official Pass/Fail. Preserve each source AC's deterministic/judged label even if the scenario contains both; one overall scenario label must not hide a failed constituent AC.

### Review and handoff

QA reviews scenario-to-AC links and remaining unmapped rows. Engineering reviews reproducibility, observation points and environment feasibility. The spec owner resolves requirement/target gaps; a QA interpretation or implementation choice cannot approve them. Record decisions in the authoritative source through a separate change, then update this plan's baseline.

This planning task is complete when the two documents are reviewable, the priority success/failure scenarios have explicit traceability, and uncovered or conditional work is visible. Execution completion and release approval are separate decisions for later sprints; this plan sets no new release gate or acceptable defect count.

The owner handles Jira linking, PR creation and review submission. The handoff should disclose the matrix's remaining unmapped ACs, the two proposed-default ACs, the 23 recorded gaps and the absence of product test execution.
