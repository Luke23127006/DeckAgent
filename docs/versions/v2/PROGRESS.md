# DeckAgent V2 — Progress

**Planning baseline:** branch `docs/versions/v2`, commit `a417141f92bee1a5801e63f2bcfc6948922399d0`.  
**State at creation:** PLAN DRAFT — no V2 implementation gate has passed.  
**Authority:** [SCOPE.md](SCOPE.md) for scope, [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) for dependencies, individual `tasks/` files for instructions.

**Current work — 28-10-2026:** owner confirmed all TASK-003 gates passed and requested TASK-004. G-003 PASS is attributed to that confirmation and the recorded automated evidence; no exact manual-run SHA or separate artifact was supplied. TASK-004 automated checks pass on `feature/v2-task-004-permissions`, based on `17ad50f`; manual G-004 remains pending. Other V2 scope/activation checkpoints are unchanged.

## CI source-file substitution fixture — 27-10-2026

- Owner supplied hosted `test:workspace` results: 17/18 PASS. The failing assertion was `injected === true`, before the security-result assertions.
- Local reproduction: run the substitution case with Windows `TEMP`/`TMP` converted to lowercase. It fails with the same `false !== true` at line 148. A temporary probe confirmed `open` was mocked, but its canonical path differed from the fixture's original path string.
- Fix: resolve the source root with `realpath` before matching the intercepted `open`. Add a folder-alias/junction variant. Both variants still require injection, an error result, and no substituted content returned to the Agent. Runtime access checks are unchanged.
- Verification: Node 22.19.0, pnpm 11.28.5, Windows. `pnpm.cmd test:workspace` PASS 19/19, 0 skipped, with both normal and lowercase TEMP paths; lint, targeted formatting and whitespace checks PASS. Logs: `.local-only/v2-workspace-ci-path-fix.log` and `.local-only/v2-workspace-ci-path-fix-default.log`.
- Scope: test fixture and evidence only; no application build was required. Hosted CI rerun and live-model manual G-001 remain unverified. No Issue publication or push was performed.

## Product / architecture checkpoints

| Checkpoint | State | Evidence / next action |
|---|---|---|
| Product decision documentation | Documented | `BR-009`, `BR-010`, `BR-005`, revised FRs on planning branch |
| Flow-level V2 Scope | Proposed | Product Owner to review `SCOPE.md` flow table |
| Public integration technical contracts | Proposed | Group README contracts to be agreed before implementation |
| Named outside research service | Not approved in this record | Provider implementation must not make unapproved outbound calls |
| Attachment limits | Validation pending | `BR-001` values not set; run trial cases before final rule approval |
| Release default models | Validation pending | `BR-005 V-5` not set; `UC-005 A13` held |
| V2 activation | Not performed | Update `docs/versions/README.md` only on approval |

## Gate dashboard

| Gate | A | B | C | Integration | Status | Evidence |
|---|---|---|---|---|---|---|
| G-001 Workspace | PASS | PASS | PASS | PASS | PASS | Owner confirmed gates passed in conversation, 27-10-2026; [automated evidence](tasks/task-001-workspace/HANDOFF.md); exact manual SHA not supplied |
| G-002 Chat Lifecycle | PASS | PASS | PASS | PASS | PASS | Owner confirmed all manual gates passed, 28-10-2026; [108/108 automated cases and handoff](tasks/task-002-chat-lifecycle/HANDOFF.md); exact manual SHA not supplied |
| G-003 Provider & Models | PASS | PASS | PASS | PASS | PASS | Owner confirmed all gates passed, 28-10-2026; [automated evidence](tasks/task-003-provider-models/HANDOFF.md); exact manual SHA not supplied |
| G-004 Permissions | AWAITING MANUAL | AWAITING MANUAL | AWAITING MANUAL | Automated PASS | NOT VERIFIED | [Permission lifecycle, browser, isolation and regression evidence](tasks/task-004-agent-permissions/HANDOFF.md); live G-004 pending |
| G-005 Sources & Attachments | Not started | Not started | Not started | Not started | NOT STARTED | — |
| G-006 Web Research | Not started | Not started | Not started | Not started | NOT STARTED | — |
| G-007 Context & Integration | Not started | Not started | Not started | Not started | NOT STARTED | — |

## How to update this file

Update the A/B/C columns after each subtask and link its verification evidence. Record automated and manual results separately. A subtask with code and automated checks complete remains `AWAITING MANUAL` until its manual checks pass. After integration, mark a group PASS only when its automated checks, manual checklist and dependency gate pass. If a gate fails, retain the failed checks, responsible owner and re-test instructions. Never infer completion from file creation or a green build alone.

