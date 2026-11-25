# Task 17: Split deck artifact storage, extract image store, and guard assertions

Read this file to decompose `artifact-store.ts`, fold `provenance.ts` and `image-needs.ts`, guard all artifact assertions, and add corrupt-JSON tests (`D1`, `D10`, `D11`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `docs/conventions/testware.md`
- `packages/presentation/deck/src/artifact-store.ts` (985 lines)
- `packages/presentation/deck/src/image-needs.ts` (38 lines)
- `packages/presentation/deck/src/provenance.ts` (11 lines)
- `packages/presentation/deck/src/errors.ts`
- `packages/presentation/deck/src/generation-contracts.ts`
- `packages/presentation/deck/src/index.ts` (lines 90-125, 145-307, 913-996)
- `packages/presentation/deck/tests/artifact-publication.test.mjs` (lines 1-120 and lines 420-474)

**Files:**

- Create: `packages/presentation/deck/src/artifact-fs.ts`
- Create: `packages/presentation/deck/src/image-store.ts`
- Create: `packages/presentation/deck/src/artifact-readback.ts`
- Change: `packages/presentation/deck/src/artifact-store.ts`
- Change: `packages/presentation/deck/src/index.ts`
- Remove: `packages/presentation/deck/src/provenance.ts`
- Remove: `packages/presentation/deck/src/image-needs.ts`
- Test: `packages/presentation/deck/tests/artifact-publication.test.mjs`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-17-refactor-deck-artifacts-and-image-store.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-17-refactor-deck-artifacts-and-image-store.md`

**Interfaces:**

- Uses: `DeckError`, `ImagePreparationError`, `isRecord`, `sha256Hex`, `validId` from `./errors.ts`.
- Produces:
  - `artifact-fs.ts`: `ArtifactFileStore` (`root`, `path`, `exists`, `write`, `read`, `remove`, `listFiles`), `PNG_MAGIC`, `IMAGE_LICENSES`, `isValidPngBytes`, `isValidImageCredit`, `validateProvenance`, `parseJsonObject`, `parsePreparedRecord`, `PreparedRecord`
  - `image-store.ts`: `outlineImageNeeds`, `PreparedImageStore` (`prepareImages`, `commitImages`, `reserveImageSearch`, `preparedRecord`, `imageReview`, `imagePreview`, `restoredImage`, `imageBlockers`)
  - `artifact-readback.ts`: `ArtifactReadback` (`provenance`, `notes`, `imageMetadata`, `metadata`, `content`, `native`, `recover`)
  - `artifact-store.ts`: `PreparedArtifact`, `ArtifactStorage` (`begin`, `setDocument`, `draft`, `append`, `setProvenance`, `asset`, `researchImage`, `prepare`, `receiptFingerprint`, `removeValidationArtifact`, `published`, `discard`)

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not rename `DeckService` or edit `apps/web/` in this task).
- Remove, skip, or weaken any test or check.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), comments beyond the five allowed reasons, lint-disable directives, or `@ts-expect-error`.
- Commit or push before Step 8 checks pass.

- [ ] **Step 1: Add fail-first tests for corrupt SQLite JSON in `packages/presentation/deck/tests/artifact-publication.test.mjs`**

Append these two tests at the end of `packages/presentation/deck/tests/artifact-publication.test.mjs`:

```js
test('corrupt prepared_images JSON fails with ARTIFACT_CORRUPT instead of DECK_STORAGE', async t => {
  const f = await fixture(t, {}, { web: true })
  const db = new DatabaseSync(join(f.dir, 'deck.sqlite'))
  t.after(() => db.close())
  db.prepare('INSERT INTO prepared_images VALUES(?,?,?,?)').run(
    'chat',
    f.p.outlineId,
    'corrupt-key',
    '{not-valid-json',
  )
  assert.throws(() => f.decks.outlineSnapshot('chat'), { code: 'ARTIFACT_CORRUPT' })
})

test('corrupt artifact_revisions manifest JSON fails with ARTIFACT_CORRUPT on notes and provenance readback', async t => {
  const f = await fixture(t)
  const db = new DatabaseSync(join(f.dir, 'deck.sqlite'))
  t.after(() => db.close())
  const slideId = f.p.slides[0].slideId
  db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run('chat', slideId, 1, '')
  db.prepare('INSERT INTO artifact_revisions VALUES(?,?,?,?,?,?)').run(
    'chat',
    slideId,
    1,
    'artifact-00000000-0000-0000-0000-000000000001',
    'a'.repeat(64),
    '{not-valid-json',
  )
  assert.throws(() => f.decks.provenance('chat', slideId, 1), { code: 'ARTIFACT_CORRUPT' })
  assert.throws(() => f.decks.slideMetadata('chat', slideId, 1), { code: 'ARTIFACT_CORRUPT' })
})
```

- [ ] **Step 2: Run the new tests and check that they fail before implementation**

Run:

```bash
node --test packages/presentation/deck/tests/artifact-publication.test.mjs
```

Expected: FAIL. Both new tests fail because unguarded `JSON.parse` currently throws `SyntaxError`, which `DeckService.access` maps to `DECK_STORAGE` instead of `ARTIFACT_CORRUPT`.

- [ ] **Step 3: Create `packages/presentation/deck/src/artifact-fs.ts` and remove `provenance.ts`**

Create `packages/presentation/deck/src/artifact-fs.ts` (under 180 lines, every function under 60 lines, zero `as`, zero `!`):
1. Define `export const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])` and `export const IMAGE_LICENSES = ['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'] as const`.
2. Export `export function hashMismatch(expected: string, bytes: Uint8Array): boolean`.
3. Export `export function isValidPngBytes(bytes: Buffer, maxBytes = 256 * 1024): boolean` checking `bytes.length <= maxBytes && bytes.subarray(0, 8).equals(PNG_MAGIC)`.
4. Export `export function isValidImageCredit(value: unknown): value is ImageCredit` validating `isRecord(value)`, `url` starting with `'https://'`, non-empty `author`, `license` in `IMAGE_LICENSES`, `licenseUrl` string, `unknownLicense === (license === 'unknown')`, and `retrievedAt` string (plus optional `evidence` and `downloadUrl` types when present).
5. Inline `export function validateProvenance(value: unknown): readonly ContentProvenance[]` from `provenance.ts` (calls `decodeContentOrigins(value)`, catches and throws `new DeckError('PROVENANCE_INVALID')`).
6. Export `export function parseJsonObject(raw: unknown): Record<string, unknown>`:
   - Wrap `JSON.parse(String(raw))` in `try/catch`. On parse failure or `!isRecord(parsed)`, throw `new DeckError('ARTIFACT_CORRUPT')`.
7. Export `PreparedRecord` interface and `export function parsePreparedRecord(raw: unknown): PreparedRecord`:
   - Parse with `parseJsonObject(raw)`.
   - Require `typeof obj.query === 'string'`.
   - Check optional `needId`, `slideId`, `failure` (`string`), `slideIndex`, `blockIndex` (`number`), optional `asset` (check `isRecord`, `validId(assetId)`, `typeof digest === 'string'`, `typeof parsedDigest === 'string'`, `typeof originalDigest === 'string'`, `typeof byteSize === 'number'`, `isRecord(source)`, and `credit` with `isValidImageCredit` when present), and optional `attempts` (`Array.isArray`). Throw `new DeckError('ARTIFACT_CORRUPT')` on any invalid field.
   - Return a constructed `PreparedRecord` object with zero `as` casts.
8. Export `export class ArtifactFileStore`:
   - Constructor takes `artifactRoot?: string`, runs the symlink and `realpathSync` checks from `artifact-store.ts` lines 112-125, and sets `readonly root: string | undefined`.
   - Methods: `path(name: string): string`, `exists(name: string): boolean`, `write(name: string, bytes: string | Uint8Array): void`, `read(name: string, fingerprint: string, limit: number): Buffer`, `remove(name: string): void`, `listFiles(): readonly string[]`.
9. Remove `packages/presentation/deck/src/provenance.ts`.

- [ ] **Step 4: Create `packages/presentation/deck/src/image-store.ts` and remove `image-needs.ts`**

Create `packages/presentation/deck/src/image-store.ts` (under 320 lines, every method under 75 lines, zero `as`, zero `!`):
1. Move `export function outlineImageNeeds(outline: BoundOutlineDraft | OutlineProposal): readonly ImageNeed[]` verbatim from `image-needs.ts` (using `sha256Hex` from `./errors.ts`).
2. Remove `packages/presentation/deck/src/image-needs.ts`.
3. Export `export class PreparedImageStore`:
   - Constructor: `constructor(private readonly db: DatabaseSync, private readonly files: ArtifactFileStore, private readonly options: DeckOptions) {}`.
   - Private `preparations = new WeakMap<object, { fingerprint: string; records: PreparedRecord[] }>()`.
   - Move `reserveImageSearch(sessionId: string, requestId: string): void` from `index.ts` lines 213-232 (validating `activeRequest` and the 5-attempt budget in `image_search_attempts`).
   - Move and decompose `prepareImages` (`artifact-store.ts` lines 167-253) into `prepareImages` + private `prepareSingleNeed(sessionId, input, need, signal, resolver)` + private `validateResearchAsset(image)` so every method is under 65 lines:
     - Parse cached rows in `prepared_images` with `parsePreparedRecord(r.payload)`.
     - Replace `this.options.researchImage!(sessionId, query, signal)` with `const research = this.options.researchImage; if (!resolver && !research) throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')`.
   - Move `commitImages`, `preparedRecord`, `imageReview`, `imagePreview`, `restoredImage`, `imageBlockers`:
     - In `preparedRecord`, parse rows with `parsePreparedRecord(r.payload)` (removes `as PreparedRecord`).
     - In `imageReview`, `imagePreview`, and `restoredImage`, replace all three `outline.slides[need.slideIndex]!` assertions with explicit `const slide = outline.slides[need.slideIndex]; if (!slide) throw new DeckError(...)` (`DECK_CONTENT_NOT_FOUND` for `imageReview`/`imagePreview`, `RESEARCH_IMAGE_SELECTION_REQUIRED` for `restoredImage`).

