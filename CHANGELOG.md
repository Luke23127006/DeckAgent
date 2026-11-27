# Changelog

Notable changes to this repository. The newest changes are at the top.

## [Unreleased]

### Added

- Add schema 3 preferences versioning, change notices and strict write validation. Reject stale research and theme writes with `PREFERENCES_STALE`.
- Move research into a Host module. Keep Browser research controls and theme synchronized through preferences notices without resending stale writes.

- **Host modules and change notices:** move `workspaces`, `chats` and `providers` into `apps/host/src/modules/`, publish `ChangeNotice` values (`workspaces`, `chats`, `providers`) through `GET /api/changes`, refuse stale writes with `409 WORKSPACES_STALE` and `409 PROVIDERS_STALE`, and refresh Browser lists from those notices.
- **Host package and HTTP edge:** add `@deckagent/host` (`apps/host/`), serve every route through Express 5.2.1, and record 15 shared HTTP behaviors in `e2e/http-edge.test.mjs` before the move.
- **Boundaries and tooling:** add `@deckagent/host-contracts`, `check:boundaries` (with `module-private-import` and `module-cycle` rules and negative fixtures), `scan:module-design`, `check:docs` and `test:local-foundation`; enable the TypeScript safety and import-restriction rules in `.oxlintrc.json`.
- **Use cases and architecture:** add the use case index, the six area files with an independent baseline, the gap analysis against OWASP ASVS 5.0.0 and the OWASP Top 10 for LLM Applications 2025, `docs/UCs/quality-attributes.md`, and the agent core contracts with ADR-001 to ADR-004.
- **Skills:** add `review-change`, `correct`, `commit` and `commit-push`, plus skills for test design, test risk, estimation, defect classification, UI design review, and use case and architecture writing.
- **Deck generation:** add HTML Basic version 3 with seven controlled layouts, image search through Commons and Pexels with licence evidence, credits and per-image attempt history, resumable image progress, continuation of a confirmed Deck, and presenter notes with a Host closing report. Image generation stays deferred in [issue 106](https://github.com/Luke23127006/DeckAgent/issues/106).
- **Attachments, sources and approvals:** add Tavily research, bounded attachment preparation, revisioned streaming uploads, saved approvals, and the request-scoped loopback MCP bridge that keeps native OpenCode tools denied.
- **Local foundation:** add the workspace registry, chat persistence with search and drafts, provider keys stored with Windows DPAPI, and the rebuild decisions and plans under `docs/build/rebuild/`.

### Changed

- Move deck routes into the deck module and session activity and request reads into chats. Remove the old management contracts.

- Move deck workflows and image and rendering adapters into the Host deck module. Keep the deck package boundary.

- Compact `CHANGELOG.md` to under 50 lines; `commit` and `commit-push` now remove low-value entries before they add a new one, so the file does not grow.
- Rewrite `docs/conventions/code.md` around the rules production code follows; use oxlint 1.94.0 as the only linter and Biome as the formatter only.
- Separate Browser transport from UI features, Node builds from Browser builds, and application failure classes from HTTP status mapping.
- Move 62 tests to their owners under `apps/web/tests/`, `packages/*/*/tests/` and `e2e/`, and replace fixed waits with explicit promises.
- Require a task report, a report index row and a `Done` row in the plan after each implementation-plan task.

### Fixed

- Share one strict Brief schema between Host validation, Browser decoding and model tools; validate layout capacities before image search; report exact field errors and derived layout blockers.
- Reuse request-scoped web images on layout retries, register concurrent identical image calls once, and explain that web images are already attached.
- Write MCP responses with native Node HTTP framing so the pinned OpenCode client can read tool replies.
- Keep Chat and Create deck guidance, research permissions and Outline revision targets aligned, with the interface layout and theme unchanged.

### Removed

- Remove `apps/web/src/ui-assets.ts`, the Node dependencies of `@deckagent/local-web`, `@deckagent/workspace-registry`, `@deckagent/browser-runtime`, the legacy Agent Loop and the Cordis runtime.
- Remove `check:comments`, the `domain-modeling` and `spec-authoring` skills, `docs/versions/`, `docs/design/` and the unused agent guides.
