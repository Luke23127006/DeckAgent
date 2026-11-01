# V2 OpenCode ? Baseline audit

## Evidence and limits

Read-only snapshot: `dev` at `be0d649e74b13f4bc4508ef6659ce67e35c1c205`; committed POC at `092b799`.
Sources: [V1 team plan](../v1/deckagent-parallel-team-implementation-plan.md), [V1 progress](../v1/PROGRESS.md), [V2 plan](../v2/IMPLEMENTATION-PLAN.md), [V2 progress](../v2/PROGRESS.md), all V2 subtask headers and the four existing handoffs.
V1 task documents contain evolving handoffs; later progress entries override earlier unmerged snapshots.
V1 code is implemented. Historical G-001?003 are PASS; G-004?007 remain NOT_VERIFIED.
V2 TASK-001?003 are owner-confirmed PASS with no exact manual-run SHA. TASK-004 code and automated checks are complete; manual acceptance remains pending.
V2 TASK-005?007 are not started. No historical gate was rerun or closed while writing this plan.

POC reference: `git show 092b799:docs/development/opencode-poc.md`, its adapter source and two test files.
Local evidence: `.local-only/opencode-integration/latest-evidence.json` and the referenced per-run evidence.
It records 135 regression passes, live `gemini-3.1-flash-lite` outline/confirm/two-slide/scoped-edit/isolation/restart tests, and active cancellation with zero mutations.
The post-Stop observation window is 2 seconds. The environment used Node 22.17.1, below the supported minimum 22.19.0.
The evidence predates final commit publication and does not independently attest a clean run at `092b799`.
Ignored evidence must be archived safely with candidate IDs for team reproducibility; no secrets or user material belong in that archive.

The spike's model-visible tool capture establishes application-level allowlisting. A denied tool filtered before inference produces no denied-tool event.
Keep that acceptance criterion. Configuration audit alone is insufficient, and no OS sandbox is claimed.
The separate `.local-only/opencode-spike/isolation.evidence.json` records the real CLI sending exactly `spike_probe` to the target model endpoint, with no tools on an auxiliary request.
That capture deliberately ends at a failing controlled provider endpoint. It proves tool declarations, not successful inference.
Successful real-model tool execution and cancellation come from the separate integration evidence above.

## Current code and migration boundary

| Current component | Confirmed role | Action and affected files |
|---|---|---|
| Web client and Host | Request/reply/approval/Stop; snapshots, activity and history | Retain `packages/client/runtime/src/`, `packages/host/api/src/request-controller.ts`; test parity in TASK-003 |
| Request composition | `openWebRequest` captures model/policy, registers phase tools, stages outline decisions and scoped generation/editing | Migrate backend composition in `apps/local-web/src/web-request.ts`; keep workflow rules |
| Custom runtime/Cordis | `AgentRuntime`, `runtimePlugin`, `Context` compose and execute the model/tool loop | Replace execution using POC `apps/local-web/src/opencode/{agent,mcp-bridge,process}.ts`; retire legacy consumers in TASK-009 |
| Shared runtime exports | `AgentHandle`, `SendOptions`, messages, errors, ToolRegistry and SessionStore contracts | Retain initially in `packages/agent/runtime/src/{contracts,index,tool-registry,tool-failure}.ts`; separate from loop retirement |
| Provider settings/adapters | Saved credentials/catalogs, selection snapshots and four inference protocols | Refactor `apps/local-web/src/provider-settings.ts`, `packages/llm/providers/src/`; preserve storage/catalog semantics while OpenCode takes inference |
| Durable session | `SqliteSessionStore` owns history and selection | Retain `packages/session/persistence/src/index.ts`; validate old history projection, no blind replay of provider state |
| Presentation domain | Outline identity, publication idempotency, HTML validation and revision conflicts | Retain `packages/presentation/deck/src/` and `packages/tools/presentation/src/`; extend only for selected new features |
| File permissions | Source/external authorization, private writes and identity checks | Retain `packages/tools/filesystem/src/`, `permission-store.ts`; enforce behind MCP |
| Remaining Cordis consumers | CLI application, smoke app, fixture and package imports | Audit `apps/agent-runtime/`, `apps/cordis-smoke/`, `packages/testing/cordis-fixture/`, manifests, scripts and tests before TASK-009 removal |

On dev, `packages/client/runtime/src/boot.ts` disables the attachment control; `web-request.ts` still constructs a Cordis Context and uses captured ModelAdapter execution.
The shared `SendOptions.promptContext` replaces dialogue for one turn without rewriting history; `continuation` must not append synthetic user input.
These details matter when adapting the POC, because copying native OpenCode history would change existing phase behavior.
V1 task handoffs include superseded restrictions (such as blocking all navigation while running). V2 lifecycle implementation and its later progress record take precedence for current behavior.

