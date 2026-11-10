---
name: ticket-writer
description: Create GitHub Issues from a plan document (research checklist, test implementation contract, or implementation plan). Uses the issue templates in .github/ISSUE_TEMPLATE/. Sets labels, milestones, and blocked-by references.
---

# Ticket writer

**Create GitHub Issues from a plan document**.

## Input

One of:
- `dev/mvp/builds/UC-XXX-label/research/research-checklist.md` → creates research tickets
- `dev/mvp/builds/UC-XXX-label/implementation/test-implementation.md` → creates test stub tickets (the criteria they cite live in `testing/design/acceptance-criteria.md`)
- `dev/mvp/builds/UC-XXX-label/implementation/implementation-plan.md` → creates implementation and post-impl tickets

Or a **single light build** (bug fix or small change) → **one `light-build.md` issue**.

Also needs:
- The flow tracker issue number of the build (not for a light build).
- The UC identifier (e.g., UC-001) for the `uc:XXX` label.

## Process

### 1. Read the plan document

**Extract each item that needs a ticket**: questions, test stubs, implementation steps, or post-impl tests.

### 2. Create issues using `gh`

Use the **GitHub CLI** to create issues. For each item:

```bash
gh issue create \
  --title "Phase: description" \
  --label "phase:xxx,uc:XXX" \
  --milestone "mvp" \
  --body "..."
```

The **body follows the matching template** in `.github/ISSUE_TEMPLATE/`:
- **Research questions** → `research-ticket.md`: **one ticket per question** whose "Trả lời bằng" is `thử nhỏ` or `anh quyết`; **none** for `không cần research` or `để build sau`. A `có sẵn` question **gets no ticket**: the PO **nods at the step it blocks** (usually the testing plan). Questions with the **same way of answering** and the **same deliverable** (for example several **spec gaps** answered in **one spec change**) **share one ticket**, which **lists each RQ**. The ticket **includes the map** of the checklist with the **question's block highlighted**
- **Test stubs** → `test-stub-ticket.md`, plus the label `tier:ci` or `tier:eval` from the AC's tier in `acceptance-criteria.md`. **Manual-tier ACs get no ticket**.
- **Implementation steps** → `implementation-ticket.md`. **Fill Test author** from the matrix and the **LLM boundary** block from the plan's LLM boundary table.
- **Post-impl tests** → `post-impl-test-ticket.md`
- **Light build** → `light-build.md`, label `build:light`; **add its row** to `dev/mvp/builds/_light/traceability-matrix.md`.

For **research tickets**, the **map is copied from section 1** of the research checklist. The **same map is reused** across the build's questions; **only the highlight moves**: the **question's block** gets class `here`, the **other blocks of this build** lose it. The ticket **restates "Vì sao" and "Đã biết"** from the checklist, so the reader **needs no other file**.

### 3. Set dependencies

**Add `Blocked by #N, #N`** in the issue body, referencing:
- Research tickets blocked by other research tickets
- Test stub tickets blocked by research decisions
- Implementation tickets blocked by test stubs and other implementation tickets
- Post-impl test tickets blocked by implementation tickets

### 4. Update the flow tracker

**Add each created issue to the flow tracker issue body** under the **correct phase**.

### 5. Update the local mirror

**Update** `dev/mvp/builds/UC-XXX-label/flow-tracker.md` with the **new ticket numbers**. **Update the source plan document's ticket column** with issue numbers. **Update** `dev/mvp/builds/UC-XXX-label/testing/traceability-matrix.md`: **fill the Test and Impl columns** with the new ticket links. Before finishing, **run the matrix's orphan check** and **report** a test or implementation ticket **without a matrix row** (see dev/mvp/WORKFLOW.md "Traceability"). Keep ticket bodies to a **matrix-row reference** (FR/AC id + link) **rather than restating requirement text** (dev/mvp/WORKFLOW.md "Document rules").

## Good tickets

A ticket should be **doable without the context**, by a teammate or a **flash model** (dev/mvp/WORKFLOW.md "Good tickets"). Aim for:

1. One concern per ticket; **split it** when it grows past a few files.
2. Exact file paths.
3. Input/output contract with types.
4. Test command as acceptance criteria.
5. Do NOT section with explicit boundaries.
6. Blocked by prerequisites.
7. Context section with the existing files the implementer needs.
8. Test author named, when someone else wrote the tests.

## Test author

The **test author of an FR** is preferably **not its implementer** (dev/development/test-strategy.md "Test levels"). When asked to suggest assignees, **check the matrix's Test author column** and **point out** a ticket whose assignee wrote its tests.

## Linking convention

All cross-references must be **clickable Markdown links** (see dev/mvp/WORKFLOW.md "Linking convention"). At the start, **derive the repo base URL**:

```bash
git remote get-url origin
# https://github.com/{owner}/{repo}.git → base = https://github.com/{owner}/{repo}
```

Apply to every output:

- **Issue bodies — Deliverable section:** use `[dev/mvp/research/topic.md]({base}/blob/main/dev/mvp/research/topic.md)`.
- **Local plan files** (checklist, flow tracker): update Ticket column and `#N` references to `[#N]({base}/issues/N)`.
- Issue-to-issue references (`Blocked by #N`) **stay as `#N` in issue bodies** because **GitHub auto-links them**. **Only local `.md` files need full links**.

## Rules

- **One milestone, `mvp`**. **Create it if it does not exist** (normally done in Phase 0): `gh api repos/{owner}/{repo}/milestones -f title="mvp"`.
- **Create labels first** if they do not exist (dev/mvp/WORKFLOW.md "Labels").
- The **agent writes the tickets**; the team **reviews them** when it picks them up.
- **Always reference the flow tracker issue** in every ticket body.
- **Number tickets in dependency order** so that **blocked-by references point to lower-numbered issues**.
