---
name: ticket-writer
description: Create GitHub Issues when work is handed off or coordinated - a task for a teammate or a flash model, a research question that needs work, or the tasks of a build that several people work on. Uses the issue templates in .github/ISSUE_TEMPLATE/. A ticket is a hand-off tool, never a prerequisite for ordinary implementation.
---

# Ticket writer

**Create GitHub Issues** for work that is **handed off** or **coordinated**. A ticket is a **tool**, **not a prerequisite**: an ordinary task can be implemented **without an issue**, with its evidence in the **PR and CI** (dev/mvp/WORKFLOW.md "Kinds of work").

## When to write tickets

- A task is **handed to someone else** (a teammate, a flash model) and must be **doable without the context**.
- A **research question** needs work that someone will pick up.
- **Several tasks of a build** are in flight and their **dependencies** need to be visible.
- The user **asks for issues**.

**Do not** create a separate test ticket, an implementation-plan ticket or a tracker **only because a task exists**.

## Input

- The **work to hand off**: a task description, a research checklist (`dev/mvp/builds/UC-XXX-label/research/research-checklist.md`), or a list of tasks.
- The **spec items** and the **existing test design** the work relies on (link them; **do not restate** requirement text).
- The UC identifier (e.g., UC-001) for the `uc:XXX` label, when it applies.

## Process

### 1. Pick the template

The **body follows the matching template** in `.github/ISSUE_TEMPLATE/`:
- **A task** (feature, FR, component, integration) → `implementation-ticket.md`. Fill **Expected behavior and verification** with a **link to the existing design** or the **cases stated**.
- **A bug or small change** → `light-build.md` (shown as "Small change").
- **A research question** → `research-ticket.md`: **one ticket per question** whose "Trả lời bằng" is `thử nhỏ` or `anh quyết`; **none** for `không cần research`, `có sẵn` or `để build sau`. Questions with the **same way of answering** and the **same deliverable** **share one ticket**, which **lists each RQ**. Copy the **map** of the checklist with the **question's block highlighted**, and restate "Vì sao" and "Đã biết" so the reader **needs no other file**.
- **A test handed off on its own** (rare: someone else writes the tests of a behavior) → `test-stub-ticket.md` or `post-impl-test-ticket.md`, with `tier:ci` or `tier:eval`.

### 2. Create issues using `gh`

```bash
gh issue create \
  --title "Short description" \
  --label "uc:XXX" \
  --milestone "mvp" \
  --body "..."
```

Add `tier:*` for a test ticket and `flash-ready` when a flash model can implement it. The `phase:*` and `build:light` labels belong to **older issues**; **do not add them**.

### 3. Set dependencies

**Add `Blocked by #N, #N`** in the issue body **only for what must be merged first**. Do not invent ordering between tasks that can proceed independently.

### 4. Coordination (when it exists)

When the build **has a flow tracker**, add the new issues to its **Tasks** list. When the build **keeps a traceability matrix**, fill the test or task link of the rows the issue serves, and **report** an issue that serves no row. **Neither is created** just to host the new ticket.

## Good tickets

A handed-off ticket should be **doable without the context** (dev/mvp/WORKFLOW.md "Good tickets"). Aim for:

1. One concern per ticket; **split it** when it grows past a few files.
2. Exact file paths.
3. The expected behavior with its source, and how it is verified.
4. Input/output contract with types, when another part depends on it.
5. A test command whose green result means done.
6. A "Do NOT" section with explicit boundaries.
7. Blocked by, only for real prerequisites.
8. Context section with the existing files the implementer needs.

## Linking convention

All cross-references must be **clickable Markdown links** (see dev/mvp/WORKFLOW.md "Linking convention"). At the start, **derive the repo base URL**:

```bash
git remote get-url origin
# https://github.com/{owner}/{repo}.git → base = https://github.com/{owner}/{repo}
```

- **Issue bodies:** link files as `[dev/mvp/research/topic.md]({base}/blob/main/dev/mvp/research/topic.md)`.
- **Local files** (checklist, tracker mirror): write `#N` as `[#N]({base}/issues/N)`.
- Issue-to-issue references (`Blocked by #N`) **stay as `#N` in issue bodies**, because **GitHub auto-links them**.

## Rules

- **One milestone, `mvp`**: `gh api repos/{owner}/{repo}/milestones -f title="mvp"` if it does not exist.
- **Ask before creating** a batch of issues; creating issues **publishes** to the repository.
- The **agent writes the tickets**; the team **reviews them** when it picks them up.
