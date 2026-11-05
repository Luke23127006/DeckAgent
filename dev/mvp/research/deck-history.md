# Earlier states of a deck

Question: **how do open-design and the OpenCode runtime keep earlier states of the work**, and **how does the user go back to one**? Checked on 05-11-2026 for the review of legacy UC-008, from `README.md`, `docs/architecture.md` and `docs/spec.md` of `https://github.com/nexu-io/open-design` on `main` (no commit hash visible), and from `https://opencode.ai/docs/tui`, `/docs/config` and `/docs/server`. **No product was run**; **source code was not read**.

1. Why check this? Legacy UC-008 lets the user **see earlier states of a deck** and **make one the current deck again**. The review needs to know **what a reference product and the runtime already offer**, and **what they do with the conversation**.

2. **Does open-design keep earlier versions of an artifact?**
   - Observation: `docs/spec.md` section 5: "Artifact store — daemon-managed storage for generated files, **version snapshots**, and per-artifact metadata." Section 10 asks "**Artifact versioning. Git, or SQLite, or both?**"
   - Observation: `docs/spec.md` opens with a note that it is a **historical baseline** whose "**assertions below are not a source of current behavior**".
   - Observation: `docs/architecture.md` 3.2 lists "**version**" among the daemon routes, with **no route path or behavior**.
   - Observation: **no page says when a version is made**, or **how the user lists, opens, compares or restores one**.
   - => **open-design coverage** of going back to an earlier state is **unverified**.

3. **How does OpenCode go back?**
   - Observation: `/docs/tui`, "undo": "Undo last message in the conversation. **Removes the most recent user message, all subsequent responses, and any file changes.**"
   - Observation: `/docs/tui`, "redo": "Redo a previously undone message. Only available after using `/undo`." **File changes are restored too**.
   - Observation: `/docs/server`, Sessions: **`POST /session/:id/revert` reverts a message**; **`POST /session/:id/unrevert` restores all reverted messages**.
   - Observation: `/docs/config`, Snapshot: "OpenCode **uses snapshots to track file changes** during agent operations, enabling you to undo and revert changes within a session. **Snapshots are enabled by default.**" They use "**an internal git repository**" and **can be turned off** with `"snapshot": false`.
   - Observation: `/docs/tui` says the project "**needs to be a Git repository**" for undo; `/docs/config` says the **git repository is internal**. The pages **do not reconcile this**.
   - Observation: **not documented**: **undo of several steps**, whether a **new message clears redo**, and whether **undo restores only files the agent touched**.

4. **What does this mean for DeckAgent?**
   - Inference: the **runtime already keeps file states per message**, so a **state per request needs no extra store**, **if the deck source lives in the session's working folder**.
   - Inference: **OpenCode undo removes messages** from the session. Legacy UC-008 **kept every message** and said in the conversation which state the deck went back to. **Using the runtime undo as it is changes that behavior**.
   - Proposal: the **behavior is parked** (dev/mvp/spec/05-backlog/UC-008.md). When it returns, the runtime research **checks undo of several steps**, **where the snapshot repository lives**, and **how it fits** [DEC-006](../decisions/DEC-006-where-chat-work-is-kept.md).

5. **Limits of this check.**
   - `docs/spec.md` of open-design **calls itself a historical baseline**, not a source of current behavior; **item 2 rests on it**.
   - The **OpenCode pages disagree** on whether **undo needs the project to be a Git repository** (item 3).
   - **No product was run** and **no source code was read**.
