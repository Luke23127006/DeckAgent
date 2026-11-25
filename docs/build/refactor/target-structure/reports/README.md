# Target Structure Refactor Reports

Read this file to find the execution reports of the Target Structure Refactor plan.

| Report | Task | Summary |
| --- | --- | --- |
| [Task 1: Update Project Structure report](task-01-update-project-structure.md) | Task 1 | Project Structure now describes the target layout, the module shape, the dependency rules, the move rules and the enforcement table. |
| [Task 2: Write the Tech Stack section report](task-02-write-tech-stack.md) | Task 2 | AGENTS.md lists the current tools with their versions and the chosen target libraries without versions. `## Commands` stays directly after the section and stays empty. |
| [Task 3: Diagnose the run owner report](task-03-diagnose-run-owner.md) | Task 3 | The 51 uses of `sessionId` in the request lifecycle and the OpenCode adapter, each with a class. Nine sites enforce one active request for each chat. Two sites are unclassified. |
| [Task 4: Diagnose the AgentRuntime port report](task-04-diagnose-agent-runtime-port.md) | Task 4 | The 40 failure and notice codes of the runtime contract, each with an origin. The runtime outcome has no usage field, and `parseEvent` drops `tokens`. 7 codes are unclassified. |
| [Task 5: Diagnose run preparation report](task-05-diagnose-run-preparation.md) | Task 5 | The 51 places that build a part of a run, each with a kind and an owner. Deck and OpenCode code build most parts. The adapter never reads the grants. 3 places are unclassified. |
| [Task 6: Diagnose the change notice and version report](task-06-diagnose-change-notice.md) | Task 6 | The 29 tables of 4 schema files, each with a class: 8 `versioned`, 10 `user-visible-write`, 7 `user-visible-read`, 4 `internal`. Only the deck sends a change notice. No deck write takes an expected deck `version`. 0 tables are unclassified. |
| [Task 7: Write the agent core contracts report](task-07-write-agent-core-contracts.md) | Task 7 | Four ADRs with status `Proposed`, the agent core contracts file and the architecture README. The six name checks and `check:docs` pass. |
| [Task 8: Check the Phase 1 exit condition report](task-08-check-phase-1-exit.md) | Task 8 | The four Phase 1 exit conditions pass. The greps and `check:docs` prove names and structure only, so a person decides whether the content is correct. |
| [Task 9: Inventory the HTTP routes report](task-09-inventory-http-routes.md) | Task 9 | The 44 HTTP routes of the Local Host, each with a method, a path pattern, a body kind, a status, its conditions and its flags. 31 routes have a path parameter with a character class other than `[^/]`, and one route has an order conflict. |
