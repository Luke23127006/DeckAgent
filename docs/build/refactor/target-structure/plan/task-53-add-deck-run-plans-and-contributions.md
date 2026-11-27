# Task 53: Add RunPlan and RunContribution builders in apps/host/src/modules/deck

Read this file to learn the steps of Task 53, which adds `sourceKindsForBrief`, `createDeckRunPlan` and `createGenerationRunPlan` in `apps/host/src/modules/deck/` and proves `sourceKinds` equivalence before the Host cutover.

**Type:** Code

After this task, `apps/host/src/modules/deck/` builds `RunPlan` and `RunContribution` objects for deck review commands (with `RunGrants.sourceKinds` and `RunPlan.next` image recovery) and deck generation / continuation runs (with `stepLimit: 'none'`, `closingText` and `GenerationGrant` inside the deck contribution). `apps/host/tests/deck-run-plan.test.mjs` proves that `sourceKindsForBrief` plus `createSourceToolsContribution` matches `isSourceToolAllowed` across all 16 combinations. Existing `DeckWorkflow` and `GenerationWorkflow` stay intact until the cutover task removes them.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/architecture/10-agent-core.md` (the sections `Owner và kế hoạch run` and `Contribution`)
- `docs/architecture/30-decisions.md` (ADR-003)
- `apps/host/src/runs/ports.ts`, `apps/host/src/runs/index.ts`
- `apps/host/src/modules/deck/deck-prompts.ts`, `deck-tool-session.ts`, `deck-workflow.ts`, `generation-tools.ts`, `generation-workflow.ts`, `generation-execution.ts`, `generation-report.ts`, `ports.ts`, `index.ts`

**Files:**

- Create: `apps/host/src/modules/deck/deck-run-plan.ts`, `apps/host/src/modules/deck/generation-run-plan.ts`, `apps/host/tests/deck-run-plan.test.mjs`
- Change: `apps/host/src/modules/deck/deck-prompts.ts`, `apps/host/src/modules/deck/index.ts`, `package.json`

**Interfaces:**

- Uses, from `apps/host/src/runs/index.ts`: `AgentRuntime`, `RunContribution`, `RunEvent`, `RunLifecycleContext`, `RunPlan`, `RunResult`, `RunTools`, `SourceKind`, `ToolContext`, `ToolResult`, `ToolSchema`, `ToolSet`.
- Produces, in `apps/host/src/modules/deck/deck-prompts.ts`:
  - `sourceKindsForBrief(brief: BriefDraft): readonly SourceKind[]`: returns `['workspace-files', 'attachments', 'research']` when `brief.sources.material` is true, `['research']` when `!brief.sources.material && brief.sources.publicResearch`, and `[]` otherwise.
- Produces, in `apps/host/src/modules/deck/deck-run-plan.ts`:
  - `DeckPlanDependencies`: `{ readonly decks: DeckStore; readonly sessions: DeckSessionStore; readonly briefs: BriefCoordinator; readonly imageResearch?: WebImageResearch }`
  - `createDeckRunPlan(deps: DeckPlanDependencies, request: AgentRequest, selection: ModelSelection): Promise<RunPlan>`
    - Checks `BRIEF_LOCKED`, `BRIEF_STALE`, `OUTLINE_STALE`, `OUTLINE_NOT_FOUND` and `briefs.verify`.
    - Sets `grants: { publicResearch: initial.sources.publicResearch && request.publicResearch === true, sourceKinds: sourceKindsForBrief(initial) }` and `stepLimit: 8`.
    - Sets `skipRuntime: true` for `restore` and for `skip` when `!interviewState(staged).readyForOutline`.
    - Supplies one `RunContribution` with `buildDeckInstructions(context)` and a `ToolSet` for `stage_brief`, `stage_outline`, `search_slide_images` and `select_slide_image` without wrapping source tools.
    - Implements `next(result, ctx)` for the single image recovery pass: returns a pass-2 `RunPlan` with `grants: { publicResearch: false, sourceKinds: [] }`, `buildRecoveryInstructions` and a `ToolSet` limited to `search_slide_images` and `select_slide_image`.
    - Implements `finalize(result, ctx)` to settle recovery activity, check repair limits and proposal presence, run `prepareOutlineImages`, commit via `decks.commitBriefProposal` and emit `deck-workflow-result`.
- Produces, in `apps/host/src/modules/deck/generation-run-plan.ts`:
  - `GenerationSourceToolsPort`: `{ prepare(sessionId: string, sourceKinds: readonly SourceKind[], publicResearch: boolean): Promise<ToolSet> }`
  - `GenerationRuntimeOverride`: `{ prepare(request: AgentRequest): Promise<{ readonly selection: ModelSelection; start(run: GenerationOverrideRun): Promise<{ readonly status: 'completed'; commit?(): void } | { readonly status: 'failed'; readonly errorCode: string }> }> }`
  - `createGenerationRunPlan(deps: GenerationPlanDependencies, options: GenerationPlanInput): Promise<{ readonly plan: RunPlan; readonly runtime?: AgentRuntime }>`
    - Sets `stepLimit: 'none'`, `grants: { publicResearch, sourceKinds: [] }`, and `closingText: status => generationReport(decks, sessionId, requestId, status)`.
    - Keeps `GenerationGrant` and `GenerationCapability` inside `beforeRun` and the deck `RunContribution`.
    - Wraps only selected `brief.sources.refs` tools (via `GenerationSourceToolsPort`) with ref checks and `EvidenceLedger` inside the generation `ToolSet` so `prepareRunInput` has zero tool name conflicts.
    - When a caller supplies a `generationRuntime` override (for test seams), wraps it as an `AgentRuntime` returned in `runtime`.

**STOP when:** Any of the 16 `sourceKinds` equivalence combinations differs from `isSourceToolAllowed`.

**Forbidden:** import `apps/host/src/tools/` or `@deckagent/session-persistence` inside `apps/host/src/modules/deck/`. Change `apps/host/src/server.ts`, `deck-workflow.ts` or `generation-workflow.ts`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 52 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Write the failing tests in `apps/host/tests/deck-run-plan.test.mjs`**

Create `apps/host/tests/deck-run-plan.test.mjs` covering:

1. **ADR-003 equivalence test:** loop over all 16 combinations of `material` (`false | true`), `briefPublicResearch` (`false | true`), `requestPublicResearch` (`false | true`) and `hasResearchSources` (`false | true`). For each combination, compare the tool names returned by `createSourceToolsContribution` given `grants: { publicResearch: briefPublicResearch && requestPublicResearch, sourceKinds: sourceKindsForBrief(brief) }` against the tool names returned by filtering full source schemas with `isSourceToolAllowed(name, brief, requestPublicResearch)`. Assert exact equality on every combination.
2. `createDeckRunPlan` executed via `RunController` + fake `AgentRuntime`: stages brief and outline, runs `RunPlan.next` image recovery pass receiving ONLY `search_slide_images` and `select_slide_image` (zero source tools), and commits the proposal via `finalize`. Also check that `skipRuntime: true` on `restore` makes zero runtime calls.
3. `createGenerationRunPlan` executed via `RunController` + fake `AgentRuntime`: passes `stepLimit: 'none'`, enforces selected `brief.sources.refs` with `evidenceId` provenance, records `finishGeneration`, and appends `generationReport` via `closingText`.

Add `apps/host/tests/deck-run-plan.test.mjs` to `test:deck-review` in `package.json`.

- [ ] **Step 3: Run the new test and check that it fails**

Run: `node --test apps/host/tests/deck-run-plan.test.mjs`

Expected: FAIL. Missing exports `sourceKindsForBrief`, `createDeckRunPlan` and `createGenerationRunPlan`.

- [ ] **Step 4: Implement `sourceKindsForBrief`, `deck-run-plan.ts` and `generation-run-plan.ts`**

1. Export `sourceKindsForBrief` in `apps/host/src/modules/deck/deck-prompts.ts`.
2. Create `apps/host/src/modules/deck/deck-run-plan.ts` and `apps/host/src/modules/deck/generation-run-plan.ts` matching the signatures in `Interfaces`, reusing existing prompt builders, validation helpers, `EvidenceLedger`, `ImageReviewRun` and `generationReport` without duplicating them.
3. Export `sourceKindsForBrief`, `createDeckRunPlan`, `createGenerationRunPlan` and their public types from `apps/host/src/modules/deck/index.ts`.

- [ ] **Step 5: Build and run `deck-run-plan.test.mjs`**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. Exit code 0.

Run: `node --test apps/host/tests/deck-run-plan.test.mjs`

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 6: Format, build and check**

Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 7: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 8: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: live HTTP requests still pass through legacy `DeckWorkflow` and `GenerationWorkflow` until the cutover task wires `createDeckRunPlan` and `createGenerationRunPlan` in `server.ts`.
- `CHANGELOG.md` line: ``- Add `sourceKindsForBrief`, `createDeckRunPlan` and `createGenerationRunPlan` in `apps/host/src/modules/deck/` with a 16-case `sourceKinds` equivalence test. Task 53 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: add RunPlan and RunContribution builders in apps/host/src/modules/deck`
