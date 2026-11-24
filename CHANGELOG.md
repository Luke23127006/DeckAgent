# Changelog

Notable changes to this repository. The newest changes are at the top.

## [Unreleased]

### Added

- Add `@deckagent/host-contracts` (`packages/host/contracts`) with browser-safe wire DTOs, boundary decoders (`decodeAttachment`, `requestEvent`, `decodeBriefView`, `decodeBoundProposal`, `decodeGeneration`, `decodeImageReview`, `isDesignSnapshot`), private Zod wire validation for Brief drafts, and portable-document decoder re-exports.
- Add Wave 0 boundary checks (`scripts/check-boundaries.mjs`, `check:boundaries` / `check:boundaries:report`) and enable TypeScript safety and import-restriction rules in `.oxlintrc.json` with negative fixture tests.
- Add the codebase refactor plan with 18 tasks across ten waves. Specify safety-net checks, file ownership, contracts, migration order, regression checks and deferred behavior work.
- Add the target structure of DeckAgent to `docs/conventions/project-structure.md`. The file gives the runtime ownership, the state authority of each owner, one table row for each folder and package, and the dependency rules. It also gives the enforcement status of each boundary: the tool that stops it now, and the check that the refactor adds.
- Add a `Check` layer to `docs/conventions/README.md` that answers how a violation is stopped, plus a decision diagram that places a new rule in Content, Convention, Skill, Lesson or Router.
- Extend the gap analysis of the chats, deck, providers, requests and workspaces use cases with five standards: the OWASP Top 10 for LLM Applications 2025, OWASP ASVS 5.0.0 and the Microsoft HAX Guidelines for Human-AI Interaction. Each new gap cites the standard item, and each accepted risk names the rule that answers it.
- Add four open questions for the gaps that no rule decides: the secret files that the agent reads without a prompt (OQ-068), the resource limit of one request (OQ-069), the valid base URL of a custom model API (OQ-070), and the link inside a project folder that points outside it (OQ-071).
- Add the `review-change` skill: a new subagent reviews a change against the convention files in `docs/conventions/` and reports only the mistakes that `pnpm check` cannot find.
- Add the `correct` skill: find the mistake classes that agents repeat in this repository and stop each one at the highest level that works, from architecture to a Lesson Learned.
- Add `docs/UCs/quality-attributes.md` with one quality attribute scenario for each of the 11 old quality requirements. Each scenario has the six SEI parts, and the security scenarios cite OWASP ASVS 5.0.0 and the OWASP Top 10 for LLM Applications 2025.
- Add the gap analysis of each use case file against its independent baseline. Each gap becomes a new rule, an accepted risk with its reason, or an open question.
- Add the open questions that the gap analysis found, and a question about the default language of a deck.
- Add Task 10 of the use case plan, which records the values that the product owner approved.
- Add the `Gửi request` use case file in `docs/UCs/` with its rules, flows and lifecycle diagrams, and nine open questions for the items that no rule decides.
- Add an independent baseline for the gap analysis of each area in `docs/UCs/`, written by a subagent that does not read the spec, together with the standards that the analysis uses.
- Add the use case index in `docs/UCs/README.md` (actors, use case map, files, ID prefixes, glossary), the six area file skeletons, and the open question OQ-001 about an independent baseline for the gap analysis.
- Add the implementation plan that moves the spec in `docs/00-old/spec/` to use case files in `docs/UCs/`, and add `UCs` as a `refactor` workstream of the implementation-plan skill.
- Add agent skills for test design techniques, test risk, estimation and defect classification, UI design review, and writing use cases and architecture documents.
- Check documentation structure and citations with `check:docs`, and run `check:docs` from a Claude Code hook after each edit.

### Changed

