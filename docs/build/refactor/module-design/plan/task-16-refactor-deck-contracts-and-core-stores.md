# Task 16: Split presentation/deck contracts and refactor core stores

Read this file to split `packages/presentation/deck/src/contracts.ts`, reduce long core functions under 80 lines, move `generation_intents` SQL into `generation-store.ts`, and replace core `!` assertions (`D3`, `D4`, `D5`, `D6`, `D7`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `packages/presentation/deck/src/contracts.ts` (446 lines)
- `packages/presentation/deck/src/brief.ts` (234 lines)
- `packages/presentation/deck/src/brief-store.ts` (132 lines)
- `packages/presentation/deck/src/bound-outline.ts` (218 lines)
- `packages/presentation/deck/src/outline-store.ts` (198 lines)
- `packages/presentation/deck/src/generation-store.ts` (149 lines)
- `packages/presentation/deck/src/interview.ts` (118 lines)
- `packages/presentation/deck/src/schema.ts` (101 lines)
- `packages/presentation/deck/src/index.ts` (lines 1-145 and lines 315-485)
- `packages/presentation/deck/src/artifact-store.ts` (lines 1-65)
- `packages/presentation/deck/src/image-needs.ts` (38 lines)
- `packages/presentation/deck/src/provenance.ts` (11 lines)

**Files:**

- Create: `packages/presentation/deck/src/errors.ts`
- Create: `packages/presentation/deck/src/brief-contracts.ts`
- Create: `packages/presentation/deck/src/outline-contracts.ts`
- Create: `packages/presentation/deck/src/generation-contracts.ts`
- Create: `packages/presentation/deck/src/deck-contracts.ts`
- Remove: `packages/presentation/deck/src/contracts.ts`
- Change: `packages/presentation/deck/src/brief.ts`
- Change: `packages/presentation/deck/src/brief-store.ts`
- Change: `packages/presentation/deck/src/bound-outline.ts`
- Change: `packages/presentation/deck/src/outline-store.ts`
- Change: `packages/presentation/deck/src/generation-store.ts`
- Change: `packages/presentation/deck/src/interview.ts`
- Change: `packages/presentation/deck/src/schema.ts`
- Change: `packages/presentation/deck/src/index.ts`
- Change: `packages/presentation/deck/src/artifact-store.ts`
- Change: `packages/presentation/deck/src/image-needs.ts`
- Change: `packages/presentation/deck/src/provenance.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-16-refactor-deck-contracts-and-core-stores.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-16-refactor-deck-contracts-and-core-stores.md`

**Interfaces:**

- Produces:
  - `errors.ts`: `DeckError`, `ImagePreparationError`, `deckFailureMessage`, `validId`, `isRecord`, `sha256Hex`
  - `brief-contracts.ts`: `BriefSourceRef`, `InterviewTopic`, `BriefDraft`, `BriefRecord`, `InterviewState`, `BriefSnapshot`, `BriefProposalInput`
  - `outline-contracts.ts`: `OutlineDraft`, `OutlineTarget`, `OutlineChanges`, `OutlineProposal`, `BoundOutlineDraft`, `BoundOutlineInput`, `OutlineSnapshot`, `OutlineReader`
  - `generation-contracts.ts`: `ConfirmationTarget`, `ConfirmationReceipt`, `GenerationSnapshot`, `GenerationGrant`, `DeckOptions`, `PreparedImageAsset`, `ImageCredit`, `PreparedResearchImage`, `ImageNeed`, `ImageSelection`, `ImageSourceCheck`, `ImageAttempt`, `ImageResolver`, `OutlineImageReview`, `StageStatus`, `StageChunk`, `ArtifactPublication`, `ArtifactAsset`, `ContentProvenance`, `GenerationCapability`
  - `deck-contracts.ts`: `ConfirmedDeckPlan`, `DeckSlide`, `DeckSnapshot`, `DeckChange`, `PublishSlide`, `PublishedSlide`, `SlideContent`, `DeckReader`, `DeckPublisher` (keep `DeckPublisher` temporarily in `deck-contracts.ts` until export narrowing completes)
  - `outline-store.ts`: `class OutlineStorage { constructor(db: DatabaseSync, briefs: BriefStorage) ... }`
  - `generation-store.ts`: `GenerationStorage` methods `get`, `insert`, `continueActive`, `admit`, `start`, `finish`, `reconcile`, plus `deckVersion(db: DatabaseSync, sessionId: string): number`

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not rename `DeckService` or change `apps/web/`, `packages/host/`, or test files in this task).
- Remove, skip, or weaken any test or check.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), comments beyond the five allowed reasons, lint-disable directives, or `@ts-expect-error`.
- Commit or push before Step 8 checks pass.