- [ ] **Step 5: Create `packages/presentation/deck/src/artifact-readback.ts`**

Create `packages/presentation/deck/src/artifact-readback.ts` (under 180 lines, every method under 60 lines, zero `as`, zero `!`):
1. Export `export class ArtifactReadback`:
   - Constructor: `constructor(private readonly db: DatabaseSync, private readonly files: ArtifactFileStore, private readonly formats: ReadonlyMap<string, FormatAdapter>) {}`.
2. Move `provenance`, `notes`, `imageMetadata`, `metadata`, `content`, `native`, and `recover` from `artifact-store.ts`:
   - Replace every `JSON.parse(String(row.manifest))` with `parseJsonObject(row.manifest)` so malformed JSON throws `DeckError('ARTIFACT_CORRUPT')`.
   - In `notes(row)`: narrow `const notes = manifest.notes; if (notes === undefined) return undefined; if (typeof notes !== 'string' || notes.length > 16000) throw new DeckError('ARTIFACT_CORRUPT'); return notes` (removes `as string | undefined`).
   - In `imageMetadata(row)`: check `manifest.assets`, `manifest.imageOmissions`, and each `credit` with `isValidImageCredit`.
   - In `native(row)`: guard legacy `manifest.design.template` access with `isRecord(manifest.design) && isRecord(manifest.design.template)` (throwing `DeckError('ARTIFACT_CORRUPT')` if corrupt).
   - In `recover()`: parse `prepared_images.payload` with `parsePreparedRecord(row.payload)` and `artifact_revisions.manifest` with `parseJsonObject(row.manifest)`.

