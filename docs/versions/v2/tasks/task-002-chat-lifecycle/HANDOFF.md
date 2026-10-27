# TASK-002 — Implementation and manual acceptance

Candidate: `feature/v2-task-002-chat-lifecycle`, base `c93f3e862a532fae206121864ebd8939c00b138a`, plus uncommitted changes. Owner requested TASK-002 after confirming the preceding gates passed on 27-10-2026. That confirmation closes G-001; it does not close G-002 or historical V1 gaps.

## Delivered

- A: per-Chat latest request summaries and monotonic state revisions. Running, waiting and terminal states remain distinct. Restart marks interrupted work unknown without replay.
- B: Chat/New Chat/Workspace navigation stays available while work runs or waits. Each Chat keeps its draft, model, pending question and request controls. Switching replaces only the view subscription.
- B: background Chat indicators and tab-local unread markers. Late history, SSE and admission/reply responses cannot overwrite another Chat's view or draft.
- B: activity detail keeps its existing expand/collapse behavior, records known elapsed time and preserves failed activity states independently of the request outcome.
- C: concurrent-request, stale reply/Stop, view disconnect and killed-Host fixtures, plus real Chrome navigation tests.

The [group README](README.md) records actual candidate contracts and compatibility. No new package boundary or database schema was introduced. Workspace options keep their DOM nodes during unchanged background refreshes so polling does not rebuild the selector.

## Verification — 27-10-2026

Environment: Windows, Node 22.19.0 from the existing local toolchain, pnpm 11.28.5 and installed Chrome. Providers are deterministic fixtures; every test uses separate temporary data.

| Check | Result | What it does not prove |
|---|---|---|
| `pnpm.cmd build` | PASS | Live provider compatibility or model quality |
| `pnpm.cmd lint` | PASS | Manual UX acceptance |
| Combined affected integration and regression run | 108/108 PASS, 0 skipped | Hosted CI or live-model acceptance |
| `pnpm.cmd test:chat-lifecycle` | 3/3 PASS, 0 skipped; also included in the combined run | Does not call real providers |
| `pnpm.cmd test:browser-smoke` | Final expanded rerun 7/7 PASS, 0 skipped | One local Windows/Chrome environment |
| Targeted formatting, workflow `actionlint`, local documentation links and `git diff --check` | PASS | Hosted CI not run |

The combined command was `node --test` with these files under `tests/`: `session-persistence`, `web-session`, `web-management`, `file-tools`, `host-api`, `browser-runtime`, `local-web`, `deck-service`, `publish-slide`, `deck-pipeline`, `deck-model`, `deck-client`, `outline-state`, `outline-workflow`, `outline-client`, `recovery-editing`, `v2-workspace`, `v2-workspace-isolation`, `v2-legacy-import`, `v2-concurrent-chat` and `browser-smoke` (each ending `.test.mjs`).

Local logs: `.local-only/v2-task002-build.log`, `.local-only/v2-task002-final-tests.log`, `.local-only/v2-task002-browser-final.log`, `.local-only/v2-task002-lifecycle-final.log`. These ignored files are local evidence, not published Issue attachments. `test:chat-lifecycle` is included in Workspace CI; the new workflow has not run on a hosted runner.

The final browser case holds both X and Y awaiting separate questions, invokes X's detached old button while viewing Y, and verifies neither request receives that answer. It also holds Y's send receipt until after navigation to X, then checks both drafts and history. The expanded case passed in the final browser rerun.

Failure history:

- The new management tracer failed because `latestRequest` was absent; it passes after adding the durable summary.
- The new browser tracer failed because New Chat was disabled while X ran; it passes with independent navigation.
- An elapsed-time assertion failed before timestamp recording was added.
- Response identity validation initially accepted another Chat's response. It now rejects mismatched Chat/request IDs and invalid revisions.
- The first combined run was 45 PASS / 1 FAIL because a V1 browser assertion still required active navigation to be disabled. That assertion now checks the accepted concurrent behavior; the rest of its output, draft, focus and recovery checks remain.
- A new browser harness reused top-level JavaScript constants between evaluations. Scoped expressions fixed that fixture error.

## Manual G-002 — pending

Use disposable test storage. Do not replace or migrate the profile used for your existing work.

```powershell
pnpm.cmd build
pnpm.cmd start:local-web --data-dir .deckagent/v2-task002-manual
```

Configure a usable model. Create two Chats, X and Y, and two test Workspaces where needed. Record the candidate commit, provider/model, tester and date.

| Case | Action | PASS condition |
|---|---|---|
| Concurrent navigation | Start a sufficiently long request in X. While its status is running, open Y and send another request. Also try New Chat and switching Workspace. | X continues in X; Y can work independently. No navigation action stops or moves work. |
| Draft isolation | During X's work, type an unsent draft. Open Y, type a different draft, then return to X. | Each draft returns only in its own Chat. |
| Background result | Leave X open in the background until it ends. | Its history row shows the real outcome and a new-result marker. Opening X restores its result and activities; the marker clears. |
| Waiting question | Ask X to clarify a topic before drafting. While X awaits your answer, work in Y; return to X and answer. | The same question/request resumes in X. Y receives none of X's answer or work. |
| Stop isolation | Start work in both Chats. Open X and Stop it, then inspect Y. | X stops and retains saved work; Y keeps its own running/final state. |
| Reload | Reload while a request runs, and again while a question waits. | Current state/history and question return without sending a new request. |
| Activity detail | Expand/collapse activities and read a tool failure when available. | Viewing starts no work. A failed tool does not automatically turn a successful request into failure. Known elapsed times remain visible. |
| Host restart | Stop Host during test work, then restart with the same profile. | Interrupted work is unconfirmed, never reported as completed or automatically replayed. History remains readable. |
| Presentation regression | Create and confirm a three-slide outline, publish slides, reopen the Chat and edit one selected slide. | Saved deck reopens; only the requested slide changes during the edit. |

If the model finishes before you switch, repeat with a longer request; that run did not demonstrate concurrency. Keep any failed observations and record the retest.

## Gate and handoff

G-002 stays NOT VERIFIED pending the manual checklist. The owner can supply PASS/FAIL per row and safe evidence. No real user data or model key was used by the agent. No commit, push or Issue publication was performed; Issue links remain pending authorization.

TASK-003 integration remains dependent on G-002 PASS. Permissions/approval UI, attachments, web research and compaction remain in their later groups.
