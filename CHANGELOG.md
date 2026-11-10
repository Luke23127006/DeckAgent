# Changelog

Notable changes to this repository. The newest changes are at the top.

## [Unreleased]

### Changed
- `docs/spec/` now holds the MVP spec: use cases, requirements, business rules and a backlog of behaviors left for later
  - The spec states each design choice as its result, or `pending` while it is open, and links no decision record or research note
- The `spec-authoring` skill follows the MVP use case format: the interaction diagram is the source of each step, and the Steps table holds the same steps
- `docs/AGENTS.md` drops the `Updated at` date rule and the rule that the spec holds no release, which the MVP spec replaces
- `docs/research/` holds one file per product (open-design, OpenCode, DeepSeek Harness, Claude Slide Design, Napkin AI, the legacy DeckAgent v2 code, folders on Windows), with observed conclusions only; screenshots and recordings sit under `docs/research/evidence/`
- Markdown files follow the no-hard-wrap rule in `docs/development/writing-documents.md`: each paragraph, list item and sentence sits on one line, and the named rules in `apps/local-web/DESIGN.md` are separate paragraphs

### Added
- `docs/build/rebuild/research/` holds the rebuild research: the direction (rebuild on the OpenCode Agent Loop, keep the `clean-main` UI), the reference baseline commit, the runtime comparison, the code inventory, the architecture direction and the CLI integration validation
  - The notes are written in Vietnamese, which departs from the plain-English rule in `AGENTS.md`, and they sit outside `docs/research/` because they record a build sequence rather than one product
- `commit` and `commit-push` skills, which write a conventional commit message and an entry in this file
- `docs/development/writing-documents.md`: living documents and records, outcomes and not the conversation, one line per paragraph, clickable links, no bare ID
- `docs/research/_STYLE.md`: how a research note is written
- A GitHub conventions section in `AGENTS.md`: no agent is named as author or co-author

### Removed
- The product vision, the user segments, and the use cases and requirements that the MVP spec does not take
- `docs/versions/` and `docs/design/`: plans, tasks and handoffs live in GitHub Issues
  - The UX prototype regression test and its CI step, which only checked the removed prototype page
- The research report on EthanGuo2022 OpenDesign, the spec question backlog, and the research plans and handoffs
- The unused agent guides under `docs/agents/` (domain, issue tracker, triage labels, verification), with their references in `AGENTS.md` and the skill router
