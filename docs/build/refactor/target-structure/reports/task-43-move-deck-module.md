# Task 43: Move the deck workflows, image and rendering adapters and error map report

Read this file to learn the changes and check results for Task 43.

## Files changed

- `apps/host/src/modules/deck/`: deck workflows, image adapters, rendering adapters, ports, error mapping and public exports.
- `apps/host/src/local-transport.ts`: remove deck error mapping.
- `apps/host/src/server.ts`: wire module exports, parser instances and deck error mapping.
- `.oxlintrc.json`: allow the deck package in deck module files except routes.
- `tests/oxlint-boundaries.test.mjs`: add two tests for the deck package boundary.
- `apps/host/tests/commons-images.test.mjs` and `image-research.test.mjs`: use module exports and inject the parser.
- `docs/conventions/project-structure.md`: record the retained presentation package and the Host module owner.
- The task file, plan index and report index: record Task 43 completion.
- Remove the old deck feature, image integration and rendering integration folders.

## Moved files

| Old path | New path | Symbols |
| --- | --- | --- |
| `apps/host/src/features/deck/brief-coordinator.ts` | `apps/host/src/modules/deck/brief-coordinator.ts` | `BriefCoordinator` |
| `apps/host/src/features/deck/confirmation-coordinator.ts` | `apps/host/src/modules/deck/confirmation-coordinator.ts` | `ConfirmationCoordinator` |
| `apps/host/src/features/deck/deck-prompts.ts` | `apps/host/src/modules/deck/deck-prompts.ts` | `BriefFailureState`, `emptyBriefDraft`, `deckToolResult`, `decodeDeckToolArgs`, `assertBriefChoices`, `buildDeckWorkflowContext`, `buildDeckToolSchemas`, `buildDeckInstructions`, `buildRecoveryInstructions`, `isSourceToolAllowed`, `deckRepairLimitResult`, `ImageToolCall`, `decodeImageToolCall`, `recordDeckToolFailure` |
| `apps/host/src/features/deck/deck-tool-session.ts` | `apps/host/src/modules/deck/deck-tool-session.ts` | `DeckStagingState`, `DeckImageReview`, `DeckToolSessionOptions`, `DeckToolSession`, `createDeckToolSession`, `createDeckImageReview` |
| `apps/host/src/features/deck/deck-workflow.ts` | `apps/host/src/modules/deck/deck-workflow.ts` | `DeckWorkflow` |
| `apps/host/src/features/deck/failures.ts` | `apps/host/src/modules/deck/failures.ts` | `OutlineNotFoundReason`, `DeckWorkflowFailure` |
| `apps/host/src/features/deck/generation-execution.ts` | `apps/host/src/modules/deck/generation-execution.ts` | `executeGenerationRun`, `executeRecoveryRun` |
| `apps/host/src/features/deck/generation-prompts.ts` | `apps/host/src/modules/deck/generation-prompts.ts` | `GenerationPlan`, `GenerationSource`, `GenerationContext`, `generationToolSchemas`, `buildGenerationContext`, `buildGenerationInstructions` |
| `apps/host/src/features/deck/generation-report.ts` | `apps/host/src/modules/deck/generation-report.ts` | `generationReport` |
| `apps/host/src/features/deck/generation-tools.ts` | `apps/host/src/modules/deck/generation-tools.ts` | `GenerationToolOptions`, `createGenerationTools` |
| `apps/host/src/features/deck/generation-workflow.ts` | `apps/host/src/modules/deck/generation-workflow.ts` | `GenerationWorkflow` |
| `apps/host/src/features/deck/image-credit.ts` | `apps/host/src/modules/deck/image-credit.ts` | `imagePageCredit` |
| `apps/host/src/features/deck/image-research.ts` | `apps/host/src/modules/deck/image-research.ts` | `WebImageResearch` |
| `apps/host/src/features/deck/image-review-run.ts` | `apps/host/src/modules/deck/image-review-run.ts` | `Candidate`, `ImageReviewRun` |
| `apps/host/src/integrations/images/commons-images.ts` | `apps/host/src/modules/deck/images/commons-images.ts` | `CommonsCandidate`, `CommonsImages` |
| `apps/host/src/integrations/images/image-source.ts` | `apps/host/src/modules/deck/images/image-source.ts` | `ImageSourceError`, `imageSource` |
| `apps/host/src/integrations/images/index.ts` | `apps/host/src/modules/deck/images/index.ts` | Public re-exports |
| `apps/host/src/integrations/images/public-image-reader.ts` | `apps/host/src/modules/deck/images/public-image-reader.ts` | `ImageLookup`, `ImageReadError`, `PublicImageReader` |
| `apps/host/src/integrations/rendering/artifact-renderer.ts` | `apps/host/src/modules/deck/rendering/artifact-renderer.ts` | `ArtifactRenderer`, `artifactRenderer` |
| `apps/host/src/integrations/rendering/cdp-browser.ts` | `apps/host/src/modules/deck/rendering/cdp-browser.ts` | `CdpConnection`, `ManagedBrowser`, `executable`, `rendererEnvironment`, `verifySafeRoot`, `connectBrowser`, `launchManagedBrowser`, `disposeManagedBrowser` |
| `apps/host/src/integrations/rendering/dom-validation.ts` | `apps/host/src/modules/deck/rendering/dom-validation.ts` | `buildValidationExpression`, `assertValidationReport` |
| `apps/host/src/integrations/rendering/index.ts` | `apps/host/src/modules/deck/rendering/index.ts` | Public re-exports |
| Deck error mapping in `apps/host/src/local-transport.ts` | `apps/host/src/modules/deck/deck.errors.ts` | `mapDeckFailure`, `deckWorkflowStatus` |

