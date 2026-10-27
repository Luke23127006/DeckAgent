# DeckAgent V2 — Master Implementation Plan

**Baseline branch:** `docs/versions/v2` · **Reference commit:** `a417141f92bee1a5801e63f2bcfc6948922399d0` · **Date:** 27-10-2026.  
**Scope authority:** [SCOPE.md](SCOPE.md). This plan selects no product behavior on its own.  
**Status:** owner confirmed G-001 passed and requested TASK-002 on 27-10-2026. TASK-002 is implemented and awaits manual acceptance; later groups and V2 activation remain pending. See [PROGRESS.md](PROGRESS.md).

## 1. Value chain

```text
Application-owned data and isolated Workspaces
    -> Chat identity and concurrent request continuity
    -> Provider/model/effort contracts at request start
    -> Per-chat access and step approval
    -> Durable attachments, references and document ingestion
    -> Public search/fetch through privacy-gated provider adapters
    -> Manual context compaction, integration and regression
```

The groups are sequential dependency gates. **Within each group, A/B/C begin in parallel** against the contract in that group's `README.md`. An early finisher can prepare the next group, but must not integrate work depending on an unpassed gate.

## 2. Team and file ownership

| Lane | Long-running responsibility | Rule |
|---|---|---|
| A — Platform / Host | Application wiring, API contracts, request composition, session/database migrations | Owns `apps/local-web/src/index.ts`, `apps/local-web/src/web-request.ts`, Host routing and shared contracts whenever a group changes them. |
| B — Client / UX | Left Sidebar, Composer, settings, conversation/activity, deck-canvas compatibility | Owns `packages/client/runtime/src/boot.ts` and client views. Reads Host contracts; never writes Host DB directly. |
| C — Security / Data Adapters / QA | Filesystem tools, parsers, provider implementations and cross-feature tests | Owns tool/material/provider adapter packages and regression fixtures. Sends contract-change requests to A, never edits A/B-owned integration files. |

A file has exactly one direct editor inside a group. If a task needs a change in another lane's file, its owner applies it. See each group README for the concrete exception-free owner list.

## 3. Task groups and gates

| Group | Goal and deliverable | Depends on | Integration gate |
|---|---|---|---|
| [TASK-001](tasks/task-001-workspace/README.md) | Application Storage, Workspace Registry, Chat ownership, no source-folder writes, recoverable legacy migration | Existing V1 baseline | G-001: workspace identity and data survive folder removal/restart; source folder untouched |
| [TASK-002](tasks/task-002-chat-lifecycle/README.md) | Concurrent navigation, durable per-chat request state and Activities | G-001 | G-002: request in Chat X continues while Chat Y opens; stop/reply target X only |
| [TASK-003](tasks/task-003-provider-models/README.md) | OpenAI Responses adapter, per-model metadata/effort and selection | G-002 | G-003: model/effort snapshots remain stable across active request and validated provider calls |
| [TASK-004](tasks/task-004-agent-permissions/README.md) | Chat policy, approval UI and execution enforcement | G-003 | G-004: out-of-policy action waits; no cross-chat access or original-file modification |
| [TASK-005](tasks/task-005-sources-attachments/README.md) | Durable attachments, file/folder references, seven accepted document types | G-004 | G-005: files are validated, scoped to chat and not confused with references |
| [TASK-006](tasks/task-006-web-research/README.md) | Web Search/Fetch abstraction, adapters, privacy checks and settings | G-005 | G-006: public-only queries, safe URLs, approved-provider gate, graceful no-provider state |
| [TASK-007](tasks/task-007-context-integration/README.md) | Context meter, manual compact, end-to-end regression and rollout evidence | G-006 | G-007: summary changes next model context, never original history; all V1/V2 tests pass |

### Cross-group dependency rules

- TASK-001 must establish `workspaceId`, `sessionId`, `requestId`, and a per-chat Agent work root before TASK-004/TASK-005 add access rules.
- TASK-002 must preserve the Host's existing Session-keyed RequestController semantics. Do not make a global one-request lock.
- TASK-003 must keep `ModelSelection` backward compatibility with old persisted Session records. Unknown effort/metadata is not treated as a made-up default.
- TASK-004 must enforce authorization **at tool execution**, not only in prompts or UI.
- TASK-005 must never hand an OS path from a browser message directly to a tool without Workspace and Chat authorization.
- TASK-006 must not interpret permission to search as permission to upload the current Chat, prompt, deck or attachments.
- TASK-007 must not rewrite `SessionStore` history to a summary; compaction creates a separate model-context projection.

