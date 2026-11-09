# Earlier work in open-design

Question: **how does open-design keep earlier work**, and **how does the user find and reopen it**? Checked on 05-11-2026 for the UC-006 review, from `README.md`, `QUICKSTART.md`, `docs/architecture.md`, `docs/spec.md` (an archived draft) and `AGENTS.md` in `https://github.com/nexu-io/open-design` on `main` (no commit hash visible). **No product was run**; **source code was not read**.

1. Why check this? Legacy UC-006 **reopens an earlier chat** with its conversation and its deck. The review needs to know **what unit of earlier work a reference product uses**, and **what it promises after a restart**.

2. **How does the user find earlier work?**
   - Observation: `README.md` product tour: "**All projects** — revisit design systems, media, and prototypes." and "**Home** — start with a brief or an example."
   - Observation: `QUICKSTART.md` troubleshooting: "**open the project from the OpenDesign app again** instead of resuming an old terminal agent session."
   - Observation: **no page describes a list of conversations**, or **search or filter** of projects or conversations.

3. **What is the unit of earlier work?**
   - Observation: `docs/architecture.md` 3.2 lists "**project and conversation persistence**" as a daemon task. 3.1: "Projects, conversations, messages, and project files are **hydrated through the daemon APIs**." The **daemon** is the **local program that runs next to the web interface**.
   - Inference: a **project holds its conversations and its files**. That a **project holds several conversations is not stated**.
   - => **DeckAgent keeps the chat as the unit**: **one conversation and at most one deck** (owner ruling of 05-11-2026). **Grouping chats by workspace**: items 8 to 10.

4. **Where is earlier work kept**, and **does it survive a restart**?
   - Observation: `docs/architecture.md`: "**SQLite state and daemon-owned project files**". The **data folder comes from `OD_DATA_DIR`**; the docs give **no concrete path on purpose** (`AGENTS.md`, "Daemon data directory contract").
   - Observation: `docs/architecture.md` 3.1: browser state is "**not as an alternate browser-only project database**".
   - Inference: **earlier work survives a restart**, since it is **kept in SQLite by the daemon**. The docs **do not state it as a promise**.

5. **What happens to a run** when the user **leaves, reloads or restarts**?
   - Observation: the **daemon owns** "**run bookkeeping, cancellation, and SSE output**" (`docs/architecture.md` 3.2). **SSE** (server-sent events) is a **stream of events from the daemon to the interface**.
   - Observation: **no page says** whether a **run goes on when the user leaves** a project or reloads, or whether it **resumes after the daemon restarts**.
   - => **DeckAgent keeps its own rulings**: a **request keeps running when the user goes to another chat** (FR-068), and **nothing resumes after DeckAgent stops** (FR-019).

6. **Can a project or conversation be renamed or deleted?**
   - Observation: **not documented**. The **only deletion found removes all local app data** (`docker compose down -v` in `QUICKSTART.md`).
   - Proposal: **renaming and deleting a chat** is a **candidate use case**, **not yet scheduled** (owner rulings of 05-11-2026 in the UC-006 and UC-013 reviews).
   - => **Parked in the spec backlog as UC-018** on 05-11-2026.

7. **Limits of this check.**
   - `README.md` and `AGENTS.md` were **read in part**; the rest **came from a summary** of the page.
   - `docs/modes.md`, `docs/roadmap.md` and `docs/agent-adapters.md` were **not read** for this question.

**Items 8 to 10 were added on 05-11-2026** for the UC-013 review, from `README.md` (first part verbatim, the rest summarized), `docs/architecture.md` and `QUICKSTART.md`.

8. **Does a project use a folder of the user?**
   - Observation: `docs/architecture.md` section 6: "`POST /api/import/folder` **creates a project rooted at a user-selected folder**." Section 3.5: an imported project uses "the user-selected external `metadata.baseDir`" and is **not copied** "into the managed-project root".
   - Observation: the daemon "**validates and bounds file operations against that selected workspace**". A **desktop import needs a token** "minted by the trusted main process after the native folder picker succeeds".
   - Observation: **other projects are kept under the data folder** of the daemon.
   - => DeckAgent: a **workspace has one project folder that the user chooses** (FR-071).

9. **Does the agent write into that folder?**
   - Observation: the runtime is spawned "**with the project workspace as its working directory**"; section 7: "Imported-folder projects use their validated external root".
   - Inference: the **agent of an imported project writes into the user's folder**. **No page states it**.
   - => **DeckAgent writes no file into the project folder** (FR-084); **where its work is kept** is [DEC-006](../decisions/DEC-006-where-chat-work-is-kept.md).

10. **Are projects grouped or removed?**
    - Observation: **no page describes a group of projects** (workspace, folder or tag), or **removing a project** and **what happens to its files**.
    - => **DeckAgent groups chats by workspace** and **keeps every chat of a removed workspace in the default workspace** (FR-073, BR-004). **No reference product shows this**.

