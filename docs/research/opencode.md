# OpenCode

OpenCode (`https://opencode.ai`) is an open-source coding-agent runtime: it runs a model in a loop with tools (read, edit, bash, web fetch and others), keeps sessions, and offers a terminal interface (TUI) and an HTTP server. Checked on 05-11-2026 from the published docs: `https://opencode.ai/docs/permissions/`, `/docs/agents/`, `/docs/config`, `/docs/tui` and `/docs/server`. The `config`, `tui` and `server` pages were read through a fetch tool that returns a summary, so quotes from them are close to the page text, not guaranteed word for word. The product was never run and no source was read.

1. How does OpenCode limit what a tool step reaches?
   - Observation: each kind of tool step has a permission key: `read`, `edit` (covers edit, write and patch), `glob`, `grep`, `list`, `bash`, `task`, `skill`, `webfetch`, `websearch`, `external_directory`, `doom_loop` and others. Each key takes `allow`, `ask` or `deny`; wildcard patterns are allowed, and the last matching rule wins.
   - Observation: "Most permissions default to "allow"." `doom_loop` and `external_directory` default to `ask`.
   - Observation: `external_directory` covers "tool calls that touch paths outside the working directory" where OpenCode was started.
   - Observation: "You can override permissions per agent." The built-in Plan agent denies edits except its own plan files, and does not restrict `bash`.
   - Observation: a run flag `--auto` approves every step that is not denied.
   - => The reach of a step is set by configuration, not by the model. Code that writes the configuration decides what the agent reaches. With the working directory set to a project folder, reading there can be `allow`, writing there `deny`, and reading outside `ask`.
   - Not checked: whether `deny` on `edit` also blocks a `bash` command that writes in the working directory.

2. What does the user see when a step is `ask`?
   - Observation: the answers are `once` (this request), `always` (matching requests "for the rest of the current OpenCode session") and `reject`.
   - Not found: a way to take back an `always` answer.
   - => An approval that lasts is bounded by the session. A product that needs only "allow once" or "refuse" uses `once` and `reject`.
   - Not checked: how an `ask` step reaches a program that drives OpenCode through its server, so that the program can ask its own user.

3. How does OpenCode keep a long conversation within the context of the model?
   - Observation: `/docs/config`, Compaction: `"compaction": { "auto": true, "prune": false, "reserved": 10000 }`. `auto`: "Automatically compact the session when context is full (default: `true`)." `prune`: "Remove old tool outputs to save tokens (default: `false`)." `reserved`: "Token buffer for compaction"; no default is stated. Compacting means replacing the earlier conversation the model reads with a shorter summary.
   - Observation: `/docs/tui`: the command `/compact`, alias `/summarize`, "Compact the current session".
   - Observation: `/docs/server`: `POST /session/:id/summarize`, "Summarize the session", body `{ providerID, modelID }`.
   - Not found: a context usage number, token count or percentage shown to the user, or an API that returns one.
   - Not found: whether earlier messages stay readable after a compaction, and what the summary keeps.
   - => By default the runtime compacts by itself when the context is full, and also on request. If it replaces the messages, a product on top of it keeps its own copy of the conversation for the user to read.

4. How does OpenCode go back to an earlier state?
   - Observation: `/docs/tui`, "undo": "Undo last message in the conversation. Removes the most recent user message, all subsequent responses, and any file changes."
   - Observation: `/docs/tui`, "redo": "Redo a previously undone message. Only available after using `/undo`." File changes are restored too.
   - Observation: `/docs/server`, Sessions: `POST /session/:id/revert` reverts a message; `POST /session/:id/unrevert` restores all reverted messages.
   - Observation: `/docs/config`, Snapshot: "OpenCode uses snapshots to track file changes during agent operations, enabling you to undo and revert changes within a session. Snapshots are enabled by default." They use "an internal git repository" and can be turned off with `"snapshot": false`.
   - Observation: `/docs/tui` says the project "needs to be a Git repository" for undo; `/docs/config` says the git repository is internal. The pages do not reconcile this.
   - Not found: undo of several steps, whether a new message clears redo, whether undo restores only files the agent touched, and where the snapshot repository lives.
   - Inference: the runtime already keeps file states per message, so a state per request needs no extra store if the deck source lives in the session's working folder.
   - Inference: undo removes messages from the session. A product that keeps every message and says in the conversation which state the deck went back to cannot use the runtime undo as it is.
