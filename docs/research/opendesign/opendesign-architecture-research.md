# OpenDesign Architecture Research (DOC-007)

- Status: Draft — ready for review
- Produced by: W-031 · Used by: W-033
- Contract: [DOC-005 Reference-System Research Contract](../reference-system-research-contract.md)
- Criteria: [DOC-004 Architecture Acceptance Criteria](../../architecture/architecture-acceptance-criteria.md)

## 1. Header

- System: OpenDesign
- Researcher: OpenAI Codex
- Research dates: 2026-09-25
- Official repository confirmation: The official `nexu-io` organization links to `https://github.com/nexu-io/open-design`, and the installation instructions use this repository. Research started only after `git ls-remote` confirmed the release tag and commit.

Versions used (DOC-005 §5.2):

- Repository: `https://github.com/nexu-io/open-design` @ tag `open-design-v0.24.0`, commit `0d3a14c1df6dc5017f3cc3ef05b24558250c220b` (commit date 2026-09-21).
- Version caveat: The pinned tag is `open-design-v0.24.0`, but the root and daemon `package.json` files at that commit report version `0.23.1`. Therefore, the findings refer to both the tag **and the commit**, not only the package metadata.
- Docs: repository `README.md`, `docs/architecture.md`, and linked code-backed documentation at the pinned commit; GitHub pages accessed 2026-09-25.
- Release material: official GitHub release/tag `open-design-v0.24.0`, accessed 2026-09-25.
- Paper or other official material: No OpenDesign research paper was found in the official repository, README, architecture documentation, or release material.
- Historical version used, and why: None. Historical changelog entries are cited only as evidence of change for RQ-17. They are not the implementation baseline.

Sources consulted, in priority order (DOC-005 §5.1):

1. Pinned official source tree, especially `apps/daemon`, `apps/web`, `apps/desktop`, `packages/contracts`, and deck/export code.
2. Pinned official architecture and product documentation: `docs/architecture.md`, `README.md`, and `CHANGELOG.md`.
3. Pinned official skills/templates where they define deck-generation or fidelity mechanisms, especially `skills/pptx-html-fidelity-audit/` and `design-templates/html-ppt-*/`.
4. No secondary sources were used.

### 1.1 Terminology — what “OD Next” means

**OD Next is a built-in OpenDesign strategy for running design tasks. It is not a separate product or release.** At the pinned commit, its manifest calls it `OD Next Strategy V2` (`od-next-strategy`, prompt recipe `od-next-plan-build-v2`). It has its own core prompt, orchestration rules, task profiles, and `discovery → plan → generate` flow — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:plugins/_official/scenarios/od-next-strategy/open-design.json#L4-L18`, `#L27-L46`, `#L104-L120`.

For supported agents, this strategy is the default path for prototypes, slide decks (`ppt`/`deck`), marketing images, and Hyperframes video. The manifest explicitly connects OD Next to these task profiles — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:plugins/_official/scenarios/od-next-strategy/open-design.json#L46-L85`. The official v0.22.1 changelog describes the default rollout and the Design Harness setting that disables it — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/CHANGELOG/v0.22.1/en.md#L3-L11`.

OD Next has a prompt and execution path separate from the legacy stack. It uses named task stages (`request`, `clarification`, `contract_repair`, `production`), chooses `direct_edit` or `full_plan`, and returns a small set of runtime outcomes — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/plugins/strategy-v2.ts#L25-L55`. OD Next runs use their own prompt-composition path — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/prompts/system.ts#L943-L954`. A finding about OD Next therefore applies only to this strategy, not automatically to legacy runs, every agent adapter, or UI markers named `<od-next>`.

## 2. Findings

### 2.1 Input & source

Research questions: RQ-01, RQ-02

### F-OD-01 — OD Next presents attachments as task data, but the model can still access them

- Research questions: RQ-01
- Problem addressed: Supplying user files to different agent runtimes while telling the model not to treat file content as host instructions.
- Responsibility / boundary: The daemon and shared prompt contracts control attachment transport and prompt composition. The selected agent and model receive the prompt and attachment references. The project workspace stores uploaded or materialized files.
- Decision / mechanism: OD Next stores attachment bytes outside the prompt. The prompt contains stable identity metadata instead of file bodies or absolute paths. It also tells the model to treat attachments, existing artifacts, retrieved pages, plugin content, and tool output as task data, not as rules that replace the system boundary. This is a prompt rule, not a technical guarantee that a model will always follow it.
- Source says: The request-input contract uses `OD_TASK_INPUT_DIR` to transport files outside the prompt. It records each file's kind, reference, media type, size, and digest, but its serializer leaves out file bodies and absolute paths — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/prompts/od-next-task-inputs.ts#L36-L65`, `#L93-L108`. The daemon copies attachment bytes into read-only snapshot files, verifies their digests, and makes their managed references available through `OD_TASK_INPUT_DIR` — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/strategies/od-next/task-input-snapshot.ts#L610-L707`, `#L709-L724`. SQLite stores message content and run context — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/db.ts#L237-L260`. The OD Next prompt identifies attachments and retrieved material as task data — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/prompts/od-next-strategy.ts#L440-L446`.
- User-instruction trace — Source says: `POST /api/runs` receives the request body. It uses `currentPrompt` when available; otherwise, it uses the flattened `message`. It then inserts or updates that text as the SQLite user-message row — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/routes/runs.ts#L939-L946`, `#L2588-L2643`. Next, `startChatRun` reads `message`, `currentPrompt`, transcript/context, and the selected model/runtime — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/server.ts#L10860-L10885`. It resolves the current request, combines it with system, tool, and context blocks, and adds it to the final payload — `#L12019-L12045`, `#L12236-L12276`. Saved user and project instructions enter the stable system-prompt inputs through a separate path — `#L10551-L10617`. Finally, the complete prompt reaches the runtime through adapter arguments, a prompt file, stdin, or an RPC/session payload — `#L13469-L13476`, `#L13624-L13652`, `#L14394-L14409`, `#L15569-L15622`, `#L17174-L17195`.
- Exposure search result — Source says:
  - **Logs and telemetry:** A search of daemon `console.*` and logger calls, runtime launch code, and telemetry code found no normal daemon log that intentionally prints the raw user prompt. However, this is not a guarantee for every path. An Antigravity run writes an agent-owned log in the OS temp directory, reads the end of that log to classify failures, and makes a best-effort attempt to delete it when the run closes — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/server.ts#L13462-L13473`, `#L16327-L16355`, `#L17146-L17158`. Also, when telemetry metrics and content consent are both enabled, OpenDesign may send a limited or redacted prompt, prompt-stack content, outputs, and tool inputs/outputs to a configured OpenDesign relay or Langfuse sink — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/langfuse-trace.ts#L458-L482`, `#L1890-L1929`, `#L1997-L2001`, `#L2356-L2357`.
  - **Temporary files:** File-prompt adapters write the complete prompt to `prompt.md` in a new OS temp directory with mode `0600`. Cleanup recursively removes the directory, but several caller paths only make a best-effort attempt — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/runtimes/prompt-file.ts#L11-L28`, `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/server.ts#L13469-L13476`, `#L17146-L17158`. Managed attachment snapshots create another on-disk copy, separate from the temporary prompt files.
  - **Caches:** The inspected daemon and runtime paths had no separate local cache for the raw instructions from each user turn. OD Next puts the reusable system/skill prefix first and `userFirstPrompt` last, outside the stable cache prefix. This layout explicitly targets an upstream provider's prompt cache — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/prompts/od-next-prompt-bundle-v2.ts#L15-L28`, `#L48-L84`. This repository does not establish how the provider retains or evicts that cache.
  - **Tools:** The daemon gives each run a scoped token for limited internal tool endpoints. It can also add user-configured external MCP servers and OAuth data so the model can call them — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/server.ts#L11204-L11237`, `#L13131-L13174`. Tool arguments may therefore include user content and may leave the process through an external MCP server or tool selected for the run. The inspected launch and configuration paths had no repository-wide allowlist controlling content sent to arbitrary external tools or MCP servers configured per CLI.
  - **Runtime/model provider:** OpenDesign intentionally sends the complete instruction payload to the selected runtime. The runtime may stay local or send the payload to its configured upstream or BYOK provider. OpenDesign's provider-proxy routes also forward system prompts and messages to the selected provider endpoint — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/routes/chat.ts#L986-L1032`, `#L1032-L1085`, `#L1348-L1431`.
