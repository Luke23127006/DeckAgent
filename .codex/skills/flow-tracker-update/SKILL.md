---
name: flow-tracker-update
description: Update an optional flow tracker issue of a build that has several tasks in flight. Reads the current state of the issues the tracker lists and updates its Tasks and Verification checklists. A coordination tool only; it gates nothing.
---

# Flow tracker update

**Update a build's flow tracker issue** so it shows the **current state of its tasks**. A tracker exists **only when a build has several tasks in flight** (dev/mvp/WORKFLOW.md "MVP delivery"); it is a **progress display**, **not a gate**.

## Input

- The flow tracker issue number.
- The UC identifier (e.g., UC-001), to filter issues.

## Process

### 1. Get current statuses

The milestone `mvp` holds **every build**, so **filter by the UC label too**, and **keep only the issues the tracker body lists**.

```bash
gh issue list --milestone "mvp" --label "uc:XXX" --state all --json number,title,state,labels,assignees
```

### 2. Update the Tasks list

For each issue the tracker lists:
- `[x]` if the issue is `closed`
- `[ ]` if the issue is `open`

Older trackers may still show **phase sections**; keep their content, and **do not add phase sections** to a new tracker.

```bash
gh issue edit TRACKER_NUMBER --body "..."
```

### 3. Report the Verification state

Report **facts only**: CI green on `main`; an **eval run recorded** under `testing/execution/eval-runs/` for each scored criterion; **manual checks done**; `docs/architecture/` current when a boundary changed. **Accepting the build** is the PO's.

### 4. Local mirror (when one exists)

When the build keeps `dev/mvp/builds/UC-XXX-label/flow-tracker.md`, **update it to match the issue**. Do not create one.

## Linking convention

In local files, **write every issue reference as `[#N]({base}/issues/N)`** (dev/mvp/WORKFLOW.md "Linking convention"); derive `{base}` from `git remote get-url origin`. The **GitHub issue body uses bare `#N`**.

## Rules

- **Do not close issues**: **only update the tracker display**.
- **Do not change labels or assignments**.
- **Editing the tracker publishes** to GitHub: do it **when asked**.
- **Report blocked tasks** and the **open verification items** in the output.