- [ ] **Step 1: Split `contracts.ts` into five focused domain modules and remove `contracts.ts`**

Create these five files with zero `@deckagent/design` re-exports in `brief-contracts.ts` or `deck-contracts.ts`. Keep existing `index.ts` re-exports working temporarily via direct imports from `@deckagent/design` until export narrowing runs:

1. `packages/presentation/deck/src/errors.ts`:
   - Move `DeckError`, `ImagePreparationError`, `failureMessages`, `deckFailureMessage`, and `validId` verbatim from `contracts.ts` lines 388-446.
   - Export `isRecord(value: unknown): value is Record<string, unknown>` returning `Boolean(value) && typeof value === 'object' && !Array.isArray(value)`.
   - Export `sha256Hex(value: string | Uint8Array): string` returning `createHash('sha256').update(value).digest('hex')`.
   - Update the `GenerationGrant` comment or error classes with no behavior change.
2. `packages/presentation/deck/src/brief-contracts.ts`:
   - Move `BriefSourceRef`, `InterviewTopic`, `BriefDraft`, `BriefRecord`, `InterviewState`, `BriefSnapshot`, `BriefProposalInput` (import `CatalogRef`, `DesignSnapshot`, `ThemeValues` as `import type` from `@deckagent/design`, `SourceReference` from `@deckagent/presentation-document`, `briefTopics` from `./brief.ts`, and `OutlineTarget` from `./outline-contracts.ts`).
3. `packages/presentation/deck/src/outline-contracts.ts`:
   - Move `OutlineDraft`, `OutlineTarget`, `OutlineChanges`, `OutlineProposal`, `BoundOutlineDraft`, `BoundOutlineInput`, `OutlineSnapshot`, `OutlineReader` (import `ContentBlock`, `LayoutIssue` as `import type` from `@deckagent/design`, `BriefRecord`, `BriefSourceRef` from `./brief-contracts.ts`, and `OutlineImageReview` from `./generation-contracts.ts`).
4. `packages/presentation/deck/src/generation-contracts.ts`:
   - Move `ConfirmationTarget`, `ConfirmationReceipt`, `GenerationSnapshot`, `GenerationGrant`, `DeckOptions`, `PreparedImageAsset`, `ImageCredit`, `PreparedResearchImage`, `ImageNeed`, `ImageSelection`, `ImageSourceCheck`, `ImageAttempt`, `ImageResolver`, `OutlineImageReview`, `StageStatus`, `StageChunk`, `ArtifactPublication`, `ArtifactAsset`, `ContentProvenance`, `GenerationCapability`.
   - Replace inline `import('@deckagent/design')` references with top-level `import type { ContentBlock, DesignSnapshot, WebImageIntent } from '@deckagent/design'`.
   - Import `BriefSourceRef` from `./brief-contracts.ts`, `OutlineProposal` from `./outline-contracts.ts`, `DeckSlide` and `PublishedSlide` from `./deck-contracts.ts`, and `ContentOrigin`, `FormatAdapter`, `SlideDocument`, `ValidationIssue` from `@deckagent/presentation-document`.
5. `packages/presentation/deck/src/deck-contracts.ts`:
   - Move `ConfirmedDeckPlan`, `DeckSlide`, `DeckSnapshot`, `DeckChange`, `PublishSlide`, `PublishedSlide`, `SlideContent`, `DeckReader`, `DeckPublisher`.
   - Import `ArtifactDescriptor`, `SlideDocument` from `@deckagent/presentation-document`, and `ContentProvenance`, `GenerationSnapshot`, `ImageCredit` from `./generation-contracts.ts`.
