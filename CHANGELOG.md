# Changelog

Notable changes to this repository. The newest changes are at the top.

## [Unreleased]

### Added

**Host modules and change notices** (Tasks 1 to 34 of `docs/build/refactor/target-structure/plan/`, each `Done` with a report under `reports/`)

- Read the settings and the chat list again in the Browser after a newer `providers` notice, and on `PROVIDERS_STALE` read the settings again, show the saved values and a message, and do not send the write again. Task 34 is `Done` in `docs/build/refactor/target-structure/plan/`.
- Require `expectedVersion` on `PUT` and `DELETE /api/providers/:providerId`, refuse an old version with `409 PROVIDERS_STALE` before the provider check, and send the version from the Browser client. Task 33 is `Done` in `docs/build/refactor/target-structure/plan/`.
- Add the change notice chain: `ChangeTopic`, `ChangeNotice`, `PublishChange`, `decodeChangeNotice` and the workspace body decoders in `@deckagent/host-contracts`; `ChangeFeed` and `GET /api/changes` in `apps/host/src/http/`; and `change_versions` in `workspaces.sqlite` schema 2, `sessions.sqlite` schema 8 and `web.sqlite` schema 2, with the version bump inside each writing transaction and the notice published after commit.
- Check `expectedVersion` and answer `409 WORKSPACES_STALE` inside the workspace transactions, replace `field` in `workspaces.routes.ts` with Zod body decoders, and publish `workspaces` notices after commit and chat ungrouping. Chat writes take no `expectedVersion`.
- Bump the providers version in the transaction of each provider save and removal, and publish the `providers` notice before the chats notice of a removed model; `GET /api/settings` returns `providersVersion`.
- Connect the Browser to `GET /api/changes` through one `ChangeWatcher`: a newer `workspaces` version refreshes the workspace list, `WORKSPACES_STALE` refreshes the list and shows a message without retrying the write, and a newer `chats` notice refreshes the chat list without opening a chat.
- Add the package `@deckagent/host` (`apps/host/`) with the entries `lib/server.js` and `lib/cli.js`, owning `src/server.ts`, `src/cli.ts`, `src/features/` and `src/integrations/`.
- Add the HTTP edge characterization tests (`e2e/http-edge.test.mjs`, `test:http-edge`): 12 black-box tests record 15 shared HTTP behaviors and 2 Task 9 route facts, so the move to Express 5 cannot drop them without a failed test.
- Add folder-level `no-restricted-imports` rules for `apps/host/src/modules/`, `apps/host/src/http/` and the Browser files, plus the `check:boundaries` rules `module-private-import` and `module-cycle`, each with a negative fixture.
- Add the reports index and the diagnosis and exit reports of the refactor: the start state, the change notice (29 tables of 4 schema files, only the deck sends a notice, `BRIEF_STALE`, `OUTLINE_STALE`, `DRAFT_CONFLICT`), run preparation (51 places, each with a kind such as `prompt-input` and an owner such as `composition-root`), the workspaces, chats and providers modules, and the Phase 1 and Phase 2 exits, where both Task 19 checks pass on `4d42e0f`.
- Add the agent core contracts in `docs/architecture/` (`10-agent-core.md`, `30-decisions.md`, `README.md`): ADR-001 to ADR-004 are `Proposed`, with the contract shapes and the run flow.
- Add Revision 2b (Tasks 13 to 16), Revision 3 (read-only diagnosis of `workspaces`) and Revision 3 Slice 2B (read-only diagnosis of the `packages/presentation/deck/` core, stores and public surface, and of artifact storage with its `packages/presentation/design/` seam) to the plans, with the decisions on the `workspaces.sqlite` upgrade and the `ChangeFeed`; a task now starts only on a clean working tree.

**Module design refactor** (Tasks 1 to 14 of `docs/build/refactor/module-design/plan/`)

