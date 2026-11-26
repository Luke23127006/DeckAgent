# Task 43: Move the deck workflows, image and rendering adapters and error map

Read this file to learn the steps of Task 43, which moves the deck workflows, image adapters, rendering adapters and deck error map into `apps/host/src/modules/deck/`.

**Type:** Move or rename

After this task, `apps/host/src/modules/deck/` holds the deck workflow files, the `images/` adapters, the `rendering/` adapters, the narrow ports `DeckSessionStore` and `ImageParserPort`, and `deck.errors.ts`. `packages/presentation/deck/` stays a package (`@deckagent/deck`). No file in `apps/host/src/modules/deck/` imports `@deckagent/session-persistence` or `@deckagent/file-tools`. Targeted `.oxlintrc.json` overrides allow `@deckagent/deck` inside `apps/host/src/modules/deck/` non-route files while keeping it blocked for all other modules and for `deck.routes.ts`. The HTTP contract and all route paths stay unchanged.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `docs/conventions/project-structure.md` (the table `### packages/` and `## Enforcement`)
- `.oxlintrc.json` and `tests/oxlint-boundaries.test.mjs`
- `apps/host/src/features/deck/index.ts`, `brief-coordinator.ts`, `confirmation-coordinator.ts`, `deck-workflow.ts`, `generation-workflow.ts`, `generation-prompts.ts`, `generation-tools.ts`, `image-research.ts`, `image-review-run.ts`
- `apps/host/src/integrations/images/index.ts` and `commons-images.ts`
- `apps/host/src/integrations/rendering/index.ts`
- `apps/host/src/local-transport.ts` and `apps/host/src/server.ts`
- `apps/host/tests/commons-images.test.mjs` and `apps/host/tests/image-research.test.mjs`

**Files:**

- Create: `apps/host/src/modules/deck/ports.ts`, `deck.errors.ts`, `index.ts`
- Move into `apps/host/src/modules/deck/`: all 14 non-index files of `apps/host/src/features/deck/`
- Move into `apps/host/src/modules/deck/images/`: all 4 files of `apps/host/src/integrations/images/`
- Move into `apps/host/src/modules/deck/rendering/`: all 4 files of `apps/host/src/integrations/rendering/`
- Remove: `apps/host/src/features/deck/`, `apps/host/src/integrations/images/`, `apps/host/src/integrations/rendering/`
- Change: `.oxlintrc.json`, `apps/host/src/local-transport.ts`, `apps/host/src/server.ts`, `docs/conventions/project-structure.md`
- Test: `tests/oxlint-boundaries.test.mjs`, `apps/host/tests/commons-images.test.mjs`, `apps/host/tests/image-research.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/modules/deck/ports.ts`:
  - `export interface DeckAttachmentRecord { readonly attachmentId: string; readonly name: string; readonly state: string; readonly detectedType?: string; readonly source?: BriefSourceRef }`
  - `export interface DeckSourceCatalogueItem { readonly sourceId: string; readonly version: number; readonly kind: string; readonly label: string }`
  - `export interface DeckSessionStore { getInfo(sessionId: string): Promise<unknown>; read(sessionId: string): Promise<readonly { readonly role: string }[]>; readonly attachments: { sent(sessionId: string): readonly DeckAttachmentRecord[] }; readonly requests: { activeFor(sessionId: string): string | undefined; get(requestId: string): StoredRequest | undefined; text(requestId: string): string; sourceCatalogue(sessionId: string): readonly DeckSourceCatalogueItem[]; researchSources(sessionId: string): readonly ResearchSourceRecord[] } }`
  - `export interface ImageParserPort { parse(input: { readonly name: string; readonly bytes: Uint8Array; readonly signal: AbortSignal }): Promise<{ readonly parts: readonly ({ readonly type: 'image'; readonly data: string } | { readonly type: string })[] }>; close(): Promise<void> }`
- Produces, in `apps/host/src/modules/deck/deck.errors.ts`:
  - `export function mapDeckFailure(error: unknown): HttpFailureResponse | undefined`
- Changes constructor signatures:
  - `CommonsImages`: `constructor(private readonly parser: ImageParserPort, private readonly request: typeof fetch = fetch)`
  - `WebImageResearch`: `constructor(private readonly research: Pick<ResearchCoordinator, 'imageSearch'>, private readonly commons: CommonsImages, private readonly parser: ImageParserPort, private readonly reader = new PublicImageReader())`
- Produces, in `apps/host/src/modules/deck/index.ts`: exports `BriefCoordinator`, `CommonsImages`, `ConfirmationCoordinator`, `DeckWorkflow`, `DeckWorkflowFailure`, `GenerationWorkflow`, `PublicImageReader`, `WebImageResearch`, `artifactRenderer`, `generationReport`, `mapDeckFailure`, and the types `ArtifactRenderer`, `DeckSessionStore`, `ImageLookup` and `ImageParserPort`.

**STOP when:** the build reports an error that a change in the tables `Mapping` and `Move rules` does not fix.

**Forbidden:** change any HTTP route path, status code or JSON body. Leave any import of `@deckagent/session-persistence` or `@deckagent/file-tools` inside `apps/host/src/modules/deck/`.

## Mapping

| Old | New |
| --- | --- |
| `apps/host/src/features/deck/*.ts` (except `index.ts`) | `apps/host/src/modules/deck/*.ts` |
| `apps/host/src/integrations/images/*.ts` | `apps/host/src/modules/deck/images/*.ts` |
| `apps/host/src/integrations/rendering/*.ts` | `apps/host/src/modules/deck/rendering/*.ts` |
| `DeckError`, `DeckWorkflowFailure` and `deckWorkflowStatus` in `apps/host/src/local-transport.ts` | `apps/host/src/modules/deck/deck.errors.ts` (`mapDeckFailure`) |

