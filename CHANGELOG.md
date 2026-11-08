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
- **MVP build order** in `dev/mvp/README.md`: **eight builds**, each **one vertical slice** that **depends only on the builds before it**, after a **time-boxed walking skeleton and spike** in Phase 0. The reasons and the **build of every FR, NFR and BR** are in `dev/mvp/research/mvp-build-order.md`.
- `dev/mvp/research/opencode-reference.md`: an **analysis of the reference code** on `feat/v2-opencode` at commit `5bd9c17`: its **problems**, **where it differs from the MVP spec**, **what it helps with**, and **which files each build reads**.

### Changed

- **Research checklist format "map first, questions after"** (template, skill `research-questions`, skill `ticket-writer`, research ticket template): a **map of the whole product** with the **build's blocks highlighted**, the **build's boundary**, then **questions per block**, each **triaged by how it gets answered** (no research needed, later build, existing evidence, small check, PO decides). **Only the last three get a ticket.** Prose in Vietnamese with English technical terms.
- **Phase 1 of the first build** (workspaces and new chat) **started**: research checklist and traceability matrix in `dev/mvp/builds/UC-013-workspaces-new-chat/`.
- **Phase 0 is closed.** The **walking skeleton is deferred** to the **first implementation ticket of the first build**: OpenCode **already ran on Windows** in the reference, **runtime questions** belong to the **Phase 1 research** of the build that touches them, and the **first build calls no runtime**. The **spike on check faults** moves to **Phase 1 of the slide build**.
- **Workspaces** (UC-013, UC-006): a new workspace **takes the name of its folder**, **two workspaces may share a name**, and the user **renames a workspace** (new FR-141). A **removed workspace's chats become ungrouped chats**, **apart from every workspace**, as DeepSeek Harness does; **adding the folder again gives an empty workspace**. The open question on workspace names is answered.
- **Markdown form** (AGENTS.md "Writing Markdown"): **no hard wrap**, each paragraph or list item **on one line**; each sentence **bolds its keywords**. Every Markdown file outside `dev/legacy/` was **unwrapped**; spec style rule 9 and research style rule 3 follow the new rule. Every living document **bolds its keywords**: the spec, the workflow, the templates, the skills, the issue and PR templates, `dev/development/`, `docs/`, README, AGENTS.md and CLAUDE.md, and every file of `dev/mvp/`, the decisions, research notes and evidence reports included.
- Living documents hold no history (AGENTS.md "Documents: current state, history in git"; spec style rule 12). The MVP spec lost every legacy reference, ruling date and "merged/retired/changed vs" note, its `updated` dates, its removed-ID lists (each kind now names its next free ID, each use case its next free flow ID) and the `Source`/`Decided` sections of backlog items. Accessibility is not an MVP question.

- The spec, research, decisions, templates and workflow moved into `dev/mvp/`: the current spec is the MVP spec, with no target/version layers. `dev/mvp/README.md` holds the MVP status. `WORKFLOW.md` moved to `dev/mvp/WORKFLOW.md`.
- Acceptance criteria and NFR measures are written per build in its testing plan, after research, not in the spec. The FR and NFR templates lost those sections; the testing-plan template gained them.
- Phase 0 is MVP planning (build order, milestone `mvp`, walking skeleton); version close became MVP close, followed by a review of the workflow. A review of the workflow follows the first build.
- "Legacy source" became "Reference code": the legacy code and the OpenCode code on `feat/v2-opencode` are read at a pinned commit; the MVP code is written new, so port tickets and the `legacy:port` label are gone.
- The research of Claude Slide Design, Napkin AI and OpenDesign (EthanGuo2022) moved from `dev/legacy/` to `dev/mvp/research/evidence/`.
- The **use case interaction diagram is now the source** of each step's text: a **`U->>S` line** for the user and a **`Note over U,S` box** for the system, each **starting with its step ID** (`[S1]`), with a **wider, left-aligned layout**. The **Steps table keeps only Step, FR and Evidence**. The skill `use-case-sequence` that generated the diagram is **removed**; `spec-authoring` **checks that the diagram and the table hold the same steps**.

- The previous docs moved from `docs/` to `dev/legacy/` unchanged; `docs/AGENTS.md` became `dev/legacy/docs-rules.md`.
- `AGENTS.md`, `CLAUDE.md` and `README.md` replaced by the workflow versions. The README keeps the instructions to run the legacy app.
- The skills in `.agents/skills/` replaced by the workflow set (15 skills). The skill manifest now names `use-case-sequence` and lists `commit`.
- The `commit` and `commit-push` skills no longer add a `Co-Authored-By` trailer for an AI agent.

### Removed

- `dev/versions/`, the version spec layer and the `CHANGES.md` template.
- The rest of the legacy documents: the legacy vision is deleted. The DeepSeek Harness notes are compacted into `dev/mvp/research/deepseek-harness.md`; the nine user segments into `dev/mvp/research/users.md`; the three legacy ADRs into DEC-006 and the research files on outside services and agent permissions; the open design questions and attachment-limit trials still open into `dev/mvp/research/open-questions.md`. `dev/legacy/` keeps only `development/` and `versions/`, tied to the legacy code.
- Legacy documents with no use left: the previous spec (read it on the `docs/spec` branch at `71ff143`), the old agent rules, the docs rules and alignment plan, the duplicate HTML of the OpenDesign report, and the `docs/design/` UX prototype with its CI step (its test file stays with the legacy code). The OpenCodeReview guide moved to `dev/development/`.
- Legacy UC-011, UC-014 and UC-017 are retired in the target spec; `dev/spec/02-use-cases/_CRITERIA.md` says where each behavior went.
