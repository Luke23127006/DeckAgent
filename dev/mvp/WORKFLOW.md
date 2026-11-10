# MVP build workflow

How DeckAgent goes **from the MVP spec to working code** with a **five-person team**. **Every session** that plans the MVP or starts a build **reads this document**. It covers **the MVP only**: when the MVP closes, the team **reviews this workflow** and moves to **work driven by issues** (bug reports and improvements). See [MVP close](#mvp-close).

## At a glance

- **One product owner (PO)** owns the spec, the research decisions, the testing plan, the implementation plan and **every verdict**. **Developers** pull tickets and **write tests and code**. **The agent** drafts and does the legwork. See [Roles](#roles).
- **Quality is enforced by tests, not by PR review.** Tests are **written from the PO's plan**, **approved by the PO**, then **locked**. The **implementer of an FR** is **never the author of its tests**. **How tests are designed** is in `dev/development/test-strategy.md`, whose "Frame" places each testing activity (STLC) in a phase below. The PO decides at **three test gates**, on records: **Gate 1** scope and approach and **Gate 2** test design (both in Phase 2), **Gate 3** the build verdict (Phase 6). See [Test tiers](#test-tiers) and [Enforcement](#enforcement).
- **One spec.** `dev/mvp/spec/` is **the spec of the MVP**. It **states behavior**; the **acceptance criteria** are written **per build**, in its `acceptance-criteria.md`. Behaviors **left for later** wait in the **spec backlog** `dev/mvp/spec/05-backlog/`. See [Spec rules](#spec-rules).
- **The MVP code is new.** The **legacy code** and the **OpenCode code** on `feat/v2-opencode` are **reference, not product**. See [Reference code](#reference-code).
- **Understanding of the system is a deliverable.** Each build leaves an **as-built record** focused on what carries product value: the **boundary between the model and the deterministic parts**. See [As-built layer](#as-built-layer).
- **Flow:** **Phase 0** (once) → **Phases 1–6** (once per build) → **MVP close**.

## Roles

| Role | Owns | Must not |
|---|---|---|
| **PO** | The spec. Research answers and decision records (`Choice` / `Why`). Test analysis, testing plan and test design, including the acceptance criteria, and the three test gates. Implementation plan, including module boundaries and the LLM boundary. Approving tickets. **Approving tests.** Walking skeleton. Verdicts in Phase 6. MVP close. | — |
| **Developer** | Test-stub, implementation and post-impl test tickets. Running the ticket's test command before opening a PR. Running eval suites. | Edit the spec, edit a locked test, or implement an FR whose tests they wrote. Change files outside the ticket. |
| **Agent** | Research question lists and option/tradeoff tables. Drafts of plans, acceptance criteria and tickets. Light PR review. Running suites and reporting. As-built drafts. | Answer a research question. Fill a decision's `Choice` / `Why`. Close a gate. |

The PO's **scarce time** goes to **plans and test review**, **not code review**. A test file read against its acceptance criteria is **short**; reviewing it is the **highest-leverage check** the PO makes.

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
│           │   ├── analysis/                     Gate 1
│           │   │   ├── test-analysis.md          summary: basis counts, risks, types, feasibility, ambiguities
│           │   │   ├── basis-register.md         one row per basis item
│           │   │   └── sentence-map.md           every unit of the spec text, its class and items
│           │   ├── planning/testing-plan.md      Gate 1: planning decisions, design inputs
│           │   ├── design/                       Gate 2
│           │   │   ├── test-design.md            summary: techniques, coverage counts, ruling log
│           │   │   ├── techniques/Dn-topic.md    evidence of one technique, step by step
│           │   │   └── acceptance-criteria.md    AC, measures, eval cases, manual checks, charters
│           │   ├── execution/eval-runs/YYYY-MM-DD.md   Phase 6: recorded eval runs
│           │   └── test-summary.md               Gate 3: coverage, defects, residual risks
│           └── implementation/
│               ├── test-implementation.md        driver, fixtures, test-stub tickets
│               ├── implementation-plan.md        Phase 3
│               └── as-built.md                   Phase 6
├── development/              coding conventions, review criteria, repo structure, test strategy
├── meetings/                 meeting transcripts and notes
└── legacy/                   documents tied to the legacy code (read-only)
```

**A build folder holds three groups**, each with **one owner of its facts**: `research/` (**what was asked and found**), `testing/` (**what is tested, how, and the evidence**), `implementation/` (**how it is built and how the tests are wired**). A file is **created when its phase writes it**, never empty in advance. A local mirror of the **flow tracker** sits at the build root.

**Test directories** (**proposed**; the final layout lives in `dev/development/repository-structure.md`): `tests/acceptance/`, `tests/eval/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`. Test files **directly in `tests/`** are **legacy tests** (see [Reference code](#reference-code)).

## Spec rules

| Part | In `dev/mvp/spec/` | In the testing plan of a build |
|---|---|---|
| Use case | Steps table and alternatives, one-line `When` each | — |
| FR | Statement only | Acceptance criteria, each with a tier |
| NFR | Statement only | Measures, each with a tier |
| BR | Rule and values | — |

Rules:

1. **One ID everywhere.** FR-001 in a testing plan, a test or a ticket **is FR-001 of the spec**.
2. **Acceptance criteria are written per build, after research.** **Phase 2** writes them in the build's `testing-plan.md`, for the **FRs and NFRs in scope only**. They **never go into the spec**, so a behavior is kept in **two places only**: its **statement** and its **locked tests**. When the build closes, its testing plan is a **record**; the **locked tests** are what **stays current**. The **testable items** of the spec are listed in the build's `test-analysis.md`; they **stay out of the spec** too.
3. **New behavior enters the spec first.** A build **never contains a behavior the spec lacks**. A new behavior **claims its ID in the spec**, with the **PO's approval**, **before a build uses it**.
4. **The backlog waits outside the spec.** A use case, a flow, an FR, an NFR or a BR that the PO **leaves for later** is **parked** in `dev/mvp/spec/05-backlog/` with its **ID and the reason**. **No build takes a backlog item**, and **no spec block cites one**. To build it, the PO **promotes it to the spec first** (rule 3). A behavior **dropped for good is deleted** instead; its **ID is not reused**. See `dev/mvp/spec/05-backlog/_CRITERIA.md`.
5. **The spec freezes at MVP close.** **Later changes** go **through issues**.

## Test tiers

Every acceptance criterion and measure of a build carries **exactly one tier**. Its `Check` field gives the **default**: `deterministic` → **CI**, `evaluation` → **eval**. The PO **may move one to manual**.

| Tier | Covers | Runs | Blocks |
|---|---|---|---|
| **CI** | Deterministic criteria: state, confirmations, locks, saved files. The model is replaced by recorded fixtures or a mock. | Every PR | **Merge** |
| **Eval** | Generation quality: the interview, an outline that fits the audience, slide quality. Fixed cases with a rubric, against a real model. | By anyone, at any time. At least one recorded run per build. | **Closing the build** (Phase 6) |
| **Manual** | What only a person can judge, such as visual quality. | Phase 6 | **Closing the build** (Phase 6) |

An **eval run is recorded** at `builds/UC-XXX-label/testing/execution/eval-runs/YYYY-MM-DD.md` with the **model**, the **cases**, the **rubric score per case** and the **runner**.

## Build sizes

| Size | When | What it skips |
|---|---|---|
| **Full** (default) | A UC, a set of steps or alternatives, or a new FR | Nothing |
| **Light** | A bug fix or a small change to an existing FR | The research checklist, the testing plan, the implementation plan and the as-built record. **It keeps** an acceptance criterion with a tier (written in the issue), a test approved by the PO before the fix merges, and a matrix row. |

A **light build** is **one Issue** labelled `build:light`. Its **matrix row** goes into `dev/mvp/builds/_light/traceability-matrix.md`. In a light build, the **same developer may write the test and the fix**, but the **test is approved first**.

## Trigger and scope

Every build **belongs to the MVP**. Its **first action is Phase 1**, **never implementation**. **Phase 0 must be closed first.**

| User says | Scope |
|---|---|
| "Build UC-001" | Full UC as written in the spec |
| "Build the fetch flow from UC-001" | Steps S1-S2, alternatives A1-A3 |
| "Build just the link validation" | FR-001 only |
| "Build UC-001 S1-S3 without save" | Steps S1-S3, without the save-related alternatives |
| "Fix: outline loses a slide on revise" | Light build |

Every build **defines its scope** in `dev/mvp/builds/UC-XXX-label/`:

- **Use case:** UC-XXX
- **Steps included:** S1-S2 (or "all")
- **Alternatives included:** A1, A3 (or "all")
- **FRs in scope:** FR-001, FR-002
- **NFRs in scope:** NFR-001

**Several builds of the same UC** can coexist. Each has its **own folder, flow tracker and tickets**.

## Resuming

"**Continue**" + a build name: **read the build's flow tracker issue** on GitHub **first**. It shows the **active phase** and the **open tickets**. "**Status**" + a build name: **show the tracker** **without changing anything**.

## Reference code

**Two bodies of code** exist outside the workflow. Both are **reference, not product**. The **MVP code is written new**, against **tests the PO approved**.

- **Legacy code:** `apps/`, `packages/`, `vendor/`, `scripts/` and the tests directly in `tests/`. It **predates the workflow** and **does not run on OpenCode**. With it stay `dev/legacy/development/` (how to run it, its conventions) and `dev/legacy/versions/` (its plans).
- **OpenCode reference:** the code on branch `feat/v2-opencode`, **built on the OpenCode runtime**. It **may differ from the spec**.

Rules:

1. **Pinned reference.** Research and plans read reference code **at a named commit**, **never at a moving branch head**. When the reference moves, the **PO decides** whether the **drift inventory is redone**.
2. **Drift inventory (Phase 1).** When reference code **already implements behavior** in a build's scope, the research checklist **lists that behavior per in-scope FR** as `match`, `differ` or `missing` **against the spec**. The **PO rules each line**: a **bug is not carried**; a **wanted but unspecified behavior enters the spec first** (spec rule 3); an **unwanted behavior is dropped**. The **spec wins over the code**.
3. **Tests first (Phase 2).** Legacy and reference tests are **regression input**. They **do not count as approved tests** for an acceptance criterion.
4. **The plan names the source (Phase 3).** A plan step that follows reference code **names the file and the commit** it is read from. The implementation ticket **lists that file in its context section**. The ticket **writes new code**; it **does not copy the reference**.
5. **Legacy cutover.** The **implementation plan of the first build** decides, with the PO, **when the legacy code** and the documents tied to it **are deleted**. The deletion is **its own change**, **approved by the PO**.

## Phases

### Phase 0 — MVP planning (once)

**Owner:** PO. **Agent:** drafts.

1. **Confirm the MVP scope**: the use cases in `dev/mvp/spec/02-use-cases/`, **without the backlog**. **Order the builds** (which use case or flows come first). **Record the order** in `dev/mvp/README.md`.
2. **Read the product questions** in `dev/mvp/research/open-questions.md`. **Settle the ones the first build needs**, or **name the build** whose research answers each one.
3. **Create the GitHub milestone** `mvp`.
4. **Walking skeleton.** The **PO implements the thinnest path** that **runs end to end** through the real runtime: UI → runtime (OpenCode) → tools → renderer, for the **main flow**. It **need not look good**; it **must run**. It **may read the OpenCode reference**. It **may be deferred** to the **first implementation ticket of the first build**; `dev/mvp/README.md` **records why**, and that ticket then **blocks Phase 5 of every build**.

**Gate:** the PO **approves the build order**; the **milestone exists**; the **skeleton runs end to end**, or its **deferral is recorded**.

### Phase 1 — Research

**Owner:** PO **researches, answers and decides**. **Agent:** generates **the questions and the option/tradeoff tables only**.

1. Run skill `research-questions` on the **in-scope part of the spec**. Write `research/research-checklist.md`, with the **drift inventory** when reference code applies ([Reference code](#reference-code) rule 2).
2. **Seed** `testing/traceability-matrix.md` from `dev/mvp/templates/`, with **one row per in-scope FR and NFR**.
3. Create **one `research-ticket` Issue per question** (labels `phase:research`, `uc:XXX`).
4. **Runtime research is mandatory** when a build **touches the runtime integration**. A research file in `dev/mvp/research/` must state **how the runtime handles the part touched**, and **where DeckAgent hooks in**. **Start from the matching items** of `dev/mvp/research/open-questions.md`.
5. Each answer produces a **research file update** or a **decision record** `dev/mvp/decisions/DEC-NNN-topic.md`. The **PO writes** the `Choice` and the `Why`.
6. **Close each ticket when answered.** **Record the RQ/DEC link** on the matrix rows it serves.

**Gate:** all **research tickets are closed**; every in-scope FR and NFR **has a matrix row**; every **drift line has a PO ruling**; every **answered RQ leads to a DEC** or to a row that uses it.

### Phase 2 — Testing plan and test stubs

**Owner:** PO **writes the plan** and **approves the tests**. **Developers** write the tests.

1. Run skill `testing-plan`, which **applies** `dev/development/test-strategy.md`. **Gate 1 records first:** write `testing/analysis/test-analysis.md` (the **counts of the test basis**, the **quality risks and test types**, the **automation feasibility**, the **ambiguities**), with the **register rows** in `basis-register.md` and the **sentence map** in `sentence-map.md` beside it and the **scope rulings** in the matrix's "Items not tested", and `testing/planning/testing-plan.md`, which holds **planning decisions only** (the **objectives**, the **risk level** of each in-scope item, the **technique selection** with its rules, the **levels**, the **coverage targets**, the **environment and dependencies**, the **entry and exit criteria**, the **testing risks**, the **post-implementation tests**, and the **design inputs** handed to Gate 2). The **PO approves them (Gate 1)** **before any design starts**.
2. **Gate 2 records**, in `testing/design/`: **one evidence file per design input** in `techniques/`, holding the **output of each step** of its technique, its **coverage items** and its **test cases**, ending with the **reconciliation** against drafted AC; the summary `test-design.md` (**techniques applied**, **coverage counts**, **gaps, deviations and design rulings**; `dev/development/test-strategy.md` "Test design specification"); then `acceptance-criteria.md`: the **acceptance criteria** of each in-scope FR and the **measures** of each in-scope NFR ([Spec rules](#spec-rules) rule 2), each with its **tier**, its **`Catches` line**, the **conditions it serves** and its **test cases**. The **PO approves them (Gate 2)** **before any test ticket** is created.
3. **Split the matrix rows**: **one row per acceptance criterion or measure**, with its tier, its **basis items** and its **conditions**.
4. **Write the test implementation contract** in `implementation/test-implementation.md`: the **driver functions and fields** the AC use, the **fixtures** with their **self-tests**, and the **test-stub ticket list**. It **follows the final AC**; it never limits the design. Then **create `test-stub-ticket` Issues** from it (labels `phase:test-stubs`, `uc:XXX`, `tier:*`):
   - **CI tier:** a **failing test** in `tests/acceptance/` (or a security test), written as an **expected failure** (`it.fails`), so CI **stays green while the test fails** and **turns red if it passes unexpectedly**. It must fail **on a real assertion**; the **implementation PR** shows that in its **first commit** (`dev/development/test-strategy.md` "Test infrastructure rules").
   - **Eval tier:** the **eval cases and the rubric** in `tests/eval/`.
   - **Manual tier:** **no ticket**. The check is **listed in `acceptance-criteria.md`**.
5. The **PO reviews each test PR** against its criteria. **A merged test is locked** by CODEOWNERS: **changing it needs the PO** again.
6. **Record the test ticket** and **its author** on the matrix row.

**Test types** and **when they are written**:

| Type | When | Label |
|---|---|---|
| Acceptance, security | Before implementation | `phase:test-stubs` |
| Eval cases and rubric | Before implementation | `phase:test-stubs` |
| Unit | Inside implementation tickets | `phase:impl` |
| Integration, recovery | After the modules they test | `phase:post-impl` |
| E2E, smoke, performance | After all implementation | `phase:post-impl` |
| Regression | With each bug fix | `phase:post-impl` or `build:light` |
| Exploratory | Charter in `acceptance-criteria.md`; session in Phase 6 | None: it creates **no locked test** |

**Gate:** the PO **passed Gate 1 and Gate 2**; all **test-stub tickets are closed**; every **CI-tier** criterion has an **approved, locked test** that runs as an **expected failure**; every **eval-tier** criterion has **approved cases and a rubric**; every **manual-tier** criterion is **listed in `acceptance-criteria.md`**; every in-scope **DEC is consumed** by at least one test; the **Phase 2 exit** of `dev/development/test-strategy.md` "Phases" **is met**.

### Phase 3 — Implementation plan

**Owner:** PO. **Agent:** drafts it.

1. Write `implementation/implementation-plan.md`. Each step names **what to build** (module, file path), the **tests it makes pass**, the **decisions it depends on**, and the **reference code it reads** ([Reference code](#reference-code) rule 4). The plan sets the **branch coverage threshold** of new code (`dev/development/test-strategy.md` "Phases").
2. **Module boundaries.** The **PO decides the module split and the seams** (skill `codebase-design`). This is where **understanding of the code structure** is formed.
3. **LLM boundary.** For **each step of every value flow** in scope, the plan states:

   | Step | Model or code | What the model receives | What the model decides | Prebuilt assets used |
   |---|---|---|---|---|

   **Prebuilt assets** are **themes, layouts, animations and format renderers**. The **default is code**: a step **calls the model only** to **understand the request**, **interview the user** or **write content**.
4. **In the first build**: **decide the legacy cutover** ([Reference code](#reference-code) rule 5).

**Gate:** the PO **approves the plan**; every **matrix row has at least one step**; the **LLM boundary table covers every value flow** in scope.

### Phase 4 — Implementation tickets

**Owner:** agent **writes them**; PO **approves**.

1. **Create `implementation-ticket` Issues** (labels `phase:impl`, `uc:XXX`) following the [ticket rules](#ticket-rules).
2. Create `post-impl-test-ticket` Issues (label `phase:post-impl`), **blocked by the implementation tickets** they depend on.
3. **Separation rule.** Each implementation ticket **names the test author** of its FR. The **test author must not be the assignee**.
4. **Update the flow tracker.** **Fill the matrix Test and Impl columns** with ticket links.

**Gate:** all **tickets exist and are linked**; the matrix **Test/Impl columns are filled**; **no ticket lacks a matrix row**.

### Phase 5 — Execution

**Owner:** developers. **Agent:** light review.

1. The **PO assigns tickets**. The implementer **reads the ticket and its context**, branches, implements, and **runs the ticket's test command**.
2. The implementation PR's **first commit** shows that its tests **fail on an assertion** against the new code. A **later commit** **turns the expected failures of its criteria into plain tests** (`it.fails` → `it`). That **one-word change** is the **only change** it makes to a **locked test**, and the **PO approves it** with the PR (CODEOWNERS).
3. The PR uses the **PR template**: **ticket link**, **test command output**, **scope checkbox**.
4. The agent **reviews with `/code-review`** and checks:
   - the change **stays within the ticket's files** (at most 3);
   - **no locked test or spec file** is touched, **except** the `it.fails` → `it` change of step 2;
   - the **separation rule holds**;
   - the **LLM boundary** from the plan holds: **no model call where the plan says code**.
5. **Merge when CI is green** and the **review passes**. A PR that touches a **CODEOWNERS path** also **needs the PO**.
6. **Close the ticket** and **update the flow tracker**.

**Gate:** all `phase:impl` and `phase:post-impl` **tickets are closed**; the **Phase 5 exit** of `dev/development/test-strategy.md` "Phases" **is met**.

### Phase 6 — Verification

**Owner:** the agent **runs the suites**; the **PO judges**.

1. Run the **full CI suite**, **smoke tests** and **E2E tests** for the **happy path** and the **alternatives in scope**.
2. **Eval.** **At least one recorded run** in `testing/execution/eval-runs/` covering **every eval-tier criterion**. **Anyone may run it.** The **PO reads the scores**.
3. **Predict, then compare.** **Before reading anything the agent wrote**, the **PO writes a short prediction** in `implementation/as-built.md`: "this flow goes through A → B → C; the model is called at X and Y". The agent then fills in the **actual flow** and the **drift**.
4. The agent **updates `docs/architecture/`** (see [As-built layer](#as-built-layer)).
5. The **PO runs the manual-tier checks**, and the **exploratory sessions** the testing plan lists.
6. The agent writes `testing/test-summary.md`: the **coverage table** (the five measures of `dev/development/test-strategy.md` "Coverage", with the `excluded` and `deferred` items beside the ratios), the **results by test type**, the **defects**, the **residual risks**, and the **status of every mechanism** behind a counted test.
7. **Gate 3, the build verdict.** The **PO ticks the Verified column** row by row, from `test-summary.md` and the matrix. A **row that still fails is not ticked**; the PO **chooses one of two**: **fix it** in a **light build** with a **regression test**, or **move its behavior to the spec backlog** with the reason ([Spec rules](#spec-rules) rule 4). Then the PO **closes the flow tracker**.

**Gate:** **CI green**; an **eval run is recorded** for every eval-tier criterion; `as-built.md` has the **prediction, the actual flow and the drift**; `docs/architecture/` **is current**; `test-summary.md` **exists** and **every mechanism behind a counted test is `verified`**; **every matrix row is verified**, or its **behavior is moved to the spec backlog**; the **Phase 6 exit** of `dev/development/test-strategy.md` "Phases" **is met**.

### Review after the first build

When the **first build closes**, the PO and the team hold a **short review of this workflow**: which phase, document or rule **gave no value for its cost**. The **PO approves any change** to this file. The notes also **feed the way of working after the MVP**.

### MVP close

**Owner:** PO.

1. **Every build** in milestone `mvp` **is closed**.
2. The **spec is frozen**: `dev/mvp/` **stays as the record** of the MVP.
3. **Close the milestone.**
4. **Review this workflow** and **design the way of working after the MVP**: **bug reports and improvement requests as GitHub issues**, each with **its own lifecycle**.

## As-built layer

The as-built layer exists so the PO understands **what carries product value**, **not every line of code**. DeckAgent's value lies in **where the model works** and where **prebuilt, deterministic parts work instead**. That boundary is what **separates DeckAgent from asking a coding agent for slides**.

| Artifact | Where | Updated | Content |
|---|---|---|---|
| **LLM boundary map** | `docs/architecture/llm-boundary.md` | Every Phase 6 | The as-built version of the Phase 3 table, for every built value flow |
| **Module map** | `docs/architecture/modules.md` | When module boundaries change | Each module: what it owns, what it depends on |
| **As-built record** | `builds/UC-XXX-label/implementation/as-built.md` | Phase 6 | Prediction, actual flow (a short sequence diagram for value flows only), drift |

**Drift that must be reported:** a step that **calls the model where the plan says code**, or the reverse; a **prebuilt asset bypassed** (for example, the model generating CSS instead of applying a theme); a **module boundary crossed**. **Renames and internal restructuring are not reported.**

Each `as-built.md` **stays within one page**.

## Enforcement

Rules the team **does not have to remember**:

- **CODEOWNERS** (PO as owner): `dev/mvp/spec/`, `tests/acceptance/`, `tests/eval/`, `.github/`.
- **Branch protection on `main`:** the **CI check is required**, **no direct pushes**.
- **PR template:** **ticket link**, **test command output**, the checkbox "**no file outside the ticket changed**".
- **Agent review** checks **scope**, **locked paths**, the **separation rule** and the **LLM boundary** (Phase 5).

## Traceability

Each build keeps **one spine**: `testing/traceability-matrix.md`. **Phase 1** gives it **one row per in-scope FR and NFR**; **Phase 2 splits them** into **one row per acceptance criterion or measure**. Each row links `FR/AC → basis items → conditions → tier → RQ/DEC → test (author) → impl ticket → result → verified`. The **Impl column links tickets or PRs**, **not functions**. Basis items that are **`excluded` or `deferred`** are listed **apart**, each with its ruling.

**No-orphan rule:** every deliverable has a **named consumer downstream**.

- Every in-scope **FR and NFR has a row**; after Phase 2, every **criterion and measure has a row and a tier**.
- Every **row has at least one test** (after Phase 2).
- Every **DEC is consumed** by at least one test or implementation step.
- Every **answered RQ leads to a DEC** or to a row that uses it.
- Every **test and implementation ticket maps back to a row**.
- In a **full build**, after Phase 2, the **link rules** of `dev/development/test-strategy.md` "The chain" hold (a **light build** has no test analysis; its row cites the FR and the AC in the issue): every **AC cites a basis item**, every **condition cites a basis item**, every **test case cites a condition**, and every **basis item** has a condition and a test case or is **`excluded` or `deferred`** with a ruling.

**No phase gate closes** while the matrix **has an orphan** that the phase was responsible for.

## Document rules

Every plan document and template serves **two readers**: a **person skimming it**, and an **agent that re-reads it** each phase.

1. **Front-load.** Open with `## At a glance`: **scope**, **status**, and a **link to the matrix**.
2. **Link, don't restate.** **One fact lives in one home.** Plans **reference matrix rows by ID**. They **never copy requirement text**.
3. **Fixed section order.** Each template **fixes its headings**. Generators **keep them**.
4. **Length budget.** **About one page** per document. **Split or link out** when it grows. The **acceptance criteria and measures** (`acceptance-criteria.md`), the **basis register** and the **sentence map** of a test analysis (`basis-register.md`, `sentence-map.md`), and the **technique evidence files** **do not count** toward it: their length follows the spec they cover.
5. **No history in a living document.** The spec, this workflow, the templates and the other living documents say **what is true now**; **history goes to git** and `CHANGELOG.md`. **Records** (decisions, research items, build files, meeting notes) **keep their dates**. See AGENTS.md "Documents: current state, history in git".
6. **One line, bold keywords.** Each **paragraph or list item sits on one line** (**no hard wrap**), and each sentence **bolds the words that carry its meaning**. See AGENTS.md "Writing Markdown".
7. **Outcomes, not the conversation.** Every document holds what its reader **acts on**. A decision is written as its **result**, or **`pending`** while open; **who decided and when** stays in the **flow tracker issue** and **git**. A section that only records **a review** or **a check that changed nothing** is **not kept**. See AGENTS.md "Documents: current state, history in git".

## Flow tracker

Each build has **one flow tracker issue** (template `.github/ISSUE_TEMPLATE/flow-tracker.md`), created at the **start of Phase 1**, in milestone `mvp`. The **scope comes first**. GitHub issue bodies use **bare `#N`**. The local mirror uses **full links**.

```markdown
## Phase 1: Research
- [ ] #N question-title (status)

## Phase 2: Testing plan
- [ ] Gate 1: test analysis and approach approved
- [ ] Gate 2: test design and AC approved
- [ ] #N test-stub-title (tier, author)
Blocked by: Phase 1 complete

## Phase 3: Implementation plan
- [ ] #N plan-review
Blocked by: Phase 2 complete

## Phase 4: Implementation
- [ ] #N module-title (test author: @x)
Blocked by: #test-stub, #other-module

## Phase 5: Post-impl testing
- [ ] #N test-title
Blocked by: #module

## Phase 6: Verification
- [ ] Eval run recorded
- [ ] As-built: prediction, actual, drift
- [ ] docs/architecture/ updated
- [ ] Test summary written: test-summary.md
- [ ] Gate 3: build verdict
Blocked by: Phase 5 complete
```

## Ticket rules

Tickets must be **executable by a flash model** (DeepSeek V4.1 Flash, GLM 5.3 Flash) **or by a developer who does not check their own work**. The **same rules serve both**.

1. **One concern.** One function, one component, one module.
2. **Exact file paths.** `src/domain/source-validator.ts`, **not "a validation module"**.
3. **Input/output contract.** **Signature**, **parameter types**, **return type**.
4. **Test command.** The command whose **green result proves the ticket done**.
5. **Do NOT section.** What **not to touch, refactor or change**.
6. **Blocked by.** **Prerequisites** that must be **merged first**.
7. **Context section.** The **existing files the implementer needs**, with a **one-line description** each, including any **reference file at its commit**.
8. **At most 3 files changed.** **Split the ticket** otherwise.
9. **Test author named** on implementation tickets (**separation rule**).

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

**One milestone**: `mvp`. **Every ticket of every build** belongs to it. The `uc:XXX` **label separates builds**.

## Linking convention

Every cross-reference is a **clickable Markdown link**, **never a bare `#N` or a plain path**, **except inside GitHub issue bodies**, where `#N` **auto-links**. **Derive the base URL** from `git remote get-url origin` at the **start of each build**.

| Reference | Format |
|---|---|
| Issue from a local file | `[#N](https://github.com/{owner}/{repo}/issues/N)` |
| File from an issue body | `[dev/mvp/research/topic.md](https://github.com/{owner}/{repo}/blob/main/dev/mvp/research/topic.md)` |
| Issue from an issue body | `#N` |

Apply it in **research checklists**, **local flow-tracker mirrors**, **research files** (`Ticket`, `Blocked by`), **decision files**, and **issue bodies** (deliverable links).