- Inference: OD Next separates file bytes from prompt metadata and tells the model how to treat those files. It does not keep all content local. User instructions pass through the API, SQLite state, prompt composition, runtime transport, and the selected model or provider. Depending on the run, user content may also appear in project files, managed snapshots, temporary prompt or log files, consented telemetry, and tool or MCP calls. The inspected code has protections for individual paths, but it does not establish one end-to-end guarantee for every runtime, provider, legacy path, and user-configured MCP server.
- Rationale: Keeping file bytes outside the prompt reduces prompt size and avoids putting absolute paths in the serialized input. This rationale is inferred from the data shape.
- Trade-off: The design provides attachment identity that works across runtimes, flexible runtime and tool integration, and a clear trust rule. However, content exposure and retention still vary by adapter, telemetry consent, external tool, and upstream provider.
- Related AC: AC-02, because source material is explicitly labelled task data; AC-11, because the trace shows where content is stored or sent through runtimes, providers, temporary storage, telemetry, and tools.
- DeckAgent implication: W-033 can use this as evidence that input identity metadata can be separated from file-content transport. Temporary copies, telemetry consent, data sent through tools, provider retention, and consistency across legacy paths remain separate open questions for DeckAgent.
- Mismatch / caution: OpenDesign supports many CLIs, remote providers, plugins, linked directories, and durable projects. DeckAgent V1 is local and session-only under D-027; these wider flows are not a scope precedent.
- Confidence: Strong inference — the transport and storage paths are visible in code, but the end-to-end security limit is an inference bounded to the inspected paths.

### F-OD-02 — The attachment contract separates media type from task role

- Research questions: RQ-02
- Problem addressed: Accepting different file types without treating a file extension as the complete meaning of an input.
- Responsibility / boundary: Shared contracts describe attachment transport metadata. Project metadata and plugin or template selection determine the task and output mode. The agent decides how to use each attachment.
- Decision / mechanism: An attachment has a broad `kind` (`file` or `image`) and a media type. A separate configuration stores the task type, route, mode, and output constraints. The inspected request contract has no semantic role—such as `content`, `reference`, `template`, or `asset`—for each attachment.
- Source says: Attachment facts and task configuration are separate objects — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/prompts/od-next-task-inputs.ts#L16-L65`. Functional skills, renderable templates, design systems, plugins, and craft are distinct registries — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L126-L146`.
- Inference: A file's extension or media type does not determine its task role. For an ordinary attachment, the role comes from the request text and the agent's interpretation, not from saved role metadata. Adding machine-readable roles would at least require a contract change and might also require UI and prompt changes.
- Rationale: This separation keeps the request model small and lets the same media type serve different workflows. This rationale is inferred.
- Trade-off: The mechanism is flexible, but downstream code cannot reliably query whether a PDF was content, style reference, or template.
- Related AC: AC-13, because media classification is not identical to task configuration and the evidence shows the likely cost of explicit roles.
- DeckAgent implication: W-033 can distinguish OpenDesign's prompt-based interpretation from a machine-readable role mechanism without choosing either one.
- Mismatch / caution: DeckAgent first V1 needs only content-source role under D-024; OpenDesign's broader catalogs exceed that boundary.
- Confidence: Strong inference — the current contract is explicit; the likely change impact is inferred.

### 2.2 Intent

Research questions: RQ-03

### F-OD-03 — Coarse intent is retained explicitly; detailed constraints remain distributed

