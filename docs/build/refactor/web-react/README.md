# Browser in React

Read this file to follow the abstract phase plan that moves `apps/web/` to React, and to find the research files behind it.

The plan is Phase 5 of the Target Structure Refactor.

## Scope and relationship to other workstreams

Phase 5 of the Target Structure Refactor [[1]](#ref-1) replaces each screen of the Browser with React components. This workstream gives Phase 5 its layout, its conventions and its phases. The reference product is open-design. The reference for the layout is crypto-force ([Reference Products](reference-products.md)).

- Scope: `apps/web/`, the asset serving in `apps/host/src/server.ts`, `docs/conventions/`, the Browser parts of `docs/build/refactor/target-structure/target-layout.md` and `criteria.md`, and the Browser rules of `check:boundaries`.
- Out of scope: Host modules and the HTTP contract. Paths, status codes and JSON bodies do not change. The rename of `sessionId` is Phase 8 of the Naming and Grouping Refactor [[2]](#ref-2), and it starts after this workstream.
- The Browser must work after each revision. One phase moves one group of screens.

## Research files

| File | Question it answers |
| --- | --- |
| [reference-products.md](reference-products.md) | What do open-design and crypto-force teach, and can a crypto-force setup give a result equal to open-design? |
| [problems.md](problems.md) | Which problems does `apps/web/` have, with which evidence? |
| [web-rules.md](web-rules.md) | Which layout, stack and conventions apply to the Browser? |

## Planner and executor

The planner writes one revision in `plan/` for each phase, with the skill `write-implementation-plan` [[3]](#ref-3). Do not write a revision for a later phase before the current phase is done. The planner does the diagnosis of the phase and records each decision in a decision table in the revision, with the reason. The executor does each task as written. When the code does not match the task, the executor stops and reports the difference.

A task runs only the tests that are related to its change. These are the tests that it changes and the tests of the code that it changes. A task does not run the full set of test suites. Only the exit task of a phase runs all non-live test suites, to find defects and fix them. The planner writes each revision with this rule in its Global Constraints.

## Abstract phase plan

Every phase is done only when `build`, `lint`, `check:boundaries`, `check:docs` and the non-live test suites pass, and HTTP black-box tests pass without changes to their expected values.

| Phase | Name | Starts when | Done when | Status |
| --- | --- | --- | --- | --- |
| 1 | Decisions, conventions and checks | The PO answers the `Open` items of [Browser Rules](web-rules.md#stack) | The rules of [Browser Rules](web-rules.md) are in the Project Structure [[4]](#ref-4), the Coding Guidelines [[5]](#ref-5) and the Testware [[6]](#ref-6). They are also in AGENTS.md [[7]](#ref-7), the target layout and the criteria. The folder rules for `apps/web/src/` exist, each with a negative fixture | Done ([Revision 1](plan/README.md#revision-1-phase-1-decisions-conventions-and-checks)) |
| 2 | React shell | Phase 1 is done | Vite builds `apps/web/`. The Host serves the build folder with an SPA fallback, and `loadWebAssets` with its HTML and CSS strings is removed (WB-02, WB-05). Tailwind, shadcn/ui with the theme variables, Vitest, `main.tsx`, the route table, the app shell layout, the `QueryClient`, `api/client.ts` and the change feed hook exist. The old screens render inside the shell | Done ([Revision 2](plan/README.md#revision-2-phase-2-react-shell)) |
| 3 | Settings | Phase 2 is done | The settings screen (providers, models, credentials, theme) is React. Its responses use `decode*` of the contracts package | Implemented; [exit check blocked](#phase-3-settings) by concurrent Host edits |
| 4 | Workspaces and chat navigation | Phase 2 is done | The workspace screen and the chat list are React and read through query hooks | Pending |
| 5 | Conversation and requests | Phase 4 is done | The conversation, the draft, attachments, research and the request feedback are React. The request stream hook owns the SSE reader | Pending |
| 6 | Deck | Phase 5 is done | The brief, the outline, the deck canvas, the preview and the presentation are React. The preview iframe has one owner component. The editor core has a folder if UC-007 work started | Pending |
| 7 | Removal and exit check | Phases 3 to 6 are done | `apps/web/src/browser/` and the second TypeScript project are removed (WB-09). `apps/web/` imports only the contracts package (WB-03). The old Browser rules of `check:boundaries` are replaced. A rescan checks TS-06 and TS-07 [[8]](#ref-8) | Pending |

Phases 3 and 4 can run in any order after Phase 2.

### Phase 1: Decisions, conventions and checks

Change the conventions before any screen moves, so that the executors do not apply the feature layout to new code. The style model, the test runner, the development mocks and the routing mode are decided. The place of the deck decoders (WB-03) and the case of component file names are decided too. Phase 1 is done. [Revision 1](plan/README.md) of the plan has the tasks and the reports.

### Phase 2: React shell

Phase 2 is done. Legacy screens mount into a ref through `LegacyBrowserMount` until Phases 3 to 6 replace them. [Revision 2](plan/README.md#revision-2-phase-2-react-shell) of the plan has the tasks and the reports.

### Phase 3: Settings

The settings route renders React components for providers, models, credentials and theme. Query hooks read server state, and mutation hooks send writes. The API layer uses response decoders from the contracts package.

Legacy settings entry points save the chat draft before navigation. The return path uses router state because the Host rejects query strings. Navigation preserves the token fragment, so Settings supports reload. The history guard registers before React Router and protects unsaved edits.

The form keeps its read version until submission. A stale response refreshes settings and resets the form without another write. Submitted credentials leave the input immediately. The form resets completed mutations to release submitted credentials.
The Settings implementation is complete. All 20 non-live test scripts passed, with isolated retries for three scripts. Vitest passed 15 tests, the checker suite passed 112 tests, and the complete browser suite passed 22 tests. The scoped web typecheck and Vite build also passed. A focused browser test passed after the final mobile scroll change.

The full build passed earlier in this run. The last full build failed in concurrent Host deck edits outside this phase. Missing exports included `DeckSessionStore`, `ImageReviewRun` and `mapDeckFailure`. Phase 3 keeps its exit check open until the shared tree builds again.

### Phase 6: Deck

The deck screens have the most hand-built DOM and the preview security. The planner reads `features/deck/` and the deck routes of the Host before the plan. The preview keeps the empty `sandbox` attribute and the slide CSP.

## References

1. <a id="ref-1"></a>[Target Structure Refactor](../target-structure/README.md)
2. <a id="ref-2"></a>[Naming and Grouping Refactor](../naming-and-grouping/README.md)
3. <a id="ref-3"></a>[Write Implementation Plan](../../../../.agents/skills/write-implementation-plan/SKILL.md)
4. <a id="ref-4"></a>[Project Structure](../../../conventions/project-structure.md)
5. <a id="ref-5"></a>[Coding Guidelines](../../../conventions/code.md)
6. <a id="ref-6"></a>[Testware](../../../conventions/testware.md)
7. <a id="ref-7"></a>[Project: DeckAgent](../../../../AGENTS.md)
8. <a id="ref-8"></a>[Target Structure Criteria](../target-structure/criteria.md)