- [ ] **Step 6: Reduce `packages/presentation/deck/src/artifact-store.ts` to staging and preparation only, and wire `index.ts`**

1. Update `packages/presentation/deck/src/artifact-store.ts` (must be under 390 lines, every method under 75 lines, zero `as`, zero `!`):
   - Constructor accepts `(files: ArtifactFileStore, images: PreparedImageStore, formats: ReadonlyMap<string, FormatAdapter>, options: DeckOptions)`.
   - Preserve grant-keyed `WeakMap`s (`stageAttempts`, `imageAttempts`, `researchImages`) and `stages` `Map`.
   - Keep `begin`, `setDocument`, `draft`, `append`, `setProvenance`, `asset`, `researchImage`, `prepare`, `receiptFingerprint`, `removeValidationArtifact`, `published`, `discard`.
   - Split `researchImage` (85 lines) into `researchImage` + private `loadCachedResearchImage` (bind non-nullable `const grantCache = cache` to eliminate both `cache!` assertions at lines 674 and 692) + shared PNG/credit validation from `artifact-fs.ts`.
   - Split `prepare` (80 lines) into `prepare` + private `assertStageReadyForBuild` + private `verifyBuiltArtifact` so every method stays under 60 lines.
   - Guard `removeValidationArtifact` with `parseJsonObject(artifact.manifest)`.
