# Target Structure Refactor

Read this file to follow the abstract phase plan that moves DeckAgent to the target layout, and to find the research files behind it.

## Scope and relationship to module design

Module Design Refactor [[1]](#ref-1) reshaped modules inside the current layout. It closes when its Task 39 (Slice 2D and Phase 2 exit check) is `Done`. Its Phases 3 to 5 are superseded by this workstream, because they assume that the current layout is final.

This workstream moves the code to the layout in Target Layout [[2]](#ref-2):

- A thin HTTP edge with Express 5 and one module per domain (`<name>.routes.ts`, `<name>.service.ts`, `<name>.store.ts`) inside `apps/host/src/`.
- An agent core with ports and adapters: `runs/`, `tools/`, and `runtimes/`.
- A Browser application in React and Vite inside `apps/web/src/`, which imports only `packages/contracts/`.

The criteria that every phase must keep are in Target Structure Criteria [[3]](#ref-3) (TS-01 to TS-13).

Write implementation tasks in `plan/` one phase at a time, as sequential revisions [[4]](#ref-4). Do not write tasks for a later phase before the current phase is done. Each phase starts with diagnosis tasks that end with `STOP` and a decision table, because each phase has open design points that diagnosis must answer first.

## Research files

The files below are research inputs in Vietnamese. They are not plans.

| File | Question it answers |
| --- | --- |
| [criteria.md](criteria.md) | Which criteria must the target structure meet, and how do we check each one? |
| [agent-load-axes.md](agent-load-axes.md) | Which parts of DeckAgent carry the architecture load, and why do layers fit only the HTTP edge? |
| [reference-codebases.md](reference-codebases.md) | What do open-design and crypto-force teach, and what must we not copy? |
| [target-layout.md](target-layout.md) | What is the target folder layout, its dependency direction, and its agent core rules? |
| [current-gap.md](current-gap.md) | How far is the current code from the target, and where does each folder go? |
| [libraries.md](libraries.md) | Which libraries replace hand-written infrastructure, and in which order? |
| [feature-pressure.md](feature-pressure.md) | Which missing features change the target structure, and where? |

## Starting point

The facts below come from a run on 2026-11-25 on branch `refactor` at commit `d01f355`:

- `build`, `check:boundaries` (0 violations), and `lint` pass.
- 17 of 18 non-live test suites pass with `# fail 0`. `test:env-startup` failed one time in a full run and its child process did not stop. It passed 4 of 4 runs alone, each in about 4 seconds against a 5-second startup wait. **Inferred:** the startup wait is too short under load. Task 39 of Module Design Refactor [[1]](#ref-1) records this failure.
- The Browser already calls the Host only through HTTP (`fetch` to `/api/...` with a bearer token, and SSE read from the response body). Inside the Host, routes call feature code as plain functions. The HTTP contract between the two applications is therefore the safety net for every phase. Paths, status codes, and JSON bodies stay the same unless a phase changes them on purpose.

## Abstract phase plan

| Phase | Name | Plan location | Starts when | Done when |
| --- | --- | --- | --- | --- |
| 1 | Conventions and agent core contracts | `plan/` Revision 1 | Module Design Task 39 is `Done` | Project Structure [[5]](#ref-5) describes the target layout and the rules for old and new code during the move. The Tech Stack section of AGENTS.md [[6]](#ref-6) lists the chosen libraries. The run owner, the `AgentRuntime` port, the run preparation contribution, and the change notice each have a written shape |
| 2 | Host application and Express edge | `plan/` Revision 2 | Phase 1 is done | `apps/host/src/server.ts` and `http/` serve every current route through Express 5. `node:http` routing with regular expressions is removed. HTTP black-box tests pass without changes to their expected values. Folder-level `no-restricted-imports` rules exist, each with a negative fixture (TS-09) |
| 3 | Domain modules | `plan/` Revisions 3 and later | Phase 2 is done | `workspaces`, `chats`, `providers`, `attachments`, `research`, and `deck` live in `apps/host/src/modules/` with the common module shape. The interface `WebManagement` and `packages/host/api/` are removed. Every store has a `version` and a change notice (TS-12) |
| 4 | Agent core | `plan/` Revisions after Phase 3 | Phases 1 and 3 are done | `runs/`, `tools/`, and `runtimes/opencode/` implement the Phase 1 contracts. `runs/` imports no module, no Express, and no SQL driver (TS-04, TS-13) |
| 5 | Browser in React | `plan/` revisions in parallel with Phases 3 and 4 | Phase 2 is done | Every screen is a React component in `apps/web/src/`. No helper that builds DOM by hand remains (TS-07). `apps/web/` imports only `packages/contracts/` (TS-06) |
| 6 | Final hygiene, flow docs, and exit scan | `plan/` last revision | Phases 3, 4, and 5 are done | The items carried from Module Design Phases 3 to 5 are done on the new code. Flow docs exist in Architecture [[7]](#ref-7). A rescan checks every criterion in Target Structure Criteria [[3]](#ref-3) |

### Phase 1: Conventions and agent core contracts

Executors follow Project Structure [[5]](#ref-5). Change it before any code moves, so that executors do not apply the old layout to new code. Also add the rule that old and new code run together during the move.

Design the four agent core contracts from Current Gap [[8]](#ref-8) before any lifecycle code moves. If code moves first, it changes a second time right after the move. The contracts are:

- A run owner with a type and an ID, in place of `sessionId`.
- An `AgentRuntime` port with run events, resource usage, and error categories.
- A run preparation contribution that modules register at the composition root.
- A change notice with a `version`, which every store sends after a write.

The product decision about what a user sees when a write has an old `version` (Target Layout [[2]](#ref-2)) goes to Open Questions [[9]](#ref-9). It does not stop Phase 1, because the store rejects the write in either answer.

### Phase 2: Host application and Express edge

Move the transport layer first, because every module route depends on it. Replace the routing only. Keep the route logic, the bearer check, the origin check, the security headers, and the SSE cursor behavior. Use `multer` for multipart and `helmet` for headers only when the HTTP tests show the same behavior [[10]](#ref-10).

Write the folder-level import rules in this phase, while the new folders are still small. Without them, the move weakens the boundaries that `check:boundaries` enforces today (Current Gap [[8]](#ref-8)).

### Phase 3: Domain modules

Move one module per revision, from the simplest to the most complex: `workspaces`, `chats`, `providers`, `attachments`, `research`, and then `deck`. The diagnosis for `deck` decides whether `packages/presentation/deck/` stays a package or moves into `modules/deck/` (Target Layout [[2]](#ref-2)). Do the type assertion and comment cleanup on each moved file in the same revision, so that no file is opened twice.

### Phase 4: Agent core

Move `packages/host/api/src/lifecycle/`, `packages/tools/filesystem/`, and `apps/web/src/integrations/opencode/` into `runs/`, `tools/`, and `runtimes/opencode/`. Apply the Phase 1 contracts during the move. This phase has the highest risk, because it touches the request lifecycle and the capability boundary.

### Phase 5: Browser in React

Replace one screen at a time, so that the Browser works after every revision. Keep the clients in `apps/web/src/browser/transport/` and move them to `apps/web/src/api/`. Add TanStack Query only for server state that more than one screen reads [[10]](#ref-10).

### Phase 6: Final hygiene, flow docs, and exit scan

Do the remaining items from Module Design Phases 3 to 5 on the new code (see [Carried items](#carried-items)). Try Drizzle only if its docs state support for the SQLite driver in use and a trial removes code [[10]](#ref-10). Skip it otherwise.

## Carried items

| Module Design item [[1]](#ref-1) | Where it goes |
| --- | --- |
| Phase 3: remove non-`as const` type assertions, audit comments, rename `*Service` symbols | Each Phase 3 and Phase 4 revision, for the files it moves. Phase 6 for the remaining files |
| Phase 3: `packages/presentation/design/` refactors D12 and D13 | Phase 6, because `packages/presentation/` keeps its place |
| Phase 3: lint rules against regressions | Phase 2 folder-level rules (TS-09) |
| Phase 4: Testware alignment | Phase 6, after interfaces stop changing. HTTP black-box tests that a phase depends on are fixed in that phase |
| Phase 5: flow docs for Request Lifecycle, Deck Pipeline, and Workspace and Source Permission | Phase 6, after paths stop changing |
| Phase 5: Before and After rescan | Phase 6 exit scan |

## Fresh-chat handoff

A new chat starts the next phase in four steps:

1. Read this file and `plan/README.md` (when it exists) to find the last completed phase.
2. Check that the "Starts when" condition of the next phase is true.
3. Run `/write-implementation-plan` to add only the next phase's revision to `plan/` [[4]](#ref-4).
4. Ask the user for phase-specific inputs before writing executable tasks.

## References

1. <a id="ref-1"></a>[Module Design Refactor](../module-design/README.md)
2. <a id="ref-2"></a>[Layout đích](target-layout.md)
3. <a id="ref-3"></a>[Tiêu chí của cấu trúc đích](criteria.md)
4. <a id="ref-4"></a>[Write Implementation Plan](../../../../.agents/skills/write-implementation-plan/SKILL.md)
5. <a id="ref-5"></a>[Project Structure](../../../conventions/project-structure.md)
6. <a id="ref-6"></a>[Project: DeckAgent](../../../../AGENTS.md)
7. <a id="ref-7"></a>[Architecture](../../../architecture/README.md)
8. <a id="ref-8"></a>[Khoảng cách hiện tại](current-gap.md)
9. <a id="ref-9"></a>[Open Questions](../../../open-questions.md)
10. <a id="ref-10"></a>[Thư viện](libraries.md)
