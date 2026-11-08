# MVP

**Everything the MVP** of DeckAgent **is built from**: the spec, the research, the decisions, the templates and the builds. **Rules**: [WORKFLOW.md](WORKFLOW.md).

## At a glance

- **Phase 0:** **in progress**. The **build order is approved** (below); the **milestone** and the **walking skeleton** remain.
- **Milestone:** `mvp` (**not created yet**).
- **Walking skeleton:** **not built**. It is **built in Phase 0**, **time-boxed**, **before the first build**, together with a **spike** that **counts how often code rejects the deck source the model writes** within a template (DEC-005; [open-questions.md](research/open-questions.md) item 5).
- **Reference code:** **legacy code** in `apps/`, `packages/`, `vendor/`, `scripts/`; **OpenCode reference** on branch `feat/v2-opencode`, **commit to pin at the first drift inventory** ([WORKFLOW.md "Reference code"](WORKFLOW.md#reference-code)).

## Build order

Each build is **one vertical slice** that **depends only on builds before it**. **Reasons, dependencies and the build of every FR, NFR and BR**: [research/mvp-build-order.md](research/mvp-build-order.md). **Reference code to read per build**: [research/opencode-reference.md](research/opencode-reference.md) item 14.

| # | Build | Scope | Flow tracker | Status |
|---|---|---|---|---|
| B1 | **Workspaces and new chat** | UC-013, UC-012 | — | not started |
| B2 | **Services and keys** | UC-005 | — | not started |
| B3 | **Send a request and wait** | UC-003 | — | not started |
| B4 | **First draft: the outline** (interview, outline, revision, confirmation, sources) | UC-001, outline part | — | not started |
| B5 | **First draft: the slides** (slide generation, deck view, images, source of content) | UC-001, slide part | — | not started |
| B6 | **Reopen an earlier chat** | UC-006 | — | not started |
| B7 | **Change the deck and ask about it** | UC-002, UC-009 | — | not started |
| B8 | **Design systems** | UC-010 | — | not started |

## Where things are

| What | Where |
|---|---|
| Spec | [spec/](spec/) |
| Spec backlog | [spec/05-backlog/](spec/05-backlog/) |
| Research | [research/](research/) (read [research/_STYLE.md](research/_STYLE.md) first) |
| Open questions | [research/open-questions.md](research/open-questions.md) |
| Decisions | [decisions/](decisions/) |
| Templates | [templates/](templates/) |
| Builds | `builds/UC-XXX-label/`, created at Phase 1 |
