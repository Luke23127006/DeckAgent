# Earlier work in open-design

Question: how does open-design keep earlier work, and how does the user find and reopen it? Checked on 05-11-2026 for the UC-006 review, from `README.md`, `QUICKSTART.md`, `docs/architecture.md`, `docs/spec.md` (an archived draft) and `AGENTS.md` in `https://github.com/nexu-io/open-design` on `main` (no commit hash visible). No product was run; source code was not read.

1. Why check this? Legacy UC-006 reopens an earlier chat with its conversation and its deck. The review needs to know what unit of earlier work a reference product uses, and what it promises after a restart.

2. How does the user find earlier work?
   - Observation: `README.md` product tour: "All projects — revisit design systems, media, and prototypes." and "Home — start with a brief or an example."
   - Observation: `QUICKSTART.md` troubleshooting: "open the project from the OpenDesign app again instead of resuming an old terminal agent session."
   - Observation: no page describes a list of conversations, or search or filter of projects or conversations.

3. What is the unit of earlier work?
   - Observation: `docs/architecture.md` 3.2 lists "project and conversation persistence" as a daemon task. 3.1: "Projects, conversations, messages, and project files are hydrated through the daemon APIs." The daemon is the local program that runs next to the web interface.
   - Inference: a project holds its conversations and its files. That a project holds several conversations is not stated.
   - => DeckAgent keeps the chat as the unit: one conversation and at most one deck (owner ruling of 05-11-2026). Grouping chats by workspace: items 8 to 10.

4. Where is earlier work kept, and does it survive a restart?
   - Observation: `docs/architecture.md`: "SQLite state and daemon-owned project files". The data folder comes from `OD_DATA_DIR`; the docs give no concrete path on purpose (`AGENTS.md`, "Daemon data directory contract").
   - Observation: `docs/architecture.md` 3.1: browser state is "not as an alternate browser-only project database".
   - Inference: earlier work survives a restart, since it is kept in SQLite by the daemon. The docs do not state it as a promise.

5. What happens to a run when the user leaves, reloads or restarts?
   - Observation: the daemon owns "run bookkeeping, cancellation, and SSE output" (`docs/architecture.md` 3.2). SSE (server-sent events) is a stream of events from the daemon to the interface.
   - Observation: no page says whether a run goes on when the user leaves a project or reloads, or whether it resumes after the daemon restarts.
   - => DeckAgent keeps its own rulings: a request keeps running when the user goes to another chat (FR-068), and nothing resumes after DeckAgent stops (FR-019).

6. Can a project or conversation be renamed or deleted?
   - Observation: not documented. The only deletion found removes all local app data (`docker compose down -v` in `QUICKSTART.md`).
   - Proposal: renaming and deleting a chat is a candidate use case, not yet scheduled (owner rulings of 05-11-2026 in the UC-006 and UC-013 reviews).
   - => Parked in the spec backlog as UC-018 on 05-11-2026.

7. Limits of this check.
   - `README.md` and `AGENTS.md` were read in part; the rest came from a summary of the page.
   - `docs/modes.md`, `docs/roadmap.md` and `docs/agent-adapters.md` were not read for this question.

Items 8 to 10 were added on 05-11-2026 for the UC-013 review, from `README.md` (first part verbatim, the rest summarized), `docs/architecture.md` and `QUICKSTART.md`.

8. Does a project use a folder of the user?
   - Observation: `docs/architecture.md` section 6: "`POST /api/import/folder` creates a project rooted at a user-selected folder." Section 3.5: an imported project uses "the user-selected external `metadata.baseDir`" and is not copied "into the managed-project root".
   - Observation: the daemon "validates and bounds file operations against that selected workspace". A desktop import needs a token "minted by the trusted main process after the native folder picker succeeds".
   - Observation: other projects are kept under the data folder of the daemon.
   - => DeckAgent: a workspace has one project folder that the user chooses (FR-071).

9. Does the agent write into that folder?
   - Observation: the runtime is spawned "with the project workspace as its working directory"; section 7: "Imported-folder projects use their validated external root".
   - Inference: the agent of an imported project writes into the user's folder. No page states it.
   - => DeckAgent writes no file into the project folder (FR-084); where its work is kept is [DEC-006](../decisions/DEC-006-where-chat-work-is-kept.md).

10. Are projects grouped or removed?
    - Observation: no page describes a group of projects (workspace, folder or tag), or removing a project and what happens to its files.
    - => DeckAgent groups chats by workspace and keeps every chat of a removed workspace in the default workspace (FR-073, BR-004). No reference product shows this.
