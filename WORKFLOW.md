# Build workflow

How DeckAgent goes from spec to working code with a five-person team. Every session that
plans a version or starts a build reads this document.

## At a glance

- **One product owner (PO)** owns the spec, the research decisions, the testing plan, the
  implementation plan and every verdict. **Developers** pull tickets and write tests and
  code. **The agent** drafts and does the legwork. See [Roles](#roles).
- **Quality is enforced by tests, not by PR review.** Tests are written from the PO's
  plan, approved by the PO, then locked. The implementer of an FR is never the author of
  its tests. See [Test tiers](#test-tiers) and [Enforcement](#enforcement).
- **Two spec layers.** `dev/spec/` is the thin target product (the map).
  `dev/versions/vN/spec/` is the full spec of one version (what gets built). Behaviors
  left for later wait in the spec backlog `dev/spec/05-backlog/`. See
  [Spec layers](#spec-layers).
- **Understanding of the system is a deliverable.** Each build leaves an as-built record
  focused on what carries product value: the boundary between the model and the
  deterministic parts. See [As-built layer](#as-built-layer).
- **Flow:** Phase 0 (once per version) → Phases 1–6 (once per build) → version close.

## Roles

| Role | Owns | Must not |
|---|---|---|
| **PO** | Target spec and version specs. Research answers and decision records (`Choice` / `Why`). Testing plan. Implementation plan, including module boundaries and the LLM boundary. Approving tickets. **Approving tests.** Walking skeleton. Verdicts in Phase 6. Version close. | — |
| **Developer** | Test-stub, implementation and post-impl test tickets. Running the ticket's test command before opening a PR. Running eval suites. | Edit a spec, edit a locked test, or implement an FR whose tests they wrote. Change files outside the ticket. |
| **Agent** | Research question lists and option/tradeoff tables. Drafts of plans and tickets. Light PR review. Running suites and reporting. As-built drafts. | Answer a research question. Fill a decision's `Choice` / `Why`. Close a gate. |

The PO's scarce time goes to **plans and test review**, not code review. A test file
read against its ACs is short; reviewing it is the highest-leverage check the PO makes.

## Repository layout

```
docs/                         public docs for outside readers (polished prose)
├── architecture/             as-built: module map, LLM boundary map
└── design/                   legacy UX prototype (read by a legacy test)
dev/                          internal docs for the dev team
├── legacy/                   documents from before this workflow (read-only)
├── spec/                     target spec (thin)
│   └── 05-backlog/           spec backlog: behaviors left for later
├── versions/
│   ├── README.md             lists the active version
│   └── vN/
│       ├── spec/             version spec (full)
│       ├── CHANGES.md        Added / Changed / Removed vs v(N-1), by ID
│       └── builds/UC-XXX-label/
│           ├── traceability-matrix.md
│           ├── research-checklist.md
│           ├── testing-plan.md
│           ├── implementation-plan.md
│           ├── as-built.md
│           └── eval-runs/YYYY-MM-DD.md
├── research/                 research files (read research/_STYLE.md first)
├── decisions/                DEC-NNN-topic.md
├── development/              coding conventions, review criteria, repo structure
├── meetings/                 meeting transcripts and notes
└── templates/                plan and as-built templates
```

Test directories (proposed; the final layout lives in
`dev/development/repository-structure.md`): `tests/acceptance/`, `tests/eval/`,
`tests/unit/`, `tests/integration/`, `tests/e2e/`. Test files directly in `tests/` are
legacy tests (see [Legacy source](#legacy-source)).

## Spec layers

| | Target spec `dev/spec/` | Version spec `dev/versions/vN/spec/` |
|---|---|---|
| Purpose | The map of the ideal product | What version N builds, in full |
| Use case | Steps table and alternatives, one-line `When` each | Full template: steps, alternatives, outcome, guarantees |
| FR / BR / NFR | FR and NFR: statement only. BR: rule and values. **No acceptance criteria, no measures** | Full template: **acceptance criteria** and **measures** |
| Changes | Grows when a new behavior is identified | Frozen when the version closes |

Rules:

1. **One ID everywhere.** FR-001 in a version spec is FR-001 of the target, narrowed.
2. **A version spec only narrows.** It may drop ACs, alternatives or steps from the
   target. It never contains a behavior that the target lacks.
3. **New behavior enters the target first** as a one-line entry that claims the ID. The
   detail and the ACs are then written in the version spec.
4. **Each version spec is complete.** A reader never needs an earlier version to
   understand it. `CHANGES.md` records the difference from the previous version by ID.
5. **A closed version's spec is never edited.** Corrections go into the next version and
   its `CHANGES.md`.
6. **The backlog waits outside the target.** A use case, a flow, an FR, an NFR or a BR
   that the PO leaves for later is parked in `dev/spec/05-backlog/` with its ID and the
   reason. No version takes a backlog item, and no target block cites one. To build it,
   the PO promotes it to the target first (rule 3). A behavior dropped for good goes to
   the removed list of its kind instead. See `dev/spec/05-backlog/_CRITERIA.md`.

## Test tiers

Every AC in a version spec carries exactly one tier. The FR template's `Check` field
gives the default: `deterministic` → CI, `evaluation` → eval. The PO may move an AC to
manual.

| Tier | Covers | Runs | Blocks |
|---|---|---|---|
| **CI** | Deterministic ACs: state, confirmations, locks, saved files. The model is replaced by recorded fixtures or a mock. | Every PR | **Merge** |
| **Eval** | Generation quality: the interview, an outline that fits the audience, slide quality. Fixed cases with a rubric, against a real model. | By anyone, at any time. At least one recorded run per build. | **Closing the build** (Phase 6) |
| **Manual** | What only a person can judge, such as visual quality. | Phase 6 | **Closing the build** (Phase 6) |

Eval is not tied to closing a version. It is tied to closing each build, so every build
leaves at least one judged run.

An eval run is recorded at `builds/UC-XXX-label/eval-runs/YYYY-MM-DD.md` with the model,
the cases, the rubric score per case and the runner.

## Build sizes

| Size | When | What it skips |
|---|---|---|
| **Full** (default) | A UC, a set of steps or alternatives, or a new FR | Nothing |
| **Light** | A bug fix or a small change to an existing FR | The research checklist, the implementation plan and the as-built record. **It keeps** an AC, a tier, a test approved by the PO before the fix merges, and a matrix row. |

A light build is one Issue labelled `build:light`. Its matrix row goes into
`dev/versions/vN/builds/_light/traceability-matrix.md`. In a light build, the same
developer may write the test and the fix, but the test is approved first.

## Trigger and scope

A build always belongs to the **active version** (`dev/versions/README.md`). Its first
action is Phase 1, never implementation. Phase 0 must be closed for that version first.

| User says | Scope |
|---|---|
| "Build UC-001" | Full UC as written in the version spec |
| "Build the fetch flow from UC-001" | Steps S1-S2, alternatives A1-A3 |
| "Build just the link validation" | FR-001 only |
| "Build UC-001 S1-S3 without save" | Steps S1-S3, without the save-related alternatives |
| "Fix: outline loses a slide on revise" | Light build |

Every build defines its scope in `dev/versions/vN/builds/UC-XXX-label/`:

- Use case: UC-XXX
- Steps included: S1-S2 (or "all")
- Alternatives included: A1, A3 (or "all")
- FRs in scope: FR-001, FR-002
- NFRs in scope: NFR-001

Several builds of the same UC can coexist. Each has its own folder, flow tracker and
tickets.

## Resuming

"Continue" + a build name: read the build's flow tracker issue on GitHub first. It shows
the active phase and the open tickets. "Status" + a build name: show the tracker without
changing anything.

## Legacy source

The repository holds code and documents written before this workflow (AGENTS.md "Legacy
source"). They are research input, not product. They enter a version only through the
phases.

1. **Baseline.** The first workflow version is v3. v1 and v2 are legacy releases
   (`dev/legacy/versions/`) with no version spec in this format. The v3 `CHANGES.md`
   opens with "Baseline: legacy v2, no version spec in this format. Every ID is Added."
2. **Drift inventory (Phase 1).** When legacy code already implements behavior in a
   build's scope, the research checklist lists that behavior per in-scope FR as
   `match`, `differ` or `missing` against the version spec. The PO rules each line: a
   bug is not ported; a wanted but unspecified behavior enters the target spec first
   (spec rule 3); an unwanted behavior is dropped. The spec wins over the code.
3. **Tests first (Phase 2).** Legacy tests are regression input. They do not count as
   approved tests for an AC. A legacy test becomes an acceptance test only through a
   test-stub ticket that the PO approves against the AC.
4. **The plan names the source (Phase 3).** A plan step that reuses legacy code names the
   legacy file and the commit it is read from.
5. **Port ticket (Phase 4).** Reused code enters through a `port-ticket` Issue: "port X
   from `<file>` at `<commit>`, make tests Y pass, do not carry Z". The ticket rules
   apply. The author of the legacy code may port it but must not write its tests
   (separation rule).
6. **Pinned reference.** Research and port tickets read legacy code at a named commit,
   for example a commit of `feat/v2-opencode`, never at a moving branch head. When the
   reference moves, the PO decides whether the drift inventory is redone.
7. **Deferred walking skeleton.** While the runtime path exists only in legacy code,
   Phase 0 may close with the skeleton deferred; `CHANGES.md` records why. The skeleton
   then becomes the first port ticket of the version and blocks Phase 5 of every build.
8. **Cutover.** Legacy code is deleted only in a change the PO approves, after every
   behavior kept from it is covered by a closed build. `dev/legacy/` stays as a record.

## Phases

### Phase 0 — Version planning (once per version)

**Owner:** PO. **Agent:** drafts the spec slices and `CHANGES.md`.

1. Choose the UCs and flows of version N from the target spec. Read the spec backlog
   and promote any item the version needs to the target first (spec rule 6). Add each
   new behavior to the target spec first (spec rule 3). Leaving a UC out of a version
   never removes it from the target spec.
2. Write `dev/versions/vN/spec/`. Start from the previous version spec, or from the
   target for v1. Every in-scope FR gets its ACs. Every AC gets a tier.
3. Write `CHANGES.md`: Added / Changed / Removed by ID. In v1, everything is Added.
4. Create the GitHub milestone `vN`. Set `vN` as active in `dev/versions/README.md`.
5. **Walking skeleton.** The PO implements the thinnest path that runs end to end
   through the real runtime: UI → runtime (OpenCode) → tools → renderer, for the
   version's main flow. It need not look good; it must run. It is required in the first
   version on a runtime and in any version that changes that path. Otherwise the PO
   records in `CHANGES.md` why the existing skeleton still holds. While the runtime path
   exists only in legacy code, the skeleton may be deferred to a port ticket
   ([Legacy source](#legacy-source) rule 7).

**Gate:** the PO approves the version spec and `CHANGES.md`; the milestone exists; the
skeleton runs end to end, or its skip or deferral is recorded.

### Phase 1 — Research

**Owner:** PO researches, answers and decides. **Agent:** generates the questions and
the option/tradeoff tables only.

1. Run skill `research-questions` on the in-scope part of the version spec. Write
   `research-checklist.md`.
2. Seed `traceability-matrix.md` from `dev/templates/`, with one row per in-scope FR/AC
   and NFR, and its tier.
3. Create one `research-ticket` Issue per question (labels `phase:research`, `uc:XXX`).
4. **Runtime research is mandatory** when a build touches the runtime integration. A
   research file in `dev/research/` must state how the runtime handles the part
   touched, and where DeckAgent hooks in.
5. Each answer produces a research file update or a decision record
   `dev/decisions/DEC-NNN-topic.md`. The PO writes the `Choice` and the `Why`.
6. Close each ticket when answered. Record the RQ/DEC link on the matrix rows it serves.

**Gate:** all research tickets are closed; every in-scope FR/AC/NFR has a matrix row
with a tier; every answered RQ leads to a DEC or to a row that uses it.

### Phase 2 — Testing plan and test stubs

**Owner:** PO writes the plan and approves the tests. **Developers** write the tests.

1. Run skill `testing-plan`. Write `testing-plan.md`. It maps each AC to its tier and
   its test type, and says what the test checks.
2. Create `test-stub-ticket` Issues (labels `phase:test-stubs`, `uc:XXX`, `tier:*`):
   - **CI tier:** a failing test in `tests/acceptance/` (or a security test).
   - **Eval tier:** the eval cases and the rubric in `tests/eval/`.
   - **Manual tier:** no ticket. The check is listed in the testing plan.
3. The PO reviews each test PR against its ACs. **A merged test is locked** by
   CODEOWNERS: changing it needs the PO again.
4. Record the test ticket and **its author** on the matrix row.

Test types and when they are written:

| Type | When | Label |
|---|---|---|
| Acceptance, security | Before implementation | `phase:test-stubs` |
| Eval cases and rubric | Before implementation | `phase:test-stubs` |
| Unit | Inside implementation tickets | `phase:impl` |
| Integration, recovery | After the modules they test | `phase:post-impl` |
| E2E, smoke, performance | After all implementation | `phase:post-impl` |
| Regression | With each bug fix | `phase:post-impl` or `build:light` |

**Gate:** all test-stub tickets are closed; every CI-tier AC has an approved, red,
locked test; every eval-tier AC has approved cases and a rubric; every manual-tier AC is
listed in the testing plan; every in-scope DEC is consumed by at least one test.

### Phase 3 — Implementation plan

**Owner:** PO. **Agent:** drafts it.

1. Write `implementation-plan.md`. Each step names what to build (module, file path),
   the tests it makes pass, and the decisions it depends on.
2. **Module boundaries.** The PO decides the module split and the seams (skill
   `codebase-design`). This is where understanding of the code structure is formed.
3. **LLM boundary.** For each step of every value flow in scope, the plan states:

   | Step | Model or code | What the model receives | What the model decides | Prebuilt assets used |
   |---|---|---|---|---|

   Prebuilt assets are themes, layouts, animations and format renderers. The default is
   **code**: a step calls the model only to understand the request, interview the user
   or write content.

**Gate:** the PO approves the plan; every matrix row has at least one step; the LLM
boundary table covers every value flow in scope.

### Phase 4 — Implementation tickets

**Owner:** agent writes them; PO approves.

1. Create `implementation-ticket` Issues (labels `phase:impl`, `uc:XXX`) following the
   [ticket rules](#ticket-rules).
2. Create `post-impl-test-ticket` Issues (label `phase:post-impl`), blocked by the
   implementation tickets they depend on.
3. **Separation rule.** Each implementation ticket names the test author of its FR. The
   test author must not be the assignee.
4. Update the flow tracker. Fill the matrix Test and Impl columns with ticket links.

**Gate:** all tickets exist and are linked; the matrix Test/Impl columns are filled; no
ticket lacks a matrix row.

### Phase 5 — Execution

**Owner:** developers. **Agent:** light review.

1. The PO assigns tickets. The implementer reads the ticket and its context, branches,
   implements, and runs the ticket's test command.
2. The PR uses the PR template: ticket link, test command output, scope checkbox.
3. The agent reviews with `/code-review` and checks:
   - the change stays within the ticket's files (at most 3);
   - no locked test or spec file is touched;
   - the separation rule holds;
   - the LLM boundary from the plan holds: no model call where the plan says code.
4. Merge when CI is green and the review passes. A PR that touches a CODEOWNERS path
   also needs the PO.
5. Close the ticket and update the flow tracker.

**Gate:** all `phase:impl` and `phase:post-impl` tickets are closed.

### Phase 6 — Verification

**Owner:** the agent runs the suites; the **PO judges**.

1. Run the full CI suite, smoke tests and E2E tests for the happy path and the
   alternatives in scope.
2. **Eval.** At least one recorded run in `eval-runs/` covering every eval-tier AC.
   Anyone may run it. The PO reads the scores.
3. **Predict, then compare.** Before reading anything the agent wrote, the PO writes a
   short prediction in `as-built.md`: "this flow goes through A → B → C; the model is
   called at X and Y". The agent then fills in the actual flow and the drift.
4. The agent updates `docs/architecture/` (see [As-built layer](#as-built-layer)).
5. The PO runs the manual-tier checks.
6. The PO ticks the Verified column row by row, then closes the flow tracker.

**Gate:** CI green; an eval run is recorded for every eval-tier AC; `as-built.md` has
the prediction, the actual flow and the drift; `docs/architecture/` is current; every
matrix row is verified.

### Version close

**Owner:** PO.

1. Every build in milestone `vN` is closed.
2. `CHANGES.md` is final.
3. The version spec is frozen.
4. Close the milestone. Set the next version as active, or none.

Eval does not gate version close; each build already carries its own runs.

## As-built layer

The as-built layer exists so the PO understands **what carries product value**, not
every line of code. DeckAgent's value lies in where the model works and where prebuilt,
deterministic parts work instead. That boundary is what separates DeckAgent from asking
a coding agent for slides.

| Artifact | Where | Updated | Content |
|---|---|---|---|
| **LLM boundary map** | `docs/architecture/llm-boundary.md` | Every Phase 6 | The as-built version of the Phase 3 table, for every built value flow |
| **Module map** | `docs/architecture/modules.md` | When module boundaries change | Each module: what it owns, what it depends on |
| **As-built record** | `builds/UC-XXX-label/as-built.md` | Phase 6 | Prediction, actual flow (a short sequence diagram for value flows only), drift |

**Drift that must be reported:** a step that calls the model where the plan says code, or
the reverse; a prebuilt asset bypassed (for example, the model generating CSS instead of
applying a theme); a module boundary crossed. Renames and internal restructuring are not
reported.

Each `as-built.md` stays within one page.

## Enforcement

Rules the team does not have to remember:

- **CODEOWNERS** (PO as owner): `dev/spec/`, `dev/versions/*/spec/`, `tests/acceptance/`,
  `tests/eval/`, `.github/`.
- **Branch protection on `main`:** the CI check is required, no direct pushes.
- **PR template:** ticket link, test command output, the checkbox "no file outside the
  ticket changed".
- **Agent review** checks scope, locked paths, the separation rule and the LLM boundary
  (Phase 5).

## Traceability

Each build keeps one spine: `traceability-matrix.md`. It has one row per in-scope FR/AC
and NFR, linking `FR/AC → tier → RQ/DEC → test (author) → impl ticket → verified`. The
Impl column links tickets or PRs, not functions.

**No-orphan rule:** every deliverable has a named consumer downstream.

- Every in-scope FR/AC and NFR has a row and a tier.
- Every row has at least one test (after Phase 2).
- Every DEC is consumed by at least one test or implementation step.
- Every answered RQ leads to a DEC or to a row that uses it.
- Every test and implementation ticket maps back to a row.

No phase gate closes while the matrix has an orphan that the phase was responsible for.

## Document rules

Every plan document and template serves two readers: a person skimming it, and an agent
that re-reads it each phase.

1. **Front-load.** Open with `## At a glance`: scope, status, and a link to the matrix.
2. **Link, don't restate.** One fact lives in one home. Plans reference matrix rows by
   ID. They never copy requirement text.
3. **Fixed section order.** Each template fixes its headings. Generators keep them.
4. **Length budget.** About one page per document. Split or link out when it grows.

## Flow tracker

Each build has one flow tracker issue (template `.github/ISSUE_TEMPLATE/flow-tracker.md`),
created at the start of Phase 1, in milestone `vN`. The scope comes first. GitHub issue
bodies use bare `#N`. The local mirror uses full links.

```markdown
## Phase 1: Research
- [ ] #N question-title (status)

## Phase 2: Testing plan
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
Blocked by: Phase 5 complete
```

## Ticket rules

Tickets must be executable by a flash model (DeepSeek V4.1 Flash, GLM 5.3 Flash) **or by
a developer who does not check their own work**. The same rules serve both.

1. **One concern.** One function, one component, one module.
2. **Exact file paths.** `src/domain/source-validator.ts`, not "a validation module".
3. **Input/output contract.** Signature, parameter types, return type.
4. **Test command.** The command whose green result proves the ticket done.
5. **Do NOT section.** What not to touch, refactor or change.
6. **Blocked by.** Prerequisites that must be merged first.
7. **Context section.** The existing files the implementer needs, with a one-line
   description each.
8. **At most 3 files changed.** Split the ticket otherwise.
9. **Test author named** on implementation tickets (separation rule).

## Labels

| Label | Meaning |
|---|---|
| `uc:XXX` | Use case of the ticket |
| `phase:research` | Phase 1 ticket |
| `phase:test-stubs` | Phase 2 ticket |
| `phase:impl-plan` | Phase 3 ticket |
| `phase:impl` | Phase 4 implementation ticket |
| `legacy:port` | Implementation ticket that ports legacy code |
| `phase:post-impl` | Post-implementation test ticket |
| `tier:ci`, `tier:eval` | Tier of a test ticket |
| `build:light` | A light build |
| `flow-tracker` | The root tracker of a build |
| `flash-ready` | Suitable for a flash-model implementer |

## Milestones

One milestone per version: `vN`. Every ticket of every build in that version belongs to
it. The `uc:XXX` label separates builds within a version.

## Linking convention

Every cross-reference is a clickable Markdown link, never a bare `#N` or a plain path,
except inside GitHub issue bodies, where `#N` auto-links. Derive the base URL from
`git remote get-url origin` at the start of each build.

| Reference | Format |
|---|---|
| Issue from a local file | `[#N](https://github.com/{owner}/{repo}/issues/N)` |
| File from an issue body | `[dev/research/topic.md](https://github.com/{owner}/{repo}/blob/main/dev/research/topic.md)` |
| Issue from an issue body | `#N` |

Apply it in research checklists, local flow-tracker mirrors, research files (`Ticket`,
`Blocked by`), decision files, and issue bodies (deliverable links).
