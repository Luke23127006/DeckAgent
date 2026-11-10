# MVP

**Everything the MVP** of DeckAgent **is built from**: the spec, the research, the decisions, the templates and the build records. **How work is done**: [WORKFLOW.md](WORKFLOW.md).

## At a glance

- **MVP planning:** **done**. The **build order** is below and the **milestone** exists.
- **Milestone:** [`mvp`](https://github.com/Luke23127006/DeckAgent/milestone/1).
- **MVP code:** **none yet**. The **MVP code root** is a **pending PO decision** ([repository-structure.md](../development/repository-structure.md)).
- **Application foundation and runtime:** the **DeckAgent application server** (local server and browser, DEC-010) and the **interface** for workspaces are built in **B1**. The **OpenCode agent runtime** is integrated with the **first feature that needs agent execution** (B3), and the **walking skeleton through the runtime** is built then. **OpenCode already ran on Windows** in the OpenCode reference at `5bd9c17`.
- **Spike** that **counts how often code rejects the deck source the model writes** within a template (DEC-005): in the **slide build** (B5), **before slide code depends on it** ([open-questions.md](research/open-questions.md) item 5).
- **Reference code:** **legacy code** in `apps/`, `packages/`, `vendor/`, `scripts/`; **OpenCode reference** on branch `feat/v2-opencode`, **read at a pinned commit** ([WORKFLOW.md "Reference code"](WORKFLOW.md#reference-code)).

## Build order

Each build is **one delivery slice** that **depends only on builds before it**. A build **organizes scope, dependencies and progress**; it **does not prescribe how a task is done**. **Reasons, dependencies and the build of every FR, NFR and BR**: [research/mvp-build-order.md](research/mvp-build-order.md). **Reference code to read per build**: [research/opencode-reference.md](research/opencode-reference.md) item 14.

| # | Build | Scope | Tracker | Status |
|---|---|---|---|---|
| B1 | **Workspaces and new chat** | UC-013, UC-012 | [#48](https://github.com/Luke23127006/DeckAgent/issues/48) | research done; test design in progress (D5 in review); **no implementation started** |
| B2 | **Services and keys** | UC-005 | — | not started |
| B3 | **Send a request and wait** | UC-003 | — | not started |
| B4 | **First draft: the outline** (interview, outline, revision, confirmation, sources) | UC-001, outline part | — | not started |
| B5 | **First draft: the slides** (slide generation, deck view, images, source of content) | UC-001, slide part | — | not started |
| B6 | **Reopen an earlier chat** | UC-006 | — | not started |
| B7 | **Change the deck and ask about it** | UC-002, UC-009 | — | not started |
| B8 | **Design systems** | UC-010 | — | not started |

## MVP testing

**Shared testing knowledge to reuse**, not a gate: completing it **does not block** any task, and it is **not updated per task**. **Method**: [test-strategy.md](../development/test-strategy.md). **Tiers**: [WORKFLOW.md "Test tiers"](WORKFLOW.md#test-tiers).

- **Scope:** the spec of the use cases in the build order above; the **spec backlog** (`spec/05-backlog/`) is **out of scope**.
- **Shared risks** (each is detailed where it is designed):

  | Risk | Level | Builds | Detail |
  |---|---|---|---|
  | **Filesystem and security**: a refused or too-wide project folder, path forms that bypass a refusal, reading or writing the project folder, a state change from a client that is not allowed | high | B1, B3 | B1 [test-analysis.md](builds/UC-013-workspaces-new-chat/testing/analysis/test-analysis.md) QR-1, QR-2, QR-3, QR-8 |
  | **Data loss and recovery**: half state after a kill, removal, restart | high | B1, B3, B6, B7 | B1 QR-4, QR-5 (NFR-008) |
  | **LLM generation quality**: the interview, the outline, the slides, a change to the deck | normal, eval tier | B4, B5, B7 | not designed yet |
  | **Provider boundaries**: keys and secrets, what leaves the machine, provider failures and timeouts | high | B2, B3 | not designed yet |

- **Levels:** **unit** with each module; **acceptance** through the test driver against the server; **integration** once two real parts exist; **E2E** once a flow runs from the interface; **eval** with fixed cases and a rubric for model behavior; **manual** for what only a person can judge.
- **Verification approach:** deterministic behavior on **Windows CI** (`windows-2022`, Node `22.19.0`, **Vitest** per DEC-013), with the model replaced by **recorded fixtures**; model behavior by **eval runs**; visual quality by **manual checks**. Branch-coverage threshold: **`not set`**.
- **Test design to reuse:** B1 [testing/](builds/UC-013-workspaces-new-chat/testing/): the analysis, the plan, [acceptance-criteria.md](builds/UC-013-workspaces-new-chat/testing/design/acceptance-criteria.md) (each AC **checked against the spec** before use), and the **workspace-name design** [D5](builds/UC-013-workspaces-new-chat/testing/design/techniques/D5-workspace-name.md) (**68 test cases, all Ready**; no open gap in [test-design.md](builds/UC-013-workspaces-new-chat/testing/design/test-design.md)). The **test driver and fixture contract** is in B1 [test-implementation.md](builds/UC-013-workspaces-new-chat/implementation/test-implementation.md). B2–B8 have **no design yet**; each is designed **for the behavior a task takes**.

## Next for B1

1. **PO decision: the MVP code root.** **Proposed:** a new pnpm workspace package `apps/deckagent/` for the local server and its browser interface (DEC-010), **apart from** the legacy `apps/local-web`; alternative: a top-level `mvp/`. The **layout inside it** is the developers'.
2. **Executable now:** [#58](https://github.com/Luke23127006/DeckAgent/issues/58) **test runner** (DEC-013): Vitest `4.1.12`, a `test:acceptance` script, `vitest.config.ts`, and a **self-test** that an `it.fails` stays green on a failing assertion and turns red on a passing one. It is a **prerequisite**, **not product progress**.
3. **First product increment (backend integration, not yet user-visible):** a minimal **application server** and the **add, list and restart** of a workspace through its API, with a minimal driver.
   - **Expected behavior:** UC-013 main steps and FR-071: the workspace is **named after the folder**, becomes the **workspace in use**, is **listed**, and **survives a restart** (DEC-011, `better-sqlite3`).
   - **Rules the spec attaches to adding a workspace, enforced in this increment:**
     - **BR-019**, all five values, compared **after links are followed**. A refused folder **sets up no workspace** and the answer says **why** and whether **a folder inside it** can be chosen.
     - **Reads no file of the folder** (FR-071). Checked by the **fs audit** with a positive control that **detects a forbidden read** (B1 test-implementation.md, rule "fs audit").
     - **Changes no file** of the user or the project folder (FR-071, FR-084). Checked by a **snapshot** with its positive control.
     - **FR-143**: a client that is not allowed **changes no workspace**. The **mechanism is the developer's** (FR-143 leaves it to the implementation), **proven by tests**.
   - **Before merge:** every **path class that could reach a refused folder** through the inputs the endpoint accepts is **tested** (link following, `subst` drive, 8.3 name, case and separator variants, relative and dot segments, the `\\?\` prefix, UNC forms). A class the endpoint **rejects up front** needs one test that it **is rejected**. The **rest of the D4 and D8 coverage** may follow in later increments; **FR-071 is complete** when it is met.
   - **Name cases:** **3–5 cases of D5** from the **folder source**, each **checked against BR-020 and FR-071** before use; the rest of D5 follows with renaming (FR-141).
4. **Next (user-visible):** the interface shows the **workspace list** and a **typed-path field** to add a folder (DEC-010), against the same API; then the **E2E** test of that flow.

## Where things are

| What | Where |
|---|---|
| Spec | [spec/](spec/) |
| Spec backlog | [spec/05-backlog/](spec/05-backlog/) |
| Research | [research/](research/) (read [research/_STYLE.md](research/_STYLE.md) first) |
| Open questions | [research/open-questions.md](research/open-questions.md) |
| Decisions | [decisions/](decisions/) |
| Templates | [templates/](templates/) (optional) |
| Build records | `builds/UC-XXX-label/`, created when the work needs them |
