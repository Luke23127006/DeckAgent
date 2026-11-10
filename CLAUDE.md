# Claude Code adapter

@AGENTS.md
@dev/mvp/WORKFLOW.md

## Known mistakes — do NOT repeat

- **Use `**/*` not `*`** when globbing nested directories — `*` **only matches one level**.
- All AGENTS.md skills **exist at `.agents/skills/<name>/SKILL.md`** — **check before saying "not found"**.

- **Never add a `Co-Authored-By` trailer** or **any attribution to Claude or any other AI agent** in a commit, PR or issue (AGENTS.md "GitHub conventions").
- **No conversation log in any document.** Write a decision as its **result** or `pending`; **never "PO đã xác nhận / duyệt (date)"**, and no section that only records a review (AGENTS.md "Documents", `dev/mvp/builds/_STYLE.md` rule 14).
- **No hidden process.** Do not require an issue, plan, tracker, test ticket, record or PO approval that the engineering rules do not need; reuse existing test design instead of regenerating it.
- **Edit skills in `.agents/skills/` only**, then **run `python .agents/scripts/sync_skill_mirrors.py`**; **never edit `.claude/skills/` or `.codex/skills/` directly**.

## Workflow triggers

- When the user **asks for a feature, an FR or a build** (e.g., "build UC-001", "build the fetch flow", "build FR-001"): **determine the scope from the spec** (UC steps, alternatives, FRs, NFRs), **read the existing test knowledge** (`dev/mvp/README.md` "MVP testing", the build's records), fill **only the gaps that change correctness**, and **start implementing** under the engineering rules (AGENTS.md "Engineering principles"). **Do not open a build-wide lifecycle.**
- When the user reports a **bug or a small change** to an existing FR: **reproduce it**, add a **regression test**, fix, verify, report.
- When the user says "**close the MVP**": **run the MVP-close checklist** (dev/mvp/WORKFLOW.md "MVP close").
- When the user says "**continue**" + a task or a build: **read its issue or tracker first**, when it has one, then resume.
- When the user says "**status**" + a task or a build: **show it** **without making changes**.

The **scope** can be a **full UC**, a **subset of steps**, **specific alternatives**, or **individual FRs**.