6. Remove `packages/presentation/deck/src/contracts.ts`.

Update internal imports in `brief-store.ts`, `artifact-store.ts`, `image-needs.ts`, and `provenance.ts` to point to `./errors.ts` and the new `*-contracts.ts` files.

- [ ] **Step 2: Split `decodeBriefDraft` in `packages/presentation/deck/src/brief.ts` under 80 lines**

Update imports in `brief.ts` to use `./errors.ts` (`DeckError`, `isRecord`) and `./brief-contracts.ts` (`BriefDraft`, `BriefSourceRef`, `InterviewTopic`).
Split `decodeBriefDraft` (currently 111 lines) into three cohesive functions, each under 80 lines:
- `collectCrossFieldIssues(value: Record<string, unknown>, add: (path: string, message: string) => void): void` (lines 151-190 logic).
- `normalizeBriefDraft(data: z.infer<typeof shape>): BriefDraft` (lines 206-233 logic).
- `decodeBriefDraft(value: unknown): BriefDraft` (size check, `shape.safeParse`, call `collectCrossFieldIssues`, throw `DeckError('BRIEF_INVALID', ...)` capped at 64 + overflow issue, return `normalizeBriefDraft(parsed.data)`).

Preserve every error code, path format, and message verbatim.

- [ ] **Step 3: Refactor `schema.ts` and `interview.ts` to remove long `initialize` and 5 `!` assertions**

1. In `packages/presentation/deck/src/schema.ts`:
   - Update import of `DeckError` from `./errors.ts`.
   - Extract `applyMigrations(db: DatabaseSync, version: number): void` covering versions `2` through `10` (keep SQL statements verbatim, under 70 lines).
   - Extract `verifySchema(db: DatabaseSync): void` running `PRAGMA quick_check` with optional chaining (`db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok'`), `PRAGMA foreign_key_check`, and the 12 table `LIMIT 0` queries.
   - In `initialize(db: DatabaseSync): void`:
     - Replace `db.prepare('PRAGMA application_id').get()!.application_id` with `const ownerRow = db.prepare('PRAGMA application_id').get(); if (!ownerRow) throw new DeckError('DECK_SCHEMA'); const owner = Number(ownerRow.application_id)`.
     - Replace `db.prepare('PRAGMA user_version').get()!.user_version` with `const versionRow = db.prepare('PRAGMA user_version').get(); if (!versionRow) throw new DeckError('DECK_SCHEMA'); const version = Number(versionRow.user_version)`.
     - Keep `initialize`, `applyMigrations`, and `verifySchema` each under 75 lines, with zero `!` assertions.
2. In `packages/presentation/deck/src/interview.ts`:
   - Update imports to `./brief-contracts.ts` and `./errors.ts` (`DeckError`).
   - In `skipInterview`, replace lines 113-115 (`listTemplates('html')[0]!.id` and `.version`) with:

```ts
let templateRef: { readonly id: string; readonly version: number } | undefined
if (!draft.template) {
  const defaultTemplate = listTemplates('html')[0]
  if (!defaultTemplate) throw new DeckError('DECK_CONFIG')
  templateRef = { id: defaultTemplate.id, version: defaultTemplate.version }
}
```

   - Spread `...(templateRef ? { template: templateRef } : {})` into the `validateBriefDraft(...)` input.

- [ ] **Step 4: Split `saveBoundOutline` in `bound-outline.ts` and `OutlineStorage.snapshot` in `outline-store.ts`**

1. In `packages/presentation/deck/src/bound-outline.ts`:
   - Import `DeckError`, `isRecord`, `validId` from `./errors.ts`, `BriefRecord` from `./brief-contracts.ts`, and outline types from `./outline-contracts.ts`.
   - Extract `assertBoundOutlinePreconditions(db: DatabaseSync, sessionId: string, input: BoundOutlineInput, brief: BriefRecord, state: OutlineSnapshot): OutlineProposal | undefined` (lines 138-162 checks, returning `previous`).
   - Extract `resolveBoundSlides(draft: BoundOutlineDraft, brief: BriefRecord, state: OutlineSnapshot): OutlineProposal['slides']` (lines 164-184 checks and slide ID assignment).
   - Keep `saveBoundOutline`, `assertBoundOutlinePreconditions`, `resolveBoundSlides`, `validateBoundOutline`, and `outlineChanges` each under 75 lines.
