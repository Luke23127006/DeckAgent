# Target Structure Refactor Reports

Read this file to find the execution reports of the Target Structure Refactor plan.

| Report | Task | Summary |
| --- | --- | --- |
| [Task 1: Update Project Structure report](task-01-update-project-structure.md) | Task 1 | Project Structure now describes the target layout, the module shape, the dependency rules, the move rules and the enforcement table. |
| [Task 2: Write the Tech Stack section report](task-02-write-tech-stack.md) | Task 2 | AGENTS.md lists the current tools with their versions and the chosen target libraries without versions. `## Commands` stays directly after the section and stays empty. |
| [Task 3: Diagnose the run owner report](task-03-diagnose-run-owner.md) | Task 3 | The 51 uses of `sessionId` in the request lifecycle and the OpenCode adapter, each with a class. Nine sites enforce one active request for each chat. Two sites are unclassified. |
| [Task 4: Diagnose the AgentRuntime port report](task-04-diagnose-agent-runtime-port.md) | Task 4 | The 40 failure and notice codes of the runtime contract, each with an origin. The runtime outcome has no usage field, and `parseEvent` drops `tokens`. 7 codes are unclassified. |