- Separate Request Lifecycle operation errors (`RequestFailure`) from HTTP status mapping (`requestFailureResponse` in Host transport), switch `AttachmentService.requestStore().admit` preconditions to `SessionError`, and add `packages/host/api/tests/request-failure.test.mjs`.
- Move `RequestStore` and `ApprovalStep` contracts into `@deckagent/session-persistence` (`packages/session/persistence/src/request-store.ts`), update `RequestController` and `AttachmentService` to import them from Session, and keep a temporary `RequestStore` re-export on `@deckagent/host-api`.
- Rewrite `docs/conventions/code.md` from a plan of six empty sections into the rules of production code. The rules cover naming, TypeScript, comments, contracts, runtime validation, data representation, state, async lifetime and error handling. The file also lists the patterns that DeckAgent does not require. Each rule names the tool that stops it.
- Rewrite `docs/conventions/project-structure.md` into the rules of the target source structure, under the headings principle, C4 level, folder and package. The file gives the runtime ownership, the state authority of each owner, one table row for each folder and package, and the dependency rules. It also gives the enforcement status of each boundary: the tool that stops it now, and the check that the refactor adds.
- State the same rules without repetition in `docs/conventions/code.md`: keep the constraint and drop the phrase that restates it.
- The `review-change` reviewer also reads `docs/conventions/project-structure.md`.
- Replace the vague words "thay đổi nhiều" in three rules with a condition that a tester can check. The rules are about material conflicts, missing material and missing research. The condition is a change to the main point of a planned slide.
- Make the rule about missing research ask the user only when the system cannot write the main point of a planned slide. For missing content of a sourced type, the system writes a placeholder, so the rule no longer conflicts with the placeholder rule.
- Drop the wait-time requirements for the first slide and for a changed slide, because the time depends on the model and the provider.
- Link the gap-analysis row of each use case area file to its baseline file in `docs/build/refactor/UCs/baseline/`, and run the comparison after Task 7.
- Make `write-use-case` use DeckAgent examples, ask for an open question when no rule decides an item, and run `check:docs` with the pinned pnpm version. Tasks 1 to 7 of the use case plan follow the skill and the plan method.
- `check:docs` prints the number of checked files, so a clean result is not mistaken for a run that checked no files.
- Use oxlint 1.94.0 with the `correctness` and `suspicious` categories as the only linter. Biome stays as the formatter only.

### Fixed

- Run workspace discovery in the build with the pnpm that runs the script, so a different `pnpm` on PATH no longer fails the build.
- Validate controlled-layout capacities before Outline image search and commit; return exact fields and Unicode counts with at most two repair submissions. Show derived layout blockers for saved Outlines across reload, retain existing image progress, and preserve the confirmation error instead of reporting a connection failure.

### Removed

- Remove the `check:comments` script and `scripts/check-no-comments.mjs` with its test. The comment rules in `docs/conventions/code.md` are enforced by review.
- Remove the `domain-modeling` and `spec-authoring` agent skills.
- Remove the Cordis runtime, chat CLI, provider adapters, native tool adapters, smoke fixtures and unused vendor packages. Build, workspace dependencies and CI now use the OpenCode path; keep storage, source-access and publication checks for the current application.

### Added

- Add HTML Basic version 3 with seven controlled layout skeletons, unchanged theme roles, content capacities and offline geometry checks. Preserve pinned versions 1/2 and saved artifacts; scale the same 1280x720 canvas in Preview and fullscreen. Include an offline layout gallery and Vietnamese capacity coverage.

- Resume saved image progress in later review requests without restaging unchanged Briefs and Outlines. Apply explicit image provider changes to new searches, retain prepared images and their provenance, keep question-only turns read-only, and report stale image IDs as workflow errors with current positions.

- Resolve Commons thumbnail and Pexels stock-photo origins, preserve distinct licence and source-read diagnostics, and retain per-image attempt history. Allow model-ranked image alternatives and one restricted recovery run before saving an unresolved Outline. Deck schema 10 preserves prior data and marks the Pexels licence contract.

- Review public-image candidates against each slide role using Tavily or explicitly selected Commons. Keep selection reasons, local thumbnails and immutable credits; require accepted image-specific licence evidence, block duplicate images within a slide and preserve unchanged choices across reviews. Add bounded public-image downloads and durable search attempts in Deck schema 9.