- Add the quantitative scanner (`scripts/scan-module-design.mjs`, `scan:module-design`) with unit tests, the 14-area triage with AST baseline, and the `portable-generation-http.test.mjs` timeout diagnosis.
- Add `docs/build/refactor/module-design/README.md`: static measurements, the deep-module direction, a three-layer diagnosis method, revisable-convention guidance and priority areas; Phase 1 measured `v2` and `v3` timings and ran all 18 non-live suites plus 5 root tool test files with `# fail 0`.
- Diagnose `packages/host/contracts/` and `packages/host/api/` (16 findings, owner approves no action on F11 and convention updates on F15 and F16) and `packages/session/persistence/` with its host seam (9 findings, owner approves P8 type-level contract check and P9 move of `MemoryDraftStore` to `apps/web/`).
- Add the Phase 1 implementation plan under `docs/build/refactor/module-design/plan/`: decisions, global constraints, review focus and three tasks (the scanner, the 14-area triage table and the timeout diagnosis).
- Add Revision 2b Slice 2A tasks 08 to 12: Project Structure updates, `session/persistence` decomposition, `host/contracts` Zod unification, `host/api` lifecycle and transport separation, and the Slice 2A exit gate.

**Contracts, boundaries and tooling**

- Add `@deckagent/host-contracts` (`packages/host/contracts`): browser-safe wire DTOs, boundary decoders, private Zod validation for Brief drafts, and portable-document re-exports.
- Add Wave 0 boundary checks (`scripts/check-boundaries.mjs`, `check:boundaries`, `check:boundaries:report`) and enable the TypeScript safety and import-restriction rules in `.oxlintrc.json` with negative fixture tests.
- Enforce strict dependency boundaries across Browser features, transport, integrations, Request Lifecycle and internal relative imports; remove the workspace-source `paths` aliases from `tsconfig.base.json`; run `check:boundaries` in CI; and update the Enforcement table with negative-fixture tests.
- Add the codebase refactor plan with 18 tasks across ten waves: safety-net checks, file ownership, contracts, migration order, regression checks and deferred behavior work.
- Add the target structure to `docs/conventions/project-structure.md`: runtime ownership, state authority of each owner, one row per folder and package, dependency rules with a diagram, move rules and the enforcement status of each boundary.
- Add a `Check` layer to `docs/conventions/README.md` and a decision diagram that places a new rule in Content, Convention, Skill, Lesson or Router.
- Add `check:docs` for documentation structure and citations, run from a Claude Code hook after each edit, and print the number of checked files so a clean result is not mistaken for a run that checked no files.
- Add the `test:local-foundation` script for the workspace registry, chat persistence and local foundation tests.

**Use cases, quality attributes and skills**

- Add the use case index in `docs/UCs/README.md` (actors, use case map, files, ID prefixes, glossary), the six area file skeletons and OQ-001, plus an independent baseline for each area written by a subagent that does not read the spec.
- Add the `Gửi request` use case with its rules, flows, lifecycle diagrams and nine open questions, and the plan that moves `docs/00-old/spec/` to use case files, with `UCs` as a `refactor` workstream of the implementation-plan skill.
- Add the gap analysis of each use case file against its baseline, extended with the OWASP Top 10 for LLM Applications 2025, OWASP ASVS 5.0.0 and the Microsoft HAX guidelines; each gap cites the standard item, each accepted risk names the answering rule, and each undecided gap becomes an open question.
- Add `docs/UCs/quality-attributes.md` with one scenario for each of the 11 old quality requirements; the security scenarios cite OWASP ASVS 5.0.0 and the OWASP Top 10 for LLM Applications 2025.
- Add four open questions: the secret files the agent reads without a prompt (OQ-068), the resource limit of one request (OQ-069), the valid base URL of a custom model API (OQ-070) and a project-folder link that points outside it (OQ-071), plus a question about the default language of a deck.
- Add Task 10 of the use case plan, which records the values the product owner approved.
- Add the `review-change` skill (a subagent reviews a change against `docs/conventions/` and reports only what `pnpm check` cannot find) and the `correct` skill (find the mistake classes agents repeat here and stop each at the highest level that works).
- Add the `commit` and `commit-push` skills, which write a conventional commit message and an entry in this file.
- Add agent skills for test design techniques, test risk, estimation, defect classification, UI design review, and writing use cases and architecture documents.