2. In `packages/presentation/deck/src/outline-store.ts`:
   - Import `DeckError`, `isRecord`, `validId` from `./errors.ts` and outline types from `./outline-contracts.ts`.
   - Change constructor to `constructor(private readonly db: DatabaseSync, private readonly briefs: BriefStorage) {}` so `OutlineStorage` reuses the injected `BriefStorage` instead of calling `new BriefStorage(this.db)` inside `.map`.
   - Extract private helper `proposalStatus(outlineId: string, cancelled: unknown, currentId: string | null, confirmedId: string | null): OutlineProposal['status']`.
   - Extract private helpers `decodeBoundProposalRow(sessionId: string, row: Record<string, unknown>, detailPayload: string, currentId: string | null, confirmedId: string | null): OutlineProposal` and `decodeLegacyProposalRow(row: Record<string, unknown>, currentId: string | null, confirmedId: string | null): OutlineProposal`.
   - Keep `snapshot` under 35 lines and both decode helpers under 65 lines.
   - In `propose` (line 166), replace `return this.snapshot(sessionId).proposals.at(-1)!` with:

```ts
const created = this.snapshot(sessionId).proposals.at(-1)
if (!created) throw new DeckError('DECK_CORRUPT')
return created
```

- [ ] **Step 5: Move `generation_intents` SQL writes into `generation-store.ts`**

In `packages/presentation/deck/src/generation-store.ts`:
1. Import `DeckError`, `isRecord`, `validId` from `./errors.ts`, `BriefRecord` from `./brief-contracts.ts`, and `ConfirmationReceipt`, `ConfirmationTarget`, `GenerationSnapshot` from `./generation-contracts.ts`.
2. Export `deckVersion(db: DatabaseSync, sessionId: string): number`:
   - Query `SELECT version FROM decks WHERE session_id=?`.
   - If `!row`, throw `new DeckError('DECK_CORRUPT')`.
   - Return `Number(row.version)`.
3. Add these five methods to `GenerationStorage` (moving SQL verbatim from `index.ts` lines 369-474, with guarded reads and zero `!` assertions):
   - `continueActive(sessionId: string, requestId: string, selection: GenerationSnapshot['selection'], activeRequest?: (sessionId: string, requestId: string) => boolean): number`:
     - Check `generation` exists (`GENERATION_NOT_FOUND`), `generation.state === 'incomplete'` (`GENERATION_ALREADY_STARTED`), `activeRequest?.(sessionId, requestId)` (`GENERATION_REQUEST_INACTIVE`), non-empty `selection.provider` and `selection.model` (`CONFIRMATION_INVALID`).
     - Read `row = this.db.prepare('SELECT payload FROM generation_intents WHERE session_id=?').get(sessionId)`. If `!row`, throw `new DeckError('GENERATION_NOT_FOUND')`.
     - Parse `payload` (`if (!isRecord(payload)) throw new DeckError('DECK_CORRUPT')`), update `generation_intents` to `state='admitted'` with `{ ...payload, activeRequestId: requestId, selection }`, increment `decks.version`, and return `deckVersion(this.db, sessionId)`.
   - `admit(sessionId: string, intentId: string, requestId: string, activeRequest?: (sessionId: string, requestId: string) => boolean): number`:
     - Check `g` matches `intentId` and active `requestId` (`GENERATION_NOT_FOUND`), `activeRequest` (`GENERATION_REQUEST_INACTIVE`), `g.state === 'pending'` (`GENERATION_ALREADY_ADMITTED`), update `state='admitted'`, increment `decks.version`, return `deckVersion(this.db, sessionId)`.
   - `start(sessionId: string, intentId: string, requestId: string, activeRequest?: (sessionId: string, requestId: string) => boolean): { readonly grant: GenerationGrant; readonly version: number }`:
     - Check `activeRequest` (`GENERATION_REQUEST_INACTIVE`), `g` matches (`GENERATION_NOT_FOUND`), `g.state === 'admitted'` and `!(g.startedAt && !g.activeRequestId)` (`GENERATION_ALREADY_STARTED`), update `state='generating'` and `started_at=COALESCE(started_at,?)`, increment `decks.version`, return `{ grant: Object.freeze({ sessionId, intentId, requestId }), version: deckVersion(this.db, sessionId) }`.
   - `finish(sessionId: string, intentId: string, requestId: string, outcome: 'completed' | 'failed' | 'stopped' | 'interrupted'): number | null`:
     - Check `g` matches (`GENERATION_NOT_FOUND`). If `g.state === 'generated' || g.state === 'incomplete'`, return `null`.
     - Check unfinished slides (`SELECT 1 FROM slides WHERE session_id=? AND revision=0`), update `state` to `'generated'` or `'incomplete'`, increment `decks.version`, return `deckVersion(this.db, sessionId)`.
   - `reconcile(requestExists?: (sessionId: string, requestId: string) => boolean): void`:
     - Run the loop from `index.ts` lines 461-471.