2. Update `packages/presentation/deck/src/index.ts`:
   - Re-export `outlineImageNeeds` from `./image-store.ts`.
   - Build `formats` map (preserving `FORMAT_DUPLICATE` check), `ArtifactFileStore`, `PreparedImageStore`, `ArtifactReadback` (call `readback.recover()` when `files.root` exists), and `ArtifactStorage` in the constructor.
   - Delegate image methods (`prepareOutlineImages`, `reserveImageSearch`, `outlineImagePreview`, `restoredOutlineImage`, `imageBlockers`, `commitBriefProposal` image commit, `outlineSnapshot` image review, `confirmGeneration` image blockers) to `this.images`.
   - Delegate readback methods (`provenance`, `slideMetadata`, `content`, `nativeArtifact`) to `this.readback`.

- [ ] **Step 7: Build, check metrics, and run tests**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write packages/presentation/deck/src/ packages/presentation/deck/tests/artifact-publication.test.mjs
```

Run quantitative check on the artifact and image modules:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const targets=new Set(['packages/presentation/deck/src/artifact-fs.ts','packages/presentation/deck/src/image-store.ts','packages/presentation/deck/src/artifact-readback.ts','packages/presentation/deck/src/artifact-store.ts']); const files=out.files.filter(f=>targets.has(f.path)).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,as:f.typeAssertions.length,nn};}); console.log(JSON.stringify({count:files.length,provenanceExists:fs.existsSync('packages/presentation/deck/src/provenance.ts'),imageNeedsExists:fs.existsSync('packages/presentation/deck/src/image-needs.ts'),files},null,2));"
```

Expected: PASS. `count: 4`, `provenanceExists: false`, `imageNeedsExists: false`, and every file has `over400: false`, `longFn: 0`, `as: 0`, and `nn: 0`.

Run test suites:

```bash
node --test packages/presentation/deck/tests/artifact-publication.test.mjs && corepack pnpm@11.28.5 test:generation-publication && corepack pnpm@11.28.5 test:images && corepack pnpm@11.28.5 test:deck-review
```

Expected: PASS. All tests pass with `# fail 0` and `# skipped 0`, including both new `ARTIFACT_CORRUPT` tests.

- [ ] **Step 8: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 7 as `- [x]` in this file. Update the Task 17 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-17-refactor-deck-artifacts-and-image-store.md`.
2. Create `docs/build/refactor/module-design/reports/task-17-refactor-deck-artifacts-and-image-store.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, modified, and removed files.
   - Fail-first proof for the two `ARTIFACT_CORRUPT` tests.
   - Metrics table for the four artifact/image modules (`lines`, `longFn`, `as`, `!`).
   - Verification results for build, boundaries, lint, and all test suites.
3. Add a Task 17 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 8 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(deck): split artifact storage and guard JSON assertions`), and run `git push`.

**STOP** and send the Task 17 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