## Move rules

| Item | Rule |
| --- | --- |
| `ports.ts` | Import `BriefSourceRef` from `@deckagent/deck`, `StoredRequest` from `@deckagent/host-contracts` and `ResearchSourceRecord` from `../research/index.ts`. Export `DeckAttachmentRecord`, `DeckSourceCatalogueItem`, `DeckSessionStore` and `ImageParserPort`. |
| `brief-coordinator.ts`, `confirmation-coordinator.ts`, `deck-workflow.ts`, `generation-workflow.ts` | Replace `SqliteSessionStore` with `DeckSessionStore` from `./ports.ts`. In `confirmation-coordinator.ts`, change `../requests/index.ts` to `../../features/requests/index.ts`. |
| `generation-prompts.ts`, `generation-tools.ts` | Replace `AttachmentRecord` and `ResearchSource` from `@deckagent/session-persistence` with `DeckAttachmentRecord` from `./ports.ts` and `ResearchSourceRecord` from `../research/index.ts`. |
| `image-research.ts`, `image-review-run.ts`, `images/commons-images.ts`, `images/image-source.ts` | Change `../../integrations/images/index.ts` to `./images/index.ts`, change `../../modules/research/index.ts` to `../research/index.ts` (in `deck/`) and `../../research/index.ts` (in `deck/images/`). Remove `@deckagent/file-tools` from `image-research.ts` and `images/commons-images.ts`, and inject `ImageParserPort`. |
| `deck.errors.ts` | Map `DeckError` (`OUTLINE_STALE`, `OUTLINE_ALREADY_CONFIRMED`, `OUTLINE_READ_ONLY`, `OUTLINE_LIMIT` to `409`, `DECK_CONTENT_NOT_FOUND` to `404`) and `DeckWorkflowFailure` through `deckWorkflowStatus`. Return `undefined` for other errors. |
| `local-transport.ts` | Remove `DeckError`, `DeckWorkflowFailure` and `deckWorkflowStatus`. |
| `server.ts` | Import deck workflows, `CommonsImages`, `PublicImageReader`, `ImageLookup`, `artifactRenderer`, `ArtifactRenderer` and `mapDeckFailure` from `./modules/deck/index.ts`. Pass `new AttachmentParser()` to `CommonsImages` and `WebImageResearch`. Register `mapDeckFailure(error)` right before `mapApplicationFailure(error)`. |
| `.oxlintrc.json` | Add an override for `**/apps/host/src/modules/deck/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` after `modules/**` (before `*.routes.ts`) that keeps private-package patterns plus `../*/*.store.ts`, `../../http/**`, `../../local-transport.ts`, `@deckagent/session-persistence` and `@deckagent/file-tools` (allowing `@deckagent/deck`). Add an override for `**/apps/host/src/modules/deck/deck.service.ts` after `*.service.ts` with those same patterns plus `express`, `express/*` and `node:sqlite`. |
| `tests/oxlint-boundaries.test.mjs` | Add two tests: `modules/deck/deck.service.ts` accepts `@deckagent/deck` and rejects `@deckagent/session-persistence`, `@deckagent/file-tools`, `express` and `node:sqlite`. `modules/deck/deck.routes.ts` and `modules/workspaces/index.ts` still reject `@deckagent/deck`. |
| `docs/conventions/project-structure.md` | Replace the `Open` paragraph on `presentation/deck/` with a Vietnamese note. State that `packages/presentation/deck/` stays a package to keep `deck-concrete-adapter` and Host lifecycle types. State that `apps/host/src/modules/deck/` owns deck routes, workflows and adapters. |
| `commons-images.test.mjs`, `image-research.test.mjs` | Import `CommonsImages`, `PublicImageReader` and `WebImageResearch` from `../lib/types/modules/deck/index.js`, import `AttachmentParser` from `@deckagent/file-tools`, and pass `new AttachmentParser()` to each constructor call. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 42 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Move the files and change the wiring**

Do the changes of the tables `Mapping` and `Move rules`. Use `git mv` for the moved files. Then remove `apps/host/src/features/deck/`, `apps/host/src/integrations/images/` and `apps/host/src/integrations/rendering/`.

- [ ] **Step 3: Check that no old path or forbidden import stays**

Run: `git grep --untracked -n -E "features/deck|integrations/images|integrations/rendering" -- apps/host packages e2e scripts`

Expected: PASS. No line.

Run: `git grep --untracked -n -E "@deckagent/session-persistence|@deckagent/file-tools|node:sqlite" -- apps/host/src/modules/deck`

Expected: PASS. No line.

Run: `git grep -n -E "DeckError|DeckWorkflowFailure|deckWorkflowStatus" -- apps/host/src/local-transport.ts`

Expected: PASS. No line.

- [ ] **Step 4: Format, build and check**

Remove `apps/host/lib` first so that an old build output does not hide a broken import. Then do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs` and `node --test tests/check-boundaries.test.mjs`.

Expected: PASS. Each output contains `# fail 0`.

- [ ] **Step 5: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path | Symbols`.

- What the commands do not prove: deck routes still live in `@deckagent/host-api` until the next task. No test checks error-map registration order in `server.ts`.
- `CHANGELOG.md` line: ``- Move the deck workflows, image and rendering adapters, and deck error map into `apps/host/src/modules/deck/`, and record that `packages/presentation/deck/` stays a package. Task 43 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move deck workflows, image and rendering adapters into modules/deck`