- [ ] **Step 6: Wire `index.ts` to the split modules without changing public exports yet**

In `packages/presentation/deck/src/index.ts`:
1. Update all `./contracts.ts` imports and re-exports to point to `./errors.ts`, `./brief-contracts.ts`, `./outline-contracts.ts`, `./generation-contracts.ts`, `./deck-contracts.ts`, and `@deckagent/design` (for `CatalogRef`, `ContentBlock`, `DesignSnapshot`, `ThemeValues`).
2. Construct `this.briefs = new BriefStorage(db)` before `this.outlines = new OutlineStorage(db, this.briefs)`.
3. Delegate `continueGeneration`, `admitGeneration`, `startGeneration`, `finishGeneration`, and `reconcileGenerations` to `this.generations.continueActive`, `.admit`, `.start`, `.finish`, and `.reconcile`, calling `this.notify(sessionId, version)` with the returned version (for `finishGeneration`, preserve the existing behavior: always notify using `version ?? deckVersion(this.db, sessionId)` so existing tests see the same notifications).

- [ ] **Step 7: Build, check boundaries, lint, format, and run deck test suites**

Run:

```bash
corepack pnpm@11.28.5 build
```

Expected: PASS. Exit code `0`.

Run:

```bash
corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. `0 violation(s)` and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write packages/presentation/deck/src/
```

Run quantitative check on the touched core files:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const skip=new Set(['packages/presentation/deck/src/index.ts','packages/presentation/deck/src/artifact-store.ts','packages/presentation/deck/src/image-needs.ts','packages/presentation/deck/src/provenance.ts']); const files=out.files.filter(f=>f.area==='packages/presentation/deck/'&&!skip.has(f.path)).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,as:f.typeAssertions.length,nn};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every listed file has `over400: false`, `longFn: 0`, `as: 0`, and `nn: 0`.

Run all deck-related suites:

```bash
corepack pnpm@11.28.5 test:brief-foundation && corepack pnpm@11.28.5 test:outline-workflow && corepack pnpm@11.28.5 test:deck-review && corepack pnpm@11.28.5 test:slide-pipeline && corepack pnpm@11.28.5 test:generation-publication
```

Expected: PASS. Every suite exits with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 8: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 7 as `- [x]` in this file. Update the Task 16 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-16-refactor-deck-contracts-and-core-stores.md`.
2. Create `docs/build/refactor/module-design/reports/task-16-refactor-deck-contracts-and-core-stores.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, modified, and removed files.
   - Core-file metrics table (`lines`, `longFn`, `as`, `!`).
   - Verification table with commands, exit codes, and test counts.
3. Add a Task 16 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 8 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(deck): split contracts and core store modules`), and run `git push`.

**STOP** and send the Task 16 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
