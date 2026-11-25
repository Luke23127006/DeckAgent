# Task 18: Rename DeckService to DeckStore, narrow exports, and check contract parity

Read this file to extract `deck-publication.ts` and `deck-store.ts`, narrow `@deckagent/deck` to 31 root exports, drop `./brief`, add `contract-sync.ts` checks, and update all callers (`D2`, `D3`, `D4`, `D5`, `D7`, `D8`, `D14`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `packages/presentation/deck/package.json`
- `packages/presentation/deck/src/index.ts`
- `packages/presentation/deck/src/deck-contracts.ts`
- `packages/host/api/src/contract-sync.ts` (38 lines)
- `scripts/build-workspace.mjs` (lines 30-40)
- `apps/web/src/features/deck/generation-workflow.ts` (lines 1-15)
- `apps/web/src/features/deck/deck-workflow.ts` (lines 1-20, 80-95)
- `packages/presentation/deck/tests/deck-brief.test.mjs` (lines 1-80)
- `tests/check-boundaries.test.mjs` (lines 15-88 and lines 168-177)
- `tests/oxlint-boundaries.test.mjs` (lines 87-96)

**Files:**

- Create: `packages/presentation/deck/src/deck-publication.ts`
- Create: `packages/presentation/deck/src/deck-store.ts`
- Change: `packages/presentation/deck/src/index.ts`
- Change: `packages/presentation/deck/src/deck-contracts.ts`
- Change: `packages/presentation/deck/package.json`
- Change: `scripts/build-workspace.mjs`
- Change: `packages/host/api/src/contract-sync.ts`
- Change: `apps/web/src/index.ts`
- Change: `apps/web/src/features/chats/index.ts`
- Change: `apps/web/src/features/deck/brief-service.ts`
- Change: `apps/web/src/features/deck/confirmation-service.ts`
- Change: `apps/web/src/features/deck/deck-workflow.ts`
- Change: `apps/web/src/features/deck/generation-report.ts`
- Change: `apps/web/src/features/deck/generation-workflow.ts`
- Change: `packages/presentation/deck/tests/artifact-publication.test.mjs`
- Change: `packages/presentation/deck/tests/bound-outline.test.mjs`
- Change: `packages/presentation/deck/tests/deck-brief.test.mjs`
- Change: `packages/presentation/deck/tests/deck-service.test.mjs`
- Change: `packages/presentation/deck/tests/generation-confirmation.test.mjs`
- Change: `packages/presentation/deck/tests/generation-continuation.test.mjs`
- Change: `packages/presentation/deck/tests/outline-state.test.mjs`
- Change: `apps/web/tests/image-research.test.mjs`
- Change: `apps/web/tests/outline-client.test.mjs`
- Change: `apps/web/tests/research-image-generation.test.mjs`
- Change: `e2e/artifact-rendering.test.mjs`
- Change: `e2e/browser-smoke.test.mjs`
- Change: `e2e/confirmation-host.test.mjs`
- Change: `e2e/deck-pipeline.test.mjs`
- Change: `e2e/generation-bridge.test.mjs`
- Change: `e2e/generation-continuation-http.test.mjs`
- Change: `e2e/layout-review-browser.test.mjs`
- Change: `e2e/opencode-generation-live.test.mjs`
- Change: `e2e/portable-generation.test.mjs`
- Change: `packages/presentation/html/tests/html-template-v3.test.mjs`
- Change: `tests/check-boundaries.test.mjs`
- Change: `tests/oxlint-boundaries.test.mjs`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-18-rename-deck-store-narrow-exports-and-contract-sync.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-18-rename-deck-store-narrow-exports-and-contract-sync.md`

**Interfaces:**

- Produces:
  - `packages/presentation/deck/src/index.ts` (31 root exports):
    - `12` values: `DeckStore`, `DeckError`, `ImagePreparationError`, `deckFailureMessage`, `briefContractVersion`, `briefJsonSchema`, `validateBriefDraft`, `interviewState`, `skipInterview`, `validateBoundOutline`, `validateConfirmation`, `outlineImageNeeds`.
    - `19` types: `BriefDraft`, `BriefSourceRef`, `InterviewState`, `BoundOutlineDraft`, `OutlineReader`, `ConfirmationReceipt`, `ContentProvenance`, `GenerationCapability`, `GenerationGrant`, `ImageAttempt`, `ImageCredit`, `ImageNeed`, `ImageSelection`, `ImageSourceCheck`, `OutlineImageReview`, `PreparedResearchImage`, `ConfirmedDeckPlan`, `DeckChange`, `DeckReader`.
  - `packages/presentation/deck/package.json`: `exports` contains only `"."`.
  - `packages/host/api/src/contract-sync.ts`: compile-time `AssertEqual` checks across all 9 `session-persistence` pairs plus all 16 `deck` and `design` DTO pairs.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change `tests/scan-module-design.test.mjs` (its `DeckService` string fixtures test `*Service` detection).
- Change any file outside `Files`.
- Remove, skip, or weaken any test or check.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), comments beyond the five allowed reasons, lint-disable directives, or `@ts-expect-error`.
- Commit or push before Step 8 checks pass.

- [x] **Step 1: Create `deck-publication.ts` and `deck-store.ts`, remove `DeckPublisher`, and remove all remaining `!` assertions**

1. Remove `DeckPublisher` from `packages/presentation/deck/src/deck-contracts.ts`.
2. Create `packages/presentation/deck/src/deck-publication.ts` (under 300 lines, every function under 75 lines, zero `!`, zero `as`):
   - Define `PublicationHost` internal context interface providing `db`, `artifacts`, `options`, `publicationsInFlight`, `granted(grant)`, `snapshot(sessionId)`, `hasGeneration(sessionId)`, `access`, `asyncAccess`, `transaction`, and `notify`.
   - Extract shared helper `readSavedPublicationReceipt(row, expectedFingerprint, sessionId, slideId, expectedRevision, strictLegacyFields)` so artifact pre-check, concurrent retry check, and legacy `publish` share one guarded receipt decoder (throwing `DECK_PUBLICATION_CONFLICT` or `DECK_CORRUPT`).
   - Extract `publishArtifactFromStage(host, grant, input, signal)` split into `validateArtifactPublicationInput`, `commitPreparedArtifact` (guards `deck` row with `if (!deck) throw new DeckError('DECK_NOT_CONFIRMED')`, removing `index.ts:713` `!`), and `publishArtifactFromStage` (under 65 lines).
   - Extract `publishLegacySlide(host, sessionId, input, signal)` split into `validateLegacyPublication` + `publishLegacySlide` (under 65 lines).
   - Extract `createGenerationCapability(host, grant, signal): GenerationCapability` keeping `beginStage`, `appendStage`, `attachStageImage`, and `publishArtifact` private inside this module (hidden from `DeckStore` public methods). In `begin(...)`, reuse `{ generation } = host.access(() => host.granted(grant))` instead of `this.generations.get(grant.sessionId)!` (removes `index.ts:548` `!`). Split capability method factories into small helpers so `createGenerationCapability` stays under 65 lines.
3. Create `packages/presentation/deck/src/deck-store.ts` (under 360 lines, every method under 65 lines, zero `!`, zero `as`):
   - Rename `export class DeckService implements DeckReader, DeckPublisher` to `export class DeckStore implements DeckReader`.
   - Remove public `beginStage`, `appendStage`, `attachStageImage`, and `publishArtifact` methods (delegated internally inside `generationCapability`).
   - Delegate `generationCapability`, `publish`, and artifact publication to `deck-publication.ts`.
   - In `snapshot`: bind `const generation = this.generations.get(sessionId)` once and spread `...(generation ? { generation } : {})` (removes `index.ts:806` `!`).
   - In `slideMetadata` and `content`: bind `const notes = this.readback.notes(...)` once and spread `...(notes ? { notes } : {})` (removes `index.ts:944` and `971` `!` and duplicate parses).

- [x] **Step 2: Reduce `packages/presentation/deck/src/index.ts` to 31 root exports and remove `./brief` subpath**

1. Replace `packages/presentation/deck/src/index.ts` with a pure barrel exporting exactly these 31 symbols:
   - Values (`12`):
     - `DeckStore` from `./deck-store.ts`
     - `DeckError`, `ImagePreparationError`, `deckFailureMessage` from `./errors.ts`
     - `briefContractVersion`, `briefJsonSchema` from `./brief.ts`
     - `validateBriefDraft` from `./brief-store.ts`
     - `interviewState`, `skipInterview` from `./interview.ts`
     - `validateBoundOutline` from `./bound-outline.ts`
     - `validateConfirmation` from `./generation-store.ts`
     - `outlineImageNeeds` from `./image-store.ts`
   - Types (`19`):
     - `BriefDraft`, `BriefSourceRef`, `InterviewState` from `./brief-contracts.ts`
     - `BoundOutlineDraft`, `OutlineReader` from `./outline-contracts.ts`
     - `ConfirmationReceipt`, `ContentProvenance`, `GenerationCapability`, `GenerationGrant`, `ImageAttempt`, `ImageCredit`, `ImageNeed`, `ImageSelection`, `ImageSourceCheck`, `OutlineImageReview`, `PreparedResearchImage` from `./generation-contracts.ts`
     - `ConfirmedDeckPlan`, `DeckChange`, `DeckReader` from `./deck-contracts.ts`
2. In `packages/presentation/deck/package.json`, remove the `"./brief"` entry from `"exports"` so `"exports"` contains only `"."`.
3. In `scripts/build-workspace.mjs` line 35, remove `'@deckagent/deck': ['lib/types/brief.js'],` from `extraEntries`.

- [x] **Step 3: Add 16 `AssertEqual` checks in `packages/host/api/src/contract-sync.ts`**

Extend `packages/host/api/src/contract-sync.ts` (type-only imports only, keeping `host/api` free of runtime `@deckagent/deck` imports):
1. Import from `@deckagent/host-contracts`: `BriefDraft as HostBriefDraft`, `BriefRecord as HostBriefRecord`, `BriefSnapshot as HostBriefSnapshot`, `BriefSourceRef as HostBriefSourceRef`, `ConfirmationReceipt as HostConfirmationReceipt`, `ConfirmationTarget as HostConfirmationTarget`, `DeckChange as HostDeckChange`, `DeckSnapshot as HostDeckSnapshot`, `ImageCredit as HostImageCredit`, `InterviewState as HostInterviewState`, `OutlineProposal as HostOutlineProposal`, `OutlineSnapshot as HostOutlineSnapshot`, `SlideContent as HostSlideContent`.
2. Import from `@deckagent/deck`: `BriefDraft as DeckBriefDraft`, `BriefSourceRef as DeckBriefSourceRef`, `ConfirmationReceipt as DeckConfirmationReceipt`, `DeckChange as DeckDeckChange`, `DeckReader`, `DeckStore`, `ImageCredit as DeckImageCredit`, `InterviewState as DeckInterviewState`, `OutlineReader`.
3. Derive nested domain and design types without expanding package exports:
   - `type DeckDeckSnapshot = ReturnType<DeckReader['snapshot']>`
   - `type DeckSlideContent = ReturnType<DeckReader['content']>`
   - `type DeckOutlineSnapshot = ReturnType<OutlineReader['outlineSnapshot']>`
   - `type DeckOutlineProposal = DeckOutlineSnapshot['proposals'][number]`
   - `type DeckBriefRecord = NonNullable<DeckOutlineProposal['brief']>`
   - `type DeckBriefSnapshot = ReturnType<DeckStore['briefSnapshot']>`
   - `type DeckConfirmationTarget = Pick<DeckConfirmationReceipt, 'confirmationId' | 'outlineId' | 'outlineVersion' | 'briefId' | 'briefVersion'>`
   - `type HostContentBlock = NonNullable<HostOutlineProposal['slides'][number]['blocks']>[number]`
   - `type DeckContentBlock = NonNullable<DeckOutlineProposal['slides'][number]['blocks']>[number]`
   - `type HostWebImageIntent = NonNullable<Extract<HostContentBlock, { kind: 'web-image' }>['intent']>`
   - `type DeckWebImageIntent = NonNullable<Extract<DeckContentBlock, { kind: 'web-image' }>['intent']>`
   - `type HostLayoutIssue = NonNullable<HostOutlineProposal['layoutIssues']>[number]`
   - `type DeckLayoutIssue = NonNullable<DeckOutlineProposal['layoutIssues']>[number]`
4. Intersect all 16 `AssertEqual<Host*, Deck*>` checks into `AllSynced` (9 existing persistence pairs + 16 deck and design pairs = 25 total pairs).

- [x] **Step 4: Update `apps/web/src/` callers (`D2`, `D3`, `D5`)**

1. `apps/web/src/features/deck/generation-workflow.ts` line 3: import `DeckError` from `@deckagent/deck` and import `FormatError, decodeSlideDocument` from `@deckagent/presentation-document`.
2. `apps/web/src/features/deck/deck-workflow.ts` lines 2-11: move `briefContractVersion` and `briefJsonSchema` into the `@deckagent/deck` root import, remove line 11 (`@deckagent/deck/brief`), and rename `DeckService` to `DeckStore` (lines 10 and 86).
3. Rename `DeckService` to `DeckStore` in:
   - `apps/web/src/index.ts` (lines 11, 96, 117)
   - `apps/web/src/features/chats/index.ts` (lines 1, 18)
   - `apps/web/src/features/deck/brief-service.ts` (lines 2, 12)
   - `apps/web/src/features/deck/confirmation-service.ts` (lines 2, 14)
   - `apps/web/src/features/deck/generation-report.ts` (lines 1, 6)

- [x] **Step 5: Update test files for `DeckStore` and removed `./brief` subpath**

1. In `packages/presentation/deck/tests/deck-brief.test.mjs`:
   - Line 6: import `{ DeckStore, validateBriefDraft, briefJsonSchema }` from `'../lib/index.js'`.
   - Remove line 10 (`import { decodeBriefDraft, briefJsonSchema } from '../lib/brief.js'`).
   - Line 61: call `validateBriefDraft(input)` instead of `decodeBriefDraft(input)`.
   - Replace `DeckService` with `DeckStore` on lines 106, 122, 132, 189, 206, 212.
2. Rename `DeckService` to `DeckStore` in these 19 test files:
   - `packages/presentation/deck/tests/artifact-publication.test.mjs` (lines 7, 16, 128, 392, 469)
   - `packages/presentation/deck/tests/bound-outline.test.mjs` (lines 6, 30, 99, 150)
   - `packages/presentation/deck/tests/deck-service.test.mjs` (lines 6, 26, 50, 68)
   - `packages/presentation/deck/tests/generation-confirmation.test.mjs` (lines 6, 46, 71, 80)
   - `packages/presentation/deck/tests/generation-continuation.test.mjs` (lines 7, 13, 30)
   - `packages/presentation/deck/tests/outline-state.test.mjs` (lines 7, 24, 43, 84, 100)
   - `apps/web/tests/image-research.test.mjs` (lines 6, 448, 455, 567, 578)
   - `apps/web/tests/outline-client.test.mjs` (lines 7, 14)
   - `apps/web/tests/research-image-generation.test.mjs` (lines 6, 69)
   - `e2e/artifact-rendering.test.mjs` (lines 7, 60, 163)
   - `e2e/browser-smoke.test.mjs` (lines 12, 406, 1378)
   - `e2e/confirmation-host.test.mjs` (lines 6, 33, 82)
   - `e2e/deck-pipeline.test.mjs` (lines 8, 65, 89)
   - `e2e/generation-bridge.test.mjs` (lines 6, 48)
   - `e2e/generation-continuation-http.test.mjs` (lines 6, 34)
   - `e2e/layout-review-browser.test.mjs` (lines 8, 111, 162)
   - `e2e/opencode-generation-live.test.mjs` (lines 8, 150)
   - `e2e/portable-generation.test.mjs` (lines 7, 42, 86)
   - `packages/presentation/html/tests/html-template-v3.test.mjs` (lines 6, 108)
3. Update the two root boundary test files:
   - `tests/check-boundaries.test.mjs`: change line 22 to `exports: { '.': './lib/index.js' }`, change lines 46 and 51 from `'@deckagent/deck/brief'` to `'@deckagent/host-contracts'`, and rename `DeckService` to `DeckStore` on lines 70, 81, 171.
   - `tests/oxlint-boundaries.test.mjs`: rename `DeckService` to `DeckStore` on line 90.

- [x] **Step 6: Build, lint, check boundaries, format, and check AST targets**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Format all changed TypeScript and JavaScript files in `packages/presentation/deck/src/`, `packages/host/api/src/contract-sync.ts`, and `scripts/build-workspace.mjs`:

```bash
npx biome format --write packages/presentation/deck/src/ packages/host/api/src/contract-sync.ts scripts/build-workspace.mjs
```

Run AST and symbol sweep check:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const area=out.areas.find(a=>a.area==='packages/presentation/deck/'); const files=out.files.filter(f=>f.area==='packages/presentation/deck/'); let nn=0; for(const f of files){const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf);} const idx=fs.readFileSync('packages/presentation/deck/src/index.ts','utf8'); const sfIdx=ts.createSourceFile('index.ts',idx,ts.ScriptTarget.Latest,true); let rootExports=0; for(const s of sfIdx.statements){if(ts.isExportDeclaration(s)&&s.exportClause&&ts.isNamedExports(s.exportClause)) rootExports+=s.exportClause.elements.length;} const all=execFileSync('git',['ls-files','apps','packages','e2e','tests','scripts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js|json)$/.test(f)&&f!=='tests/scan-module-design.test.mjs'); const leftovers=all.filter(f=>{const t=fs.readFileSync(f,'utf8'); return /\bDeckService\b/.test(t)||t.includes('@deckagent/deck/brief');}); console.log(JSON.stringify({area,nonNullTotal:nn,rootExports,leftovers},null,2));"
```

Expected: PASS. `area.filesOver400 === 0`, `area.functionsOver80 === 0`, `area.smallNonBarrelFiles === 0`, `area.typeAssertions === 0`, `area.serviceSymbols === 0`, `nonNullTotal === 0`, `rootExports === 31`, and `leftovers` is `[]`.

- [x] **Step 7: Run root tool tests and Deck test suites**

Run:

```bash
node --test tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs
```

Expected: PASS. `# fail 0` and `# skipped 0`.

Run:

```bash
corepack pnpm@11.28.5 test:brief-foundation && corepack pnpm@11.28.5 test:outline-workflow && corepack pnpm@11.28.5 test:deck-review && corepack pnpm@11.28.5 test:slide-pipeline && corepack pnpm@11.28.5 test:generation-publication && corepack pnpm@11.28.5 test:images && corepack pnpm@11.28.5 test:layouts && corepack pnpm@11.28.5 test:browser-smoke
```

Expected: PASS. Every suite exits with code `0`, `# fail 0`, and `# skipped 0`.

- [x] **Step 8: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 7 as `- [x]` in this file. Update the Task 18 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-18-rename-deck-store-narrow-exports-and-contract-sync.md`.
2. Create `docs/build/refactor/module-design/reports/task-18-rename-deck-store-narrow-exports-and-contract-sync.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Before and after `packages/presentation/deck/` metrics (`files`, `lines`, `filesOver400`, `functionsOver80`, `smallNonBarrelFiles`, `typeAssertions`, `nonNullTotal`, `serviceSymbols`, `rootExports`).
   - Exact list of the 31 root exports and 25 `contract-sync.ts` `AssertEqual` pairs.
   - Verification results for build, boundaries, lint, root tool tests, and all 8 Deck suites.
3. Add a Task 18 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 8 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(deck): rename DeckStore, narrow exports, and sync contracts`), and run `git push`.

**STOP** and send the Task 18 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
