# Changelog

All notable changes to this project are recorded here.

## [Unreleased]

### Added

- The build workflow, agent rules and skills from the `deck-agent` workflow repository, applied to this repository.
- "Legacy source" rules in `WORKFLOW.md`: v3 baseline, drift inventory, port tickets at a pinned commit, deferred walking skeleton, cutover. A `port-ticket` issue template and a `legacy:port` label.
- `dev/legacy/AGENTS.md`, which marks the legacy documents as read-only data.
- Build workflow for a five-person team (`WORKFLOW.md`): version planning, phases 1–6, version close, test tiers (CI, eval, manual), full and light builds, an as-built layer.
- Agent instructions (`AGENTS.md`, `CLAUDE.md`) and skills in `.agents/skills/`, mirrored to `.claude/skills/` and `.codex/skills/`.
- Public docs in `docs/` and internal docs in `dev/`: target spec templates and criteria, version layout, plan and as-built templates, research style, meeting notes.
- GitHub issue templates, PR template and CODEOWNERS for the protected paths.
- "No agent attribution" rule in `AGENTS.md` and `CLAUDE.md`, and a project setting that turns off Claude Code commit and PR attribution.
- Target spec in `dev/spec/`, migrated from the legacy spec one use case at a time: UC-001, UC-002, UC-003, UC-005, UC-006, UC-010, UC-012 and UC-013, with their FRs, NFRs, BRs, glossary terms and research files.
- Decision records DEC-001 to DEC-007 in `dev/decisions/`; DEC-004 and DEC-006 are still open.
- The v3 legacy sync plan in `dev/versions/`.

### Changed

- The previous docs moved from `docs/` to `dev/legacy/` unchanged; `docs/AGENTS.md` became `dev/legacy/docs-rules.md`. `docs/design/` stays in place because a legacy test reads it.
- `AGENTS.md`, `CLAUDE.md` and `README.md` replaced by the workflow versions. The README keeps the instructions to run the legacy app.
- The skills in `.agents/skills/` replaced by the workflow set (15 skills). The skill manifest now names `use-case-sequence` and lists `commit`.
- The `commit` and `commit-push` skills no longer add a `Co-Authored-By` trailer for an AI agent.

### Removed

- Legacy UC-011, UC-014 and UC-017 are retired in the target spec; `dev/spec/02-use-cases/_CRITERIA.md` says where each behavior went.
