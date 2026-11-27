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
| 3 | Settings | Phase 2 is done | The settings screen (providers, models, credentials, theme) is React. Its responses use `decode*` of the contracts package | Done ([Phase 3](#phase-3-settings)). The exit check ran in [Phase 7](#phase-7-removal-and-exit-check) |
| 4 | Workspaces and chat navigation | Phase 2 is done | The workspace screen and the chat list are React and read through query hooks | Done ([Phase 4](#phase-4-workspaces-and-chat-navigation)) |
| 5 | Conversation and requests | Phase 4 is done | The conversation, the draft, attachments, research and the request feedback are React. The request stream hook owns the SSE reader | Done ([Phase 5](#phase-5-conversation-and-requests)) |
| 6 | Deck | Phase 5 is done | The brief, the outline, the deck canvas, the preview and the presentation are React. The preview iframe has one owner component. The editor core has a folder if UC-007 work started | Done ([Phase 6](#phase-6-deck)) |
| 7 | Removal and exit check | Phases 3 to 6 are done | `apps/web/src/browser/` and the second TypeScript project are removed (WB-09). `apps/web/` imports only the contracts package (WB-03). The old Browser rules of `check:boundaries` are replaced. A rescan checks TS-06 and TS-07 [[8]](#ref-8) | Done ([Phase 7](#phase-7-removal-and-exit-check)) |

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

### Phase 4: Workspaces and chat navigation

The workspace controls, the chat search and the chat list are React components in `components/`. They read the Host through `useWorkspaces`, `useChats` and `useChatSearch`, and they write through `useWorkspaceChange`. The API layer uses `decodeChatList` and `decodeWorkspaceList` of the contracts package. A `chats` or `workspaces` notice invalidates the query keys.

The conversation screen stays legacy until Phase 5. Thus `ChatSidebar` renders through portals into three slots of the legacy navigation, and the legacy CSS layout does not change. The legacy screens send the open chat, the switch lock and the unsaved draft chats to React. React sends the chat to open and the workspace list to the legacy screens. The legacy workspace view and the unused search and workspace writes of the legacy client are removed.

The phase was diagnosed and done in one run without task files. Its decisions:

| Decision | Reason |
| --- | --- |
| Portals into slots of the legacy navigation, not a new sidebar in `layouts/` | The account menu, the new chat button and the navigation toggle belong to the conversation screen until Phase 5. One layout owner prevents two navigation columns |
| The search field and the workspace select use native `input` and `change` listeners | A script event that does not bubble does not reach the root listener of React. The browser tests send such events |
| The legacy screens keep their own read of chats and workspaces | `open`, `start` and the new chat need the list. Phase 5 removes this read with the legacy screens |

Checks: `build`, `lint`, `check:boundaries`, `check:docs`, Vitest (23 tests) and the contracts tests passed. The browser suite passed 21 of 22 tests in the first run. The failed test stops at "1/3" slides after an explicit continuation of a deck. An isolated rerun with the same build passed. The same failure occurred in the Phase 3 run, so it is not a result of this phase.

### Phase 5: Conversation and requests

`ChatScreen` in `components/` renders the chat screen for the home route and the chat route. It holds the navigation, the conversation, the composer with the draft, the attachments, the research choice and the model picker, and the request records with their feedback. `useConversation` owns the open chat: the open with a generation guard, the draft mirror with its save delay, send, stop, approval and confirmation. `useRequestStream` owns the SSE reader of the active request and its `AbortController`, and continues after the last sequence. `useChatNotices` reads the notices of the open chat. The API layer uses `decodeRequestSnapshot`, `decodeHistory`, `decodeStoredRequests`, `decodeStoredActivities`, `decodeChatDraft`, `decodeAttachmentUpload` and `decodeResearchSources` of the contracts package. The text of the conversation and the request failures is in `text.ts`.

The legacy shell, the navigation, the request runner, the draft sync, the theme control and the features `chats`, `requests`, `attachments`, `research` and `providers` of `src/browser/` are removed. The deck screens stay legacy until Phase 6. `browser/deck-bridge.ts` creates them, and `ChatScreen` places their nodes through `LegacyNode`.

The phase was diagnosed and done in one run without task files. Its decisions:

| Decision | Reason |
| --- | --- |
| The open chat is one object in `useConversation` that React reads through `useSyncExternalStore`, not one query per record | The open, the send and the stream end change history, requests, activities and the draft together under one generation. Separate queries would show a mix of two chats after a fast switch. Settings, the chat list and the workspace list stay in the query cache, and the object reads them from it |
| The deck screens reach the conversation through the `ConversationDeck` port, implemented by `browser/deck-bridge.ts` | The Outline card is inside an assistant message, and the Brief command is part of a send. A port keeps the legacy deck code out of the hooks, and Phase 6 replaces only the bridge |
| The text field of the composer is uncontrolled, and it uses native `input` and `keydown` listeners | A script event that does not bubble does not reach the root listener of React. A draft notice of another interface also changes the text without a render |
| The legacy transport (`src/browser/transport/`) and `change-watcher.ts` stay | HTTP tests of the Host use them as the Browser driver. Phase 7 removes them with the second TypeScript project |
| The model options show only when a chat is open | The query cache holds Settings before the chat opens. An option list without the choice of the chat shows an empty choice |

Checks ran in a worktree at the Phase 4 commit with the changes of this phase, because concurrent Host edits in the shared tree stop `build`. `build`, the typecheck, `lint` of `apps/web/` and the contracts package, Vitest (23 tests), the contracts decoder tests and the browser suite (22 of 22 tests) passed. Fourteen non-live scripts passed. The run stopped at the request of the PO before `test:env-startup`, `test:http-edge`, `test:local-web`, `test:layouts`, `check:boundaries` and `check:docs`, so these did not run.

### Phase 6: Deck

The deck screens are React components in `components/`. `DeckWorkflow` renders the Brief workflow, `OutlineCard` renders an Outline proposal inside its assistant message, and `OutlineDock` renders the actions of the current Outline above the composer. `PublishedDeck` renders the stage, the filmstrip and the presentation mode, and `SampleDeck` renders the sample slides. `SlideFrame` is the only owner of a preview iframe: it sets the empty `sandbox` attribute, and it puts the slide CSP before the slide HTML in `srcdoc`.

`DeckScreens` in `hooks/use-deck-screens.ts` implements the `ConversationDeck` port and replaces `browser/deck-bridge.ts`. It keeps the explicit choices of the user, the interview of the open chat and the visibility of the two deck panels. `DeckModel` in `hooks/use-deck-model.ts` owns the deck SSE reader and the slide reads of the open chat. `useSlidePreviews`, `usePresentation`, `usePanelResizer` and `useOutlineImage` own the thumbnail queue, the full-screen mode, the panel divider and the prepared Outline images. The conversation reads the Outline and sends the confirmation through `api/deck.ts`. The contracts package decodes each deck payload that the Browser reads (WB-03): `decodeDeckSnapshot`, `decodeDeckChange`, `decodeSlideContent`, `decodeOutlineSnapshot`, `decodeInterview` and `decodeConfirmationResult`. The text of the deck screens is `deckText` in `text.ts`.

`browser/features/deck/`, `browser/deck-bridge.ts`, `browser/dom.ts` and `LegacyNode` are removed. The deck model test moved from `node:test` to Vitest. UC-007 work did not start, so `src/editor/` does not exist.

The phase was diagnosed and done in one run without task files. Its decisions:

| Decision | Reason |
| --- | --- |
| The components keep the classes, the labels and the order of the legacy DOM | The browser suite and `motion.ts` select the deck screens by these classes and labels, and `legacy.css` styles them |
| The form controls of the Brief workflow are uncontrolled. `DeckScreens` reads them when a request is sent, and the selects use native `change` listeners | A script sets a choice without an event, and a script event that does not bubble does not reach the root listener of React |
| `DeckScreens` tells the conversation about a deck change only when the chat, the Outline, the generation or a panel visibility changes | The stage and the filmstrip read `DeckModel` through `useDeckModel`. A slide read does not render the whole chat screen again. The poll of the conversation no longer compares a deck signature |
| The port `ConversationDeck` no longer reads the Outline or sends its confirmation. The conversation calls `readOutlines` and `confirmOutline` of `api/deck.ts` | A hook can call `api/`. The port only kept the legacy deck code out of the hooks |
| The outline read keeps `OUTLINE_UNAVAILABLE` for a refused read. The other deck reads use the error code of the Host | The conversation shows the text of `OUTLINE_UNAVAILABLE` today. A known Host code gives more exact text than the fixed fallback of the legacy clients |
| The legacy transport clients for the deck, the Brief, the Outline and the confirmation stay | HTTP tests of the Host use them as the Browser driver. Phase 7 removes them with the second TypeScript project |

Checks ran in a worktree at commit `6caa704` with the changes of this phase. The shared tree had no `packages/host/contracts/tsconfig.json` during the run, because of concurrent edits, so `tsc` and Vitest could not start there. `build`, `lint`, `check:boundaries`, `check:docs`, Vitest (33 tests), the contracts decoder tests (23 tests), `test:slide-pipeline`, `test:outline-workflow`, `test:brief-foundation`, `test:tools-browser` and the Vite build guard passed. At the request of the PO, the browser suite (`test:browser-smoke`) did not run. Thus no test of this phase ran the deck flows in a real browser. Phase 7 runs all non-live suites.

### Phase 7: Removal and exit check

`apps/web/src/browser/` and `tsconfig.browser.json` are removed. `apps/web/` has one TypeScript project (WB-09). Its `package.json` and its `tsconfig.json` refer only to `@deckagent/host-contracts` (WB-03). The motion layer moved from `browser/motion.ts` to `hooks/use-motion.ts`. `useMotion` starts it after the first render and disconnects its `MutationObserver` on unmount. `browser/change-watcher.ts`, the transport `ChangeClient` and their test are removed, because no product code and no other test used them. The change feed hook replaced them in Phase 2.

The legacy transport clients moved to `e2e/fixtures/browser-driver/` as JavaScript. The HTTP tests of the Host and the tests in `e2e/` use them as the Browser driver. The five tests of these clients moved from `apps/web/tests/` to `e2e/` with the same names. `apps/web/tests/` now holds only Vitest tests.

`check:boundaries` applies `browser-node-import` to all of `apps/web/src/`. The rule refuses a Node-only module, a workspace package other than `@deckagent/host-contracts`, and a relative import into another application. The rules `browser-feature-private-import`, `browser-feature-cycle` and `browser-transport-ui-import` are removed with the folders that they checked. The oxlint override for `apps/web/src/browser/` is removed. The negative fixtures of `tests/check-boundaries.test.mjs` and `tests/oxlint-boundaries.test.mjs` use the new folders.

The phase was diagnosed and done in one run without task files. Its decisions:

| Decision | Reason |
| --- | --- |
| The legacy clients become a test driver in `e2e/fixtures/browser-driver/`, not calls of `apps/web/src/api/` | `api/` uses the `@/` alias and the Vite environment, and Node cannot run it without a build. A rewrite of the HTTP tests to other clients would change tests that check the HTTP contract. A mechanical transpile with `typescript` keeps the behavior of the clients |
| The driver is JavaScript (`.mjs`), not TypeScript | Without a TypeScript project for it, the type annotations are not checked. The other test fixtures are `.mjs` too |
| The driver is in `e2e/fixtures/`, and the Host tests in `apps/host/tests/` import it from there | Before Phase 7 the Host tests imported the driver from `apps/web/tests/`, which is another component too. The driver stands for the Browser in a flow between the two applications, and `e2e/` holds these flows |
| The four client tests that use only a fake server stay with the driver in `e2e/` | They show that the driver decodes and refuses responses as the Browser did. They do not test product code. A later revision can replace them when the HTTP tests use `apps/web/src/api/` |
| `scripts/scan-module-design.mjs` keeps its area list | The list measures the baseline layout of the Module Design research. A change of the list changes the meaning of that baseline |

Checks ran in a worktree at commit `780e18f` with the changes of this phase and the open Host changes of the Naming and Grouping Refactor. The shared tree had no `packages/host/contracts/tsconfig.json` during the run, because of concurrent edits. `build`, `lint`, `check:boundaries`, `check:docs`, Vitest (33 tests) and the 19 other non-live test scripts passed. The browser suite passed 21 of 22 tests in the first run. The failed test stopped at "Live reply not shown". Two isolated reruns of that test and a second run of the full browser suite (22 of 22) passed. Thus the exit checks of Phase 3 are also done.

Rescan of TS-06 and TS-07 [[8]](#ref-8):

- TS-06 passes. The 40 workspace imports in `apps/web/src/` all import `@deckagent/host-contracts`. No relative import leaves `apps/web/`.
- TS-07 passes for the screens. No helper builds a screen by hand. Two hooks still make short-lived DOM nodes. `use-motion.ts` splits the welcome heading into letters for its animation, and restores the text after it. It also adds a sheen node. `use-panel-resizer.ts` adds an overlay while a divider moves.

## References

1. <a id="ref-1"></a>[Target Structure Refactor](../target-structure/README.md)
2. <a id="ref-2"></a>[Naming and Grouping Refactor](../naming-and-grouping/README.md)
3. <a id="ref-3"></a>[Write Implementation Plan](../../../../.agents/skills/write-implementation-plan/SKILL.md)
4. <a id="ref-4"></a>[Project Structure](../../../conventions/project-structure.md)
5. <a id="ref-5"></a>[Coding Guidelines](../../../conventions/code.md)
6. <a id="ref-6"></a>[Testware](../../../conventions/testware.md)
7. <a id="ref-7"></a>[Project: DeckAgent](../../../../AGENTS.md)
8. <a id="ref-8"></a>[Target Structure Criteria](../target-structure/criteria.md)
