# Task 25: Refactor deck image research and generation workflow

Read this file to split `image-research.ts` and `generation-workflow.ts`, remove test-only and unused barrel exports from `features/deck/index.ts`, and replace all assertions in those files (`FD1`, `FD3`, `FD4`, `FD6`, `FD7`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/features/deck/index.ts` (8 lines)
- `apps/web/src/features/deck/image-research.ts` (483 lines)
- `apps/web/src/features/deck/generation-workflow.ts` (384 lines)
- `apps/web/tests/image-research.test.mjs` (lines 1-20 and lines 195-300)

**Files:**

- Create: `apps/web/src/features/deck/image-credit.ts`
- Create: `apps/web/src/features/deck/image-review-run.ts`
- Create: `apps/web/src/features/deck/generation-prompts.ts`
- Create: `apps/web/src/features/deck/generation-tools.ts`
- Change: `apps/web/src/features/deck/image-research.ts`
- Change: `apps/web/src/features/deck/generation-workflow.ts`
- Change: `apps/web/src/features/deck/index.ts`
- Change: `apps/web/tests/image-research.test.mjs`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-25-refactor-deck-image-research-and-generation-workflow.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-25-refactor-deck-image-research-and-generation-workflow.md`

**Interfaces:**

- Produces:
  - `apps/web/src/features/deck/image-credit.ts`: `imagePageCredit(html: string, imageUrl: string, sourceUrl: string, rejected?: (code: string) => void): ImageCredit | undefined` (internal to `features/deck/` only)
  - `apps/web/src/features/deck/image-review-run.ts`: `Candidate`, `ImageReviewRun` (internal to `features/deck/` only)
  - `apps/web/src/features/deck/generation-prompts.ts`: `generationToolSchemas`, `buildGenerationContext`, `buildGenerationInstructions`
  - `apps/web/src/features/deck/generation-tools.ts`: `createGenerationTools`
  - `apps/web/src/features/deck/index.ts`: removes `OutlineNotFoundReason` and `imagePageCredit` (`7` exports remain)

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `deck-workflow.ts`, `brief-service.ts`, `confirmation-service.ts`, or `apps/web/src/index.ts` in this task).
- Re-export `imagePageCredit`, `ImageReviewRun`, or `OutlineNotFoundReason` from `apps/web/src/features/deck/index.ts`.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 6 checks pass.

- [ ] **Step 1: Update `apps/web/tests/image-research.test.mjs` to test JSON-LD license rules through `WebImageResearch.prepare` (`FD1`)**

1. On line 5 of `apps/web/tests/image-research.test.mjs`, change the import to `import { WebImageResearch } from '../lib/types/features/deck/index.js'`.
2. Replace lines 197-231 (`test('licence evidence must identify the exact image and an accepted licence', ...)`) with an async test that exercises every exact JSON-LD rule through `WebImageResearch.prepare` with a fake `reader`:

```js
test('licence evidence must identify the exact image and an accepted licence', async t => {
  const imageUrl = 'https://photos.example/solar.png'
  const item = {
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    creator: { name: 'Author' },
    license: credit.licenseUrl,
  }
  const prepareWith = async payload => {
    const html = `<script type="application/ld+json">${JSON.stringify(payload)}</script>`
    const images = new WebImageResearch(
      { imageSearch: async () => [] },
      { candidates: async () => [] },
      {
        read: async url => (url === imageUrl ? png : Buffer.from(html)),
      },
    )
    t.after(() => images.close())
    return images.prepare(
      { candidateId: 'json-ld-check', imageUrl, title: '', description: 'Solar', sourceUrl: credit.url },
      AbortSignal.timeout(5000),
    )
  }
  assert.equal((await prepareWith(item)).credit.license, 'CC BY')
  await assert.rejects(prepareWith({ ...item, contentUrl: 'https://photos.example/other.png' }), {
    code: 'RESEARCH_IMAGE_LICENSE_REQUIRED',
  })
  await assert.rejects(prepareWith({ ...item, license: 'https://creativecommons.org/licenses/by-sa/4.0/' }), {
    code: 'RESEARCH_IMAGE_LICENSE_UNSUPPORTED',
  })
  await assert.rejects(prepareWith({ ...item, '@type': 'Article' }), {
    code: 'RESEARCH_IMAGE_LICENSE_REQUIRED',
  })
  assert.equal((await prepareWith({ ...item, license: { '@id': credit.licenseUrl } })).credit.license, 'CC BY')
  await assert.rejects(prepareWith({ ...item, license: 'https://creativecommons.org/licenses/by-nc/4.0/' }), {
    code: 'RESEARCH_IMAGE_LICENSE_UNSUPPORTED',
  })
})
```

- [ ] **Step 2: Split `image-research.ts` into `image-credit.ts`, `image-review-run.ts`, and `image-research.ts` (`FD1`, `FD3`, `FD7`)**

1. Create `apps/web/src/features/deck/image-credit.ts`:
   - Move `imagePageCredit` and its JSON-LD parsing logic from `image-research.ts` lines 23-24 and 42-115.
   - Replace `match[1]!` (line 54) with `const raw = match[1]; if (!raw) continue; items.push(JSON.parse(raw))`.
   - Replace `reference(item.license)!` (line 76) with `const link = reference(item.license)` bound once before the `if` condition.
   - Extract private helper `extractImageObjectCredit(item, imageUrl, sourceUrl, rejected)` so every function is under 65 lines.