Use `NOT STARTED`, `IN PROGRESS`, `AWAITING MANUAL`, `PASS`, `FAIL`, or `BLOCKED`. Missing evidence is `NOT VERIFIED`. A mock result cannot substitute for live-model acceptance. Keep actionable work and detailed evidence in the corresponding GitHub Issue when publication is authorized; issue links are currently pending.

## V1 baseline carried into V2

Context reviewed on 27-10-2026. This is a documentation baseline, not a new acceptance run.

- DeckAgent is a Local Web presentation harness using the user's selected model and credentials.
- V1 has persistent conversations, provider settings, request/activity records, outline proposal/revision/confirmation, progressive slide publication and Canvas preview.
- Recovery, Stop, history reopening, scoped slide edits and natural clarification/confirmation have implementation and local-test evidence. Live-model acceptance remains distinct.
- The [V1 dashboard](../v1/PROGRESS.md) records Gates 001–003 PASS and Gates 004–007 NOT_VERIFIED. Later local fixes do not close those gates.
- V1 uses a default shared work folder and blocks Chat navigation during active requests. V2 proposes Workspace ownership, private work roots and concurrent navigation.
- [Accepted storage decision](../../adr/0001-application-storage-and-workspace-boundary.md): application data stays outside user project folders. The [research boundary](../../adr/0002-provider-neutral-web-research.md) is still a proposed technical decision.
- Deck Export, direct slide editing and a new slide-design pipeline are outside the current V2 proposal.

Before TASK-001, record the actual candidate commit, V1 data locations and a fresh regression result. Do not treat the historical planning commit as proof of the current application state.

## Manual testing after every subtask

Each TASK-001 through TASK-007 has A/B/C subtasks in its linked group README. Apply this checklist to **each** subtask, before recording completion:

- [ ] Record task ID, actual tester, candidate commit and any uncommitted changes, date, OS/browser and fixture or data directory.
- [ ] Run the subtask's documented automated checks and record commands, results and limitations.
- [ ] Demonstrate the changed behavior using the integrated application when available. For an API, adapter or storage subtask, a manually invoked fixture/API probe can demonstrate its contract; label it as a fixture.
- [ ] Demonstrate a rejection or failure case and confirm saved work remains intact.
- [ ] Run the applicable group scenarios below. Record any scenario awaiting another lane as BLOCKED, with the dependency and owner.
- [ ] Run the common V1 smoke below after integration. A fixture-only subtask remains awaiting integrated manual acceptance.
- [ ] Attach safe evidence and record PASS/FAIL, remaining gaps and the next action. Keep credentials and private user material out of evidence.

The dashboard's A/B/C cells hold subtask state; Integration holds the automated integration result; Status holds the combined gate result. The detailed record below holds manual evidence. A downstream group cannot pass integration before its upstream gate passes.

## Common V1 manual smoke after each task group

Use separate disposable test data and source folders. Preserve existing user data. Build and start Local Web using the commands in [local development](../../development/local-development.md); record the actual storage options supported by the candidate. Migration tests use copies of V1 data, never the only original.

- [ ] Open Settings, select a usable model, send a normal request and read its saved conversation.
- [ ] Create a three-slide presentation through proposal, clarification when needed, and confirmation. Observe published slides in Canvas.
- [ ] Reopen that Chat and reload the browser. Confirm conversation, outline, published content and selected slide remain correct.
- [ ] Stop an active request. Confirm already-published work remains and work does not continue after finalization.
- [ ] Restart Host with the same test storage. Reopen saved work; interrupted work is not reported as completed or automatically replayed.

Record model/provider and whether the run used a live model or fixtures. These checks establish observed behavior for that candidate only.

## Manual gate checklists

These are execution checklists for the acceptance criteria in the linked group READMEs. Those READMEs remain authoritative for contracts and automated security tests.

### G-001 — Workspace and storage

[Task and acceptance criteria](tasks/task-001-workspace/README.md). Dependency: recorded V1 baseline.

- [ ] Create two Workspaces and Chats in each. Select the same folder again; no duplicate Workspace is created.
- [ ] Restart and verify stable Workspace/Chat identities and ownership. The default Workspace has no project folder and cannot be removed.
- [ ] Remove a test Workspace. Its Chats become ungrouped and retain conversation, outline, attachments when available, and deck.
- [ ] Move a test source folder. Source reads become unavailable; saved Chat/deck data stays readable.
- [ ] Build and preview slides; compare source-folder file lists and hashes before/after. No source file changes. A Chat cannot read another Chat's work root.
- [ ] Migrate a copied V1 profile; verify IDs and saved work. Inject a migration failure using a documented fixture and verify the original copy remains recoverable.
- [ ] Pass the common V1 smoke through the new storage/work roots.

