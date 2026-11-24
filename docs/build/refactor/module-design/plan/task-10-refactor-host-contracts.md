# Task 10: Refactor Host Contracts Validation and Narrow Exports

Read this file to execute approved findings F3 (request decoder), F6, F7, and F8 in `packages/host/contracts/` and `apps/web/` [[1]](#ref-1) [[2]](#ref-2).

**Goal:** Split `packages/host/contracts/src/validation.ts` into Zod-backed domain validation modules, move pure `AgentRequest` JSON decoding into `host/contracts/`, drop `@deckagent/presentation-document` re-exports, and narrow 18 unused nested exports.

**Scope:** Keep all wire DTO shapes, thrown error strings (`INVALID_RESPONSE` and `INVALID_GENERATION_RESPONSE`), and browser bundle isolation unchanged.

## Files

- Create: `packages/host/contracts/src/validation-primitives.ts`
- Create: `packages/host/contracts/src/request-validation.ts`
- Create: `packages/host/contracts/src/outline-validation.ts`
- Create: `packages/host/contracts/src/generation-validation.ts`
- Create: `packages/host/contracts/tests/validation.test.mjs`
- Modify: `packages/host/contracts/src/brief-validation.ts`
- Modify: `packages/host/contracts/src/index.ts`
- Modify: `apps/web/src/browser/transport/deck-client.ts`
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.browser.json`
- Modify: `pnpm-lock.yaml`
- Modify: `package.json`
- Remove: `packages/host/contracts/src/validation.ts`
- Modify: `docs/build/refactor/module-design/plan/README.md`
- Modify: `docs/build/refactor/module-design/plan/task-10-refactor-host-contracts.md`
- Modify: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-10-refactor-host-contracts.md`

## Steps

- [ ] **Step 1: Create `packages/host/contracts/src/validation-primitives.ts` (F6)**

  Create `packages/host/contracts/src/validation-primitives.ts` exporting shared Zod primitives and helpers used by all four validator files:
  - `nonEmptyText`: `z.string().min(1).refine(s => !!s.trim() && s.isWellFormed())`
  - `entityId`: `z.string().regex(/^[\w-]{1,100}$/)`
  - `nonNegativeInt`: `z.number().int().min(0).refine(Number.isSafeInteger)`
  - `positiveInt`: `z.number().int().positive().refine(Number.isSafeInteger)`
  - `errorCode`: `z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/)`
  - `attachmentId`: `z.string().regex(/^att-[a-f0-9-]{36}$/)`
  - `sourceId`: `z.string().regex(/^src-[a-f0-9-]{36}$/)`
  - `isoTimestamp`: `z.string().refine(s => Number.isFinite(Date.parse(s)))`
  - `invalidResponse(): never` throwing `new Error('INVALID_RESPONSE')`
  - `invalidGenerationResponse(): never` throwing `new Error('INVALID_GENERATION_RESPONSE')`

- [ ] **Step 2: Create `packages/host/contracts/src/request-validation.ts` (F3, F6, F16)**

  Create `packages/host/contracts/src/request-validation.ts` with Zod schemas and zero `as` assertions:

  1. Export `type RequestValidationCode = 'INVALID_REQUEST' | 'REQUEST_EMPTY' | 'REQUEST_TEXT_TOO_LONG'`.
  2. Export `class RequestValidationError extends Error` with `public readonly code: RequestValidationCode` and `this.name = 'RequestValidationError'`.
  3. Export `decodeAttachment(value: unknown): AttachmentView` matching `validation.ts` lines 72 to 145 exactly and throwing `invalidResponse()` on any failure.
  4. Export `requestEvent(value: unknown): RequestEvent` matching `validation.ts` lines 147 to 198 exactly and throwing `invalidResponse()` on any failure.
  5. Export `decodeAgentRequest(value: unknown, maxAttachments: number): AgentRequest`:
     - Port the exact validation rules from `packages/host/api/src/index.ts` lines 98 to 222 using Zod `z.strictObject` schemas (`deckRequestSchema`, `agentRequestSchema`) plus helper `decodeDeckRequest`.
     - Enforce `continueDeck === true` exclusivity with `deck` and non-empty `attachmentIds`.
     - Enforce `attachmentIds` length limit (`<= maxAttachments`), uniqueness, and `attachmentId` regex.
     - Enforce `restoreOutlineId` requires `deck.action === 'restore'` and `imageProviderChoice` requires `deck.imageChoice === 'public-research'`.
     - Throw `new RequestValidationError('REQUEST_EMPTY', 'Request input is empty')` when `input.trim()` is empty and no attachment ID is present.
     - Throw `new RequestValidationError('REQUEST_TEXT_TOO_LONG', 'Request input exceeds the character limit')` when `[...input].length > 16000`.
     - Throw `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')` when `!input.isWellFormed()` or any schema check fails.
     - Return a clean `AgentRequest` object without `as boolean` or any other type assertion.

- [ ] **Step 3: Move brief, outline, and generation decoders into domain modules (F6)**

  1. Update `packages/host/contracts/src/brief-validation.ts`:
     - Import shared primitives from `./validation-primitives.ts`.
     - Add `isDesignSnapshot(value: unknown): value is DesignSnapshot` and `export function decodeBriefView(value: unknown, sessionId: string): BriefView` ported from `validation.ts` lines 199 to 320 using Zod strict schemas and throwing `invalidResponse()` on mismatch.
  2. Create `packages/host/contracts/src/outline-validation.ts`:
     - Export `decodeBoundProposal(value: Record<string, unknown>, sessionId: string): OutlineProposal` ported from `validation.ts` lines 322 to 692 using Zod schemas and small focused helpers (`decodeOutlineSource`, `decodeContentBlock`, `decodeImageReview`, `decodeLayoutIssues`, `decodeProposalSlide`).
     - Keep every function in `outline-validation.ts` under 80 lines. Preserve the source-membership check against `brief.draft.sources.refs` and unique `slideId` check.
  3. Create `packages/host/contracts/src/generation-validation.ts`:
     - Export `decodeGeneration(value: unknown, sessionId: string): GenerationSnapshot` ported from `validation.ts` lines 694 to 766 using Zod schemas, calling `isDesignSnapshot` from `./brief-validation.ts`, and throwing `invalidGenerationResponse()` on mismatch.
  4. Remove `packages/host/contracts/src/validation.ts`.

- [ ] **Step 4: Drop `@deckagent/presentation-document` re-exports and narrow 18 unused exports (F7, F8)**

  1. Update `apps/web/package.json`:
     - Add `"@deckagent/presentation-document": "workspace:*"` in `dependencies` in alphabetical order.
  2. Update `apps/web/tsconfig.browser.json`:
     - Add `{ "path": "../../packages/presentation/document" }` to `references`.
  3. Update `apps/web/src/browser/transport/deck-client.ts`:
     - Import `decodeArtifactDescriptor`, `decodeContentOrigins`, and `decodeSlideDocument` directly from `@deckagent/presentation-document`.
     - Keep `decodeGeneration` and DTO type imports from `@deckagent/host-contracts`.
  4. Sync the workspace lockfile without network access (run outside the sandbox on Windows per pnpm install rule):

     ```bash
     corepack pnpm@11.28.5 install --offline
     ```

     Expected: exit code `0`, linking `@deckagent/presentation-document` into `apps/web/node_modules/@deckagent/`.

  5. Update `packages/host/contracts/src/index.ts`:
     - Remove lines 1 to 6 (`decodeArtifactDescriptor`, `decodeContentOrigins`, `decodeSlideDocument`, `ArtifactDescriptor`, `ContentOrigin`, `SlideDocument`).
     - Remove the remaining 15 unused nested type exports (`CatalogRef`, `DesignSnapshot`, `InterviewTopic`, `ThemeValues`, `ContentBlock`, `DeckSlide`, `GenerationSnapshot`, `ImageAttempt`, `ImageSelection`, `ImageSourceCheck`, `LayoutIssue`, `OutlineChanges`, `OutlineImageReview`, `OutlineTarget`, `WebImageIntent`) while keeping them exported from their source files (`brief.ts`, `deck.ts`).
     - Export `decodeAgentRequest`, `RequestValidationError`, `type RequestValidationCode`, `decodeAttachment`, `requestEvent` from `./request-validation.ts`, `decodeBriefView` from `./brief-validation.ts`, `decodeBoundProposal` from `./outline-validation.ts`, and `decodeGeneration` from `./generation-validation.ts`.

- [ ] **Step 5: Add unit tests for `host/contracts` decoders**

  Create `packages/host/contracts/tests/validation.test.mjs` with the required Testware top comment header [[3]](#ref-3):
  - Import `decodeAgentRequest`, `RequestValidationError`, `decodeAttachment`, `requestEvent`, `decodeBriefView`, `decodeBoundProposal`, and `decodeGeneration` from `../lib/index.js`.
  - Test `decodeAgentRequest` with valid chat input, valid `deck` action, `publicResearch: true`, `REQUEST_EMPTY`, `REQUEST_TEXT_TOO_LONG` at 16001 code points (literal `'x'.repeat(16001)`), `INVALID_REQUEST` on non-boolean `publicResearch`, `continueDeck` combined with `deck`, unknown keys, and duplicate attachment IDs.
  - Test `decodeAttachment`, `requestEvent`, `decodeBriefView`, `decodeBoundProposal`, and `decodeGeneration` error paths (`INVALID_RESPONSE` and `INVALID_GENERATION_RESPONSE`).
  - Add `packages/host/contracts/tests/validation.test.mjs` to `test:tools-browser` in `package.json`.

- [ ] **Step 6: Build, check browser bundle isolation, lint, scan, and run tests**

  Run:

  ```bash
  corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 format:check
  ```

  Expected: exit code `0` with 0 errors.

  Check that the browser bundle stays free of Node built-ins:

  ```bash
  node -e "const fs=require('node:fs'); const txt=fs.readFileSync('apps/web/lib/browser/boot.js','utf8'); const hits=txt.match(/node:[a-z_]+/g)||[]; console.log(JSON.stringify({nodeImports:hits})); if(hits.length) process.exit(1);"
  ```

  Expected: `{"nodeImports":[]}` and exit code `0`.

  Run:

  ```bash
  corepack pnpm@11.28.5 test:tools-browser && corepack pnpm@11.28.5 test:brief-foundation && corepack pnpm@11.28.5 test:outline-workflow && corepack pnpm@11.28.5 test:deck-review && corepack pnpm@11.28.5 test:slide-pipeline
  ```

  Expected: every suite passes with `# fail 0` and `# skipped 0`.

  Run:

  ```bash
  node -e "const cp=require('node:child_process'); const data=JSON.parse(cp.execSync('node scripts/scan-module-design.mjs --json',{encoding:'utf8'})); const a=data.areas.find(x=>x.area==='packages/host/contracts/'); console.log(JSON.stringify({files:a.fileCount,lines:a.totalLines,over400:a.filesOver400,fnOver80:a.functionsOver80,assertions:a.assertionCount}));"
  ```

  Expected: `over400` is `0`, `fnOver80` is `0`, and `assertions` is `0`.

  **STOP** if `tsc -b` fails on declaration emit, if `boot.js` contains any `node:` import, or if any suite fails.

- [ ] **Step 7: Mark task done, write the report, and commit and push**

  1. Mark Steps 1 to 6 as `- [x]` in this file. Update the Task 10 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` with a link to `../reports/task-10-refactor-host-contracts.md`.
  2. Create `docs/build/refactor/module-design/reports/task-10-refactor-host-contracts.md` with:
     - One-sentence purpose line after H1 (`Read this file to ...`).
     - Table of created, modified, and removed files.
     - Before and after counts for `packages/host/contracts/` (files, lines, root exports, files over 400 lines, functions over 80 lines).
     - Exact command results, browser bundle Node-free check, and test counts from Step 6.
  3. Add Task 10 to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` with `0 error(s)`.
  4. Mark Step 7 as `- [x]` in this file.
  5. Stage only the files listed in `Files`, commit with a conventional commit message (example: `refactor(host-contracts): split Zod validators and narrow root exports`), and run `git push`.

  **STOP** and send the Task 10 report with the commit hash. Do not start Task 11 until the owner approves the report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Task 6 Report](../reports/task-06-diagnose-host-contracts-and-api.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)