## 4. Contract handshake for parallel work

At the **start** of each Task Group, A publishes the interface names, request/response samples and error codes from that group's README in a short contract commit or fixture. B and C begin simultaneously using those fixtures. The interfaces are **proposed names**, not existing source APIs. The acceptance criteria define the required semantics; rename a symbol only when repository conventions require it, and record the final public name in the group README. Avoid making B/C wait for A to complete its implementation.

Each subtask must distinguish (a) owned production code, (b) mock/fixture code, (c) changes requested from other owners. All shared changes must be made with provider/consumer/test updates in one group before its gate.

## 5. DeepSeek Harness reuse policy

- Research/reference only until an import compatibility check is successful. DeepSeek uses Cordis, but its client is React/Slots; DeckAgent's client is currently DOM/TypeScript. **Do not import DeepSeek UI packages directly** without a documented dependency decision.
- For Web, study `packages/web/web`, Search/Fetch provider adapters, and `packages/client/ui-settings-web-search`. Evaluate direct reuse against DeckAgent's model/tool contracts, pinned versions and Node environment; else implement a small adapter. Do not transplant the entire Harness.
- For Workspaces, permissions, attachments and context metering, reuse behavior/contract ideas with DeckAgent-specific file and privacy boundaries.
- Confirm upstream licenses/notice requirements for any copied source. Keep provider credentials out of logs and fixtures.

## 6. Verification sequence

Run only checks relevant to each changed component during a subtask. A gate runs the combined affected set and a V1 smoke check.

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:agent-runtime
pnpm test:model-providers
pnpm test:session-persistence
pnpm test:tools-browser
pnpm test:local-web
pnpm test:outline-workflow
pnpm test:slide-pipeline
pnpm test:recovery-editing
```

The available scripts come from root `package.json` at the baseline. For tests newly created in V2, add a named root script **through lane A** and document it in the group README. Some commands may fail on an unsupported OS or without credentials; run deterministic mocked tests and label what was not tested. No live provider secrets in test logs.

## 7. Required scenarios across all gates

| ID | Scenario | Where checked |
|---|---|---|
| REG-01 | Start Local Web, select model, send normal text request, read saved history | G-001 onward |
| REG-02 | Confirm outline, publish one slide, reopen deck from Chat | G-001, G-004, G-007 |
| REG-03 | Reload Web while request runs; reopening the Chat shows accurate status | G-002, G-007 |
| SEC-01 | A Chat cannot read another Chat's attachments, work data, or drafts | G-001, G-004, G-005 |
| SEC-02 | Workspace project folder remains byte-for-byte unchanged during slide build/preview | G-001, G-004, G-007 |
| SEC-03 | No private query or private-network URL leaves to public research | G-006, G-007 |
| MIG-01 | V1 databases with real data remain recoverable after failed migration | G-001, G-007 |
| CTX-01 | Compaction preserves full readable history and durable decks/outlines | G-007 |

## 8. Scope and validation blockers

**Do not replace product constraints with implementation defaults:**

- `BR-001 V-2/V-3` still `not set`: use 10 attachments/request and 20 MiB/file **as performance/safety trials**. Seek a BR change and explicit approval before declaring limits as product behavior.
- `BR-005 V-5` default model IDs still `not set`: `UC-005 A13` held. Do not fabricate release defaults to pass G-003.
- External search service not separately approved: build a provider-independent capability and mock/approved-service gates; no unapproved outbound calls. Do not claim live Web Research is release-ready without approval.
- Other missing model-specific reasoning metadata stays unknown. A model is selectable only if its adapter actually supports the required operation.
- Any UC-001-specific redesign/Deck Export request is explicitly excluded and becomes a separate scope discussion.

## 9. Handoff and progress discipline

Each subtask reports: changed files, public contracts, tests/commands and results, FR/UC evidence, risks and unresolved items. The Group integrator records one PASS/FAIL for its gate with evidence. Update [PROGRESS.md](PROGRESS.md) after each integration gate; keep GitHub Issues as actionable work items. Do not replace this plan with task status text.

## 10. Approval and activation

Before execution: (1) review flow selection in SCOPE, (2) approve or adjust Task Group boundaries and proposed public contracts, (3) choose how V2 planning coexists with any remaining V1 work, (4) mark V2 active in `docs/versions/README.md` only after that agreement. No automatic push, migration, provider activation or permission escalation follows merely from approving this document.