- Research questions: RQ-03
- Problem addressed: Preserving user intent across multiple creation and refinement turns, agents, and resumable sessions.
- Responsibility / boundary: SQLite stores conversations, messages, session identity, and a small set of conversation-level intent signals. Prompt composition combines those signals with project and user instructions, the transcript, design system, skill or template, memory, and current metadata.
- Decision / mechanism: OpenDesign latches coarse signals for deck, media, platform, and device platform so they remain active for the conversation even when visible transcript context is trimmed. More detailed constraints, such as audience, deck length, and language, remain in the transcript or other prompt inputs rather than one dedicated constraint record. Agent sessions record the stable prompt and runtime identity.
- Source says: The conversation record has `intent_signals_json` — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/db.ts#L194-L203`. The stored signals are deck, media, platform, and device platform; latching keeps detected values active at conversation scope — `#L2501-L2517`, `#L2530-L2599`. Initial prompt composition feeds these signals into the prompt bundle — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/strategies/od-next/initial-prompt-bundle-service.ts#L306-L347`. `composeSystemPrompt` also accepts skill, design system, craft, memory, metadata, user instructions, and project instructions — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/prompts/system.ts#L285-L350`.
- Inference: Coarse task intent can survive transcript trimming and agent changes within a conversation. Detailed deck constraints can still reach follow-up requests through the transcript and stable project context, but their lifetime depends on which transcript, session, project instructions, or memory is included later.
- Rationale: Latching prevents a known task category or platform choice from disappearing when context is shortened. Distributed prompt context supports constraints that do not fit the small signal schema.
- Trade-off: Important coarse intent is durable and easy to inspect. Detailed constraints remain flexible, but their lifetime and conflict resolution are harder to inspect and test.
- Related AC: AC-04, because it concerns where active goals remain available to later refinements.
- DeckAgent implication: W-033 can use this evidence about how hard transcript-carried constraints are to inspect, without choosing a storage mechanism.
- Mismatch / caution: OpenDesign persists across sessions and can use memory; DeckAgent V1's session-only boundary (D-027) differs.
- Confidence: Strong inference — the coarse signal lifecycle is explicit; the limit for detailed constraints is bounded to the inspected schema and prompt inputs.

### 2.3 Generation & provenance

Research questions: RQ-04, RQ-05

### F-OD-04 — The daemon coordinates generation, and both runtime profiles end in project files

- Research questions: RQ-04
- Problem addressed: Running interchangeable coding-agent runtimes while keeping one project, preview, and export surface.
- Responsibility / boundary: The web app owns interaction and preview presentation. The daemon owns persistence, prompts, runtime selection, runs, files, and exports. Adapters handle runtime-specific launching and normalize events. Project files hold the deliverable.
- Decision / mechanism: For each request, OpenDesign resolves the project, design system, main skill or template, turn-specific skills, runtime, and execution metadata. Filesystem runtimes write the main project files directly. Plain and BYOK runtimes return one complete artifact, which the host writes into the same workspace.
- Source says: Component responsibilities and runtime registry are documented at `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L79-L124`; both execution profiles are specified at `#L175-L199`. Web and CLI use the same daemon APIs rather than duplicate business logic — `#L55-L77`.
- Inference: The common boundary is a project-file deliverable plus normalized events, not a presentation-specific intermediate model. Runtime definitions localize many runtime differences, but provider capabilities can still affect orchestration. A change to the shared HTML or deck conventions could affect prompts, templates, preview, validation, or export; the exact impact would depend on the change.
- Rationale: Central daemon authority enables multiple interfaces and agents.
- Trade-off: The design supports multiple runtimes and works naturally with real files. However, agents can directly change those files, and HTML conventions become contracts shared by several components.
- Related AC: AC-01, because this is an end-to-end first-deck path; AC-23, because the seams show where failures spread.
- DeckAgent implication: W-033 can use this evidence for blast-radius analysis of runtime adapters versus artifact contracts. It is not a DeckAgent proposal.
- Mismatch / caution: Plugins, memory, collaboration, and multi-artifact support are outside D-024–D-027.
- Confidence: Strong inference — component ownership and execution profiles are explicit, while the change-impact statements are inferred.

### F-OD-05 — Provenance is tracked by file version, not by content fragment

- Research questions: RQ-05
- Problem addressed: Linking generated HTML to its prompt and surrounding conversation or run context while preserving manual-edit and restore history.
- Responsibility / boundary: The HTML version store keeps saved snapshots and basic metadata about their source. When a run finishes successfully, finalization detects changed paths and creates AI versions.
- Decision / mechanism: Each HTML version records its `source` (`ai`, `manual`, or `restore`), prompt or source text, digest, parent or restore history, and optional external-plugin origin. Successful-run finalization also makes a best-effort attempt to backfill the created HTML version IDs into the assistant message's artifact references. A `runId` appears directly in the version only through optional origin metadata. No field records whether an individual claim or text span came from an uploaded source, the user, or AI.
- Source says: The version schema includes source, prompt, parent history, digest, and origin — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/project-file-versions.ts#L15-L59`. Version creation saves a new content file, attaches or inherits origin metadata, and advances the current ID — `#L491-L560`. Successful runs snapshot touched HTML with the latest prompt — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/run-html-version-snapshots.ts#L82-L132` — and backfill version IDs into assistant-message artifact references — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/server.ts#L11726-L11739`. The optional external-plugin origin can carry a direct `runId` — `#L11740-L11758`.
- Inference: OpenDesign can identify the saved version, usually retain its prompt, and normally connect it to an assistant message through the best-effort backfill. Some external-plugin versions also have a direct run link. This is useful artifact-level provenance, but it does not record which source supplied each sentence or claim. `source: ai` describes the kind of file change, not the semantic origin of the content.
- Rationale: File history fits a workspace built around code files. It also supports restore and pinned exports with little metadata. This rationale is inferred.
- Trade-off: It gains useful file, prompt, and conversation lineage but cannot directly test fact-level source attribution.
- Related AC: AC-03 and AC-16, because distinguishing the source of meaning needs finer-grained records that tests can inspect.
- DeckAgent implication: W-033 can treat file-version history and sentence-level source tracking as separate mechanisms.
- Mismatch / caution: Optional `ArtifactOrigin` is tied to an external MCP/plugin workflow and does not cover every local run; DeckAgent P1 concerns the source of the content itself.
- Confidence: Strong inference — version metadata is explicit, and the limit on sentence-level provenance follows from the inspected schema.

### 2.4 State & ownership

Research questions: RQ-06, RQ-07

### F-OD-06 — Project files hold the working deliverable; SQLite holds the related metadata