**Deck generation, images and layouts**

- Add HTML Basic version 3 with seven controlled layout skeletons, unchanged theme roles, capacities and offline geometry checks; versions 1 and 2 stay pinned, saved artifacts stay valid, and the same 1280x720 canvas scales in Preview and fullscreen. Includes an offline layout gallery and Vietnamese capacity coverage.
- Resume saved image progress in later review requests without restaging unchanged Briefs and Outlines: explicit image provider changes apply to new searches, prepared images and their provenance are kept, question-only turns stay read-only, and stale image IDs report as workflow errors with current positions.
- Resolve Commons thumbnail and Pexels stock-photo origins, keep distinct licence and source-read diagnostics, and keep per-image attempt history; allow model-ranked image alternatives and one restricted recovery run before saving an unresolved Outline. Deck schema 10 preserves prior data and marks the Pexels licence contract.
- Review public-image candidates against each slide role with Tavily or explicitly selected Commons: keep selection reasons, local thumbnails and immutable credits, require image-specific licence evidence, block duplicate images within a slide, and preserve unchanged choices across reviews. Adds bounded downloads and durable search attempts in Deck schema 9.
- Keep portable slide documents beside native artifacts with executable HTML Basic version 2 templates, a two-image layout, shared browser decoding and separate validation diagnostics; prepare public images before confirmation, reuse local bytes through layout retries, and keep the Outline open when a required image is missing. Adds a native PPTX capability proof (editable text, images, notes) without a product export option; Deck schema 8 preserves existing revisions.
- Continue missing slides with an explicit new request on the same confirmed Deck, keeping completed revisions, visual choices and the original confirmation across Stop and restart.
- Save per-content origins, actual source locations, separate presenter notes and a Host-written closing report from committed revisions.
- Find public images through Wikimedia Commons without an API key, keep local PNGs and credits, reject incompatible licences and report optional omissions; generated images stay deferred in [the follow-up issue](https://github.com/Luke23127006/DeckAgent/issues/106).
- Install pinned OpenCode with Windows x64 application dependencies, discover it without global setup, validate runtime availability at startup and prepare verified release resources with the upstream license.
- Add a Windows `start:local` shortcut using pinned Node and the repository-local OpenCode CLI while reusing saved application data.
- Verify three-slide generation, restricted MCP tools, saved HTML and restart without replay through the real pinned CLI and a local test provider.
- Connect confirmed deck generation to the isolated OpenCode MCP bridge with versioned prompts, selected-source grants and scoped slide staging and publication.
- Add the end-user Create deck flow with Interview choices, Brief and Outline history, explicit confirmation, publication progress and a sandboxed Preview; duplicate or lost confirmation responses do not start another generation.
- Add explicit Host confirmation receipts and durable generation intents, exact Brief and Outline binding, idempotent admission retry and visual snapshot locks that survive Stop or restart.
- Stage bounded HTML chunks and normalized attachment images in Application Storage, validate parsed HTML/CSS and real browser output, and atomically publish immutable artifact pointers with recovery that preserves last-good revisions; Deck schema v6 retains legacy HTML.
- Add Host-owned deck interview requests with grouped missing-topic questions, explicit source choices, skip assumptions and request-local proposal staging; a failed or stopped model cannot commit staged results.
- Bind structured Outline revisions to immutable Brief versions, keep slide identities through edits and reordering, compute full changes and restore earlier proposals into new versions; Deck schema v4 keeps legacy history and adds atomic request receipts.
- Add an offline versioned design catalog, validated effective theme snapshots and content-based layout candidates with a guarded custom-layout fallback.
- Persist immutable Brief versions and explicit source choices per Chat in Deck schema v3, with authenticated Host reads and writes and a browser-safe client decoder; existing Decks, Outlines and Chat history stay intact.

**Attachments, sources and approvals**

- Opt-in Tavily public research with free-account checks, request search budgets, protected or environment credentials, durable source excerpts and a safe source viewer; session schema v7 preserves existing conversations and input records.
- Bounded preparation for text, PDF, Office documents, images and ZIP attachments, with immutable parsed sidecars, real source locations, explicit omissions and isolated cancellable parsers.
- Revisioned streaming uploads, safe previews, attachment-only admission and attachment controls in the Composer and conversation history, with parser, Host and browser checks and an opt-in real CLI image transport smoke.
- Safe project and attachment reads with file identity checks and Host approval for each read outside the project folder.
- Saved approval prompts with allow-once and refuse actions, reconnect recovery, Stop cancellation and tool activity in the chat UI; model timeouts pause while an approval is pending.
- Source permission regression checks and opt-in OpenCode CLI smoke tests against a local test provider, including approval, refusal and native tool bypass attempts.
- Chat-scoped attachment storage with durable managed files, source identities, draft revisions and atomic message and request associations; schema v4 migrates existing conversations and startup removes unsent staging without deleting committed attachments.
- Attachment metadata in Host and client history, with storage integration checks for restart, isolation, cancellation, failed admission and changed files.
- The accepted [source, request and approval integration contracts](docs/adr/0001-source-request-contracts.md).
- The `test:model-requests` script (request lifecycle, OpenCode adapter and model requests with a fake OpenCode CLI), the opt-in `test:opencode-live` script, the `--opencode <path>` flag of Local Web and `DECKAGENT_OPENCODE`.

**Rebuild decisions and planning**

- `docs/build/rebuild/adr/` with seven decision records: local storage and data ownership, chat and session history, tools and permissions, request and event lifecycle, deck artifacts and revisions, credentials and models, and the design system and templates.
- `docs/build/rebuild/architecture/` with the contracts those decisions imply, one file per area and `overview.md` as the entry point, including `repository-structure.md` (package ownership and dependency direction) and `deck-artifacts.md`.
- `docs/build/rebuild/planning/`, which maps each behavior family to its minimum prerequisites and lists the technical gaps that no decision covers; the analysis hands off to the build sequence in `implementation-plan.md`, and these notes stay in Vietnamese with their behavior IDs inside `docs/build/`.
- `docs/build/rebuild/implementation-plan.md` and `builds/B01.md` to `builds/B08.md`: the eight rebuild builds with their developer tasks; B01 is implemented and waits for independent testing.
- `packages/workspace/registry/`: the workspace registry with the project-folder rules of BR-019 and the name rules of BR-020.
- `docs/development/writing-documents.md` (living documents and records, outcomes and not the conversation, one line per paragraph, clickable links, no bare ID) and `docs/research/_STYLE.md`.
- A GitHub conventions section in `AGENTS.md`: no agent is named as author or co-author.

### Changed

**Host, module and test structure**

- Move the `workspaces`, `chats` and `providers` modules into `apps/host/src/modules/`, each with its store, service, routes and error map: `SqliteSessionStore` stays in `packages/session/persistence/`, `SqliteProviderStore` runs the provider SQL and `ProviderConfigurations` keeps the rules; delete `@deckagent/workspace-registry`, and take the chats and providers routes and error maps out of `@deckagent/host-api` and `local-transport.ts`. The HTTP contract does not change.
- Serve every Local Host route through Express 5.2.1 (`@types/express` 5.0.6): `apps/host/src/http/` holds the app, the shared checks, the error handler and `startHost`, and `@deckagent/host-api` exports `createHostRoutes` in place of `startHost`, with four Express route registrars.
- Move the Node code, the Browser code and the tests to their owners: `apps/web/` keeps the Browser code and `index.ts` (the former `ui-assets.ts`); `@deckagent/host` calls `loadWebAssets(getTheme)`; `web` and `start:local` run `node apps/host/lib/cli.js`; remove test-only re-exports from `apps/web/src/index.ts` and the unused `apps/web/src/browser/index.ts` root bundle; and 62 tests move with their fixtures to `apps/web/tests/`, `packages/*/*/tests/` and `e2e/`, which joins `lint`.
- Separate Browser transport (`apps/web/src/browser/transport/`) from UI features (`apps/web/src/browser/features/{chats,deck,attachments,providers,research,workspaces,requests}/`) with feature and transport entry points, keeping the root shell modules and the compiled bundle URLs unchanged.
- Move the browser runtime sources from `packages/client/runtime/src` into `apps/web/src/browser`, compile Node and Browser with separate TypeScript configs (`apps/web/tsconfig.json`, `apps/web/tsconfig.browser.json`) and separate `tsdown` bundles (`apps/web/lib/browser/`), resolve browser assets relative to the application module, and remove `@deckagent/browser-runtime`.
- Separate application features (`providers`, `research`, `attachments`, `sources`, `deck`) from external integrations, inject provider and research clients at startup, and replace `HttpError` with owner failure classes (`ProviderFailure`, `ResearchFailure`, `AttachmentFailure`, `SourceToolFailure`, `DeckWorkflowFailure`, `TavilyError`) mapped in `local-transport.ts`.
- Extract the workspace and chat workflows into `apps/web/src/features/workspaces/` and `apps/web/src/features/chats/` with HTTP-independent error classes, move HTTP validation and failure mapping to `local-transport.ts`, replace `HttpError` in `web-state.ts` with `WebStateError`, and add `HostOptions.mapApplicationFailure`.
- Narrow the OpenCode runtime boundary with `RuntimeSessionAccess`, `OpenCodeExecutor` and `OpenCodeError`, extract request preparation into `features/requests/`, and map `RequestPreparationFailure` in `local-transport.ts`.
- Separate Request Lifecycle operation errors (`RequestFailure`) from HTTP status mapping, switch the AttachmentService preconditions to `SessionError`, move the `RequestStore` and `ApprovalStep` contracts into `@deckagent/session-persistence` with a temporary re-export, and add `packages/host/api/tests/request-failure.test.mjs`.
- Decouple `@deckagent/deck` from `@deckagent/html-format` by moving `validateLegacySlideHtml` into `@deckagent/html-format` and requiring explicit `formats` and `legacyHtmlPolicy` injection on `DeckOptions`, both wired at startup.
- Replace fixed waits in the silent-runtime Stop test and attachment preparation polling with explicit `reached` and `released` promises and a `setImmediate`-based `waitFor` fixture, re-exported from `b02-helpers.mjs` and covered by `wait-for.test.mjs`.
- Serialize `test:generation-publication` and `test:images` with `--test-concurrency=1` against Windows Chromium lockfile contention, import `RequestFailure` directly in `ConfirmationService`, remove the unused `decodeImageReview` and `isDesignSnapshot` exports, remove the wall-clock assertion from the Stop test, and update test headers.
- Required work hygiene: a task report file (`docs/build/<workstream>/<topic>/reports/task-NN-<slug>.md`), a report index update and a `Done` row with the report link in the plan README after each task in `write-implementation-plan` (with its synced `.claude` and `.codex` mirrors), and the mark-done, report and commit-push workflow, the Revision 2 goal, the CI timeout guardrail and the review focuses in the module-design plan.
- Expand `docs/build/refactor/module-design/README.md` into a 5-phase just-in-time abstract plan for all 14 production areas: testware alignment, flow lookup maps, Definition of Done and fresh-chat handoff rules.
- Raise the `generation_publication` step `timeout-minutes` from 2 to 6, because the full suite takes about 3 minutes and the previous limit expired in CI.
- Rename `docs/build/refactor/codebase/` to `docs/build/refactor/boundaries/` and update the active references.

**Conventions and documentation**

- Rewrite `docs/conventions/code.md` into the rules of production code (naming, TypeScript, comments, contracts, runtime validation, data representation, state, async lifetime and error handling), each naming the tool that stops it, and drop phrases that only restate a rule.
- Write the `## Tech Stack` section of `AGENTS.md` with the current tool versions from `package.json` and the OpenCode config, plus the chosen target libraries without versions.
- Make the `review-change` reviewer also read `docs/conventions/project-structure.md`.
- Replace the vague "thay đổi nhiều" in three rules with a condition that a tester can check, and ask the user for missing research only when the system cannot write the main point of a planned slide, so the rule no longer conflicts with the placeholder rule.
- Drop the wait-time requirements for the first slide and for a changed slide, because the time depends on the model and the provider.
- Link the gap-analysis row of each use case area file to its baseline in `docs/build/refactor/UCs/baseline/`, and run the comparison after Task 7.
- Make `write-use-case` use DeckAgent examples, ask for an open question when no rule decides an item, and run `check:docs` with the pinned pnpm version.
- Use oxlint 1.94.0 with the `correctness` and `suspicious` categories as the only linter; Biome stays as the formatter only.
- Wrap the long `formatScanReport` assertion in `tests/scan-module-design.test.mjs` to satisfy Biome formatting.

**Chat, OpenCode and the local foundation**

- Supply the shipped visual catalog, the complete proposal shapes and explicit image and format choices to Interview runs; generation keeps its timeout and Stop without the interview's eight-step guard.
- Record the accepted initial visual catalog and the review, generation and publication contracts for B04, with the product defaults and theme roles.
- Local Web sends chat requests through the OpenCode CLI 1.19.5 (B02), so Send no longer answers `503 REQUESTS_UNAVAILABLE`:
  - Each request runs `opencode run --format json` without a shell, in an isolated configuration that denies every native tool and uses only the selected provider and model; the effective configuration is checked before any model work
  - One active request per chat; events are saved before they are shown and replay after a reload or reconnect; Stop ends the run at once; a Host restart marks running requests as not finished and starts nothing again
  - The native session of a chat is resumed only when its guard holds; otherwise a new one starts, seeded with the whole saved conversation
  - When the provider says the conversation is too long, OpenCode summarizes it and the request goes on; the chat marks where the summary starts and keeps every message readable, and a summary that fails ends the request as `CONTEXT_SUMMARY_FAILED` (FR-079)
  - A workspace with an active request is not removed or moved (UC-013 A5)
- Local Web exposes only request-scoped read tools through an authenticated loopback MCP bridge; native OpenCode tools stay denied and source changes invalidate native session reuse.
- Provider setup checks the key and the connection before saving; keys are stored with Windows DPAPI under `credentials/`, SQLite keeps only a reference, and other systems refuse a key instead of storing it in plain text.
- Attachment preparation receipts and parsed-content fingerprints use session schema v6, so migrations keep existing source identities, approvals and conversations; request text limits count Unicode code points independently of JSON transport bytes.
- The chat database moves to schema v5 (preserving source versions and approval history) and then schema v3 adds requests, their events and native session bindings.
- Local Web runs the B01 local foundation without a model or a provider key:
  - App data lives in the OS app-data folder, or in the folder that `--data-dir` or `DECKAGENT_DATA_DIR` names, with databases in `db/` and files in `files/`; a damaged, unwritable or misplaced data folder stops startup with the next step to take, and nothing is reset
  - Each chat belongs to a workspace, and a chat whose workspace is removed is listed as ungrouped; the chat list has search and marks a chat that cannot be read, and the Host keeps each chat's draft until DeckAgent stops
  - The chat database moves to schema version 2 and migrates version 1 files in place
  - Send is unavailable until B02 connects OpenCode: the Host answers `503 REQUESTS_UNAVAILABLE` and the UI says why
- ADR-0002 and `builds/B01.md` state the draft rule of FR-038: the Host keeps drafts while DeckAgent runs, not in SQLite.
- `docs/spec/` now holds the MVP spec: use cases, requirements, business rules and a backlog of behaviors left for later. It states each design choice as its result or `pending` while it is open, and links no decision record or research note.
- The `spec-authoring` skill follows the MVP use case format: the interaction diagram is the source of each step, and the Steps table holds the same steps.
- `docs/AGENTS.md` drops the `Updated at` date rule and the rule that the spec holds no release, which the MVP spec replaces.
- `docs/research/` holds one file per product (open-design, OpenCode, DeepSeek Harness, Claude Slide Design, Napkin AI, the legacy DeckAgent v2 code, folders on Windows) with observed conclusions only; screenshots and recordings sit under `docs/research/evidence/`.
- Markdown files follow the no-hard-wrap rule in `docs/development/writing-documents.md`: each paragraph, list item and sentence sits on one line.

### Fixed

- Validate controlled-layout capacities before Outline image search and commit; return exact fields and Unicode counts with at most two repair submissions; show derived layout blockers for saved Outlines across reload, retain existing image progress, and preserve the confirmation error instead of reporting a connection failure.
- Share one strict Brief schema between Host validation, browser decoding and model tool descriptions; report independent field errors together, bound same-request model repairs, preserve saved versions after exhaustion, and never let a schema repair enable sources or reset visual choices.
- Reuse request-scoped web images when retrying slide layouts, register concurrent identical image calls once, and explain that web images are already attached by the image-search tool.
- Read saved web-image Outline blocks in the browser and clear completed request controls even when a later Outline refresh fails; distinguish projection-read failures from model failures.
- Write MCP responses with native Node HTTP framing so the pinned OpenCode client can read tool replies.
- Keep Chat and Create deck guidance, research permissions and Outline revision targets aligned with the current workflow while preserving the interface layout and theme.
- Keep the research checkbox beside its label, show deck publication progress and render assistant text with safe, limited formatting and readable Brief details.
- Reject invalid custom provider IDs before sending a request, save pending model IDs and distinguish saved settings from a failed interface refresh.
- Keep Chat navigation disabled while a Chat is being created.
- Bring the CDP tab to the foreground before presenting Deck Canvas in the Browser fullscreen smoke, retaining the full presentation assertions.
- Run workspace discovery in the build with the pnpm that runs the script, so a different `pnpm` on PATH no longer fails the build.

### Removed

- Remove `apps/web/src/ui-assets.ts` and the Node dependencies of `@deckagent/local-web`; `apps/web/package.json` keeps `@deckagent/host-contracts` and `@deckagent/presentation-document` only.
- Remove the `check:comments` script and `scripts/check-no-comments.mjs` with its test; the comment rules in `docs/conventions/code.md` are enforced by review.
- Remove the `domain-modeling` and `spec-authoring` agent skills.
- Remove the Cordis runtime, chat CLI, provider adapters, native tool adapters, smoke fixtures and unused vendor packages; build, workspace dependencies and CI now use the OpenCode path, and the storage, source-access and publication checks stay for the current application.
- Remove the in-request question and reply path of the Host API and the UI; a question now ends its request (ADR-0004), along with the `agent-runtime` dependency of `host-api` and the `model-providers` dependency of `local-web`.
- Remove the legacy Agent Loop in Local Web (the outline, editing and web-request workflows, the Cordis and agent-runtime dependencies and the `--workspace` flag) and the tests that checked only that path (`outline-workflow`, `recovery-editing`, their fixtures and the `test:recovery-editing` script), adapting the tests of behavior that B01 keeps.
- Remove `docs/build/rebuild/research/`, whose conclusions now live in the decision records, the architecture notes and the implementation plan.
- Remove the product vision, the user segments, and the use cases and requirements that the MVP spec does not take.
- Remove `docs/versions/` and `docs/design/`, because plans, tasks and handoffs live in GitHub Issues, together with the UX prototype regression test and its CI step.
- Remove the research report on EthanGuo2022 OpenDesign, the spec question backlog, and the research plans and handoffs.
- Remove the unused agent guides under `docs/agents/` (domain, issue tracker, triage labels, verification) and their references in `AGENTS.md` and the skill router.
