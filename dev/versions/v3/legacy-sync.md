# Legacy sync plan (v3)

> **Status: proposal.** The PO approves it. The rules it applies are in WORKFLOW.md
> "Legacy source"; this file holds only the order, the inputs and the handoff.

## At a glance

- **Goal:** v3 is built under the workflow, using the legacy code and documents as
  input, without waiting for the OpenCode migration on `feat/v2-opencode` to finish.
- **Order:** spec review → Phase 0 → Phases 1–3 for each build → **pause** → Luke's
  handoff → Phases 4–6 → cutover.
- **The pause:** no build of v3 goes past Phase 3 before the handoff. Port tickets
  need a final commit to port from.
- **Status (2026-11-04):** workflow adopted on `docs/workflow-migration` (`2824cc6`,
  `c183667`). Spec review not started.

## Sources

| Source | Where | Read at | Used in |
|---|---|---|---|
| Previous spec | `dev/legacy/spec/` | `71ff143` (frozen copy) | Spec review |
| Teacher feedback, 23-10-2026 | `dev/meetings/` | — | Spec review |
| Product reference | [open-design](https://github.com/nexu-io/open-design) | — | Spec review, Phase 1 |
| Legacy plans and research | `dev/legacy/versions/`, `dev/legacy/research/` | — | Phase 1 |
| Legacy code, Cordis runtime | `apps/`, `packages/` on this branch | `71ff143` | Phase 1 drift inventory |
| Legacy code, OpenCode runtime | `feat/v2-opencode` | Research commit, then handoff commit | Phase 1 runtime research, Phase 4 port tickets |

The research commit is the head of `feat/v2-opencode` when Phase 1 starts (today
`019a027`). Read it with `git show <commit>:<path>`; do not merge for research.

## Steps

| # | Step | Phase | Output | Owner | Waits on |
|---|---|---|---|---|---|
| 1 | Review each legacy use case against open-design and the teacher feedback. Rewrite the target spec. Drop `02-users`; keep the interview dimensions | — | `dev/spec/` | PO, agent drafts | — |
| 2 | Plan v3: choose UCs and flows, write the version spec and `CHANGES.md` (legacy v2 baseline). Defer the walking skeleton | 0 | `dev/versions/v3/spec/`, `CHANGES.md`, milestone `v3` | PO | 1 |
| 3 | Research per build. Includes the drift inventory and the runtime research file on how OpenCode is driven at the research commit | 1 | `research-checklist.md`, `dev/research/`, `dev/decisions/` | PO, agent drafts questions | 2 |
| 4 | Decide the test entry point (proposal: the Host API with a recorded model fixture, as most legacy tests do). Write the testing plan and the locked test stubs | 2 | `testing-plan.md`, `tests/acceptance/`, `tests/eval/` | PO plans, developers write | 3 |
| 5 | Implementation plan. Decide where the v3 code lives. Each step that reuses legacy code names the file and the commit | 3 | `implementation-plan.md`, DEC on code location | PO, agent drafts | 4 |
| — | **Pause until the handoff** | | | | |
| 6 | Handoff: Luke names the handoff commit; merge `feat/v2-opencode` into this branch; diff the research commit against the handoff commit and redo affected drift rows | — | Merge commit, updated checklists | Agent merges, PO rules on drift | 5, Luke |
| 7 | Port and implementation tickets. The first port ticket is the walking skeleton | 4 | GitHub Issues | Agent writes, PO approves | 6 |
| 8 | Execution and verification | 5–6 | Merged code, `as-built.md`, eval runs | Developers, PO judges | 7 |
| 9 | Cutover: delete the legacy code that v3 replaces | — | One PR | PO approves | Every v3 build closed |

## Handoff from Luke (proposal)

Luke delivers, in one comment on the v3 flow tracker or an Issue:

- the handoff commit on `feat/v2-opencode`;
- which v2-opencode tasks are complete at that commit, with the evidence;
- the commands that run the app and its tests at that commit;
- the known failures at that commit.

Until the handoff, work that survives the port is most useful: finishing the
verification of tasks 002–004, removing the Windows-only pin, enabling CI, and the data
bug in [#46](https://github.com/Luke23127006/DeckAgent/issues/46). Changing shared
contracts (`AgentHandle`, `ToolRegistry`, `DeckService`, `SessionStore`, the Host API)
makes the drift inventory stale.

## Expected merge conflicts at step 6

| Path on `feat/v2-opencode` | Expected result |
|---|---|
| `README.md` | Conflict: both sides changed it. Keep this branch's README; carry over any new run command |
| `docs/development/*`, `docs/adr/0004-*`, `docs/versions/v2-opencode/` | Git's directory-rename detection should place them under `dev/legacy/`. Check each one lands there |
| `package.json`, `pnpm-lock.yaml`, `scripts/`, `tests/`, `apps/`, `packages/` | Not changed on this branch; no conflict expected |

## Known legacy problems for the drift inventory

Checked at `019a027`:

- `apps/local-web/src/editing-workflow.ts:4` refuses an edit request that contains
  "không", "thêm", "xóa" or "hoặc", which blocks ordinary Vietnamese. Intent
  understanding is decided in the Phase 3 LLM boundary table, not ported.
- `apps/local-web/src/opencode/agent.ts:50` accepts only Windows and a pinned SHA-256
  of the OpenCode binary.
- The live main flow fails with `OPENCODE_FAILED`; the cause is not found. Only Gemini
  is verified live.
- Legacy tests reference no FR, UC or AC ID, and the same agent wrote the tests and the
  code. They are regression input only.

## Open items

| Item | Needs | Blocks |
|---|---|---|
| Luke's consent to delete the legacy code at cutover | Luke | Step 9 |
| Admin access or branch protection on `main` (CODEOWNERS takes effect) | Luke | Locked tests in step 4 |
| Labels and milestone `v3` on GitHub | Write access (have it) | Steps 2–3 |
| CI trigger for this branch | A change to `.github/workflows/` | CI tier in step 4 |
| This branch becomes `main` | Luke or an admin | Step 8 merges |
