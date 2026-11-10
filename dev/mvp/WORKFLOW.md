# MVP build workflow

How DeckAgent goes **from the MVP spec to working code** with a **five-person student team**. It is a **direction, not a rulebook**: each step says **what to do and why**, so the team can **use judgment** when a case does not fit. **Every session** that plans the MVP or starts a build **reads this document**. It covers **the MVP only**: when the MVP closes, the team **reviews this workflow** and moves to **work driven by issues**. See [MVP close](#mvp-close).

## At a glance

- **The PO decides what is costly to get wrong**: the **spec**, **technology choices**, **scope**, and the **module and LLM boundaries**. Everything else the **team does and reviews itself**. **The agent** drafts and does the legwork. See [Roles](#roles).
- **Tests come before code.** Each build writes its **acceptance criteria** first and turns them into **tests that fail** until the code exists, so "done" means **the tests pass**, not "it looks right". **How to design tests** is in `dev/development/test-strategy.md`, a **toolbox** to use where it helps. See [Test tiers](#test-tiers).
- **One spec.** `dev/mvp/spec/` is **the spec of the MVP**. It **states behavior**; the **acceptance criteria** are written **per build**, in its `acceptance-criteria.md`. Behaviors **left for later** wait in the **spec backlog** `dev/mvp/spec/05-backlog/`. See [Spec rules](#spec-rules).
- **The MVP code is new.** The **legacy code** and the **OpenCode code** on `feat/v2-opencode` are **reference, not product**. See [Reference code](#reference-code).
- **Understanding the system is part of the work.** Each build leaves an **as-built note** on what carries product value: the **boundary between the model and the deterministic parts**. See [As-built layer](#as-built-layer).
- **Flow:** **Phase 0** (once) → **Phases 1–6** (once per build) → **MVP close**. Each phase ends with a short **"Done when"** list the team **checks itself**; phases **may overlap** when the work allows it.

## Roles

| Role | Usually does |
|---|---|
| **PO** | Owns the **spec** and the **decision records** (`Choice` / `Why`). Settles **scope**, **technology choices** and the **module and LLM boundaries**. Sets the **build order**. Says when a **build is accepted**. |
| **Developer** | Pulls tickets, writes **tests and code**, runs the tests before opening a PR, **reviews teammates' PRs**. |
| **Agent** | Drafts research questions, plans, acceptance criteria, tickets and as-built notes. Runs suites and reports. Reviews PRs lightly. **Does not** answer a research question, write a decision's `Choice` / `Why`, or accept a build: those are the PO's. |

## Repository layout

```
docs/                         public docs for outside readers (polished prose)
└── architecture/             as-built: module map, LLM boundary map
dev/                          internal docs for the dev team
├── mvp/
│   ├── README.md             MVP status: build order, walking skeleton, builds
│   ├── WORKFLOW.md           this file
│   ├── spec/                 the MVP spec
│   │   └── 05-backlog/       spec backlog: behaviors left for later
│   ├── research/             research files (read research/_STYLE.md first)
│   │   └── evidence/         recordings and reports the research files cite
│   ├── decisions/            DEC-NNN-topic.md
│   ├── templates/            plan and as-built templates
│   └── builds/
│       ├── _light/traceability-matrix.md
│       └── UC-XXX-label/
│           ├── research/
│           │   └── research-checklist.md         Phase 1: questions, drift inventory
│           ├── testing/
│           │   ├── traceability-matrix.md        the spine of the build
│           │   ├── analysis/                     what is tested
│           │   │   ├── test-analysis.md          summary: basis counts, risks, types, feasibility, ambiguities
│           │   │   ├── basis-register.md         one row per basis item
│           │   │   └── sentence-map.md           every unit of the spec text, its class and items
│           │   ├── planning/testing-plan.md      how deep, at which level, design inputs
│           │   ├── design/                       how each item is tested
│           │   │   ├── test-design.md            summary: techniques, coverage counts, open rulings
│           │   │   ├── techniques/Dn-topic.md    evidence of one technique, step by step
│           │   │   └── acceptance-criteria.md    AC, measures, eval cases, manual checks, charters
│           │   ├── execution/eval-runs/YYYY-MM-DD.md   Phase 6: recorded eval runs
│           │   └── test-summary.md               Phase 6: coverage, defects, residual risks
│           └── implementation/
│               ├── test-implementation.md        driver, fixtures, test-stub tickets
│               ├── implementation-plan.md        Phase 3
│               └── as-built.md                   Phase 6
├── development/              coding conventions, review criteria, repo structure, test strategy
├── meetings/                 meeting transcripts and notes
└── legacy/                   documents tied to the legacy code (read-only)
```

**A build folder holds three groups**: `research/` (**what was asked and found**), `testing/` (**what is tested, how, and the evidence**), `implementation/` (**how it is built and how the tests are wired**). A file is **created when the work needs it**, never empty in advance; a small build **may skip** a file that would say nothing. A local mirror of the **flow tracker** sits at the build root.

**Test directories** (**proposed**; the final layout lives in `dev/development/repository-structure.md`): `tests/acceptance/`, `tests/eval/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`. Test files **directly in `tests/`** are **legacy tests** (see [Reference code](#reference-code)).

## Spec rules

| Part | In `dev/mvp/spec/` | In the build |
|---|---|---|
| Use case | Steps table and alternatives, one-line `When` each | — |
| FR | Statement only | Acceptance criteria, each with a tier (`acceptance-criteria.md`) |
| NFR | Statement only | Measures, each with a tier (`acceptance-criteria.md`) |
| BR | Rule and values | — |

1. **One ID everywhere.** FR-001 in a plan, a test or a ticket **is FR-001 of the spec**.
2. **Acceptance criteria live in the build.** They are written **after research**, for the **FRs and NFRs in scope**, in the build's `acceptance-criteria.md`. They **stay out of the spec**, so a behavior lives in **two places**: its **statement** and its **tests**.
3. **New behavior enters the spec first.** A build **does not contain a behavior the spec lacks**, because otherwise nobody can tell a feature from a bug. The new behavior **claims its ID in the spec** (the PO approves spec changes) **before the build uses it**.
4. **The backlog waits outside the spec.** A behavior **left for later** is **parked** in `dev/mvp/spec/05-backlog/` with its **ID and the reason**, and no build takes it until the PO **promotes it to the spec**. A behavior **dropped for good is deleted**; its **ID is not reused**. See `dev/mvp/spec/05-backlog/_CRITERIA.md`.
5. **The spec freezes at MVP close.** **Later changes** go **through issues**.

## Test tiers

Each acceptance criterion or measure gets **one tier**, by **how it can be checked**. Its `Check` field gives the **default**: `deterministic` → **CI**, `evaluation` → **eval**; move one to **manual** when only a person can judge it.

| Tier | Covers | Runs |
|---|---|---|
| **CI** | Deterministic behavior: state, confirmations, saved files. The model is replaced by recorded fixtures or a mock. | Every PR; a red CI **blocks the merge** |
| **Eval** | Generation quality: the interview, an outline that fits the audience, slide quality. Fixed cases with a rubric, against a real model. | Anyone, any time; **at least one recorded run** before the build is accepted |
| **Manual** | What only a person can judge, such as visual quality. | Phase 6 |

An **eval run is recorded** at `builds/UC-XXX-label/testing/execution/eval-runs/YYYY-MM-DD.md` with the **model**, the **cases**, the **score per case** and the **runner**.

## Build sizes

| Size | When | Shape |
|---|---|---|
| **Full** (default) | A UC, a set of steps or alternatives, or a new FR | The phases below |
| **Light** | A bug fix or a small change to an existing FR | **One Issue** labelled `build:light`: an **acceptance criterion with a tier**, a **test that fails before the fix**, and a row in `dev/mvp/builds/_light/traceability-matrix.md` |

## Trigger and scope

Every build **belongs to the MVP** and **starts with Phase 1**, not with code, once **Phase 0 is done**.

| User says | Scope |
|---|---|
| "Build UC-001" | Full UC as written in the spec |
| "Build the fetch flow from UC-001" | Steps S1-S2, alternatives A1-A3 |
| "Build just the link validation" | FR-001 only |
| "Build UC-001 S1-S3 without save" | Steps S1-S3, without the save-related alternatives |
| "Fix: outline loses a slide on revise" | Light build |

Every build **writes its scope** in `dev/mvp/builds/UC-XXX-label/`: the **use case**, the **steps** and **alternatives** included (or "all"), the **FRs** and **NFRs** in scope. **Several builds of the same UC** can coexist, each with its **own folder, flow tracker and tickets**.

## Resuming

"**Continue**" + a build name: **read the build's flow tracker issue** on GitHub **first**; it shows the **active phase** and the **open tickets**. "**Status**" + a build name: **show the tracker** **without changing anything**.

## Reference code

**Two bodies of code** exist outside the workflow. Both are **reference, not product**; the **MVP code is written new**.

- **Legacy code:** `apps/`, `packages/`, `vendor/`, `scripts/` and the tests directly in `tests/`. It **predates the workflow** and **does not run on OpenCode**. With it stay `dev/legacy/development/` (how to run it) and `dev/legacy/versions/` (its plans).
- **OpenCode reference:** the code on branch `feat/v2-opencode`, **built on the OpenCode runtime**. It **may differ from the spec**.

Guidance:

1. **Read it at a named commit**, never at a moving branch head, so two readers see the same code.
2. **Compare it with the spec in Phase 1** (the **drift inventory**): for each in-scope behavior it already has, note `match`, `differ` or `missing`. A **bug is not carried**; a **wanted but unspecified behavior enters the spec first**; the **spec wins over the code**.
3. **Its tests are input, not proof.** Legacy and reference tests suggest cases; they do not stand in for the build's own tests.
4. **Name the source.** A plan step or ticket that follows reference code **names the file and the commit**, and the ticket **writes new code** rather than copying it.
5. **Legacy cutover.** The **first build's implementation plan** proposes **when the legacy code** and its documents **are deleted**; the deletion is **its own change**.

## Phases

### Phase 0 — MVP planning (once)

1. **Confirm the MVP scope**: the use cases in `dev/mvp/spec/02-use-cases/`, **without the backlog**. **Order the builds** and record the order in `dev/mvp/README.md`.
2. **Read the product questions** in `dev/mvp/research/open-questions.md`; settle the ones the first build needs, or name the build that answers each one.
3. **Create the GitHub milestone** `mvp`.
4. **Walking skeleton.** Build the **thinnest path** that **runs end to end** through the real runtime (UI → OpenCode → tools → renderer) for the main flow. It **need not look good**; it **must run**. It **may be deferred** to the first implementation ticket of the first build; `dev/mvp/README.md` says why.

**Done when:** the **build order** is recorded, the **milestone exists**, and the **skeleton runs** or its **deferral is recorded**.

### Phase 1 — Research

**Why:** a question answered **before** the tests and the plan is **cheap**; the same question found **during coding** costs a rewrite.

1. Run skill `research-questions` on the **in-scope part of the spec**. It writes `research/research-checklist.md`, with the **drift inventory** when reference code applies.
2. **Seed** `testing/traceability-matrix.md` with **one row per in-scope FR and NFR**.
3. Open **one `research-ticket` Issue per question** that needs work (labels `phase:research`, `uc:XXX`).
4. When the build **touches the runtime**, write down **how OpenCode handles that part** and **where DeckAgent hooks in**; start from the matching items of `open-questions.md`.
5. Each answer becomes a **research file update** or a **decision record** `dev/mvp/decisions/DEC-NNN-topic.md`, whose `Choice` and `Why` the **PO writes**.

**Done when:** the questions that **block the tests or the plan** are answered, and each drift line has an **outcome**. A question that blocks nothing **may stay open**.

### Phase 2 — Tests before code

**Why:** a test written **from the spec, before the code**, checks **what the product should do**; a test written after the code tends to check **what the code happens to do**.

1. Run skill `testing-plan`, which uses `dev/development/test-strategy.md`. It drafts **what to test** (`testing/analysis/`), **how deep and at which level** (`testing/planning/testing-plan.md`) and **how each item is tested** (`testing/design/`, ending in `acceptance-criteria.md`). Use the **depth the build needs**: a risky area gets the full technique; a simple one gets a criterion and a test.
2. **Ask the PO** where the **spec is unclear** or the **scope is in doubt**; that is where a test can lock in the wrong behavior. The rest the team **reviews itself**.
3. **Split the matrix rows**: one row per **acceptance criterion or measure**, with its tier.
4. Write `implementation/test-implementation.md` (the **driver**, the **fixtures**, the **test-stub ticket list**) and open the `test-stub-ticket` Issues (labels `phase:test-stubs`, `uc:XXX`, `tier:*`). Tickets for one area **may start** once **that area's criteria are clear**; they need not wait for the whole build.
   - **CI tier:** a **failing test** in `tests/acceptance/`, written as an **expected failure** (`it.fails`), so CI **stays green while the code is missing** and **turns red if it passes too early**. It should fail **on a real assertion** (`dev/development/test-strategy.md` "Test infrastructure rules").
   - **Eval tier:** the **eval cases and the rubric** in `tests/eval/`.
   - **Manual tier:** **no ticket**; the check is **listed in `acceptance-criteria.md`**.
5. **Test PRs are reviewed like code**, against their criteria, by a teammate. A later change to a test **says why in its PR**, so a test is never quietly bent to fit the code.
6. **Prefer that someone other than the implementer writes the tests of an FR**: the person who writes the code tends to test what they already thought of. Record the **test author** on the matrix row.

| Test type | When | Label |
|---|---|---|
| Acceptance, security | Before implementation | `phase:test-stubs` |
| Eval cases and rubric | Before implementation | `phase:test-stubs` |
| Unit | Inside implementation tickets | `phase:impl` |
| Integration, recovery | After the modules they test | `phase:post-impl` |
| E2E, smoke, performance | After all implementation | `phase:post-impl` |
| Regression | With each bug fix | `phase:post-impl` or `build:light` |
| Exploratory | Charter in `acceptance-criteria.md`; session in Phase 6 | None |

**Done when:** every in-scope FR and NFR has **criteria with a tier**; the **CI-tier ones have tests** that fail as expected; the **eval-tier ones have cases and a rubric**; the **manual ones are listed**.

### Phase 3 — Implementation plan

**Why:** the **module split** and the **LLM boundary** are the decisions that are **hardest to change later**, so they are settled **before the tickets**.

1. Write `implementation/implementation-plan.md`. Each step names **what to build** (module, file path), the **tests it makes pass**, the **decisions it depends on**, and the **reference code it reads**.
2. **Module boundaries.** Propose the **module split and the seams** (skill `codebase-design`); the **PO settles them**.
3. **LLM boundary.** For **each step of every value flow** in scope:

   | Step | Model or code | What the model receives | What the model decides | Prebuilt assets used |
   |---|---|---|---|---|

   **Prebuilt assets** are **themes, layouts, animations and format renderers**. **Prefer code**: call the model **only** to **understand the request**, **interview the user** or **write content**.
4. **In the first build**: propose the **legacy cutover**.

**Done when:** the PO has **settled the boundaries**, and **every matrix row** has a step that makes it pass.

### Phase 4 — Implementation tickets

1. Open **`implementation-ticket` Issues** (labels `phase:impl`, `uc:XXX`); see [Good tickets](#good-tickets).
2. Open **`post-impl-test-ticket` Issues** (label `phase:post-impl`) for the tests that need the modules first.
3. **Update the flow tracker** and the **Test / Impl columns** of the matrix.

**Done when:** every matrix row has its **tickets**, and every ticket **maps to a row**.

### Phase 5 — Execution

1. Pick a ticket, **read it and its context**, branch, implement, and **run the ticket's test command**.
2. In the PR, **first show the tests failing on an assertion** against the new code, then **turn its `it.fails` into `it`**. That shows the tests **really check the code**, not that they were green by accident.
3. Use the **PR template**: **ticket link**, **test command output**.
4. A **teammate or the agent** reviews (`/code-review`): the change **stays within the ticket**, tests are **not weakened**, and the **LLM boundary** of the plan holds (**no model call where the plan says code**).
5. **Merge when CI is green** and the review passes. **Close the ticket** and **update the flow tracker**.

**Done when:** the build's **tickets are closed** and **no `it.fails` is left**.

### Phase 6 — Verification

1. Run the **full CI suite**, the **smoke tests** and the **E2E tests** for the **happy path** and the **alternatives in scope**.
2. **Eval:** record **at least one run** in `testing/execution/eval-runs/` covering **every eval-tier criterion**.
3. **Predict, then compare.** Before reading the code, the PO writes a **short prediction** in `implementation/as-built.md` ("this flow goes A → B → C; the model is called at X and Y"); the agent then fills in the **actual flow** and the **drift**. The gap shows **where the team's understanding is off**.
4. **Update `docs/architecture/`** (see [As-built layer](#as-built-layer)).
5. Run the **manual checks** and the **exploratory sessions** listed in `acceptance-criteria.md`.
6. Write `testing/test-summary.md`: **what is covered**, the **defects**, and the **risks left**.
7. **The PO accepts the build.** For a row that still fails, either **fix it** in a **light build** with a **regression test**, or **move its behavior to the spec backlog** with the reason. Then **close the flow tracker**.

**Done when:** **CI is green**, an **eval run is recorded**, `as-built.md` and `docs/architecture/` are **current**, and the **PO has accepted the build**.

### Review after the first build

When the **first build closes**, the team holds a **short review of this workflow**: which step, document or habit **gave no value for its cost**. The notes also **feed the way of working after the MVP**.

### MVP close

1. **Every build** in milestone `mvp` **is closed**.
2. The **spec is frozen**: `dev/mvp/` **stays as the record** of the MVP.
3. **Close the milestone.**
4. **Review this workflow** and move to **bug reports and improvement requests as GitHub issues**, each with **its own lifecycle**.

## As-built layer

The as-built layer helps the team understand **what carries product value**, **not every line of code**. DeckAgent's value lies in **where the model works** and where **prebuilt, deterministic parts work instead**; that boundary is what **separates DeckAgent from asking a coding agent for slides**.

| Artifact | Where | Updated | Content |
|---|---|---|---|
| **LLM boundary map** | `docs/architecture/llm-boundary.md` | Every Phase 6 | The as-built version of the Phase 3 table, for every built value flow |
| **Module map** | `docs/architecture/modules.md` | When module boundaries change | Each module: what it owns, what it depends on |
| **As-built note** | `builds/UC-XXX-label/implementation/as-built.md` | Phase 6 | Prediction, actual flow (a short sequence diagram for value flows only), drift |

**Drift worth reporting:** a step that **calls the model where the plan says code**, or the reverse; a **prebuilt asset bypassed** (for example, the model generating CSS instead of applying a theme); a **module boundary crossed**. Renames and internal restructuring are not drift. Each `as-built.md` **stays within one page**.

## Safety nets

- **Branch protection on `main`:** the **CI check is required**, **no direct pushes**.
- **CODEOWNERS** (the PO): `dev/mvp/spec/`, `.github/`, `dev/mvp/WORKFLOW.md`, `AGENTS.md`, the files whose change **affects everyone**.
- **PR template:** **ticket link** and **test command output**.

## Traceability

Each build keeps **one spine**: `testing/traceability-matrix.md`. Each row links `FR/AC → basis items → tier → RQ/DEC → test (author) → impl ticket → result`, so anyone can answer **"which test checks this, and did it pass?"**. Items **not tested** are listed **apart**, each with its reason. The **Impl column links tickets or PRs**, not functions.

The agent **checks for orphans** at the end of each phase and **reports them**: an FR or NFR with **no row**, a row with **no test**, a **DEC nobody uses**, a ticket with **no row**. An orphan usually means **forgotten work**; fix it or say why it is fine.

## Document rules

Every plan document and template serves **two readers**: a **person skimming it**, and an **agent that re-reads it** each phase.

1. **Front-load.** Open with `## At a glance`: **scope**, **status**, and a **link to the matrix**.
2. **Link, don't restate.** **One fact lives in one home.** Plans **reference matrix rows by ID** and **never copy requirement text**.
3. **Fixed section order.** Each template **fixes its headings**; generators **keep them**.
4. **Length budget.** **About one page** per document; **split or link out** when it grows. The **acceptance criteria** (`acceptance-criteria.md`), the **basis register** and **sentence map** (`basis-register.md`, `sentence-map.md`) and the **technique evidence files** follow the length of the spec they cover.
5. **No history in a living document.** The spec, this workflow, the templates and the other living documents say **what is true now**; **history goes to git** and `CHANGELOG.md`. **Records** (decisions, research items, build files, meeting notes) **keep their dates**. See AGENTS.md "Documents: current state, history in git".
6. **One line, bold keywords.** Each **paragraph or list item sits on one line**, and each sentence **bolds the words that carry its meaning**. See AGENTS.md "Writing Markdown".
7. **Outcomes, not the conversation.** Every document holds what its reader **acts on**. A decision is written as its **result**, or **`pending`** while open; **who decided and when** stays in the **issue** and **git**. See AGENTS.md "Documents: current state, history in git".

## Flow tracker

Each build has **one flow tracker issue** (template `.github/ISSUE_TEMPLATE/flow-tracker.md`), opened at the **start of Phase 1** in milestone `mvp`, so anyone sees **where the build stands** at a glance. The **scope comes first**. GitHub issue bodies use **bare `#N`**; the local mirror uses **full links**.

```markdown
## Phase 1: Research
- [ ] #N question-title (status)

## Phase 2: Tests before code
- [ ] Acceptance criteria written
- [ ] #N test-stub-title (tier, author)

## Phase 3: Implementation plan
- [ ] #N plan-review

## Phase 4: Implementation
- [ ] #N module-title (test author: @x)

## Phase 5: Post-impl testing
- [ ] #N test-title

## Phase 6: Verification
- [ ] Eval run recorded
- [ ] As-built: prediction, actual, drift
- [ ] docs/architecture/ updated
- [ ] Test summary written: test-summary.md
- [ ] Build accepted
```

## Good tickets

A ticket should be **doable by someone who does not know the context**: a teammate, or a small model (DeepSeek V4.1 Flash, GLM 5.3 Flash). A good ticket usually has:

- **One concern**: one function, one component, one module; **split it** when it grows past a few files.
- **Exact file paths**: `src/domain/source-validator.ts`, not "a validation module".
- **The contract**: **signature**, **parameter types**, **return type**.
- **A test command** whose **green result means done**.
- **What not to touch**.
- **Blocked by**: what must be **merged first**.
- **Context**: the **files the implementer needs**, one line each, including **reference files at their commit**.
- **The test author**, when someone else wrote the tests.

## Labels

| Label | Meaning |
|---|---|
| `uc:XXX` | Use case of the ticket |
| `phase:research` | Phase 1 ticket |
| `phase:test-stubs` | Phase 2 ticket |
| `phase:impl-plan` | Phase 3 ticket |
| `phase:impl` | Phase 4 implementation ticket |
| `phase:post-impl` | Post-implementation test ticket |
| `tier:ci`, `tier:eval` | Tier of a test ticket |
| `build:light` | A light build |
| `flow-tracker` | The root tracker of a build |
| `flash-ready` | Suitable for a flash-model implementer |

## Milestone

**One milestone**: `mvp`. **Every ticket of every build** belongs to it; the `uc:XXX` **label separates builds**.

## Linking convention

Every cross-reference is a **clickable Markdown link**, **never a bare `#N` or a plain path**, **except inside GitHub issue bodies**, where `#N` **auto-links**. **Derive the base URL** from `git remote get-url origin`.

| Reference | Format |
|---|---|
| Issue from a local file | `[#N](https://github.com/{owner}/{repo}/issues/N)` |
| File from an issue body | `[dev/mvp/research/topic.md](https://github.com/{owner}/{repo}/blob/main/dev/mvp/research/topic.md)` |
| Issue from an issue body | `#N` |

Apply it in **research checklists**, **local flow-tracker mirrors**, **research files**, **decision files**, and **issue bodies**.