### G-002 — Chat lifecycle and activities

[Task and acceptance criteria](tasks/task-002-chat-lifecycle/README.md). Dependency: G-001 PASS.

- [x] Start work in Chat X; switch Chat/Workspace and send in Chat Y. Return to X; its work continued and its status belongs to X.
- [x] Leave X awaiting clarification; switch to Y and return. Reply only to X. A stale reply cannot answer another request.
- [x] Keep different unsent drafts in X and Y; switching restores the correct draft.
- [x] Reload while X runs. Stop X and verify Y is unaffected. Restart Host during test work; interrupted work is not marked successful.
- [x] Expand/collapse activity details without sending work. Inspect a fixture with a failed activity and successful request; the two states remain distinct.
- [x] Pass the common V1 smoke.

### G-003 — Providers, models and reasoning

[Task and acceptance criteria](tasks/task-003-provider-models/README.md). Dependency: G-002 PASS.

- [x] Reopen saved V1 provider configurations after restart. Test valid configuration changes and an invalid connection without exposing keys.
- [x] Select models in different Chats. Only known reasoning choices appear; unknown metadata remains unknown.
- [x] Start a request, then change the model/reasoning settings. Verify the running request keeps its captured selection and the next request uses the change.
- [x] Manually run the Responses tool-call compatibility fixture. Record fixture evidence separately from any live provider call.
- [x] Keep restore-default-model acceptance held while approved release model IDs are absent. Record the provider/protocol combinations actually tested.
- [x] Pass the common V1 smoke with a usable live model; unavailable combinations remain NOT VERIFIED.

### G-004 — Permissions and approvals

[Task and acceptance criteria](tasks/task-004-agent-permissions/README.md). Dependency: G-003 PASS.

- [ ] New Chat uses Workspace Access. Change to Provided Materials Only; conversation and draft remain intact.
- [ ] Request an outside-file read using disposable material. Confirm the step waits; deny or leave unanswered and verify no read occurs.
- [ ] Allow once; a later step needs approval again. Grant a named continuing scope, verify its limits, then revoke it and verify access stops for later work.
- [ ] Attempt cross-Chat reads and original-project writes. Both remain denied even through an attempted approval.
- [ ] Change permission while a request runs. Its captured policy stays stable; the next request receives the change.
- [ ] Pass the common V1 smoke and verify source-folder hashes remain unchanged.

### G-005 — Sources and attachments

[Task and acceptance criteria](tasks/task-005-sources-attachments/README.md). Dependency: G-004 PASS.

- [ ] Add known-content TXT, MD, PDF, DOCX, PNG, JPEG and PPTX samples. Verify usable content for each type; record partial extraction explicitly.
- [ ] Send a ready attachment without text. Restart and verify the attachment is still available to its owning Chat.
- [ ] Try damaged, protected and invalid-type files. Inspect rejection reasons; rejected material cannot be sent as ready.
- [ ] Add a project reference. Confirm it does not count as an attachment or create a permanent copy merely by being named.
- [ ] Move/remove the referenced source before reading. Confirm revalidation fails without substituting a same-name file elsewhere.
- [ ] Attempt another Chat's attachment and an arbitrary-path read; both are denied.
- [ ] Record timing/resource evidence for candidate count/size limits. Do not claim approved limits while BR-001 values remain unset.
- [ ] Pass the common V1 smoke using permitted material.

### G-006 — Public research

[Task and acceptance criteria](tasks/task-006-web-research/README.md). Dependency: G-005 PASS.

- [ ] With no approved/configured service, request research. Verify a clear unavailable result and zero outbound research calls.
- [ ] With controlled adapters, invoke Search and Fetch separately. Inspect sources, activity detail and typed errors.
- [ ] Use synthetic private markers in Chat/material fixtures. Inspect captured outgoing requests; private content is absent.
- [ ] Run controlled private-address, redirect and DNS-rebinding probes. Verify rejection before a forbidden connection; never probe real metadata services.
- [ ] Fail an operation. Verify no automatic retry/provider fallback; explicit retry repeats only that operation in the same request.
- [ ] Record live service approval and live results separately. Without approval, live acceptance stays BLOCKED even when adapter fixtures pass.
- [ ] Pass the common V1 smoke. Pair manual observations with automated network-policy evidence; UI output alone proves no privacy boundary.

### G-007 — Context and final integration

[Task and acceptance criteria](tasks/task-007-context-integration/README.md). Dependency: G-006 PASS.

