# Target Structure Refactor Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Target Structure Refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Complete Phase 1 of the Target Structure Refactor, and collect the facts that the design of Phase 2 needs. Phase 1: the conventions describe the target layout, AGENTS.md lists the tech stack, and the four agent core contracts have a written shape. Phase 2: the Local Host serves every current route through Express 5.

**Approach:** Revision 1 (Tasks 1 to 6) has two parts. Tasks 1 and 2 change Project Structure [[1]](#ref-1) and the Tech Stack section of AGENTS.md [[2]](#ref-2). Executors follow these files, so the files must not send new code to the old layout. Tasks 3 to 6 are diagnosis tasks that do not change code. Each task covers one agent core contract and ends with STOP. Revision 1b (Tasks 7 and 8) writes the contract shapes from the approved diagnosis reports and checks the Phase 1 exit condition. Revision 2 (Tasks 9 to 12) starts Phase 2 with four diagnosis tasks that do not change code. They cover the routes, the shared HTTP behavior and the error maps, the Host application package and the test baseline.

**Tech stack:** Windows, Git Bash, Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, oxlint 1.94.0, Biome 2.5.15, Zod 4.6.7, `node:sqlite`, `node:test`, OpenCode 1.19.5.

**Spec:** Target Structure Refactor [[3]](#ref-3), Phases 1 and 2. Inputs: Target Layout [[4]](#ref-4), Current Gap [[5]](#ref-5), Target Structure Criteria [[6]](#ref-6), Libraries [[7]](#ref-7) and Feature Pressure [[8]](#ref-8).

## Decisions

| Topic | Decision |
| --- | --- |
| Workstream and topic | This folder owns `refactor/target-structure`. The phase README is `docs/build/refactor/target-structure/README.md` [[3]](#ref-3). Each phase adds one revision to this folder. |
| Phase 1 start | Task 39 of Module Design Refactor is `Done`. The start condition of Phase 1 is true. |
| Revision 1 scope | Tasks 1 and 2 change documents only. Tasks 3 to 6 read code and write reports only. No task in Revision 1 changes production code, test code, `package.json` or a check script. |
| Project Structure content | Task 1 replaces `docs/conventions/project-structure.md` with the complete text in the task file. The text describes the target layout from Target Layout [[4]](#ref-4), the module shape and the dependency rules. It also gives the rules for old and new code during the move, and the enforcement table. |
| Old and new code during the move | An old folder keeps the ownership of its target folder in the mapping table. New code of an area with old code goes next to the old code until the revision that moves the area. New code of a new area goes to `apps/web/src/features/<name>/` before `apps/host/` exists, and to `apps/host/src/modules/<name>/` after. Only a phase revision of this plan moves an old folder, or creates a target folder for an area with old code. A move updates all callers in the same revision and leaves no re-export file at the old path. A `check:boundaries` rule for an old path stays until the revision that moves the path adds a folder-level rule with a negative fixture. |
| Open points in Project Structure | Two points stay `Open` in Project Structure: the place of `packages/presentation/deck/` (Phase 3 diagnosis decides) and the place of the error-to-HTTP-status map (Phase 2 diagnosis decides). |
| Tech Stack content | Task 2 writes the current tools with the versions from `package.json` and the chosen target libraries without versions. The phase that installs a library pins its version. Drizzle is not chosen [[7]](#ref-7). |
| Where the contract shapes go | Revision 1b writes one ADR with status `Proposed` for each contract in `docs/architecture/30-decisions.md`, and the type shapes and flows in a new file `docs/architecture/10-agent-core.md`. Both files are in Vietnamese, because `docs/architecture/` is not in `docs/build/`. |
| Diagnosis before design | Tasks 3 to 6 collect facts and stop. They do not propose type shapes. The planner writes the shapes in Revision 1b from the approved reports. |
| Product question about old `version` | What a user sees when a write has an old `version` is the open question OQ-061 in `docs/open-questions.md`. Revision 1 adds no new open question. |
| Run owner (Revision 1b) | A run has `RunOwner = { kind, id }` in place of `sessionId`. `runs/` keeps one active run for each owner with a unique index on `(owner_kind, owner_id)`. Different owners run in parallel. The HTTP wire keeps `sessionId` and the current codes. |
| Change notice (Revision 1b) | One `version` and one notice topic for each aggregate that the user sees. Child tables increase the `version` of the parent aggregate. |
| Contract text (Revision 1b) | Task 7 writes the complete Vietnamese texts of `docs/architecture/30-decisions.md`, `docs/architecture/10-agent-core.md` and `docs/architecture/README.md`. The texts are in the task file. |
| ADR status (Revision 2) | ADR-001 to ADR-004 in `docs/architecture/30-decisions.md` keep status `Proposed` until Phase 4. Revision 2 does not change `docs/architecture/`. |
| Revision 2 scope | Tasks 9 to 12 read code, run checks and write reports only. No task in Revision 2 changes production code, test code, `package.json`, a check script or `docs/architecture/`, and no task installs a package. |
| Express defaults list | Task 10 compares the current behavior with a fixed list of Express 5 defaults that the planner took from the Express 5 API reference. The executor does not run Express. A later revision proves each difference with an HTTP test. |
| Commit | Executors do not commit or push. A person commits after approving the report. |

## Global Constraints

- Shell: Git Bash on Windows. Run every command from the repository root `C:/Users/Duy/Desktop/DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not run `pnpm` without `corepack`. Do not install packages.
- Docs check: `corepack pnpm@11.28.5 check:docs`. PASS: the output contains `0 error(s)`. FAIL: the output contains `error(s)` with a number above 0.
- Language: files in `docs/build/` are in English. Files in `docs/conventions/`, `docs/architecture/` and `AGENTS.md` are in Vietnamese and keep English technical terms.
- Each new file in `docs/` starts with an H1 and one purpose sentence. English files use `Read this file to ...`. Vietnamese files use `Đọc file này để biết ...`.
- Each new file in `docs/` must have a link from the nearest `README.md`.
- Do not create a Markdown file that the `Files` block of the task does not list.
- Do not change production code, test code, `package.json`, `.oxlintrc.json` or a file in `scripts/` in Revision 1.
- Do not change `docs/build/refactor/target-structure/README.md` or the research files next to it.
- Do not add a comment, a lint-disable directive or `@ts-expect-error`.
- Do not commit or push.
- Write reports in English with `asd-ste100` strict mode. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py <report-file>` on each report. When `python` is not available in Git Bash, run the same command in PowerShell.

## Review Focus

These are the six failure modes most likely in Revision 1. No automated test covers them, so the reviewer checks them by hand.

1. Project Structure still sends new code to an old folder, for example a new Host route to `packages/host/api/src/transport/`. Owner: [Task 1](task-01-update-project-structure.md), Step 3 checks the mapping table.
2. Project Structure drops an old boundary rule before a replacement check exists. Owner: [Task 1](task-01-update-project-structure.md), Step 3 checks the enforcement table.
3. The run owner diagnosis misses a `sessionId` use that enforces the rule "one active request for each chat". Owner: [Task 3](task-03-diagnose-run-owner.md), Step 1 counts every site.
4. The runtime diagnosis lists failure codes but not where each code comes from, so the error categories in Revision 1b have no evidence. Owner: [Task 4](task-04-diagnose-agent-runtime-port.md), Step 2 records the origin of each code.
5. The run preparation diagnosis misses a part that the code builds under another name, for example `seedPrompt` in `history.ts`. The search by name finds it only by chance. Owner: [Task 5](task-05-diagnose-run-preparation.md), Step 2 reads the files in full.
6. The change notice diagnosis misses a store that writes user-visible state without a `version`. Owner: [Task 6](task-06-diagnose-change-notice.md), Step 1 lists every file that runs SQL.

Revision 1b adds these failure modes:

7. A contract type in `10-agent-core.md` keeps a `sessionId` field. Owner: [Task 7](task-07-write-agent-core-contracts.md), Step 5 counts `sessionId:`.
8. An ADR states a fact that the diagnosis reports do not contain. Owner: [Task 7](task-07-write-agent-core-contracts.md). No check covers it, so the reviewer compares each `Bối cảnh` section with its report.

Revision 2 adds these failure modes:

9. The route inventory misses a route that a branch answers without a method check, for example the deck routes. Owner: [Task 9](task-09-inventory-http-routes.md), Step 1 counts the method checks and Step 2 reads the files in full.
10. A path parameter keeps its current character class only by chance after the move, because Express accepts any character other than `/`. Owner: [Task 9](task-09-inventory-http-routes.md), flag `param-pattern`.
11. A shared behavior has no test, so the move to middleware can drop it with no failed test. Owner: [Task 10](task-10-diagnose-shared-http-behavior.md), `Not found` in the `Tests` column.
12. An e2e test imports `@deckagent/local-web` directly, so a move of the composition root changes the test. Owner: [Task 11](task-11-diagnose-host-application-package.md), Step 3.
13. A suite fails before Phase 2 changes code, and a later task reports the failure as a regression. Owner: [Task 12](task-12-record-http-test-baseline.md).

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Update Project Structure to the target layout](task-01-update-project-structure.md) ([report](../reports/task-01-update-project-structure.md)) |
| 2 | Done | [Write the Tech Stack section of AGENTS.md](task-02-write-tech-stack.md) ([report](../reports/task-02-write-tech-stack.md)) |
| 3 | Done | [Diagnose the run owner](task-03-diagnose-run-owner.md) ([report](../reports/task-03-diagnose-run-owner.md)) |
| 4 | Done | [Diagnose the AgentRuntime port](task-04-diagnose-agent-runtime-port.md) ([report](../reports/task-04-diagnose-agent-runtime-port.md)) |
| 5 | Done | [Diagnose run preparation](task-05-diagnose-run-preparation.md) ([report](../reports/task-05-diagnose-run-preparation.md)) |
| 6 | Done | [Diagnose the change notice and version](task-06-diagnose-change-notice.md) ([report](../reports/task-06-diagnose-change-notice.md)) |
| 7 | Done | [Write the agent core contracts](task-07-write-agent-core-contracts.md) ([report](../reports/task-07-write-agent-core-contracts.md)) |
| 8 | Done | [Check the Phase 1 exit condition](task-08-check-phase-1-exit.md) ([report](../reports/task-08-check-phase-1-exit.md)) |
| 9 | Done | [Inventory the HTTP routes](task-09-inventory-http-routes.md) ([report](../reports/task-09-inventory-http-routes.md)) |
| 10 | Done | [Diagnose the shared HTTP behavior and the error maps](task-10-diagnose-shared-http-behavior.md) ([report](../reports/task-10-diagnose-shared-http-behavior.md)) |
| 11 | Done | [Diagnose the Host application package](task-11-diagnose-host-application-package.md) ([report](../reports/task-11-diagnose-host-application-package.md)) |
| 12 | Pending | [Record the test baseline before Phase 2](task-12-record-http-test-baseline.md) |

## Next revision

Revision 2b writes the Phase 2 implementation tasks after a person approves the reports of Tasks 9 to 12. Before Revision 2b, a person decides these points from the reports:

- What `apps/host/` contains in Phase 2 and what it imports while the feature code stays in `apps/web/src/features/`. Input: Task 11.
- Where the route registrars live until Phase 3 moves each module. Input: Tasks 9 and 11.
- How the Express routes keep the current path parameter rules, method rules and 404 body. Input: Tasks 9 and 10.
- Where the error map goes: one error handler in `http/` or one map in each module. This closes the `Open` point in Project Structure. Input: Task 10.
- Whether `multer` and `helmet` replace `multipart.ts` and `setSecurityHeaders`. Input: Task 10. The rule from Libraries [[7]](#ref-7) applies: use a library only when the HTTP tests show the same behavior.
- Which folder-level `no-restricted-imports` rules Phase 2 adds, each with a negative fixture in `tests/oxlint-boundaries.test.mjs` (TS-09). Input: Task 11.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Project: DeckAgent](../../../../../AGENTS.md)
3. <a id="ref-3"></a>[Target Structure Refactor](../README.md)
4. <a id="ref-4"></a>[Layout đích](../target-layout.md)
5. <a id="ref-5"></a>[Khoảng cách hiện tại](../current-gap.md)
6. <a id="ref-6"></a>[Tiêu chí của cấu trúc đích](../criteria.md)
7. <a id="ref-7"></a>[Thư viện](../libraries.md)
8. <a id="ref-8"></a>[Áp lực từ feature còn thiếu](../feature-pressure.md)