- Research questions: RQ-06
- Problem addressed: Giving chat, preview, versioning, and export access to one mutable artifact without making browser state the source of truth.
- Responsibility / boundary: The project directory stores artifact bytes. SQLite stores projects, conversations, messages, tabs, and run metadata. The daemon controls file access. The web app stores only UI state and preferences.
- Decision / mechanism: Filesystem agents mutate files in the project workspace. Preview renders a selected project file in a sandboxed iframe. Export reads either the current file or an explicitly requested HTML version.
- Source says: The database module calls the project folder the single owner of actual user files and SQLite the metadata store — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/db.ts#L1-L5`. Web has no alternate browser project database, while daemon owns file preview/version/import/export — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L81-L110`. Export resolves `fileName` plus optional `versionId` — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/import-export-routes.ts#L951-L989`.
- Inference: When a deck is one HTML file, preview and export can read the same source bytes. The working state is not one all-or-nothing deck object. It is a set of editable files plus metadata, so consistency across several files depends on how those files are updated.
- Rationale: Real files make agent tooling, handoff, and direct code reuse natural; the README says agents write canonical files that OpenDesign previews — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:README.md#L324-L330`.
- Trade-off: The system is transparent and works with normal file tools, but the inspected flow does not update several files as one all-or-nothing deck change. It also does not show a separate slide-and-text model for this HTML deck path.
- Related AC: AC-05, because preview/export source identity matters; AC-15, because slide order/text must be extracted from HTML and outputs.
- DeckAgent implication: W-033 can distinguish “same source file” from “one accepted, all-or-nothing deck state.”
- Mismatch / caution: OpenDesign uses durable files/imported folders. DeckAgent is session-only (D-027) and requires editable PPTX plus PDF (D-026).
- Confidence: Strong inference — file ownership and export inputs are explicit; the consistency limit is inferred from the file-based model.

### F-OD-07 — HTML versions support restore, but rollback applies to one file after it has changed

- Research questions: RQ-07
- Problem addressed: Recovering from unwanted HTML edits.
- Responsibility / boundary: The daemon's per-file version store keeps saved HTML history. File routes let callers list, read, and restore versions. A restore overwrites the working file and adds a new restore version.
- Decision / mechanism: Near the end of a successful run, OpenDesign creates versions of the HTML files changed by AI. Restoring a version copies its bytes into the live file and records the source version in `restoreFromVersionId`.
- Source says: Version history is restricted to HTML — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/routes/project/index.ts#L7236-L7264`. Restore reads the chosen version, overwrites the working file, and records a new restore version — `#L7407-L7472`. AI snapshots are created from touched HTML after the run changed the filesystem — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/run-html-version-snapshots.ts#L82-L132`.
- Inference: If a suitable HTML version exists, a single-file deck can be restored. In the inspected flow, there is no one-step run-level restore for both HTML and its assets. The live file changes before the successful-run snapshot is created, and the flow does not show a separate candidate state waiting for user acceptance.
- Rationale: Append-only per-file restore preserves history while fitting filesystem ownership; inferred.
- Trade-off: This provides practical recovery for HTML. The inspected restore path does not reverse a multi-file refinement in one step or isolate changes before acceptance.
- Related AC: AC-06, because candidate/accepted separation is absent; AC-07, because restore approximates rejection only for a selected file/version; AC-17, because before/after HTML versions are observable when captured.
- DeckAgent implication: W-033 can distinguish history/restore from pre-acceptance isolation and run-level rollback.
- Mismatch / caution: DeckAgent requires only latest-refinement rejection (D-025), not general version management; OpenDesign's wider history is not scope.
- Confidence: Strong inference — restore behavior is explicit; the absence claim is limited to the inspected version and run-finalization paths.

### 2.5 Refinement

Research questions: RQ-08

### F-OD-08 — Refinement routes bounded edits through Direct Edit and broader changes through Full Plan

- Research questions: RQ-08
- Problem addressed: Refining an existing deck while keeping the conversation, files, and preview together.
- Responsibility / boundary: OD Next orchestration classifies the requested change and locks either Direct Edit or Full Plan. The agent performs the authorized file changes. Filesystem comparison records changed paths, and preview follows the updated files.
- Decision / mechanism: Direct Edit is allowed only when an editable baseline exists, the request is explicit and local, the deliverable remains stable, and affected dependencies can be bounded. It records a versioned minimal-change contract, including protected content, then instructs the agent to modify only the authorized scope. If that scope expands after Build starts, the agent must stop rather than widen the edit. Broader or uncertain changes use Full Plan. Both routes still produce file edits, and the filesystem diff records paths rather than slide-level semantic changes.
- Source says: The orchestration rules define Direct Edit eligibility, its minimal-change contract, protected content, and the stop-on-scope-escape rule — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:plugins/_official/scenarios/od-next-strategy/assets/general-orchestration.md#L132-L202`. The resolver sends a request to Direct Edit only when its baseline, scope, deliverable, and dependency checks pass; otherwise it returns Full Plan — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/strategies/od-next/resolver.ts#L201-L256`. Run tracking snapshots before and after the run and reports changed paths — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/run-artifact-fs.ts#L1-L14`, `#L382-L459`.
- Inference: OpenDesign deliberately steers clear, local refinements toward targeted edits. This explains why ordinary use often changes only what the user requested. The remaining limit is verification: the inspected diff proves which files changed, not that every non-target slide or element stayed semantically identical. The inspected sources also do not define a separate whole-deck translation pipeline.
- Rationale: Direct Edit avoids full replanning for bounded changes while Full Plan handles changes whose scope or dependencies cannot be safely limited. This rationale is stated in the orchestration rules.
- Trade-off: The two routes support both fast local changes and broader redesigns. Exact element preservation still relies on the change contract, agent behavior, and artifact structure because the host does not validate a slide-level semantic patch after writing.
- Related AC: AC-01, because repeated refinement uses the common run path; AC-04, because prompt context and the minimal-change contract carry constraints; AC-27, because no separate translation pipeline was found and the same refinement routes are relevant.
- DeckAgent implication: W-033 can assess route-level scope control separately from post-edit semantic verification. It is evidence that targeted refinement can be encouraged without requiring a slide-object editor.
- Mismatch / caution: The README's partially shipped “comment-mode surgical edits” concerns a more specific UI path and does not mean ordinary chat-based Direct Edit is absent — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:README.md#L596-L612`. DeckAgent D-025 does not require object-editing ambitions.
- Confidence: Strong inference — route eligibility and scope rules are explicit; the verification limit follows from the path-level diff, while translation behavior remains less certain.

### 2.6 Validation & quality

Research questions: RQ-09, RQ-10

### F-OD-09 — Completion validation verifies deliverable integrity, not deck correctness