- [ ] Inspect provider-reported, estimated and unknown context cases. Unknown capacity/usage produces no invented percentage.
- [ ] Reach the BR-010 suggestion threshold using a fixture. Verify a suggestion appears without starting compaction.
- [ ] Start compact manually on an idle Chat. Verify the next model request uses the summary while the full conversation remains readable.
- [ ] Reopen after restart. Verify the checkpoint persists and outline, deck and attachments remain intact.
- [ ] Try compact during running/awaiting work; it is rejected. Inject compact failure; prior context and saved work remain unchanged.
- [ ] Pass the common V1 smoke and the V1 scoped-edit checklist: only the requested slide changes revision/content.
- [ ] Review all seven gates, selected flows, security tests and migration rollback evidence. Unverified V1 gates and blocked live research remain explicit release gaps.

## Manual evidence record

Add one row per subtask run and group gate run. Preserve failures when recording a retest. Attribute manual results to the actual tester.

| Task / gate | Candidate / environment / data | Tester / date | Scenarios and automated results | Manual result | Safe evidence / Issue | Blocker / owner / next action |
|---|---|---|---|---|---|---|
| V2 planning | Documentation only | 27-10-2026 / Codex | Context review and checklist preparation | NOT VERIFIED | Local PROGRESS.md; Issue pending | Implementation and manual execution not started |
| TASK-001 A/B/C / G-001 | `feature/v2-task-001-workspace`, base `7713d78` + uncommitted changes; Windows, Node 22.19.0, Chrome; temporary data | Codex / 27-10-2026 | Build/lint PASS; combined 101/101 PASS, 0 skipped; expanded import suite 5/5 PASS, making 102 distinct passing cases | NOT VERIFIED | [Commands, failures, limits and manual steps](tasks/task-001-workspace/HANDOFF.md); Issue pending | Task owner: live-model G-001 checklist; no user profile migrated |
| G-001 owner acceptance | Candidate SHA and separate manual artifacts not supplied | Task owner / 27-10-2026 | Earlier automatic evidence above and CI fixture correction retained | PASS, owner-confirmed | Owner said the gates passed and requested TASK-002 | Supersedes the pending manual result above; does not close historical V1 gates |
| TASK-002 A/B/C / G-002 | `feature/v2-task-002-chat-lifecycle`, base `c93f3e8` + uncommitted changes; Windows, Node 22.19.0, Chrome; temporary data | Codex / 27-10-2026 | Build/lint PASS; combined 108/108 PASS, 0 skipped | NOT VERIFIED | [Contracts, failure history and manual steps](tasks/task-002-chat-lifecycle/HANDOFF.md); Issue pending | Task owner: manual G-002; hosted CI not run |
| G-002 owner acceptance | Candidate SHA and separate manual artifacts not supplied | Task owner / 28-10-2026 | Earlier automated evidence above retained | PASS, owner-confirmed | Owner said all gates passed and requested TASK-003 | Supersedes the pending manual result above; does not close historical V1 gates |
| TASK-003 A/B/C / G-003 | `feature/v2-task-003-provider-models`, base `6611c57`; Windows, Node 22.19.0, Chrome; temporary data | Codex / 28-10-2026 | Build/typecheck/lint PASS; provider 28/28, Local Web 9/9, tools-browser 16/16, browser 7/7, agent 35/35, sessions 9/9, workspace 19/19, lifecycle 3/3, outline 19/19, slides 9/9, recovery 26/26 PASS | NOT VERIFIED | [Contracts, failures, compatibility matrix and manual steps](tasks/task-003-provider-models/HANDOFF.md); Issue pending | Task owner: live G-003 observations; hosted CI not run |
| G-003 owner acceptance | Exact manual-run SHA and separate artifact not supplied | Task owner / 28-10-2026 | Earlier automatic evidence retained | PASS, owner-confirmed | Owner said all Task 3 gates passed and requested TASK-004 | Supersedes the pending manual result above; release defaults remain held |
| TASK-004 A/B/C / G-004 | `feature/v2-task-004-permissions`, base `17ad50f`; Windows, Node 22.19.0, Chrome; temporary profiles | Codex / 28-10-2026 | Build/lint PASS; permissions 7/7, browser 8/8, tools-browser 16/16, runtime 35/35, Local Web 9/9, slides 9/9, outline 19/19, Workspace 19/19, lifecycle 3/3 PASS | NOT VERIFIED | [Contracts, negative matrix, failures and manual steps](tasks/task-004-agent-permissions/HANDOFF.md); Issue pending | Task owner: manual G-004; hosted CI not run |

## Open handoffs

1. Confirm planned interface signatures and update any names in group README files before implementation starts.
2. Record available local/remote V1 storage locations before any migration code runs.
3. Obtain provider compatibility evidence and explicit external-service approval separately from code completion.
4. Preserve an explicit compatibility check for the existing UC-001 outline/slide pipeline after every shared-tool or storage change.
