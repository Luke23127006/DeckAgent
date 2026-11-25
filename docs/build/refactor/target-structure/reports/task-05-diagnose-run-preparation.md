# Task 5: Diagnose run preparation report

Read this file to learn where the code builds the instructions, the tools, the resources and the grants of a run.

## Files changed

- `docs/build/refactor/target-structure/plan/task-05-diagnose-run-preparation.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 5 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index.
- `docs/build/refactor/target-structure/reports/task-05-diagnose-run-preparation.md`: added this report.

No code, test, script or convention file changed.

## Commands run

All commands ran in Git Bash on Windows from the repository root, except the STE lint, which ran with `uv run python -I`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| Before Step 1 | `git status --short` | 0 | Empty output. The plan revision was already committed (`ac03753`). |
| Before Step 1 | `wc -l` on the 21 `Read first` code files | 0 | Every count equals the count in the task file. |
| 1 | `git ls-files ... \| grep -v ... \| xargs grep -lwE ... \| wc -l` | 0 | `18` |
| 1 | The same pipeline with `xargs grep -nwE` | 0 | 87 lines in the form `<path>:<line>:<text>`. |
| 3 (extra) | `grep -rn "presentation\|run\.generation\|onApprovalWait" apps/web/src/integrations/opencode` | 0 | Only `stream-tracker.ts:36` reads a `RequestRun` field of this group (`onApprovalWait`). |
| 3 (extra) | `grep -rniE "skill" apps/web/src packages --include=*.ts -l` | 1 | No output. No file mentions a skill. |
| 4 | `git status --short` | 0 | Only the four files of `Files`. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 178 file(s) checked, 0 error(s) in 0 file(s)` |
| 5 | `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | `0 violations` |

The 18 files of Step 1 are in this table.

| Kind of file | Files |
| --- | --- |
| Builds a part | `deck-prompts.ts`, `deck-tool-session.ts`, `deck-workflow.ts`, `generation-execution.ts`, `generation-prompts.ts`, `generation-tools.ts`, `generation-workflow.ts`, `confirmation-coordinator.ts`, `source-tools.ts`, `config.ts`, `history.ts`, `mcp-bridge.ts`, `runtime.ts`, `request-controller.ts`, `index.ts` |
| Declares a type only | `contracts.ts` and `tool-contracts.ts` in `lifecycle/`, and `transport/contracts.ts` |

Five files hold a row of the table below and are not in the Step 1 output: `prepare-runtime.ts`, `resources.ts`, `provider.ts`, `provider-settings.ts` and `generation-report.ts`. Step 2 found them by reading.

## Part table

Kinds and owners follow the [Part decision table](../plan/task-05-diagnose-run-preparation.md#part-decision-table). The first matching row decides the kind. Paths in the `Location` column are short. The folder in the `Owner` column gives the full path. `features/` means `apps/web/src/features/`. `integrations/` means `apps/web/src/integrations/`. `host-api/lifecycle` means `packages/host/api/src/lifecycle/`.

| ID | Location | Kind | Owner | Inputs | Consumer |
| --- | --- | --- | --- | --- | --- |
| RP1 | `deck-prompts.ts:141-167` `buildDeckWorkflowContext` | instructions | features/deck | command, initial Brief, previous Outline, image review, expected proposal | `buildDeckInstructions` (`deck-prompts.ts:239`) and the tool context hash (`deck-tool-session.ts:183-186`) |
| RP2 | `deck-prompts.ts:220-241` `buildDeckInstructions` | instructions | features/deck | the context of RP1 | `deck-workflow.ts:144` `prepared.start({ ...run, instructions })` |
| RP3 | `deck-prompts.ts:243-245` `buildRecoveryInstructions` | instructions | features/deck | the deck instructions, the recovery JSON (Outline and pending image needs) | `generation-execution.ts:47` |
| RP4 | `generation-prompts.ts:70-93` `buildGenerationContext` | instructions | features/deck | confirmed plan, source files, attachments, research sources, template catalogue | `buildGenerationInstructions` (`generation-workflow.ts:44`) and the tool manifest (`generation-tools.ts:332`) |
| RP5 | `generation-prompts.ts:95-125` `buildGenerationInstructions` | instructions | features/deck | plan, context of RP4, `portable` flag | `generation-workflow.ts:57` |
| RP6 | `config.ts:13-18` `systemPrompt` | instructions | integrations/opencode | none (a constant) | `config.ts:71`, when no tool bridge exists |
| RP7 | `config.ts:63-71` agent `prompt` | instructions | integrations/opencode | bridge present or absent, `systemPrompt`, `run.instructions` | OpenCode setting `agent.deckagent.prompt`, encoded at `runtime.ts:226` |
| RP8 | `history.ts:9-39` `seedPrompt` | prompt-input | integrations/opencode | earlier messages of the chat, `request.input` | `runtime.ts:179`, `181` and `187` |
| RP9 | `runtime.ts:249-251` stdin text | prompt-input | integrations/opencode | `run.tools.manifest`, the prompt | `runProcess` option `input` (`runtime.ts:245`) |
| RP10 | `source-tools.ts:65-93` `buildSourceManifest` | tools | features/sources | workspace root, source catalogue, research sources, attachments, research flag | `source-tools.ts:197` |
| RP11 | `source-tools.ts:95-142` `buildSourceSchemas` | tools | features/sources | "has research sources" flag, "research exists" flag | `source-tools.ts:198` |
| RP12 | `source-tools.ts:157-196` `prepareSourceTools` (context hash) | tools | features/sources | chat info, workspace, source access, attachments, source catalogue, research revision | the `PreparedTools` that `request-controller.ts:93` receives |
| RP13 | `source-tools.ts:199-394` `execute` and its helpers | tools | features/sources | tool name, arguments, `ToolContext`, source access, attachments, research | `toolCapability` (`request-controller.ts:365`) |
| RP14 | `index.ts:313-323` `prepareTools` closure | tools | composition-root | session ID, attachment IDs, `publicResearch`, session store, workspace registry, data root, home folder, prepared research (`index.ts:321`) | `RequestController` through `packages/host/api/src/index.ts:78` and `request-controller.ts:93` |
| RP15 | `request-controller.ts:340-395` `toolCapability` | tools | host-api/lifecycle | `PreparedTools`, the execution (IDs, signal, `approve`) | `RequestRun.tools` (`request-controller.ts:230`) |
| RP16 | `deck-prompts.ts:169-218` `schema` and `buildDeckToolSchemas` | tools | features/deck | action, read-only flag, restored flag, image review flag | `deck-tool-session.ts:168` |
| RP17 | `deck-prompts.ts:260-267` `isSourceToolAllowed` | tools | features/deck | tool name, initial Brief source flags, `publicResearch` | `deck-tool-session.ts:178` and `197` |
| RP18 | `deck-tool-session.ts:163-183` `buildTools` | tools | features/deck | `run.tools`, command, review, context, initial Brief, `publicResearch` | `DeckToolSession.tools` (`deck-tool-session.ts:92-94`), then `deck-workflow.ts:144` |
| RP19 | `deck-tool-session.ts:185-251` `callTool`, `dispatchStagingTool`, `executeImageTool` | tools | features/deck | tool name, arguments, options, staging state | `RequestTools.call` of RP18 |
| RP20 | `generation-prompts.ts:37-68` `operations`, `generationToolSchemas` | tools | features/deck | none (constants) | `generation-workflow.ts:49` |
| RP21 | `generation-workflow.ts:7`, `45-56` tool options | tools | features/deck | run, capability, context, schemas filtered by `portable`, files, attachments, research, Brief | `createGenerationTools` (`generation-tools.ts:317`) |
| RP22 | `generation-tools.ts:119-128` `sourceToolNames` | tools | features/deck | files, attachments, research, Brief source flags | `generation-tools.ts:319` |
| RP23 | `generation-tools.ts:317-371` `createGenerationTools` | tools | features/deck | the options of RP21, `run.tools` | `generation-workflow.ts:57` |
| RP24 | `generation-execution.ts:35-53` `executeRecoveryRun` | tools | features/deck | prepared request, run, base tools, instructions, recovery JSON | `prepared.start` (`generation-execution.ts:45`) |
| RP25 | `generation-execution.ts:19-24` `executeGenerationRun` | grant | features/deck | `decks.startGeneration` (session, intent, request IDs), `run.signal` | `prepared.start` with `generation` and `presentation` (`generation-execution.ts:20`) |
| RP26 | `request-controller.ts:92` | grant | host-api/lifecycle | `prepared.publicResearch`, `request.publicResearch` | `prepareTools` (`request-controller.ts:93`) and `store.admit` (`request-controller.ts:103`) |
| RP27 | `confirmation-coordinator.ts:92-96` | grant | features/deck | current Brief `sources.publicResearch` | `runtime.prepare` (`confirmation-coordinator.ts:97`) and `submit` (`confirmation-coordinator.ts:104`) |
| RP28 | `deck-workflow.ts:41-45` | grant | features/deck | current Brief `sources.publicResearch` | `generationRuntime.prepare` (`deck-workflow.ts:42`) and `PreparedRequest.publicResearch` (`deck-workflow.ts:44`) |
| RP29 | `deck-workflow.ts:81-91`, `134` | grant | features/deck | `command.sourceChoice`, `request.publicResearch`, base Brief sources | the initial Brief (`deck-workflow.ts:86`) and `createDeckToolSession` (`deck-workflow.ts:134`) |
| RP30 | `prepare-runtime.ts:38-71` `prepare` | settings | features/requests | chat info, saved providers, `runSettings` | the `PreparedRequest` returned to `request-controller.ts:91`, and `runtime.execute` (`prepare-runtime.ts:71`) |
| RP31 | `provider-settings.ts:237-249` `runSettings` | settings | features/providers | saved provider, selection, key store | `prepare-runtime.ts:62` |
| RP32 | `request-controller.ts:98-106` `store.admit` | settings | host-api/lifecycle | `prepared.selection`, `publicResearch`, attachment IDs, draft revision | the request store |
| RP33 | `deck-workflow.ts:33`, `43-46`, `99-102` | pass-through | features/deck | `prepared.selection` | the `PreparedRequest` returned to `request-controller.ts:91`. `start` wraps the inner `start`. |
| RP34 | `generation-workflow.ts:16-22` `prepare` | pass-through | features/deck | `prepared.selection` | the `PreparedRequest` returned to `deck-workflow.ts:42` |
| RP35 | `confirmation-coordinator.ts:114-117` | pass-through | features/deck | `prepared.selection` | `submit` option `prepared` (`request-controller.ts:91`) |
| RP36 | `runtime.ts:216-220` | pass-through | integrations/opencode | `run.instructions` | `runtimeConfiguration` (`config.ts:42`) |
| RP37 | `request-controller.ts:226-230` run object | pass-through | host-api/lifecycle | request ID, session ID, abort signal | `start(...)` of the prepared request. The `tools` field comes from RP15. |
| RP38 | `config.ts:39-91` `runtimeConfiguration` | runtime-config | integrations/opencode | provider settings, bridge URL and tool names, `instructions` | `encodeConfiguration` (`runtime.ts:226`) |
| RP39 | `provider.ts:34-66` `providerConfiguration` | runtime-config | integrations/opencode | `ProviderRunSettings` | `config.ts:59` |
| RP40 | `config.ts:97-104` `encodeConfiguration` | runtime-config | integrations/opencode | configuration object | `isolatedEnvironment` (`runtime.ts:226`) |
| RP41 | `config.ts:107-143` `isolatedEnvironment` | runtime-config | integrations/opencode | run folders, encoded configuration, key, bridge token | `runProcess` option `env` (`runtime.ts:247`) |
| RP42 | `runtime.ts:140-153` `folders` | runtime-config | integrations/opencode | chat ID, runtime root | `runtime.ts:158` |
| RP43 | `mcp-bridge.ts:124-177` `openToolBridge` | runtime-config | integrations/opencode | `run.tools`, `run.signal` | `runtime.ts:214` |
| RP44 | `mcp-bridge.ts:57-82` `createToolServer` | runtime-config | integrations/opencode | `RequestTools`, "request is active" function | `mcp-bridge.ts:149` |
| RP45 | `runtime.ts:232-244` command-line arguments | runtime-config | integrations/opencode | the native session ID to resume, `selector` | `runProcess` (`runtime.ts:245`) |
| RP46 | `runtime.ts:41-78` `findExecutable` | install | integrations/opencode | configured path, `PATH`, resource folder | `index.ts:243` |
| RP47 | `resources.ts:16-45` `resourceExecutable` | install | integrations/opencode | resource folder, `manifest.json`, hash of the binary | `runtime.ts:47` |
| RP48 | `runtime.ts:98-138` `initialize`, `availability`, `ensureAvailable`, `checkVersion` | install | integrations/opencode | executable, pinned version | `index.ts:259`, `index.ts:285` and `prepare-runtime.ts:64` |
| RP49 | `runtime.ts:159-161` and `config.ts:10` | unclassified | integrations/opencode | hash of `run.instructions`, `run.tools.context`, `toolBoundary`, work folder | the resume guard (`runtime.ts:174`) and the saved binding (`runtime.ts:199`) |
| RP50 | `generation-report.ts:5-58` `generationReport`, wired at `index.ts:310` | unclassified | features/deck | deck store, session ID, request ID, terminal status | `closingText` of `RequestController` (`request-controller.ts:284-285`) |
| RP51 | `deck-tool-session.ts:100-161` `createDeckImageReview` | unclassified | features/deck | deck store, image research, command, initial Brief, previous Outline, restored Outline, run | `deck-workflow.ts:115` |

## Count of rows

| Kind | Rows |
| --- | --- |
| instructions | 7 |
| prompt-input | 2 |
| tools | 15 |
| grant | 5 |
| settings | 3 |
| pass-through | 5 |
| runtime-config | 8 |
| install | 3 |
| unclassified | 3 |
| Total | 51 |

| Owner | Rows |
| --- | --- |
| features/deck | 23 |
| features/sources | 4 |
| features/requests | 1 |
| features/providers | 1 |
| integrations/opencode | 17 |
| host-api/lifecycle | 4 |
| composition-root | 1 |
| Total | 51 |

The kind `install` has 3 rows. These rows are not run contributions.

## Facts of Step 3

### Fact 1: Order of preparation

The route is `POST /api/requests`. The route for the confirmation of a deck is `POST /api/sessions/<id>/deck/confirm`. Both end at `RequestController.submit`.

Request path:

1. `request-routes.ts:64-67` (`routeRequests`) reads the `AgentRequest` and calls `controller.submit`.
2. `request-controller.ts:71` (`submit`) rejects the request when the chat has an active request (80-90).
3. `request-controller.ts:91` calls `runtime.prepare(request)`. In the app, this runtime is `DeckWorkflow` (`index.ts:312`). `deck-workflow.ts:31` (`prepare`) chooses one of three paths:
   - An ordinary chat (`deck-workflow.ts:33`) calls `createRequestRuntime.prepare` (`prepare-runtime.ts:38`). This function reads the chat, freezes the settings (62) and tests the runtime (64). It returns a `PreparedRequest` whose `start` is `runtime.execute` (71).
   - A deck command (`deck-workflow.ts:34`, `60`, `93`) calls the same `prepare-runtime.ts:38` and wraps `start` (101).
   - A continuation (`deck-workflow.ts:32`, `37`, `42`) calls `GenerationWorkflow.prepare` (`generation-workflow.ts:16`), which calls `prepare-runtime.ts:38`.
4. `request-controller.ts:93` calls `prepareTools`. In the app this is the closure at `index.ts:313`, which calls `prepareSourceTools` (`source-tools.ts:157`).
5. `request-controller.ts:98` admits the request to the store. `request-controller.ts:130` calls `run`, and `request-controller.ts:226` calls `start(...)`, with `tools` from `toolCapability` (230).
6. `PreparedRequest.start(run)` runs:
   - Ordinary chat: `prepare-runtime.ts:71` calls `OpenCodeRuntime.execute` (`runtime.ts:155`), then `attempt` (`runtime.ts:205`).
   - Deck command: `deck-workflow.ts:101` calls `start` (105). It builds the context (126), the instructions (127) and the tool session (128). It then calls `prepared.start({ ...run, instructions, tools })` (144). A recovery pass can call `prepared.start` again (`generation-execution.ts:45`).
   - Continuation: `deck-workflow.ts:46` calls `executeGenerationRun` (`generation-execution.ts:10`). It calls `prepared.start({ ...run, generation, presentation })` (20). `GenerationWorkflow.startRun` (`generation-workflow.ts:24`) builds the instructions (44) and the tools (45) and calls `prepared.start({ ...run, tools, instructions })` (57).

Confirmation path:

1. `session-routes.ts:94-100` (`routeSession`) calls `options.confirmations.confirm`.
2. `confirmation-coordinator.ts:25` (`confirm`) calls `admitConfirmedGeneration` (77).
3. `confirmation-coordinator.ts:97` calls `runtime.prepare`. In the app this runtime is `GenerationWorkflow` (`index.ts:304`).
4. `confirmation-coordinator.ts:104` calls `submit`, which is `controller.submit(request, admission)` (`session-routes.ts:100`). The `prepared` object has its own `start` (116), which calls `executeGenerationRun`. `request-controller.ts:91` uses this `prepared` object and does not call `prepare` again.

### Fact 2: Where `index.ts` connects the parts

| Place | What it connects |
| --- | --- |
| `index.ts:242-259` | Creates `OpenCodeRuntime` and calls `initialize`. |
| `index.ts:260` | `createRequestRuntime({ sessions, providers, runtime: openCode })`. This is the base request runtime. |
| `index.ts:279` | `new GenerationWorkflow(runtime, sessions)`. This is the generation runtime. |
| `index.ts:304` | `new ConfirmationCoordinator(decks, sessions, briefs, runtime.generationRuntime)`. |
| `index.ts:310` | `closingText` is `generationReport` (RP50). |
| `index.ts:312` | `new DeckWorkflow(runtime.runtime, decks, sessions, briefs, runtime.generationRuntime, runtime.images)`. This is the runtime that `RequestController` uses. |
| `index.ts:313-323` | `prepareTools` calls `prepareSourceTools` (RP14). The research part comes from `runtime.research.prepare(publicResearch === true)` (321). |
| `packages/host/api/src/index.ts:75-80` | Gives `store`, `runtime`, `prepareTools` and `closingText` to `new RequestController`. |

The deck workflow and the source tools do not know each other. `RequestController` runs `prepareTools` (RP14) first. The deck workflow later takes the result from `run.tools` and wraps it (RP18).

### Fact 3: Condition of each feature folder

| Folder | Part | Condition |
| --- | --- | --- |
| `features/sources/` | Source tools (RP10 to RP13) | `options.requests.prepareTools` exists (`request-controller.ts:93` uses `?.`). The app always sets it (`index.ts:313`). The tools are in every request of the app. |
| `features/sources/` | `research_public` | The request has `publicResearch === true` and `research.prepare` returns a value (`research-coordinator.ts:136-137` and `source-tools.ts:106`). |
| `features/sources/` | `read_research` | The chat has at least one saved research source (`source-tools.ts:97`). |
| `features/deck/` (collecting) | Deck instructions and staging tools (RP1, RP2, RP16 to RP19) | `request.deck` exists (`deck-workflow.ts:33-34`) and the Brief is not locked and the versions are current (`deck-workflow.ts:62-73`). |
| `features/deck/` (collecting) | `stage_brief`, `stage_outline` | The action is not `question` or `clarify`, and the Outline is not restored (`deck-prompts.ts:189-197`). `skip` removes `stage_brief`. |
| `features/deck/` (collecting) | Image tools | The image review exists (`hasImageReview`, `deck-prompts.ts:189`). |
| `features/deck/` (collecting) | Source tools of the deck session | `isSourceToolAllowed` (`deck-prompts.ts:260-267`) allows the tool for the initial Brief and `publicResearch`. |
| `features/deck/` (collecting) | The start of the model | A `skip` that is not ready for the Outline, and a `restore`, complete without a model call (`deck-workflow.ts:142-143`). |
| `features/deck/` (recovery) | Recovery instructions and tools (RP3, RP24) | The outcome is `completed`, the proposal changed, required images are pending and recoverable (`deck-tool-session.ts:322-345`). |
| `features/deck/` (generation) | Generation instructions and tools (RP4, RP5, RP20 to RP23) | `run.presentation` and `run.generation` exist (`generation-workflow.ts:26`). Only `executeGenerationRun` sets them (`generation-execution.ts:20-24`). |
| `features/deck/` (generation) | Selection of schemas | `portable` is true when the template version is 2 or more (`generation-workflow.ts:31`). When `portable` is false, the code removes three portable tools (49). `find_slide_image` stays only when `portable` is false and `images.mode` is `public-research` (`generation-tools.ts:335`). |
| `features/deck/` (generation) | Source tools of the generation | `sourceToolNames` (`generation-tools.ts:119-128`) lists a source tool only when the Brief has the matching sources. |
| `features/deck/` (confirmation) | `GenerationGrant` and capability | The user confirmed the Outline. The Brief is current, no source is unavailable, no request is active, and the model did not change (`confirmation-coordinator.ts:84-102`). |
| `integrations/opencode/` | MCP bridge and tool grants | `run.tools` exists (`runtime.ts:214`). Without it, the agent has no `mcp` block and uses `systemPrompt` (`config.ts:64-71`). |
| `integrations/opencode/` | Step limit | `steps: 8` applies unless the tool list has `publish_slide` (`config.ts:73`). |

### Fact 4: What the OpenCode adapter converts

| Part | Converted to | Function and line |
| --- | --- | --- |
| `RequestRun.instructions` | The agent prompt of the OpenCode configuration | `runtimeConfiguration` (`config.ts:63-71`), called at `runtime.ts:216-220`. |
| `RequestRun.instructions` | A hash that is part of the resume context | `runtime.ts:159-161`. |
| `RequestRun.tools.schemas` | The list of MCP tools | `createToolServer`, handler for `ListToolsRequestSchema` (`mcp-bridge.ts:60-68`). |
| `RequestRun.tools.call` | The MCP tool call handler | `createToolServer`, handler for `CallToolRequestSchema` (`mcp-bridge.ts:69-80`). |
| Names of the tools | The permission entries `deckagent_<name>: allow` | `runtimeConfiguration` (`config.ts:44-46`), with the names from `runtime.ts:218`. |
| `RequestRun.tools.manifest` | A text prefix of the standard input | `runtime.ts:249-251`. |
| `RequestRun.tools.context` | Part of the resume context | `runtime.ts:161`. |
| `ProviderRunSettings` | The provider block | `providerConfiguration` (`provider.ts:34-66`), called at `config.ts:59`. |
| The provider key | An environment variable placeholder | `encodeConfiguration` (`config.ts:97-104`) and `isolatedEnvironment` (`config.ts:140`). |
| The tool bridge | The `mcp` block and the bridge token | `config.ts:76-89` and `config.ts:141`. |
| `RequestRun.onApprovalWait` | A timer pause while an approval waits | `createStreamTracker` (`stream-tracker.ts:36`). |

The adapter never reads `RequestRun.presentation` or `RequestRun.generation`. Only the code in `features/deck/` reads them.

The current code has no skill. The grep for `skill` in `apps/web/src` and `packages` prints no file.

## Code read and not counted

These code places do not build a part, so they have no row.

- `runtime.ts:266-293` `auditConfiguration` and `config.ts:149-176` `safeConfiguration` compare the resolved OpenCode configuration with the configuration that RP38 built. They write nothing.
- `contracts.ts`, `tool-contracts.ts` and `transport/contracts.ts` declare types only.
- `stream-tracker.ts` reads `onApprovalWait`. It builds no part.

## Unclassified items

| ID | What it is | Why no row of the table matches |
| --- | --- | --- |
| RP49 | A hash of the instructions, the tool context, `toolBoundary` and the work folder. The resume guard compares it with the saved value. | The hash is not sent to the model and is not a tool, grant, setting or OpenCode setting. It only decides whether the native session resumes. |
| RP50 | `generationReport` builds the closing text of a request. `RequestController` saves it as a `generation-summary` text event. | The text is a result for the user. The model does not read it. |
| RP51 | `createDeckImageReview` builds the staged Brief, the staged Outline and the image review that the deck tools use. | It builds state that tools read, not the tools. No row covers state shared between tools. |

## What the commands do not prove

The search finds parts by name only. A part that the code builds under another name is in the report only when Step 2 found it by reading. Step 2 found the parts of RP8, RP9, RP30 to RP32, RP39 to RP51 by reading. The search did not find them. Step 2 read the files in `Read first` in full for code that builds a part. It read only the needed ranges of `request-controller.ts`, `source-tools.ts`, `deck-prompts.ts`, `generation-prompts.ts`, `generation-tools.ts` and `deck-tool-session.ts`. A part in the unread ranges of these six files can be missing from the table.

The report does not cover a live run. No test ran. The report does not show that the order of preparation is the same in the tests. The conditions of Fact 3 come from reading the code, not from running it.