- Research questions: RQ-09
- Problem addressed: Preventing a run from reporting success when its artifact is missing, unreadable, the wrong type, or unchanged.
- Responsibility / boundary: Daemon finalization validates run status, filesystem diff, project kind, entry selection, and readability. HTML lint supplies separate heuristic quality findings.
- Decision / mechanism: Run validation requires a successful status, at least one artifact, a main entry file, a compatible project type, evidence that the run changed the entry or a linked page, and a readable file. It does not check factual accuracy, slide completeness, geometry, or export output before the live file becomes current.
- Source says: The validator distinguishes “did this run produce it?” from “does the project have it?” — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/run-deliverable-validation.ts#L163-L230`. It checks status/count, entry, touched path, kind, and file readability — `#L233-L346`. The HTML linter is a cheap grep mechanism whose P0 findings are surfaced for correction — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/lint-artifact.ts#L1-L15`.
- Inference: OpenDesign has a clear deliverable-completion gate, and P0 lint findings can be returned to the agent for correction on a later turn. These checks improve delivery integrity and iterative quality, but they do not approve or reject a separate candidate deck: the inspected flow runs against files that are already the working state.
- Rationale: Runtime-neutral checks cheaply prevent stale-file success claims; supported by validator comments.
- Trade-off: The gate detects missing, stale, or unreadable output, and lint provides actionable feedback. Neither mechanism by itself keeps an earlier working artifact unchanged when a later result is low quality or inaccurate.
- Related AC: AC-10, because this identifies a validation point and available information; AC-06, because it lacks candidate/accepted separation.
- DeckAgent implication: W-033 can separate deliverable-integrity validation from content/layout acceptance validation.
- Mismatch / caution: OpenDesign is a continuously editable workspace; DeckAgent has explicit accepted-state/output-delivery concerns.
- Confidence: Strong inference — the validator's checks are explicit; the candidate-state limit is bounded to the inspected completion flow.

### F-OD-10 — Quality checks combine source linting, render telemetry, capture, and optional audits

- Research questions: RQ-10
- Problem addressed: Detecting design regressions and render failures across HTML decks and exports.
- Responsibility / boundary: Source linting inspects HTML text. Iframe reporting provides runtime errors, render failures, and deck geometry. Electron renders slides. An optional skill compares PPTX with HTML.
- Decision / mechanism: The system uses heuristic source checks, preview events for white screens or unscaled stages, off-screen capture of the whole deck, and an optional audit. The audit extracts PPTX shapes, text, geometry, and boundary information.
- Source says: Lint checks deck anchors, theme classes, and rhythm — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/lint-artifact.ts#L448-L509`. Preview reports runtime/resource errors, white screen, unscaled deck stage, viewport/canvas sizes, and stage geometry — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:packages/contracts/src/runtime/preview-observability.ts#L86-L127`. The audit extracts PPTX shape text/position/size/typography and verifies bounds — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:skills/pptx-html-fidelity-audit/SKILL.md#L57-L103`, `#L178-L209`.
- Inference: OpenDesign can render the whole deck and report some geometry and render-health data. The normal completion path does not show one automatic layout-and-readability audit that covers preview, PPTX, and PDF. The inspected fidelity workflow is a separate skill.
- Rationale: Fast checks cover common failures during iteration, while more expensive artifact inspection remains optional. This rationale is inferred from how the checks are connected.
- Trade-off: The normal path stays responsive, but quality evidence is spread across several mechanisms, and exports are not verified in a consistent way.
- Related AC: AC-14, because geometry/text metrics exist in some paths; AC-18, because desktop capture renders the whole deck; AC-25, because separate mechanisms raise integration cost.
- DeckAgent implication: W-033 can treat source lint, render-health telemetry, and artifact comparison as distinct checks with different costs.
- Mismatch / caution: The audit targets HTML-to-`python-pptx`; v0.24.0 defaults to screenshot PPTX and optionally `dom-to-pptx`, so coverage cannot be assumed.
- Confidence: Strong inference — the individual checks are explicit; the absence claim is limited to the inspected completion, export, and audit paths.

### 2.7 Rendering & export

Research questions: RQ-11, RQ-12, RQ-13

### F-OD-11 — Export reads saved HTML instead of generating the content again

- Research questions: RQ-11
- Problem addressed: Exporting PPTX or PDF without generating the content again, while allowing repeatable exports from historical versions.
- Responsibility / boundary: Preview renders project HTML in a sandboxed iframe. Export reads either the current file or a requested `versionId`, and the desktop app renders it. Binary assembly does not call a model.
- Decision / mechanism: Screenshot PPTX and raster PDF share Electron Chromium slide rendering; daemon assembles images. Browser-print PDF receives the same selected HTML. Editable PPTX starts from the requested HTML but uses DOM conversion.
- Source says: Preview uses sandboxed file-workspace iframes and URL/srcDoc modes — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L164-L173`. Export reads `fileName`/optional `versionId` and invokes desktop rendering — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/import-export-routes.ts#L951-L989`, `#L1103-L1126`. Screenshot routes replaced agent-prompt export with deterministic rendering — `#L1463-L1485`.
- Inference: The inspected export paths do not regenerate deck content with a model. A `versionId` identifies the exact HTML snapshot used for export. However, the sources inspected here do not show that preview itself is pinned to that same version. If the user reviews a live file and exports without a `versionId`, the file may change between review and export.
- Rationale: Browser rendering aims at fidelity and avoids model variability; route comments explicitly call it deterministic.
- Trade-off: A selected snapshot makes exports repeatable. However, the process depends on Electron and does not prove that preview, editable PPTX, and PDF preserve the same meaning.
- Related AC: AC-05, because source identity matters; AC-09, because export reads/renders rather than mutating source; AC-15, because raster outputs lose directly readable text even though slide order follows images.
- DeckAgent implication: W-033 can use this as evidence for export from stored source and for binding review/export to a state identity.
- Mismatch / caution: DeckAgent requires editable PPTX and PDF. OpenDesign's default screenshot PPTX is non-editable and raster PDF text is not selectable.
- Confidence: Strong inference — export inputs and the absence of a model call are visible in the route; preview-to-version binding is not established.

### F-OD-12 — Output formats share HTML rendering but still need format-specific paths

