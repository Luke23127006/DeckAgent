# V2 OpenCode — Task management and evidence

The [master plan](../IMPLEMENTATION-PLAN.md) indexes all groups and dependencies.
Each group contains README.md, TASK-NNN-A/B/C.md and HANDOFF.md.
Named assignees and Issue links remain pending; lane ownership is ready for allocation.

## Verification

Record candidate SHA and dirty diff, date/tester, OS/browser, Node/pnpm, CLI hash, model/protocol and disposable data location.
Use Node `^22.19.0` or `>=24.0.0` and pnpm 11.28.5, following [local development](../../../development/local-development.md).
Build before tests that import generated `lib/`. Run affected suites, then integrated group cases.

```powershell
pnpm.cmd build
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd format:check <explicit-changed-source-files>
git diff --check
```

Select existing scripts as affected:
`test:agent-runtime`, `test:model-providers`, `test:session-persistence`, `test:chat-setup`,
`test:tools-browser`, `test:local-web`, `test:outline-workflow`, `test:slide-pipeline`,
`test:recovery-editing`, `test:workspace`, `test:chat-lifecycle`, `test:permissions`, `test:browser-smoke`.
Do not rewrite whole-repository formatting drift.

After porting, the existing POC entry points are:

```powershell
node --test tests/opencode-agent.test.mjs
$env:DECKAGENT_OPENCODE_POC='1'
node --env-file=.env --test tests/opencode-integration.test.mjs
```

Use trusted credentials and test-owned profiles; never put secrets in arguments or evidence.
New test paths in task files are proposed deliverables, not commands available on current dev.
A adds scripts as needed. Skipped live tests are not acceptance.

## Baseline smoke after integration

Select a model; send and reopen conversation. Clarify and confirm an outline; publish at least two slides.
Edit only slide two; compare slide-one HTML/revision. Switch active Chats; activities and approvals stay scoped.
Stop active work; preserve committed slides, reject queued/new tools and drain process/tool work before releasing admission.
Reload/restart; restore history/deck and mark interruption without replay.
Compare source hashes and unrelated Chat data. Include stale confirmation/revision, denied file and invalid tool arguments.

## Evidence and status

Work states: NOT STARTED, IN PROGRESS, AWAITING MANUAL, PASS, FAIL, BLOCKED.
Acceptance without evidence is NOT VERIFIED. Track functional status separately from migration verification.
Each gate requires affected automated checks, integrated manual cases and real-model evidence for model-dependent behavior.
List what evidence does not prove. Preserve failures and their retests.

Effective isolation requires captured provider tool declarations from the pinned CLI, not only config inspection.
Filtered denied tools need no denial event. Tool permissions are application controls, not an OS sandbox.
Cancellation evidence combines bounded observation with enforced rejection/drain barriers.

Handoffs name contracts, changed files, consumer updates, commands/results, data compatibility, failures and next owners.
Issue publication is outside this task. Prepare local records and publish only when authorized.
