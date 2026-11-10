---
name: research-questions
description: Generate the research checklist of a build in the format "map first, questions after". Reads the in-scope use cases, FRs, NFRs and BRs, draws where the build sits in the whole product, states its boundary, then derives questions per block of the map, each triaged by how it gets answered. Fills the drift inventory against the reference code. Used at the start of Phase 1.
---

# Research questions

**Generate the research checklist** of a build, so the PO **understands the context first** and **sees why each question matters**. The checklist is **not a list of questions**: it is a **map**, a **boundary**, then **questions read off the map**.

## Input

The PO **names a build** (e.g., "the first build", "UC-001 outline part"). **Read**:

1. `dev/mvp/README.md` (**build order**) and `dev/mvp/research/mvp-build-order.md` (**which items each build takes**, and **why**).
2. The **in-scope use cases** in `dev/mvp/spec/02-use-cases/`, **every FR, NFR and BR** they cite, and the **glossary** in `dev/mvp/spec/_STYLE.md`.
3. **Existing research** in `dev/mvp/research/` and **decisions** in `dev/mvp/decisions/`: **do not ask what they answer**.
4. `dev/mvp/research/open-questions.md`: **carry over each open question in scope**.
5. **Reference code at its pinned commit** (`dev/mvp/research/opencode-reference.md` item 14 names the files per build): **evidence for the questions** and the **drift inventory**.

## Process

### Step 1 — Map

Draw **one Mermaid flowchart of the whole product** along the build order: the **blocks every build makes**, the **user's folder**, **DeckAgent's own data**, **OpenCode and the model**. **Highlight the blocks this build makes** (class `here`), **grey the blocks of later builds** (class `later`, the build named in the label), **dot the paths** this build does not run but must **leave room for**. Close with **one sentence**: "**ta đang ở đây**".

### Step 2 — Boundary

State what the build **takes in**, what it **gives out**, what **later builds depend on** (the contracts that are **dearest to change late**, each with the build that uses it), and what it **does not do**.

### Step 3 — Questions per block

Walk **each highlighted block** and its **edges**. Look **beyond the spec and the open questions**: ask what will go wrong **while building this block**. The lenses:

- **Contract**: what a later build reads from this block.
- **Data**: where it is kept, how long, what survives a restart, what a removal removes.
- **Failure midway**: a crash or an error between two writes.
- **Two at once**: two views, two requests, two copies of DeckAgent.
- **Runtime**: what OpenCode does already, where DeckAgent hooks in (mandatory when the build touches the runtime, dev/mvp/WORKFLOW.md "Phase 1").
- **Model or code**: whether a step calls the model or uses deterministic code; the **default is code**.
- **Security and reach**: keys, paths, what the agent reads and sends to a provider.
- **Testability**: how a test fakes the model, which fixture it needs.
- **Traps in the reference code**: problems recorded in `dev/mvp/research/opencode-reference.md`.
- **Spec gaps**: a situation the spec does not cover.
- **Not testable yet**: an in-scope behavior that needs a later build.

**Triage every question before writing it**. The PO's rule: **not everything needs evidence**, and **evidence others already have is not gathered again**.

| Answer by | When | Ticket |
|---|---|---|
| `không cần research` | Common practice, low risk, cheap to change; the implementation plan chooses | No; listed for the implementation plan |
| `để build sau` | Belongs to another build | No; carried to `open-questions.md` if not there |
| `có sẵn` | **Evidence we already have answers it**: reference code, another product, docs | Yes; the PO only nods |
| `thử nhỏ` | A **few checks on a computer**, under an hour | Yes |
| `anh quyết` | A **product or technology choice**; a **spec gap** is answered **in the spec first** | Yes |

**Never list a risk without checking it against the evidence we have.** Only questions **nobody else can answer** cost the team time.

Each question gets: **Vì sao** (what goes wrong if skipped), **Đã biết** (evidence, linked, reference code at its commit), **Trả lời bằng**, **Chặn** (testing plan, implementation plan, or nothing). A **technology choice** may add an **options table**:

| Option | Description | Fits requirements | Tradeoffs |
|---|---|---|---|

Close section 3 with **"Không hỏi, và vì sao"**: the topics a reader would expect, and why they need no question.

### Step 4 — Drift inventory

**One row per in-scope item**: the behavior **in words**, its ID, the **reference file at its commit**, `match` / `differ` / `missing`, **what differs**. **Leave the Kết quả column `pending`**: the PO rules it, and it holds the **outcome only**, never who decided or when. Write "**chưa kiểm**" for a row not read yet, and **finish it before the gate**.

## Output

1. **Create** `dev/mvp/builds/UC-XXX-label/research/research-checklist.md` from `dev/mvp/templates/research-checklist.md`. **Keep its sections in order.**
2. **Seed** `dev/mvp/builds/UC-XXX-label/testing/traceability-matrix.md` from `dev/mvp/templates/traceability-matrix.md`: **one row per in-scope FR and NFR**, **Tier empty**.
3. **Deliverables**, created when the tickets are created (skill `ticket-writer`), listed in section 5 of the checklist:
   - **Research answer:** a **new numbered item** in the matching topic file of `dev/mvp/research/`. Research files are **records**: **add an item**, do not rewrite an old one.
   - **Decision record:** `dev/mvp/decisions/DEC-NNN-topic.md` from `dev/mvp/decisions/_TEMPLATE.md`, **options table only**; **Choice and Why stay empty** for the PO.
   - **Spec change:** for a spec gap; **the PO approves** it (skill `spec-authoring`).

## Writing

- **Prose in Vietnamese**, **English technical terms** (the PO's choice). Follow `dev/mvp/research/_STYLE.md` otherwise.
- **No bare ID.** Say **what it is in words first**, the ID in parentheses: "**xoá workspace** (FR-073)", never "FR-073 yêu cầu ...".
- **Self-contained.** When a question needs a fact from another file (a rule, an open question, a decision), **restate it in one sentence** where it is used; the link is **for reading deeper**.
- **One line per paragraph or list item**; **bold the keywords** (AGENTS.md "Writing Markdown").
- **Clickable links** (dev/mvp/WORKFLOW.md "Linking convention"); a reference file **always with its commit**. Derive the base URL from `git remote get-url origin`.

## Rules

- The agent supplies the **map, the questions, the evidence and the options**. It **does not answer** a question that is the PO's (`thử nhỏ` results are reported, `anh quyết` is left to the PO), and **does not fill `Choice` or `Why`** of a decision record (dev/mvp/WORKFLOW.md "Roles").
- **Do not ask what the spec, the research or a decision already answers.** Cite it instead.
- **Do not ask about implementation details** that coding decides (names, internal splits); put them under `không cần research` only when a reader would expect them.
- A question that **spans several blocks** is asked **once**, in the block where it **costs most**.