- Research questions: RQ-12
- Problem addressed: Delivering a code-first deck in portable formats.
- Responsibility / boundary: The daemon handles APIs and assembly. Electron handles rendering. Format libraries build the output containers. Separate paths package HTML, ZIP, Markdown, or images.
- Decision / mechanism: Deck workflows support HTML, PDF, PPTX, ZIP, Markdown, and image output. Screenshot PPTX/raster PDF share capture; vector PDF uses browser print; editable PPTX uses DOM conversion.
- Source says: README lists HTML, PDF, PPTX, ZIP, and Markdown — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:README.md#L198-L213`. Shared screenshot flow and branches are visible at `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/import-export-routes.ts#L936-L940`, `#L1074-L1102`, `#L1134-L1177`, `#L1228-L1267`.
- Inference: Bitmap-based formats can reuse much of the same capture flow, although each output container still needs its own assembly code. Editable or structure-preserving formats also need format-specific conversion and fidelity checks.
- Rationale: Shared capture improves visual consistency. Separate paths provide features that images cannot support. This rationale is inferred.
- Trade-off: Pixel-based outputs can reuse capture, but each container still needs assembly code. Editable structure, selectable text, notes, and animations need work specific to each target format.
- Related AC: AC-26, because the paths show reuse and format-specific impact.
- DeckAgent implication: W-033 can compare output extension cost for image-container versus structure-preserving formats.
- Mismatch / caution: DeckAgent first V1 has only PPTX/PDF (D-026); extra OpenDesign formats do not expand scope.
- Confidence: Strong inference — current branches show shared capture and separate assembly; future extension cost remains an inference.

### F-OD-13 — The inspected export flow does not automatically record quality loss

- Research questions: RQ-13
- Problem addressed: Finding differences between PPTX or PDF output and the intended HTML.
- Responsibility / boundary: Normal export reports whether rendering and assembly succeeded. A separate, optional fidelity skill compares HTML and PPTX, but it is not part of the normal export-completion path.
- Decision / mechanism: Standard screenshot export validates the renderer response and keeps paths within the allowed location. It does not compare the output with the source or record quality loss for each slide. The separate audit requires both artifacts, reads the internal PPTX structure, and reports or fixes differences.
- Source says: Screenshot PPTX embeds one full-bleed image per slide and raster PDF one image per page — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/deck-export.ts#L146-L218`. The audit requires HTML plus PPTX and builds/verifies an issue table — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:skills/pptx-html-fidelity-audit/SKILL.md#L17-L40`, `#L57-L103`, `#L178-L209`.
- Inference: The separate audit can find some HTML-to-PPTX differences. In the inspected export, assembly, preview-telemetry, and audit paths, no step automatically saves a quality-loss record for every normal PPTX or PDF export.
- Rationale: Screenshot embedding reduces layout drift pressure; the source does not state this as the omission rationale.
- Trade-off: Export remains simple, but checking editable exports, fonts, and application-specific behavior needs a separate audit. If the results must be available later, another step must store them.
- Related AC: AC-19, because it concerns detection and recording from real artifacts.
- DeckAgent implication: W-033 can distinguish reducing differences by design from measuring and recording differences after export.
- Mismatch / caution: Screenshot PPTX avoids converting content into native slide shapes, but it sacrifices editability. DeckAgent cannot assume this trade-off under D-026.
- Confidence: Strong inference — the absence claim is bounded to the inspected export, renderer, telemetry, and audit paths.

### 2.8 Failure & recovery

Research questions: RQ-14

### F-OD-14 — Failures are classified and retries are limited, but the baseline cannot roll files back

- Research questions: RQ-14
- Problem addressed: Ending long agent operations predictably and avoiding unsafe retries after a run has caused side effects.
- Responsibility / boundary: The run manager controls status, cancellation, process termination, final SSE events, and retries. Adapters provide failure signals. The project filesystem remains the target of changes.
- Decision / mechanism: By default, selected temporary failures allow at most one safe retry. Ordinary same-run retry is suppressed after cancellation, user-visible output, tool calls, artifact writes, or live artifacts. For supported native sessions, a separate continuation path can resume some eligible post-tool failures without repeating completed tool calls. File baselines are fingerprints used to detect changes; they do not contain bytes for rollback.
- Source says: Default retry cap and backoff are defined at `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/run-retry-policy.ts#L10-L57`; native-session post-tool continuation at `#L120-L162`; transient classification at `#L176-L223`; side-effect suppression at `#L226-L279`. Baselines store size/mtime/hash and compute changed paths — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/run-artifact-fs.ts#L105-L124`, `#L382-L459`.
- Inference: The system can report a failure status, avoid unsafe replay, and sometimes continue from an existing native session after a tool call. If an agent writes part of a deck before failure or cancellation, those changes may remain. The filesystem baseline cannot restore the old bytes because it stores only metadata and hashes. HTML history may allow a later manual restore when a suitable version exists.
- Rationale: After a run has acted, the policy prioritizes avoiding duplicate side effects. The gates and comments state this directly.
- Trade-off: The policy reduces repeated actions and can preserve progress through native-session continuation. It does not keep the working files unchanged when a run fails midway.
- Related AC: AC-08, because operations end with determinate status/retry decisions; AC-09, because export errors do not mutate source; AC-20, because failure category/detail/stage/retryability are reportable.
- DeckAgent implication: W-033 can separate operation recovery from artifact rollback and side-effect-aware retry from accepted-state preservation.
- Mismatch / caution: OpenDesign permits arbitrary agent workspace side effects; DeckAgent may use a narrower boundary.
- Confidence: Strong inference — retry gates and baseline contents are explicit; the effect on files follows from the lack of stored rollback bytes.

### 2.9 Editor dependency

Research questions: RQ-15

### F-OD-15 — Agents and code drive the main workflow; object editing is optional and incomplete