2. Create `apps/web/src/features/deck/image-review-run.ts`:
   - Move `Candidate`, `NeedState`, and `ImageReviewRun` from `image-research.ts` lines 25-40 and 254-483.
   - Split `ImageReviewRun.select` into private helpers `resolveRankedChoices(state, candidateId, reason, alternatives)`, `attemptChoice(state, version, choice)`, and `recordAttemptFailure(state, candidate, error)`.
   - Return `readonly { readonly candidate: Candidate; readonly reason: string }[]` from `resolveRankedChoices` so `select` iterates resolved `Candidate` objects with zero `!` assertions (replacing line 407).
   - Keep every function in `image-review-run.ts` under 70 lines.
3. Update `apps/web/src/features/deck/image-research.ts`:
   - Keep `WebImageResearch` (with `close`, `open`, `candidates`, and `prepare`) and import `imagePageCredit` from `./image-credit.ts` and `ImageReviewRun` + `type Candidate` from `./image-review-run.ts`.
   - Split `WebImageResearch.prepare` into private methods `prepareCommonsCandidate`, `resolveSourceCredit`, `readCachedPage`, and `downloadAndNormalize` so every function is under 65 lines.
   - Keep `image-research.ts` under 180 lines.
4. Update `apps/web/src/features/deck/index.ts`:
   - Remove line 2 (`export type { OutlineNotFoundReason } from './failures.ts'`).
   - Change line 8 to `export { WebImageResearch } from './image-research.ts'`.

- [ ] **Step 3: Create `generation-prompts.ts` and `generation-tools.ts` (`FD4`, `FD6`)**

1. Create `apps/web/src/features/deck/generation-prompts.ts`:
   - Move `operations` and `schemas` (export as `generationToolSchemas`) from `generation-workflow.ts` lines 15-45.
   - Export `buildGenerationContext(plan, files, attachments, research)` (lines 78-94 logic).
   - Export `buildGenerationInstructions(plan, context, portable)` (lines 95-121 logic).
   - Keep every function in `generation-prompts.ts` under 70 lines.
2. Create `apps/web/src/features/deck/generation-tools.ts`:
   - Add local type predicates:

```ts
function isSourceKind(value: unknown): value is BriefSourceRef['kind'] {
  return value === 'attachment' || value === 'project-file' || value === 'approved-file' || value === 'research'
}

function isProvenanceKind(value: unknown): value is ContentProvenance['kind'] {
  return value === 'fact' || value === 'wording' || value === 'placeholder'
}
```

   - Extract `createEvidenceLedger(attachments)` (`remember` and `get`, using `isSourceKind` with zero `as` assertions).
   - Extract `parseProvenanceEntries(rawEntries, evidence)` using `isProvenanceKind` and a local `const quote = ...` binding so `quote` narrows to `string` with zero `as` assertions (replacing lines 283 and 296).
   - Extract `callAuthorizedSourceTool(...)` (lines 170-222 logic).
   - Extract `dispatchStageTool(...)` and `dispatchPublishOrContentTool(...)` (lines 236-365 logic, each under 70 lines).
   - Export `createGenerationTools(...)` returning the `RequestTools` object (under 65 lines).
   - Keep every function in `generation-tools.ts` under 75 lines, with zero `as` and zero `!`.

- [ ] **Step 4: Simplify `apps/web/src/features/deck/generation-workflow.ts` (`FD4`, `FD7`)**

In `apps/web/src/features/deck/generation-workflow.ts`:
1. Keep `export class GenerationWorkflow implements RequestRuntime` with its exact constructor `(runtime, sessions)` and `prepare(request)` signature.
2. Extract private method `startRun(prepared, run)` (under 65 lines).
3. Replace `plan.outline.brief!.draft` (line 66) with:

```ts
const briefRecord = plan.outline.brief
if (!briefRecord) return { status: 'failed', errorCode: 'BRIEF_NOT_FOUND' }
const brief = briefRecord.draft
```

4. Call `buildGenerationContext`, `buildGenerationInstructions`, and `createGenerationTools` from `./generation-prompts.ts` and `./generation-tools.ts`.
5. Keep `generation-workflow.ts` under 90 lines and every function under 70 lines.

- [ ] **Step 5: Build, check boundaries, lint, format, check AST metrics, and run deck generation and image suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/features/deck/ apps/web/tests/image-research.test.mjs
```

Run quantitative check on the touched `features/deck/` files:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const target=new Set(['apps/web/src/features/deck/image-research.ts','apps/web/src/features/deck/image-credit.ts','apps/web/src/features/deck/image-review-run.ts','apps/web/src/features/deck/generation-workflow.ts','apps/web/src/features/deck/generation-prompts.ts','apps/web/src/features/deck/generation-tools.ts','apps/web/src/features/deck/index.ts']); const files=out.files.filter(f=>target.has(f.path)).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,as:f.typeAssertions.length,nn,exports:f.exportCount};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every listed file has `over400: false`, `longFn: 0`, `as: 0`, and `nn: 0`, and `index.ts` has `exports: 7`.

Run image, generation, and slide pipeline suites:

```bash
corepack pnpm@11.28.5 test:images && corepack pnpm@11.28.5 test:generation-publication && corepack pnpm@11.28.5 test:slide-pipeline
```

Expected: PASS. All three suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 6: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 5 as `- [x]` in this file. Update the Task 25 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-25-refactor-deck-image-research-and-generation-workflow.md`.
2. Create `docs/build/refactor/module-design/reports/task-25-refactor-deck-image-research-and-generation-workflow.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created and modified files.
   - Metrics table for the seven touched `features/deck/` files (`lines`, `longFn`, `as`, `!`, `exports`).
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 25 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 6 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(deck): split image research and generation workflow`), and run `git push`.

**STOP** and send the Task 25 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
