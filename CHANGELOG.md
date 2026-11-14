# Changelog

Notable changes to this repository. The newest changes are at the top.

## [Unreleased]

### Changed

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