- Research questions: RQ-15
- Problem addressed: Producing/refining decks without requiring a professional slide editor.
- Responsibility / boundary: Users provide a brief or chat instructions and may add comments or tweaks. Agents write HTML and CSS. OpenDesign handles preview and export. External tools receive code or files.
- Decision / mechanism: Real code is the main editable medium. Creation and refinement happen through agent conversations and workspace changes. Object-level features are additional tools, and reliable targeted editing from comments is still incomplete.
- Source says: README describes agent-native, code-first artifacts — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:README.md#L34-L38`. It describes Studio deck flow and HTML/CSS or PPTX/PDF handoff — `#L73-L83`, `#L367-L375`. Surgical edits are partial and AI tweaks unimplemented — `#L596-L612`.
- Inference: The main deck workflow does not require direct editing of slide objects. More detailed editing moves to code tools or an exported PPTX. The default screenshot PPTX contains a slide-sized image rather than editable slide objects.
- Rationale: The product explicitly treats coding agents as the design engine and real files as the working medium.
- Trade-off: This avoids building a full slide editor, but nontechnical users must rely on language-based iteration. The screenshot export also trades editability for visual fidelity.
- Related AC: AC-12, because professional-editor interaction is not required.
- DeckAgent implication: W-033 can use agent-led refinement plus external handoff as interaction evidence while separately assessing editability.
- Mismatch / caution: OpenDesign's wider “Figma alternative” ambitions and inspect/tweak surfaces are outside DeckAgent V1.
- Confidence: Strong inference — the code-first workflow is explicit, while the user-impact statement is inferred.

### 2.10 Dependencies & cost

Research questions: RQ-16

### F-OD-16 — Runtime adapters localize model differences; screenshot exports depend on desktop Chromium

- Research questions: RQ-16
- Problem addressed: Supporting many AI engines and formats without duplicating the product flow.
- Responsibility / boundary: Runtime definitions isolate differences in launch, prompts, models, authentication, streams, and probes. The daemon centralizes APIs and SQLite. Electron renders content, and format libraries assemble the output.
- Decision / mechanism: `RuntimeAgentDef` and normalized events give agents a common lifecycle interface. Screenshot PPTX and PDF require desktop rendering; the daemon alone returns HTTP 501. `pptxgenjs` and `pdf-lib` assemble images, while editable PPTX also requires DOM conversion.
- Source says: Runtime definitions and shared lifecycle are documented at `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L112-L124`. Desktop-only screenshot export is explicit at `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/import-export-routes.ts#L936-L940`, `#L1036-L1041`. The daemon pins `better-sqlite3`, Express, `pdf-lib`, and `pptxgenjs`; desktop pins Electron — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/package.json#L52-L65`, `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/desktop/package.json#L34-L34`.
- Inference: Runtime definitions keep many provider-specific details in one place, although provider capabilities still affect orchestration. The desktop renderer is a shared dependency for screenshot PPTX and raster PDF, so a renderer failure can affect both paths.
- Rationale: The registry avoids a separate product flow for each agent. Chromium reuses the rendering behavior of the authored HTML.
- Trade-off: The system supports many providers and reuses browser rendering, but it depends on Node/Electron, native SQLite, OS packaging, and a renderer shared by several export formats.
- Related AC: AC-21, because subsystem variety shapes learning/maintenance; AC-22, because agents, Electron, and libraries have different isolation.
- DeckAgent implication: W-033 can compare AI and rendering dependency isolation separately.
- Mismatch / caution: Team feasibility belongs to W-035. OpenDesign's many-runtime platform is not a DeckAgent baseline.
- Confidence: Strong inference — the dependency paths are explicit; maintainability and failure-spread effects are inferred.

### 2.11 Evolution

Research questions: RQ-17

### F-OD-17 — OpenDesign has changed its system structure and export mechanisms over time

- Research questions: RQ-17
- Problem addressed: Evolving quickly without treating early deployment and generation assumptions as permanent contracts.
- Responsibility / boundary: Architecture docs describe the current system structure. Plugin/runtime interfaces and repeatable export routes mark places where implementations can be replaced.
- Decision / mechanism: The current architecture differs from earlier browser-only, in-memory designs that used WebSockets and history files. Current documentation describes HTTP/SSE, a SQLite-backed daemon, request-time registries, sidecars, and a BYOK proxy. The changelog also records a plugin-core rebuild and a later change from agent-driven PPTX export to capture and assembly.
- Source says: Early tunnel/browser-only/WebSocket/in-memory/`history.jsonl` designs are labelled overtaken — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L5-L16`. The 0.8.0 changelog describes a rebuilt plugin core and thin desktop wrapper — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:CHANGELOG.md#L137-L159`. Current export replaced the agent/`python-pptx` path — `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/import-export-routes.ts#L1463-L1465`.
- Inference: OpenDesign has replaced several important architectural choices over time. The sources show which areas changed, but they do not prove that one specific coupling caused the redesign. They also do not provide effort data or a complete compatibility history.
- Rationale: Official sources connect the changes to headless reuse, plugins, durable state, and repeatable export. No effort figures are given.
- Trade-off: The newer design adds reuse, persistent state, and repeatable export paths. The historical sources indicate broad changes across product layers, but they do not quantify the migration cost.
- Related AC: AC-23, because the history shows how many areas changed; AC-24, because it shows that major choices were reversed but gives no numeric cost.
- DeckAgent implication: W-033 can use the history to consider transport, persistence, runtime, and artifact choices separately.
- Mismatch / caution: Pressures came from a public multi-runtime, multi-artifact platform and establish no DeckAgent architecture decision.
- Confidence: Strong inference — the replacements are documented; their causes, cost, and compatibility impact are not fully established.

## 3. System-specific evidence

### 3.1 Responsibility and ownership map

This table summarizes the inspected architecture and code paths. Entries in “Does not own” are boundaries observed in those paths, not claims about every feature in the repository.

| Area | Owning component | Owned state / contract | Does not own |
|---|---|---|---|
| Product interaction | `apps/web` | Chat/project/file UI, preview mode, streamed-event rendering, export bridge | Durable project database or canonical bytes |
| Product authority | `apps/daemon` | `/api/*`, persistence, run lifecycle, prompt composition, files, versions, import/export, security | Agent-specific internals or browser presentation state |
| Runtime variation | `apps/daemon/src/runtimes` and agent protocols | Detection, launch, probes, normalized events, cancellation | Canonical deliverable format |
| Shared boundary | `packages/contracts` | HTTP/SSE DTOs, prompt, runtime, deck, and preview protocols | Durable data or process lifecycle |
| Deliverable state | Project workspace | Current HTML/CSS/assets and output files | Conversation/run metadata |
| Durable metadata | SQLite | Projects, conversations, messages, sessions, tabs, run/plugin/collaboration metadata | Actual project bytes |
| Preview | Web sandboxed iframe | Rendered HTML, host bridges, render-health observations | Project files or accepted-state authority |
| Export render | Electron desktop sidecar | Chromium load/capture/print and editable DOM conversion | Source-of-truth content |
| Binary assembly | Daemon export modules | Image-backed PPTX/PDF packaging and errors | Model generation or source mutation |

