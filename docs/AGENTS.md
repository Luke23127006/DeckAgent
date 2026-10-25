# Rules for `docs/`

These rules extend the root `AGENTS.md` for every file under `docs/`.

- **Placement.** Developer-facing conventions and reference go under `docs/development/`, agent guidance under `docs/agents/`, tooling guides under `docs/tooling/`, product specs under `docs/spec/`, version plans and handoffs under `docs/versions/<version>/` (the active version is the last one in `spec/00-current-scope/VERSIONS.md`), and research under `docs/research/`.
- **No plan detail outside `docs/versions/`.** A document outside `docs/versions/` holds no detail of an implementation plan. Plan detail means a task ID (`TASK-003`, `W-014`), a gate ID, the status of either, the owner or date of one stage, or a link to a file under `docs/versions/`. Name the behavior or the rule instead, and let the plan cite this document. A version that ended makes its plan stale. A document that copies the plan goes stale with it.
  - Allowed: `CONTRIBUTING.md` points to the progress file of the active version, because that is a pointer and not plan detail.
  - Not allowed: "TASK-003 moves the Browser policy. See `docs/versions/v1/task-003-tools-browser.md`."
- **Standalone readability.** A reader must understand a file without opening another file to decode an ID. When a file cites another source, it says what the source shows in words (for example `claude-report (stop before any slide exists keeps an empty canvas)`), not by an opaque code such as `CS-01 B15` or `row 3.12`. Meaningful IDs that the project defines and resolves (`UC-001`, `A12`, `FR-004`) are fine; row or step numbers inside another document are not.
- **Name research and reference files for their content** (`claude-deck-generation-behavior.md`), not for a sequence number.
- **Write once.** A behavior shared by several flows is written once, in a common section; each flow states only what differs.
- **Spec dates.** Every `###` block in a segment, a use case or the vision ends with `Updated at: dd-mm-yyyy`. When you change a block, set its date to the day of your change, in the same change. Do not record who changed it; git history does. Criteria: U-14, UCG-14, VG-13.
- **Spec style.** Files in `docs/spec/` follow [`spec/_STYLE.md`](spec/_STYLE.md): plain English, short sentences, one action per bullet. Use cases state intent and response and never name a control, gesture, position or look (rule 11).
- **Mermaid.** Readers use GitHub and VS Code 1.121 or later, which renders Mermaid in its built-in Markdown preview. Do not install the old Markdown Preview Mermaid Support extension; it is deprecated. Use the conservative subset in the `mermaid-markdown` skill.
- **Generated blocks.** Never edit between a `BEGIN generated` and an `END generated` marker. After any change to the steps or alternative flows of a use case, update the block with the `use-case-flowchart` skill. A Claude Code hook reminds Claude to do this; other agents have no hook, so this rule is their only trigger.