POC adds MCP SDK 1.26.0 and a lockfile dependency closure. It does not copy OpenDesign's daemon or supply an independent OpenDesign inference engine.
It implements Gemini only and rejects unsupported options. Fresh native sessions receive quoted history; long-context behavior and native resume are not proven.
The POC commit also changes old scope/progress files. Port relevant code/tests, not the historical documentation edits, into future migration branches.

## Task-by-task disposition

Each row covers the original A/B/C implementation unit. ?Implemented? does not close its historical manual gate.
All new OpenCode migration gates remain NOT VERIFIED. POC evidence is a limited foundation, not a replacement for those gates.
Retain means preserve working behavior; migrate means change its runtime connection; remove means retire only after replacement acceptance.

| Historical task | Functional / historical acceptance | Disposition | New owner task |
|---|---|---|---|
| V1 TASK-001-A ? — Establish DeckAgent Workspace | Implemented; G-001 PASS | Reuse build/workspace; update dependency checks only | TASK-001, TASK-009 |
| V1 TASK-001-B ? — Bring Cordis Boot Dependencies | Implemented; G-001 PASS | Remove Cordis/vendor closure only after last consumer migration | TASK-009 |
| V1 TASK-001-C ? — Create Foundation Smoke Tests | Implemented; G-001 PASS | Replace Cordis-only lifecycle smoke with CLI lifecycle coverage; retain useful test utilities | TASK-001, TASK-009 |
| V1 TASK-002-A ? — Compose Agent Runtime | Implemented; G-002 PASS | Replace custom inference loop; retain shared contracts and ToolRegistry | TASK-001, TASK-002, TASK-009 |
| V1 TASK-002-B ? — Enable Model Providers and Credentials | Implemented; G-002 PASS | Migrate inference to OpenCode; reuse secure configuration/catalogs | TASK-002 |
| V1 TASK-002-C ? — Enable Session Persistence | Implemented; G-002 PASS | Reuse SessionStore; verify old records and context projection | TASK-002, TASK-003 |
| V1 TASK-003-A ? — Enable File Tools and Safety | Implemented; G-003 PASS | Reuse file handlers behind MCP, retain execution authorization | TASK-001, TASK-003 |
| V1 TASK-003-B ? — Establish Host API | Implemented; G-003 PASS | Reuse implemented DeckAgent Host APIs; obsolete historical DeepSeek import wording | TASK-003 |
| V1 TASK-003-C ? — Establish Browser Runtime | Implemented; G-003 PASS | Reuse implemented DOM/TypeScript client; no Slots/framework transplant | TASK-003 |
| V1 TASK-004-A ? — Compose DeckAgent Web Host | Implemented; G-004 NOT_VERIFIED | Migrate only application backend composition | TASK-001, TASK-003 |
| V1 TASK-004-B ? — Assemble Conversation and Settings UI | Implemented; G-004 NOT_VERIFIED | Reuse conversation/settings/history; verify provider compatibility | TASK-002, TASK-003 |
| V1 TASK-004-C ? — Enable Right Sidebar and Sample Deck Tab | Implemented; G-004 NOT_VERIFIED | Reuse real deck canvas; sample-deck/Dockkit implementation instructions are superseded | TASK-003 |
| V1 TASK-005-A ? — Implement Authoritative Deck Service | Implemented; G-005 NOT_VERIFIED | Reuse authoritative DeckService and stored revisions | TASK-003, TASK-006 |
| V1 TASK-005-B ? — Connect Deck Client Model to Canvas | Implemented; G-005 NOT_VERIFIED | Reuse snapshot/canvas selection behavior | TASK-003 |
| V1 TASK-005-C ? — Implement `publish_slide` Tool | Implemented; G-005 NOT_VERIFIED | Reuse publish_slide behind phase-scoped MCP | TASK-001, TASK-003 |
| V1 TASK-006-A ? — Implement Outline State and Confirmation Guard | Implemented; G-006 NOT_VERIFIED | Reuse Host-owned confirmation and stale-target guard | TASK-003 |
| V1 TASK-006-B ? — Implement Outline Conversation UI | Implemented; G-006 NOT_VERIFIED | Reuse outline UI and existing clarification interactions | TASK-003 |
| V1 TASK-006-C ? — Implement Agent Presentation Workflow | Implemented; G-006 NOT_VERIFIED | Migrate execution; preserve phase prompts, tools and generation outcome checks | TASK-001, TASK-003 |
| V1 TASK-007-A ? — Complete Failure and Recovery Semantics | Implemented; G-007 NOT_VERIFIED | Reuse Host recovery; verify CLI death, Stop and no replay | TASK-002, TASK-003 |
| V1 TASK-007-B ? — Connect Chat History and Deck History (UC-006) | Implemented; G-007 NOT_VERIFIED | Reuse history and deck reopening | TASK-003 |
| V1 TASK-007-C ? — Implement Scoped Slide Editing (UC-002) | Implemented; G-007 NOT_VERIFIED | Reuse scoped conversational editing; extend consistency for visual editing | TASK-003, TASK-006 |
| V1 TASK-002 CLI onboarding (companion task) | Implemented; runtime baseline gate PASS | Preserve setup, list/history and prompt commands; migrate execution before deleting Cordis | TASK-002, TASK-009 |
| V2 TASK-001-A — Workspace registry, application storage and migration | Implemented; owner-confirmed PASS | Reuse workspace store and legacy import | TASK-003 |
| V2 TASK-001-B — Workspace picker, grouped Chats and folder-state UI | Implemented; owner-confirmed PASS | Reuse workspace/chat navigation | TASK-003 |
| V2 TASK-001-C — Private work roots, filesystem isolation and regression fixtures | Implemented; owner-confirmed PASS | Reuse isolated roots and safety tests through MCP | TASK-003 |
| V2 TASK-002-A — Per-chat Host lifecycle and durable request projection | Implemented; owner-confirmed PASS | Reuse per-chat admission/lifecycle and durable status | TASK-003 |
| V2 TASK-002-B — Unblocked Chat navigation and activity presentation | Implemented; owner-confirmed PASS | Reuse concurrent navigation and drafts | TASK-003 |
| V2 TASK-002-C — Request lifecycle, Activity and recovery contract tests | Implemented; owner-confirmed PASS | Extend existing lifecycle fixtures to OpenCode subprocess failure | TASK-003 |
| V2 TASK-003-A — Request model/effort contracts and Responses API adapter | Implemented; owner-confirmed PASS | Migrate protocol/effort mapping; keep captured selection | TASK-002 |
| V2 TASK-003-B — Models Settings UI and per-chat model/effort picker | Implemented; owner-confirmed PASS | Reuse settings UI; reject incompatible choices without silent changes | TASK-002, TASK-003 |
| V2 TASK-003-C — Provider persistence, model catalog metadata and validation fixtures | Implemented; owner-confirmed PASS | Reuse persistence/catalogs and extend compatibility tests | TASK-002 |
| V2 TASK-004-A — Permission domain, persisted grants and approval lifecycle | Implemented; automated PASS, manual pending | Reuse approval/grant semantics; complete live acceptance through OpenCode | TASK-003 |
| V2 TASK-004-B — Permission selector and inline approval interaction | Implemented; automated PASS, manual pending | Reuse approval UI; verify reload and stale controls | TASK-003 |
| V2 TASK-004-C — Tool-boundary filesystem permission enforcement | Implemented; automated PASS, manual pending | Reuse execution checks behind authenticated MCP | TASK-001, TASK-003 |
| V2 TASK-005-A — Durable attachment store, request references and authenticated upload API | Not implemented; NOT STARTED | Implement durable materials/upload from existing design | TASK-004 |
| V2 TASK-005-B — Composer attachment rail and project-folder reference UX | Not implemented; NOT STARTED | Implement attachment/reference interaction | TASK-004 |
| V2 TASK-005-C — Document parsing, file identity checks and attachment safety tests | Not implemented; NOT STARTED | Implement seven-format ingestion and security checks | TASK-004 |
| V2 TASK-006-A — Web capability seam, tool registration and request-local research lifecycle | Not implemented; NOT STARTED | Defer general research framework; narrow image capability only if selected | TASK-007 |
| V2 TASK-006-B — Web Research Settings and Activity UI | Not implemented; NOT STARTED | Defer dedicated research settings; add only required image feedback | TASK-007 |
| V2 TASK-006-C — Search/Fetch adapters, network security and egress tests | Not implemented; NOT STARTED | Reuse security design for selected image egress; no general search prerequisite | TASK-007 |
| V2 TASK-007-A — Context projection, manual compact API and durable checkpoint | Not implemented; NOT STARTED | Implement context projection/checkpoints against OpenCode | TASK-005 |
| V2 TASK-007-B — Context meter, compact interaction and final UI alignment | Not implemented; NOT STARTED | Implement manual compact and honest usage; avoid unrelated UI redesign | TASK-005 |
| V2 TASK-007-C — V2 end-to-end gates, privacy and V1 regression evidence | Not implemented; NOT STARTED | Split final integration/evaluation from context dependency | TASK-003, TASK-010 |

## Scope corrections, not historical rewrites

Old V1/V2 plans prioritized harness infrastructure and postponed direct editing/export.
Their completed workspace, lifecycle and permission work remains valuable and stays implemented.
Their Cordis-specific boot work is replaced, not repeated. Unimplemented research UI is deferred rather than treated as a thesis obligation.
New TASK-006?008 and TASK-010 cover the missing visual editor, export/images, external Skills and thesis evaluation.
TASK-004 adds source-to-presentation acceptance, not only upload/parser unit tests.

V1's additional UI alignment, outline clarification and product-spec migration documents are supporting records, not extra accepted task groups.
Do not automatically carry their unselected redesign or ideal-spec flows into this version.
