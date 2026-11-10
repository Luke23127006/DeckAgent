# Development workflow

How DeckAgent goes **from the spec to verified code** with a **five-person student team**. Work is **driven by engineering rules, not by a prescribed process**: the rules protect **correctness, safety and verifiability**; everything else (builds, trackers, tickets, templates, records) is a **coordination tool** the team **uses where it helps**. `dev/mvp/spec/` says **what the product does**, [test-strategy.md](../development/test-strategy.md) says **how tests are designed**, and [code-review-criteria.md](../development/code-review-criteria.md) says **how a change is reviewed**. The **delivery order** lives in [README.md](README.md).

## At a glance

- **Rules, not phases.** A task has **no mandatory lifecycle**. It follows the [engineering rules](#engineering-rules); **when the requirements and the test design are already enough, implementation starts directly**.
- **Shared testing knowledge is reference, not a gate.** Test analysis, planning and design that exist (B1's records, [test-strategy.md](../development/test-strategy.md), the MVP testing section of [README.md](README.md#mvp-testing)) are **reused**, and **extended only where something is missing**. They need **not be complete** for the MVP before code starts, and they are **never redone per task**.
- **Evidence decides done.** Every finished change has **verification evidence fitted to its risk**, and **says what stayed unverified**.
- **The PO decides what is costly to get wrong**: product behavior and scope, the spec, **significant shared contracts**, **foundational technology**, the **important LLM boundaries**, and **accepting a build**. **Developers decide** the rest. See [Roles](#roles).
- **Builds B1–B8 organize delivery** (scope, dependencies, allocation, progress); they **do not prescribe** how a task is done.

## Roles

| Role | Owns |
|---|---|
| **PO** | The **spec**. The answer to a research question and a decision record's `Choice` / `Why`. **Product behavior and scope**. **Significant shared contracts** (an API several parts depend on, a data schema later builds rely on). **Foundational technology choices** (runtime, framework, storage, runner, provider). The **important LLM boundaries**. **Build order** and **accepting a build**. |
| **Developer** | Picks up a **task**, writes **tests and code**, runs the checks, **reviews teammates' PRs**. Decides **modules, functions, internal interfaces, file layout inside the approved code root, test levels, techniques, test cases and infrastructure choices**, and a **technical mechanism the spec leaves to the implementation**. |
| **Agent** | Does the **legwork**: drafts, tests, code, reviews, reports. **Does not** answer a research question, write a decision's `Choice` / `Why`, decide product behavior, or accept a build. |

**No PO approval** is needed because a task **creates a module, a function, an internal interface or a test case**. The PO is asked when a change **alters a significant shared contract**, a **foundational technology** or an **important LLM boundary**, or goes **outside an approved security decision**.

## How work is done

Three concerns **complement each other**; they are **not stages** and have **no fixed order**.

**Shared MVP testing knowledge.** Test analysis (expected behaviors, risks, ambiguities), test planning (levels, approaches, priorities) and test design (conditions, cases, expected results) are **engineering capabilities**, recorded where they are **reusable**. B1's `testing/` records hold the deepest design so far; [README.md](README.md#mvp-testing) gives the **MVP-wide scope, shared risks and approach**. This knowledge is **extended** when a requirement changes, coverage is missing or a new risk appears. It is **not completed for B1–B8 in advance**, and it is **not repeated per task**.

**Rules-driven implementation.** With a task in hand, use judgment to:

- **understand the task** and the **expected behavior**, with its source;
- **reuse** the analysis, plans and test designs that exist;
- find **only the missing information that changes correctness**, and **resolve an ambiguity before** implementing the behavior it affects (a product question goes to the PO; the rest of the task continues);
- **design the missing verification** when it is needed, at the depth the risk calls for;
- write **tests and production code in small increments** (skill `tdd` for new deterministic behavior);
- **verify** and **report the evidence**.

These are **judgment, not a sequence**: no phase, checkpoint or artifact is required by itself. **If the task already has enough requirements and test design, start implementing.**

**Evidence-based verification.** Verification runs **as soon as its parts exist**: unit and acceptance tests with the task; **integration and E2E tests once the components they need are integrated**, not at the end of the MVP; **regression tests** with each bug fix or behavior change; **eval and manual checks** when the system can run them. Before the MVP closes, the **full suite, the E2E flows, the eval runs** and **mutation testing on B1's high-risk modules** are run, and the **residual risks** are stated.

### Engineering rules

These hold **for every task**. They are **obligations of engineering, not administrative steps**.

1. **Understand the expected behavior before writing production code.** Its **source** is the spec, an approved decision, the existing behavior to keep, or a bug reproduction.
2. **Design verification independently of the implementation.** Expected results come from an **independent oracle**, never from what the code does. An expected result that rests on a **pending ruling** is **not used** until the ruling exists. A case from a design that is **still in review** may be used **once it is checked against the spec** on its own.
3. **Reuse existing test design before creating new design.** Add **only the missing part**. Write it **where it serves**: in the **task issue, the PR or the test file** when it is clear there; in a **shared testing record** only when it is **reusable** or **affects shared coverage**.
4. **Match testing depth to the actual risk.** **Data loss, filesystem access, permission boundaries, security, recovery and shared contracts** get the **techniques their risk calls for** ([test-strategy.md](../development/test-strategy.md) "Risk and depth"); a low-risk change gets a criterion and a test.
5. **Tests must be able to detect the relevant defects.** For **new deterministic behavior**, prefer showing a **meaningful failing test** before implementing it. **Existing regression tests, integration tests, E2E tests and LLM evals** do **not** need an artificial red state.
6. **Never weaken a test to make it pass.** A test that must change **says why in its PR**.
7. **Completion discloses** the checks run, their results, their limits and the **residual risks**.
8. **A rule the spec attaches to an operation is enforced when the operation is opened** (for example **BR-019** when a workspace is added, **FR-143** for any change of workspace or chat state). **No change merges with a known security hole**: every **known way to bypass** such a rule, **through the inputs the implementation accepts**, is **tested before the merge**. Coverage that is **not about a bypass** may **grow over later increments**; a behavior is **complete** when its **coverage criterion** is met.

### Kinds of work

| Work | What it usually needs |
|---|---|
| **Bug fix** | The **reproduction** as the oracle, a **regression test** that fails before the fix, the fix, the evidence |
| **Feature or FR** | The **expected behavior** from the spec, the **existing design** reused or the missing part added, tests and code in increments |
| **Refactor** | The **existing behavior** as the oracle, the **existing regression tests** (they pass from the start), focused tests where coverage is thin |
| **Integration** | The real parts and the **failure modes of the seam** |
| **Infrastructure** | The checks it must keep green; the self-test of a new mechanism |
| **Spike** | A **time box**, a **hypothesis**, and the evidence for the decision it serves; **no product code** |

**Where evidence lives** depends on the work: the **PR description and CI** for an ordinary change; the **task issue** when the work is tracked by one; a **build's testing records** when several tasks share the evidence. **No issue, implementation plan, flow tracker or separate test ticket** is a prerequisite for ordinary implementation.

**"Continue"** + a task or a build: read **its issue or its tracker** when it has one, and resume. **"Status"**: show it **without changing anything**.

### Existing build records

The records under `dev/mvp/builds/` (B1's `research/`, `testing/`, `implementation/`) are **reusable knowledge**: their **test designs, acceptance criteria, risks, rulings and decisions** stay valid and are **reused**. The **phase requirements and ticket dependencies** they describe (every acceptance test as `it.fails` before code, T0a and T0b blocking T1–T9, a test author per ticket) are **historical planning**; they **do not control a new task**. Where such a record and this document disagree on **how work is organized**, **this document wins**; where they disagree on **what the product does**, **the spec wins**.

## Spec rules

| Part | In `dev/mvp/spec/` | Where it is verified |
|---|---|---|
| Use case | Steps table and alternatives, one-line `When` each | — |
| FR | Statement only | Acceptance criteria, each with a tier |
| NFR | Statement only | Measures, each with a tier |
| BR | Rule and values | — |

1. **One ID everywhere.** FR-001 in a plan, a test or a ticket **is FR-001 of the spec**.
2. **Acceptance criteria belong to the work that verifies them**: a build's `acceptance-criteria.md`, a task issue, or the test itself. They **stay out of the spec**, so a behavior lives in **two places**: its **statement** and its **tests**.
3. **New behavior enters the spec first.** Code **does not contain a behavior the spec lacks**, because otherwise nobody can tell a feature from a bug. The new behavior **claims its ID in the spec** (the PO approves spec changes) **before the code uses it**. A **bug fix** restores a behavior the spec already states. A **technical mechanism** the spec leaves to the implementation is **not new behavior**.
4. **The backlog waits outside the spec.** A behavior **left for later** is **parked** in `dev/mvp/spec/05-backlog/` with its **ID and the reason**, and no task takes it until the PO **promotes it to the spec**. A behavior **dropped for good is deleted**; its **ID is not reused**. See `dev/mvp/spec/05-backlog/_CRITERIA.md`.
5. **The spec freezes at MVP close.** **Later changes** go **through issues**.

## Test tiers

Each acceptance criterion or measure gets **one tier**, by **how it can be checked**. Its `Check` field gives the **default**: `deterministic` → **CI**, `evaluation` → **eval**; move one to **manual** when only a person can judge it.

| Tier | Covers | Runs |
|---|---|---|
| **CI** | Deterministic behavior: state, confirmations, saved files. The model is replaced by recorded fixtures or a mock. | Every PR; a red CI **blocks the merge** |
| **Eval** | Generation quality: the interview, an outline that fits the audience, slide quality. Fixed cases with a rubric, against a real model. | Anyone, any time; **at least one recorded run** before the build is accepted |
| **Manual** | What only a person can judge, such as visual quality. | **Before the build is accepted** |

An **eval run is recorded** at `builds/UC-XXX-label/testing/execution/eval-runs/YYYY-MM-DD.md` with the **model**, the **cases**, the **score per case** and the **runner**.

## Tests and code

- **Test design comes before the production code; the whole executable suite does not.** Start with the **most important cases** of the behavior, make them pass, then **add cases per increment** until the **coverage criterion** is met.
- A test for **new deterministic behavior** may land **ahead of its code in its own PR**, as an **expected failure** (`it.fails`) that **turns red if it passes too early**, or as the **first, failing commit** of the implementation PR. Either way it should **fail on a real assertion** ([test-strategy.md](../development/test-strategy.md) "Test infrastructure rules").
- **Integration, E2E and regression tests** are written **when their parts exist**; they may **pass on the first run**.
- **Eval cases and their rubric** exist **before** the model behavior they score is implemented, and run when the system can execute them.
- **Prefer a separate test author** for an FR's acceptance tests; when that is not possible, the test is written **and seen failing first**.

## Reference code

**Two bodies of code** exist outside the workflow. Both are **reference, not product**; the **MVP code is written new**.

- **Legacy code:** `apps/`, `packages/`, `vendor/`, `scripts/` and the tests directly in `tests/`. It **predates the workflow** and **does not run on OpenCode**. With it stay `dev/legacy/development/` (how to run it) and `dev/legacy/versions/` (its plans).
- **OpenCode reference:** the code on branch `feat/v2-opencode`, **built on the OpenCode runtime**. It **may differ from the spec**.

Guidance:

1. **Read it at a named commit**, never at a moving branch head, so two readers see the same code.
2. **Compare it with the spec when a task uses it** (the **drift inventory**): for each behavior it already has, note `match`, `differ` or `missing`. A **bug is not carried**; a **wanted but unspecified behavior enters the spec first**; the **spec wins over the code**.
3. **Its tests are input, not proof.** Legacy and reference tests suggest cases; they do not stand in for DeckAgent's own tests.
4. **Name the source.** Code that follows reference code **names the file and the commit** in its PR, and **writes new code** rather than copying it.
5. **Legacy cutover.** The **legacy code** and its documents **are deleted** in **their own change**, when the MVP code no longer needs them as reference.

## Research and decisions

**Research happens when an unknown can change correctness, feasibility or the approach**: the spec is silent, a runtime or provider may not support the approach, or a choice must be made first. Where the spec, a decision record or the reference code already answers, **cite it and go on**. A **spike** produces **evidence, not product code**. Evidence goes to a **research file item** in `dev/mvp/research/` or a **decision record** `dev/mvp/decisions/DEC-NNN-topic.md`; the **PO writes `Choice` and `Why`** where the decision is the PO's. Work that **touches the OpenCode runtime** writes down **how OpenCode handles that part** and **where DeckAgent hooks in**.

## MVP delivery

- **MVP planning is done**: the **use cases in scope**, the **build order** B1–B8 and the **milestone** `mvp` live in [README.md](README.md).
- **A build is a delivery slice**: it groups the work of one part of the product, names its **dependencies**, and is **accepted by the PO** when its behaviors are verified (CI green, the eval runs recorded for scored criteria, the manual checks done, `docs/architecture/` current when a boundary changed). It **does not prescribe how a task inside it is done**.
- **Application foundation and runtime are separate layers.** The **DeckAgent application server** (local server and browser, DEC-010) and its **interface** are built with the **first build that needs them** (B1). The **OpenCode agent runtime** is integrated with the **first feature that needs agent execution** (B3); the **walking skeleton through the runtime** is built then.
- **Coordination tools are optional.** A **flow tracker issue** (template `.github/ISSUE_TEMPLATE/flow-tracker.md`) helps when a build has **several tasks in flight**. **Issues, milestones and `Blocked by` lines** help coordinate; an ordinary task **does not need them to start**.
- **Labels.** Labels that help are `uc:XXX`, `tier:ci`, `tier:eval`, `flow-tracker` and `flash-ready`. The `phase:*` and `build:light` labels belong to **older issues**; new issues **need not use them**.

## As-built layer

The as-built layer helps the team understand **what carries product value**, **not every line of code**. DeckAgent's value lies in **where the model works** and where **prebuilt, deterministic parts work instead**; that boundary is what **separates DeckAgent from asking a coding agent for slides**.

| Artifact | Where | Updated | Content |
|---|---|---|---|
| **LLM boundary map** | `docs/architecture/llm-boundary.md` | When an LLM boundary changes, and before a build is accepted | Each built value flow: which step calls the model, what it receives and decides, which prebuilt assets apply |
| **Module map** | `docs/architecture/modules.md` | When module boundaries change | Each module: what it owns, what it depends on |
| **As-built note** | `builds/UC-XXX-label/implementation/as-built.md` | Before a build with a value flow is accepted | Prediction, actual flow (a short sequence diagram for value flows only), drift |

**Prefer code**: call the model **only** to **understand the request**, **interview the user** or **write content**. **Drift worth reporting:** a step that **calls the model where the design says code**, or the reverse; a **prebuilt asset bypassed** (for example, the model generating CSS instead of applying a theme); a **module boundary crossed**. Renames and internal restructuring are not drift. Each `as-built.md` **stays within one page**.

## Traceability

**Traceability is a tool for work large enough to need it**: a build whose criteria several tasks share keeps `testing/traceability-matrix.md`, so anyone can answer **"which test checks this, and did it pass?"**. A smaller change links its **criterion, test and result** in its **PR or issue**. When a matrix exists, the agent **reports orphans** (a criterion with no test, a test with no criterion, a decision nobody uses).

## Safety nets

- **Branch protection on `main`:** the **CI check is required**, **no direct pushes**.
- **CODEOWNERS** (the PO): `dev/mvp/spec/`, `.github/`, `dev/mvp/WORKFLOW.md`, `AGENTS.md`, the files whose change **affects everyone**.
- **PR template:** the **checks run** and whether a **test changed**.
- **Review** checks the **engineering rules**, **protected paths**, **no weakened test** and that the **LLM boundary** holds.

## Repository layout

```
docs/                         public docs for outside readers (polished prose)
└── architecture/             as-built: module map, LLM boundary map
dev/                          internal docs for the dev team
├── mvp/
│   ├── README.md             MVP status: build order, MVP testing, next work
│   ├── WORKFLOW.md           this file
│   ├── spec/                 the MVP spec
│   │   └── 05-backlog/       spec backlog: behaviors left for later
│   ├── research/             research files (read research/_STYLE.md first)
│   │   └── evidence/         recordings and reports the research files cite
│   ├── decisions/            DEC-NNN-topic.md
│   ├── templates/            optional templates for records that need one
│   └── builds/
│       └── UC-XXX-label/     records of one build, created when the work needs them
│           ├── research/     questions, drift inventory
│           ├── testing/      analysis/, planning/, design/ (techniques/, acceptance-criteria.md),
│           │                 execution/eval-runs/, traceability-matrix.md, test-summary.md
│           └── implementation/   test-implementation.md, implementation-plan.md, as-built.md
├── development/              coding conventions, review criteria, repo structure, test strategy
├── meetings/                 meeting transcripts and notes
└── legacy/                   documents tied to the legacy code (read-only)
```

**A record is created when the work needs it**, never empty in advance. The **templates** in `dev/mvp/templates/` are **tools for records that need a shape**, not a checklist.

**Test directories** (**proposed**; the final layout lives in `dev/development/repository-structure.md`): `tests/acceptance/`, `tests/eval/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`. Test files **directly in `tests/`** are **legacy tests** (see [Reference code](#reference-code)).

## Document rules

Every document serves **two readers**: a **person skimming it**, and an **agent that re-reads it**.

1. **Front-load.** Open with `## At a glance`: **scope** and **status**.
2. **Link, don't restate.** **One fact lives in one home.** Plans **reference IDs** and **never copy requirement text**.
3. **Fixed section order.** A template **fixes its headings**; a record made from it **keeps them**.
4. **Length budget.** **About one page** per document; **split or link out** when it grows. Acceptance criteria, basis registers, sentence maps and technique evidence files **follow the length of the spec they cover**.
5. **No history in a living document.** The spec, this workflow, the templates and the other living documents say **what is true now**; **history goes to git** and `CHANGELOG.md`. **Records** (decisions, research items, build files, meeting notes) **keep their dates**. See AGENTS.md "Documents: current state, history in git".
6. **One line, bold keywords.** Each **paragraph or list item sits on one line**, and each sentence **bolds the words that carry its meaning**. See AGENTS.md "Writing Markdown".
7. **Outcomes, not the conversation.** Every document holds what its reader **acts on**. A decision is written as its **result**, or **`pending`** while open; **who decided and when** stays in the **issue** and **git**.
8. **Status is work done.** A status line states **what has happened**, never what is merely allowed.

## Good tickets

When work is **handed to someone else** through a ticket (a teammate, or a small model such as DeepSeek V4.1 Flash or GLM 5.3 Flash), a good ticket is **doable without the context**. It usually has:

- **One concern**: one function, one component, one module; **split it** when it grows past a few files.
- **Exact file paths**: `src/domain/source-validator.ts`, not "a validation module".
- **The expected behavior** with its source, and **how it is verified** (a link to the existing design, or the cases stated).
- **The contract**: **signature**, **parameter types**, **return type**, when another part depends on it.
- **A test command** whose **green result means done**.
- **What not to touch**, and **Blocked by** when something must be **merged first**.
- **Context**: the **files the implementer needs**, one line each, including **reference files at their commit**.

## Linking convention

Every cross-reference is a **clickable Markdown link**, **never a bare `#N` or a plain path**, **except inside GitHub issue bodies**, where `#N` **auto-links**. **Derive the base URL** from `git remote get-url origin`.

| Reference | Format |
|---|---|
| Issue from a local file | `[#N](https://github.com/{owner}/{repo}/issues/N)` |
| File from an issue body | `[dev/mvp/research/topic.md](https://github.com/{owner}/{repo}/blob/main/dev/mvp/research/topic.md)` |
| Issue from an issue body | `#N` |

## Review after the first build

When the **first build is accepted**, the team holds a **short review of this workflow**: which rule, document or habit **gave no value for its cost**.

## MVP close

1. **Every build** in milestone `mvp` **is accepted**.
2. The **spec is frozen**: `dev/mvp/` **stays as the record** of the MVP.
3. **Close the milestone.**
4. **Review this workflow** and move to **bug reports and improvement requests as GitHub issues**.