Evidence: `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L55-L110`, `#L148-L173`; `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/db.ts#L1-L5`.

### 3.2 Main execution and mutation flow

1. The user creates or selects a project. Through the web app or `od` CLI, the user provides a brief, attachments, plugin/template/design-system choices, and a runtime/model choice.
2. The daemon saves message and run metadata, resolves the context and runtime, and builds the system and task prompts.
3. Before execution, the daemon fingerprints the artifact tree so it can later identify changed files. This is an observation record, not a byte snapshot that can restore files.
4. A filesystem agent uses the project workspace as its `cwd` and writes or edits the canonical files. A text-artifact runtime instead returns one complete artifact, which the host writes into the workspace.
5. File changes can update the live preview while the run is active. When the run ends, the daemon compares the file tree with its baseline, links changed outputs to the run, validates the deliverable, and creates HTML versions after success.
6. Preview loads the currently selected file. Export separately reads either the current file or a specified version, sends the HTML to Electron, and assembles and returns the output.
7. A restore is another change. It copies bytes from a selected HTML version into the working file and adds a new restore version to history.

The traced flow separates:

- **Working state:** mutable project files.
- **Historical evidence:** per-file HTML versions and message/run artifact snapshots.
- **Conversation/orchestration state:** SQLite messages, status/events, sessions, and prompt context.

The inspected flow does not show a separate model for a “candidate deck awaiting acceptance.”

Evidence: `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:docs/architecture.md#L175-L199`; `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/server.ts#L11486-L11505`, `#L11535-L11585`, `#L11702-L11760`; `open-design@0d3a14c1df6dc5017f3cc3ef05b24558250c220b:apps/daemon/src/routes/project/index.ts#L7407-L7472`.

### 3.3 Architectural mechanisms and contracts

| Mechanism | Contract / seam | Architectural consequence |
|---|---|---|
| Runtime registry | `RuntimeAgentDef` + normalized events | Keeps many provider and CLI lifecycle differences local, although capabilities still affect orchestration. |
| Execution profile | Filesystem output vs complete text artifact | Different runtimes all produce files in the project workspace. |
| Project-file authority | Daemon-bounded workspace paths | Agent tools, preview, and export share files. The inspected flow does not provide an automatic all-or-nothing update across multiple files. |
| HTML version store | Per-file content + digest + history | Supports HTML restore and pinned exports. Version IDs can be linked to assistant-message artifacts; direct run linkage is optional, and sentence-level source tracking is not recorded. |
| Run filesystem diff | Before/after fingerprints | Identifies changes and supports retry decisions across runtimes, but cannot roll files back. |
| Refinement routing | Direct Edit eligibility + minimal-change contract; otherwise Full Plan | Keeps clear local edits bounded while routing broader or uncertain changes through planning. Post-edit verification remains file/path based. |
| Preview protocol | Sandboxed iframe + bounded `postMessage` | Limits what rendered HTML can do and reports some render failures. |
| Export selection | `fileName` + optional `versionId` | Avoids regeneration and can pin a version. If `versionId` is omitted, the live file can change between review and export. |
| Shared slide capture | Electron → per-slide images | Gives screenshot PPTX and raster PDF one visual path and one shared renderer failure point. |
| Deliverable validator | Status + diff + entry + kind + readability | Rejects some stale, missing, or unreadable results, but does not validate meaning or layout. |
| Optional fidelity skill | HTML/PPTX extraction + verification | Can find some quality loss on demand. The inspected export path does not automatically save this result for every export. |

No additional system-specific evidence outside RQ-01–RQ-17 was found that maps to no AC ID.

## 4. Coverage table

| RQ | Priority | Status | Findings | Where looked (required unless Answered) |
|---|---|---|---|---|
| RQ-01 | Core | Answered | F-OD-01 | |
| RQ-02 | Core | Answered | F-OD-02 | |
| RQ-03 | Core | Answered | F-OD-03 | |
| RQ-04 | Core | Answered | F-OD-04 | |
| RQ-05 | Core | Answered | F-OD-05 | |
| RQ-06 | Core | Answered | F-OD-06 | |
| RQ-07 | Core | Answered | F-OD-07 | |
| RQ-08 | Core | Answered | F-OD-08 | |
| RQ-09 | Core | Answered | F-OD-09 | |
| RQ-10 | Core | Answered | F-OD-10 | |
| RQ-11 | Core | Answered | F-OD-11 | |
| RQ-12 | Extended | Answered | F-OD-12 | |
| RQ-13 | Core | Answered | F-OD-13 | |
| RQ-14 | Core | Answered | F-OD-14 | |
| RQ-15 | Extended | Answered | F-OD-15 | |
| RQ-16 | Core | Answered | F-OD-16 | |
| RQ-17 | Extended | Answered | F-OD-17 | |

## 5. Self-review against DOC-005 §9.1

- The header records the official repository, exact tag and commit, access date, sources, and the tag/package-version caveat.
- All 14 Core RQs and all 3 Extended RQs are `Answered`; none is deferred or `Not found after search`.
- Every finding separates source evidence, inference, a contract-defined confidence level, AC relevance, DeckAgent implication, and mismatch/caution.
- AC IDs are used only for relevance; OpenDesign receives no `Meets`, `Does not meet`, or `Not yet assessable` outcome.
- There is no score, ranking, pass/fail, DeckAgent architecture proposal, or architecture decision.
- The analysis goes beyond folder names. It covers responsibilities, ownership, mutation and recovery flow, execution profiles, dependencies, contracts, validation, and export mechanisms.
- Project Hub review limitation: `./scripts/project-hub status` reported that the snapshot was missing. `sync` could not authenticate because no Project Hub user token is installed. Therefore, D-023–D-028 could not be checked again against the Google Sheets source of truth. The checked-in references to D-024–D-028 in DOC-004 and DOC-005 were used only to explain relevance and scope cautions. This limits the review evidence, but it does not block the OpenDesign research.