11. **Which folders does an import refuse?** (08-11-2026, code at commit `87a4f91`)
    - Observation: `apps/daemon/src/import-export-routes.ts` (`POST /api/import/folder`) runs **`realpath`** on the path, then refuses **the root of a file system**, the **data folder or a folder inside it**, **system folders** (`C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, a folder **inside or holding** one, from `apps/daemon/src/linked-dirs.ts`), the **user's home folder itself**, and `.ssh`, `.aws`, `.gnupg`, `.kube`, `.docker` in the home folder **and inside them**.
    - Observation: each is a **plain refusal** with a reason; **no warning to confirm**.
    - Observation: a folder that **holds the data folder** but is **not the home folder** (such as `C:\Users\<name>\AppData`) is **not refused**.
    - => **DeckAgent refuses the same folders**, plus **a folder that holds its own data**, since it **writes nothing in a project folder** (FR-084, BR-019).
12. **How does open-design test folder import and refusal, and how is its test setup built?** (08-11-2026, code at commit `87a4f91`, for the testing plan of the first build)
    - Observation: `apps/daemon/tests/folder-import-route.test.ts` rejects a **missing path**, an **empty path**, a **relative path**, a **non-existent path**, a **path that points at a file**, and the **filesystem root**; it checks that a **symlink is canonicalized by `realpath`** at import, and that a **symlink into the data folder is refused**.
    - Observation: `apps/daemon/tests/linked-dirs.test.ts` uses `SystemRoot` as the **blocked system folder on Windows**, and a **`junction` pointing to it** must be refused.
    - Observation: no test was found for a **project folder that is moved, made unreadable, or replaced** after import.
    - Observation: `apps/daemon/tests/security-import-folder-dotfiles.test.ts` puts **sentinel keys in a temporary fake home**, but its **home refusal** test imports the **real `os.homedir()`**, and checks `~/.ssh` **only `if (existsSync(ssh))`**: on a runner **without `.ssh`** that check **passes without running**.
    - Observation: the **data folder** is set by **`OD_DATA_DIR`**; tests set it **before a dynamic import** of the server, because the path is **read when the module loads**. Each test **starts the server in the same process** on **port 0** and **shuts it down** after.
    - Observation: unit tests **stub `os.homedir()`** with `vi.spyOn` to keep the **real home untouched**.
    - Observation: pull-request CI runs on **Linux runners**; **Windows** runs only the **tools-pack payload tests** and a **nightly packaged smoke** on `windows-latest`. The folder refusal tests **do not run on Windows in pull-request CI**.
    - Observation: E2E uses **Playwright** (`e2e/playwright.config.ts`): **Chromium only**, **1 retry on CI**, **10 s expect timeout**, an **isolated runtime per worker** with a **reserved port**, and **CI-scaled timeouts**. `e2e/AGENTS.md` asks to **treat a pass only on retry as a signal, not flake**, to **wait on a side-effect-free readiness signal** instead of a fixed delay, and to **keep logs and scratch of a failed run**.
    - Inference: open-design covers **more input shapes** (relative path, a file instead of a folder) than DeckAgent's testing plan, and **no case for a folder that later changes**; DeckAgent's FR-074 and FR-142 tests have **no reference to copy**.
    - Inference: the **conditional `.ssh` check** is the **silent-skip risk** the testing plan's `denyRead` policy and **injected stand-in folders** avoid.
    - Proposal: DeckAgent reads its **data, user and key folders from configuration when it starts**, not when a module loads, so the test driver can **start it on port 0** with **temporary stand-ins**.
    - Proposal: DeckAgent's E2E **follows the same rules**: Playwright with Chromium, an **isolated data folder and port per worker**, **one retry on CI** where a **retry-only pass is reported**, and **waits on a readiness signal**.
13. **In which order does open-design check an import path, does a rebind check the same rules, and does it merge failing tests?** (08-11-2026, code at commit `87a4f91`, for the open points of the first build's testing plan)
    - Observation: `POST /api/import/folder` (`apps/daemon/src/import-export-routes.ts`, lines 383 to 478) checks **in a fixed order** and **stops at the first failure**: **empty** path, **relative** path, **not found** (`realpath` fails), **not a directory**, **filesystem root**, **data folder or inside it**, then `blockedProjectRootReason` (system, home, key folders). Each failure returns **one reason**.
    - Observation: the route **never checks read access** on its own; a folder that cannot be read fails only when `realpath` or `lstat` fails.
    - Observation: `apps/daemon/tests/security-import-folder-dotfiles.test.ts` (`must reject rebinding a project working-dir to the home root`) checks that **rebinding an existing project** to the home folder through `POST /api/projects/:id/working-dir` is **refused like an import**.
    - Observation: GitHub code search over the repository finds **one** use of `it.fails`, **one** of `test.fixme`, and **43** of `it.skip`; the security test above says in a comment that it was **red on `main`** when written, and **ships with its fix**.
    - Inference: open-design puts **path errors before refusal rules**, so a folder that falls under both gets the **path error**; DeckAgent's spec **does not set this order**.
    - Inference: open-design treats **changing a project's folder** as **subject to the same refusals** as importing one, which matches FR-142 "under the same conditions as choosing another folder".
    - Inference: open-design **does not merge failing tests ahead of their fix**, so its practice **does not answer** how DeckAgent keeps an **approved, locked, failing test** in CI; Vitest's `it.fails` exists and is used there once.