- Keep portable slide documents beside native artifacts, with executable HTML Basic version 2 templates, a two-image layout, shared browser decoding and separate validation diagnostics. Prepare public images before confirmation and reuse local bytes through layout retries; required missing images keep the Outline open for revision. Include a native PPTX capability proof with editable text/images and notes, without adding a product export option. Deck schema 8 preserves existing revisions and visual snapshots.

- Continue missing slides with an explicit new request on the same confirmed Deck; retain completed revisions, visual choices and the original confirmation across Stop and restart.
- Save per-content origins, actual source locations, separate presenter notes and a Host-written closing report from committed revisions.
- Find public images through Wikimedia Commons without an API key, retain local PNGs and credits, reject incompatible licences and report optional omissions. Generated images remain deferred in [the follow-up issue](https://github.com/Luke23127006/DeckAgent/issues/106).

- Install pinned OpenCode with Windows x64 application dependencies, discover it without global setup, validate runtime availability at startup and prepare verified release resources with the upstream license.

- Add a Windows `start:local` shortcut using pinned Node and the repository-local OpenCode CLI while reusing saved application data.
- Verify three-slide generation, restricted MCP tools, saved HTML and restart without replay through the real pinned CLI and a local test provider.

- Connect confirmed deck generation to the isolated OpenCode MCP bridge with versioned prompts, selected-source grants and scoped slide staging/publication.
- Add the end-user Create deck flow with Interview choices, Brief and Outline history, explicit confirmation, publication progress and sandboxed Preview; duplicate or lost confirmation responses do not start another generation.

- Add explicit Host confirmation receipts and durable generation intents, exact Brief/Outline binding, idempotent admission retry and visual snapshot locks that survive Stop or restart.
- Stage bounded HTML chunks and normalized attachment images in Application Storage, validate parsed HTML/CSS and real browser output, and atomically publish immutable artifact pointers with recovery that preserves last-good revisions. Deck schema v6 retains legacy HTML; generation model tools and end-user controls remain separate integrations.

- Add Host-owned deck interview requests with grouped missing-topic questions, explicit source choices, skip assumptions and request-local proposal staging; failed or stopped models cannot commit staged results.
- Bind structured Outline revisions to immutable Brief versions, retain slide identities through edits/reordering, compute full changes and restore earlier proposals into new versions. Deck schema v4 keeps legacy history and adds atomic request receipts; generation and its UI remain separate.

- Add an offline versioned design catalog, validated effective theme snapshots and content-based layout candidates with guarded custom-layout fallback.
- Persist immutable Brief versions and explicit source choices per Chat in Deck schema v3; expose authenticated Host reads/writes and a browser-safe client decoder. Existing Decks, Outlines and Chat history remain intact. Interview and generation integration remain separate.

### Fixed

- Share one strict Brief schema between Host validation, browser decoding and model tool descriptions. Report independent field errors together, bound same-request model repairs and preserve saved versions after exhaustion. Missing duration stays an Interview question; schema repair never enables sources or resets visual choices.

- Reuse request-scoped web images when retrying slide layouts, register concurrent identical image calls once, and explain that web images are already attached by the image-search tool.

- Read saved web-image Outline blocks in the browser and clear completed request controls even when a later Outline refresh fails; distinguish projection-read failures from model failures.

- Write MCP responses with native Node HTTP framing so the pinned OpenCode client can read tool replies.

- Keep Chat and Create deck guidance, research permissions and Outline revision targets aligned with the current workflow while preserving the interface layout and theme.
- Keep the research checkbox beside its label, show deck publication progress and render assistant text with safe, limited formatting and readable Brief details.
- Reject invalid custom provider IDs before sending a request, save pending model IDs and distinguish saved settings from a failed interface refresh.

- Keep Chat navigation disabled while a Chat is being created.

### Changed

- Supply the shipped visual catalog, complete proposal shapes and explicit image/format choices to Interview runs; generation retains timeout and Stop without the interview's eight-step guard.

- Record the accepted initial visual catalog and review/generation/publication contracts for B04, including product defaults and theme roles. Dependent runtime implementation remains separate.

- Attachment preparation receipts and parsed-content fingerprints use session schema v6; migrations keep existing source identities, approvals and conversations. Request text limits count Unicode code points independently of JSON transport bytes.

- The chat database moves to schema version 5, preserving source versions and approval history while migrating existing attachments and conversations.
- Local Web exposes only request-scoped read tools through an authenticated loopback MCP bridge; native OpenCode tools stay denied and source changes invalidate native session reuse.
- Local Web sends chat requests through the OpenCode CLI 1.19.5 (B02); Send no longer answers `503 REQUESTS_UNAVAILABLE`
  - Each request runs `opencode run --format json` without a shell, in an isolated configuration that denies every native tool and uses only the selected provider and model; the effective configuration is checked before any model work
  - One active request per chat; events are saved before they are shown and replay after a reload or reconnect; Stop ends the run at once; a Host restart marks running requests as not finished and starts nothing again
  - The native session of a chat is resumed only when its guard holds; otherwise a new one starts, seeded with the whole saved conversation
  - When the provider says the conversation is too long, OpenCode summarizes it and the request goes on; the chat marks where the summary starts and keeps every message readable, and a summary that fails ends the request as `CONTEXT_SUMMARY_FAILED` (FR-079)
  - A workspace with an active request is not removed or moved (UC-013 A5)
- Provider setup checks the key and the connection with the provider before saving; keys are stored with Windows DPAPI under `credentials/`, SQLite keeps only a reference, and other systems refuse a key instead of storing it in plain text
- The chat database moves to schema version 3 with requests, their events and native session bindings
- Local Web runs the B01 local foundation without a model or a provider key
  - App data lives in the OS app-data folder, or in the folder that `--data-dir` or `DECKAGENT_DATA_DIR` names, with databases in `db/` and files in `files/`; a damaged, unwritable or misplaced data folder stops startup with the next step to take, and nothing is reset
  - Each chat belongs to a workspace, and a chat whose workspace is removed is listed as ungrouped; the chat list has search, marks a chat that cannot be read, and the Host keeps each chat's draft until DeckAgent stops
  - The chat database moves to schema version 2 and migrates version 1 files in place
  - Send is unavailable until B02 connects OpenCode: the Host answers `503 REQUESTS_UNAVAILABLE` and the UI says why
- ADR-0002 and `builds/B01.md` state the draft rule of FR-038: the Host keeps drafts while DeckAgent runs, not in SQLite
- `docs/spec/` now holds the MVP spec: use cases, requirements, business rules and a backlog of behaviors left for later
  - The spec states each design choice as its result, or `pending` while it is open, and links no decision record or research note
- The `spec-authoring` skill follows the MVP use case format: the interaction diagram is the source of each step, and the Steps table holds the same steps
- `docs/AGENTS.md` drops the `Updated at` date rule and the rule that the spec holds no release, which the MVP spec replaces
- `docs/research/` holds one file per product (open-design, OpenCode, DeepSeek Harness, Claude Slide Design, Napkin AI, the legacy DeckAgent v2 code, folders on Windows), with observed conclusions only; screenshots and recordings sit under `docs/research/evidence/`
- Markdown files follow the no-hard-wrap rule in `docs/development/writing-documents.md`: each paragraph, list item and sentence sits on one line, and the named rules in `apps/local-web/DESIGN.md` are separate paragraphs

### Added

- Opt-in Tavily public research with free-account checks, request search budgets, protected or environment credentials, durable source excerpts and a safe source viewer. Session schema v7 preserves existing conversations and input records.

- Bounded preparation for text, PDF, Office documents, images and ZIP attachments, with immutable parsed sidecars, real source locations, explicit omissions and isolated cancellable parsers.
- Revisioned streaming uploads, safe previews, attachment-only admission and attachment controls in the Composer and conversation history, with parser/Host/browser checks and opt-in real CLI image transport smoke.

- Safe project and attachment reads, with file identity checks and Host approval for each read outside the project folder.
- Saved approval prompts with allow-once and refuse actions, reconnect recovery, Stop cancellation and tool activity in the chat UI; model timeouts pause while an approval is pending.
- Source permission regression checks and opt-in OpenCode CLI smoke tests against a local test provider, including approval, refusal and native tool bypass attempts.
- Chat-scoped attachment storage with durable managed files, source identities, draft revisions and atomic message/request associations; schema v4 migrates existing conversations and startup removes unsent staging without deleting committed attachments.
- Attachment metadata in Host/client history and storage integration checks for restart, isolation, cancellation, failed admission and changed files. Upload endpoints, parsing and attachment UI remain unavailable.
- The accepted [source, request and approval integration contracts](docs/adr/0001-source-request-contracts.md).
- The `test:model-requests` script (request lifecycle, OpenCode adapter and model requests with a fake OpenCode CLI) and the opt-in `test:opencode-live` script for the real pinned CLI
- The `--opencode <path>` flag of Local Web, and `DECKAGENT_OPENCODE`
- `docs/build/rebuild/adr/` holds seven decision records for the rebuild: local storage and data ownership, chat and session history, tools and permissions, request and event lifecycle, deck artifacts and revisions, credentials and models, and the design system and templates
- `docs/build/rebuild/architecture/` states the contracts those decisions imply, one file per area: data, session, events, tools and permissions, credentials and models, and the design system and templates, with `overview.md` as the entry point
- `docs/build/rebuild/planning/` maps each product behavior family to the minimum prerequisites it needs and lists the technical gaps that no decision covers yet
  - The dependency analysis hands off to the build sequence in `implementation-plan.md`
  - The decision records, the architecture notes and the planning notes are written in Vietnamese and keep their decision and behavior IDs inside `docs/build/`, which departs from the plain-English rule in `AGENTS.md` and the no-plan-detail rule in `docs/AGENTS.md`
- `docs/build/rebuild/implementation-plan.md` and `builds/B01.md` to `builds/B08.md`: the eight rebuild builds with their developer tasks; B01 is implemented and waits for independent testing
- `docs/build/rebuild/architecture/repository-structure.md` and `deck-artifacts.md`: package ownership and dependency direction, and the deck artifact contract
- `packages/workspace/registry/`: the workspace registry, with the project-folder rules of BR-019 and the name rules of BR-020
- The `test:local-foundation` script, which runs the workspace registry, chat persistence and local foundation tests
- `commit` and `commit-push` skills, which write a conventional commit message and an entry in this file
- `docs/development/writing-documents.md`: living documents and records, outcomes and not the conversation, one line per paragraph, clickable links, no bare ID
- `docs/research/_STYLE.md`: how a research note is written
- A GitHub conventions section in `AGENTS.md`: no agent is named as author or co-author

### Fixed

- Browser fullscreen smoke brings the CDP tab to the foreground before presenting Deck Canvas, retaining the full presentation assertions.

### Removed

- The in-request question and reply path of the Host API and the UI; a question now ends its request (ADR-0004)
- The `agent-runtime` dependency of `host-api` and the `model-providers` dependency of `local-web`
- The legacy Agent Loop in Local Web: the outline, editing and web-request workflows, the Cordis and agent-runtime dependencies of `apps/local-web`, and the `--workspace` flag
  - The tests that checked only that legacy path (`outline-workflow`, `recovery-editing`, their fixtures and the `test:recovery-editing` script and CI step); tests of behavior that B01 keeps were adapted
- `docs/build/rebuild/research/`: its conclusions now live in the decision records, the architecture notes and the implementation plan
- The product vision, the user segments, and the use cases and requirements that the MVP spec does not take
- `docs/versions/` and `docs/design/`: plans, tasks and handoffs live in GitHub Issues
  - The UX prototype regression test and its CI step, which only checked the removed prototype page
- The research report on EthanGuo2022 OpenDesign, the spec question backlog, and the research plans and handoffs
- The unused agent guides under `docs/agents/` (domain, issue tracker, triage labels, verification), with their references in `AGENTS.md` and the skill router