## Commands run

Commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell.
The package command prefix is `corepack pnpm@11.28.5`.
Node commands used `C:/dev_env/nvm/v22.23.5` in `PATH` with sandbox escalation.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before changes | 0 | No changed file |
| `git grep -n "^\| 42 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | Task 42 row |
| Authorized `git mv` and `git rm` operations | 0 | All 22 implementation files moved |
| `git grep --untracked` for old deck, images and rendering paths | 1 | No match |
| `git grep --untracked` for persistence, file-tools and SQLite imports in the deck module | 1 | No match |
| `git grep` for deck error symbols in local transport | 1 | No match |
| First `exec biome format --write` | 0 | Formatted 30 files |
| First `exec biome format` | 1 | `ports.ts` needed another format pass |
| Repeated format write and read-only checks | 0 | No fixes applied in the final check |
| `Resolve-Path apps/host/lib` and `Move-Item` to a unique TEMP folder | 0 | Old Host build output moved before build |
| First `build` | 1 | TS2339 in both image parser consumers |
| Final `build` | 0 | TypeScript and all bundles complete |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | 0 violation(s) |
| First `check:docs` | 1 | The replacement paragraph lost its first citation |
| Repeated `check:docs` before the report | 0 | 258 files, 0 error(s) |
| `node --test tests/oxlint-boundaries.test.mjs` after restoring mutants | 0 | 24 pass, 0 fail |
| `node --test tests/check-boundaries.test.mjs` | 0 | 25 pass, 0 fail |
| `git diff --check HEAD` | 0 | No whitespace error |
| `python3.12 -I C:/Users/Duy/.agents/skills/asd-ste100/scripts/ste-lint-vi.py` on the changed paragraph | 0 | 0 findings |
| `check:docs` after the report | 0 | 259 files, 0 error(s) |
| `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | 0 violations |

## Required suites

Every command below exited with code 0 and reported `# fail 0`.
No suite needed a retry.
Logs are in `TEMP` as `deckagent-task43-<suite>.log`.

| Command | Pass | Fail | Skipped |
| --- | --- | --- | --- |
| `test:http-edge` | 12 | 0 | 0 |
| `test:tools-browser` | 23 | 0 | 0 |
| `test:local-web` | 11 | 0 | 0 |
| `test:local-foundation` | 57 | 0 | 0 |
| `test:model-requests` | 29 | 0 | 0 |
| `test:source-permissions` | 11 | 0 | 0 |
| `test:attachments` | 31 | 0 | 0 |
| `test:research` | 5 | 0 | 0 |
| `test:images` | 39 | 0 | 0 |
| `test:outline-workflow` | 6 | 0 | 0 |
| `test:brief-foundation` | 15 | 0 | 0 |
| `test:deck-review` | 21 | 0 | 0 |
| `test:generation-publication` | 72 | 0 | 0 |
| `test:slide-pipeline` | 7 | 0 | 0 |
| `test:session-persistence` | 7 | 0 | 0 |
| `test:opencode-resources` | 3 | 0 | 0 |
| `test:layouts` | 10 | 0 | 0 |
| `test:browser-smoke` | 21 | 0 | 0 |
| `test:env-startup` | 2 | 0 | 0 |

## Mutation evidence

| Test | Product configuration fault | Result |
| --- | --- | --- |
| Deck service imports | Remove the deck service override from `.oxlintrc.json` | The test failed, exit 1 |
| Deck route and other module imports | Remove the deck package restriction from the generic module and route overrides | The test failed, exit 1 |

Each mutation changed the real product configuration.
Both tests passed after the original configuration returned.
The image tests keep their assertions and inject the real `AttachmentParser`.

## Plan corrections, STOP conditions and retries

- The sandbox denied the first `git mv` because the sandbox blocks writes to `.git`.
- The authorized move succeeded with command escalation.
- `python` was unavailable. The editing script used `python3.12` instead.
- The first formatting check failed on `ports.ts`. The orchestrator authorized another format pass.
- The first build failed because the planned parser union does not narrow `data` through `type` alone.
- The orchestrator authorized explicit property and string guards in both image consumers.
- Both guards keep the existing `RESEARCH_IMAGE_UNAVAILABLE` rejection.
- The first docs check failed after the replacement paragraph removed citation 1.
- The replacement paragraph now keeps the original citation.
- No unresolved STOP condition remains.
- No test suite failed. No test suite needed a retry.

## Items outside the mapping

None.
The parser guards are the explicit plan correction described above.

## What the commands do not prove

- Deck routes stay in `@deckagent/host-api` until Task 44.
- No test checks error-map registration order in `server.ts`.
- Direct inspection shows `mapDeckFailure(error)` immediately precedes `mapApplicationFailure(error)`.

## Commit handoff

The root orchestrator owns the changelog entry, independent review, commit and push.
This executor did not commit or push.
