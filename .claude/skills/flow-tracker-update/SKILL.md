---
name: flow-tracker-update
description: Update the flow tracker issue for a UC. Reads current issue statuses from GitHub and updates the tracker's phase checklists. Used after any ticket closes.
---

# Flow tracker update

**Update the flow tracker issue** to reflect **current ticket statuses**.

## Input

- The UC identifier (e.g., UC-001).
- The flow tracker issue number.
## Process

### 1. Get current ticket statuses

The milestone `mvp` holds **every build**, so **filter by the UC label too**, and **keep only the tickets the tracker body lists** (several builds of one UC can coexist).

```bash
gh issue list --milestone "mvp" --label "uc:XXX" --state all --json number,title,state,labels,assignees
```

### 2. Group by phase

Using the `phase:*` labels, **group tickets into their phases**. Show the **tier of test tickets** (`tier:*`) and the **test author of implementation tickets**.

### 3. Update the flow tracker issue

For each ticket:
- `[x]` if the issue state is `closed`
- `[ ]` if the issue state is `open`

```bash
gh issue edit TRACKER_NUMBER --body "..."
```

### 4. Check "Done when"

Each phase of dev/mvp/WORKFLOW.md "Phases" ends with a **"Done when"** list. This skill **reports how far its ticket-based parts hold**; it is a **progress report**, not a verdict.

- **Phase 1:** the `phase:research` tickets that block the tests or the plan are closed.
- **Phase 2:** the `phase:test-stubs` tickets closed.
- **Phase 3:** the module and LLM boundaries are settled in the implementation plan.
- **Phase 4:** every matrix row has its implementation ticket. **Point out** a ticket whose assignee also wrote its tests.
- **Phase 5:** all `phase:impl` and `phase:post-impl` tickets closed.
- **Phase 6:** `testing/execution/eval-runs/` has a run for every eval-tier AC; `implementation/as-built.md` has a prediction, an actual flow and a drift section; the matrix rows show their Verified state. Mirror the per-AC checklist under "Verified per AC" from the matrix rows. **Accepting the build** is the PO's.

### 5. Update the local mirror

**Update `dev/mvp/builds/UC-XXX-label/flow-tracker.md`** to **match the GitHub issue**.

## Linking convention

All `#N` references in local plan files **must be clickable Markdown links** (see dev/mvp/WORKFLOW.md "Linking convention"). At the start, **derive the repo base URL**:

```bash
git remote get-url origin
# https://github.com/{owner}/{repo}.git → base = https://github.com/{owner}/{repo}
```

When updating `dev/mvp/builds/UC-XXX-label/flow-tracker.md`, **write every ticket reference as `[#N]({base}/issues/N)`**. The **GitHub issue body uses bare `#N`** (auto-linked).

## Rules

- **Do not close tickets** — **only update the tracker display**.
- **Do not change ticket labels or assignments**.
- **Report the current phase** and **any blocked tickets** in the output.
