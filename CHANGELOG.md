# Changelog

All notable changes to this project are recorded here.

## [Unreleased]

### Added

- The build workflow, agent rules and skills from the `deck-agent` workflow repository, applied to this repository.
- "Legacy source" rules in `WORKFLOW.md`: v3 baseline, drift inventory, port tickets at a pinned commit, deferred walking skeleton, cutover. A `port-ticket` issue template and a `legacy:port` label.
- Build workflow for a five-person team (`WORKFLOW.md`): version planning, phases 1–6, version close, test tiers (CI, eval, manual), full and light builds, an as-built layer.
- Agent instructions (`AGENTS.md`, `CLAUDE.md`) and skills in `.agents/skills/`, mirrored to `.claude/skills/` and `.codex/skills/`.
- Public docs in `docs/` and internal docs in `dev/`: target spec templates and criteria, version layout, plan and as-built templates, research style, meeting notes.
- GitHub issue templates, PR template and CODEOWNERS for the protected paths.
- "No agent attribution" rule in `AGENTS.md` and `CLAUDE.md`, and a project setting that turns off Claude Code commit and PR attribution.
- Target spec in `dev/spec/`, migrated from the legacy spec one use case at a time: UC-001, UC-002, UC-003, UC-005, UC-006, UC-010, UC-012 and UC-013, with their FRs, NFRs, BRs, glossary terms and research files.
- Decision records DEC-001 to DEC-007 in `dev/decisions/`; DEC-004 and DEC-006 are still open.
- The v3 legacy sync plan in `dev/versions/`.
- `dev/research/open-questions.md`: the runtime and product questions the spec review left open, each with the phase that answers it.

### Changed

- The spec, research, decisions, templates and workflow moved into `dev/mvp/`: the current spec is the MVP spec, with no target/version layers. `dev/mvp/README.md` holds the MVP status. `WORKFLOW.md` moved to `dev/mvp/WORKFLOW.md`.
- Acceptance criteria and NFR measures are written per build in its testing plan, after research, not in the spec. The FR and NFR templates lost those sections; the testing-plan template gained them.
- Phase 0 is MVP planning (build order, milestone `mvp`, walking skeleton); version close became MVP close, followed by a review of the workflow. A review of the workflow follows the first build.
- "Legacy source" became "Reference code": the legacy code and the OpenCode code on `feat/v2-opencode` are read at a pinned commit; the MVP code is written new, so port tickets and the `legacy:port` label are gone.
- The research of Claude Slide Design, Napkin AI and OpenDesign (EthanGuo2022) moved from `dev/legacy/` to `dev/mvp/research/evidence/`.

- The previous docs moved from `docs/` to `dev/legacy/` unchanged; `docs/AGENTS.md` became `dev/legacy/docs-rules.md`.
- `AGENTS.md`, `CLAUDE.md` and `README.md` replaced by the workflow versions. The README keeps the instructions to run the legacy app.
- The skills in `.agents/skills/` replaced by the workflow set (15 skills). The skill manifest now names `use-case-sequence` and lists `commit`.
- The `commit` and `commit-push` skills no longer add a `Co-Authored-By` trailer for an AI agent.

### Removed

- `dev/versions/`, the version spec layer and the `CHANGES.md` template.
- Legacy documents with no use left: the previous spec (read it on the `docs/spec` branch at `71ff143`), the old agent rules, the docs rules and alignment plan, the duplicate HTML of the OpenDesign report, and the `docs/design/` UX prototype with its CI step (its test file stays with the legacy code). The OpenCodeReview guide moved to `dev/development/`.
- Legacy UC-011, UC-014 and UC-017 are retired in the target spec; `dev/spec/02-use-cases/_CRITERIA.md` says where each behavior went.
