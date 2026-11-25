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
