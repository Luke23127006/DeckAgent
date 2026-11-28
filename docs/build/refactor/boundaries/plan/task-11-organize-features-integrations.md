# Task 11: Separate application features from integrations

Read this file to learn the steps that separate application features from integrations.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `apps/web/src/index.ts`.
- `apps/web/src/provider-settings.ts`.
- `apps/web/src/provider-catalog.ts`.
- `apps/web/src/research-service.ts`.
- `apps/web/src/source-tools.ts`.
- `apps/web/src/opencode/runtime.ts (lines 1-260)`.
- `apps/web/src/attachment-service.ts`.
- `apps/web/src/brief-service.ts`.
- `apps/web/src/confirmation-service.ts`.
- `.agents/skills/codebase-design/SKILL.md`.
- `.agents/skills/tdd/SKILL.md`.

**Files:**

- Move: the source files in the Placement table. Each row gives the exact source and destination.
- Create: apps/web/src/features/{providers,research,attachments,sources,deck}/index.ts.
- Create: apps/web/src/features/{providers,research,attachments,sources,deck}/failures.ts.
- Create: apps/web/src/integrations/{opencode,providers,research,images,rendering,credentials}/index.ts.
- Change: apps/web/src/index.ts, local-transport.ts, cli.ts, and web-state.ts.
- Change: scripts/package-opencode.mjs and tests/opencode-adapter.test.mjs, for resource and module paths.
- Change: tests/*.test.mjs and tests/fixtures/b02-helpers.mjs, for application imports only.

**Interfaces:**

- Preserves: ProviderStore, ResearchService, AttachmentService, ManagedAttachments, BriefService, DeckWorkflow, GenerationWorkflow, ConfirmationService, and prepareSourceTools.
- Makes ProviderStoreOptions.check and catalog explicit injected dependencies. Preserve their current signatures.
- Produces required ResearchService constructor dependency client: Pick<TavilyClient, 'check' | 'search' | 'images'>. Construct TavilyClient in startup.
- Preserves: OpenCodeOptions, runProcess, runtimeConfiguration, seedPrompt, parseEvent, and resource discovery.
- Produces owner failure classes ProviderFailure, ResearchFailure, AttachmentFailure, SourceToolFailure, and DeckWorkflowFailure.
- Each constructor accepts code: string and optional detail: Readonly<Record<string, string | boolean>>.
- DeckWorkflowFailure also accepts optional reason: 'current-outline-required' | 'restore-outline-missing'.
- None of these failures contains an HTTP status.
- Feature index.ts files export only operations used by startup or another feature. Integration index.ts files export only adapter operations used by production.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A source file has no Placement row.
- Moving a resource changes its discovery order or integrity check.
- A feature needs a new database or a new dependency.
- An error mapping cannot preserve its current status, code, and safe detail.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [x] **Step 1: Apply the source placement**

Use this table. Basenames stay unchanged.

| Source under apps/web/src/ | Destination under apps/web/src/ |
| --- | --- |
| provider-settings.ts | features/providers/provider-settings.ts |
| built-in-providers.ts | features/providers/built-in-providers.ts |
| research-service.ts | features/research/research-service.ts |
| attachment-service.ts | features/attachments/attachment-service.ts |
| managed-attachments.ts | features/attachments/managed-attachments.ts |
| source-tools.ts | features/sources/source-tools.ts |
| brief-service.ts | features/deck/brief-service.ts |
| deck-workflow.ts | features/deck/deck-workflow.ts |
| generation-workflow.ts | features/deck/generation-workflow.ts |
| confirmation-service.ts | features/deck/confirmation-service.ts |
| generation-report.ts | features/deck/generation-report.ts |
| provider-catalog.ts | integrations/providers/provider-catalog.ts |
| tavily.ts | integrations/research/tavily.ts |
| commons-images.ts | integrations/images/commons-images.ts |
| public-image-reader.ts | integrations/images/public-image-reader.ts |
| image-source.ts | integrations/images/image-source.ts |
| image-research.ts | features/deck/image-research.ts |
| artifact-renderer.ts | integrations/rendering/artifact-renderer.ts |
| credential-store.ts | integrations/credentials/credential-store.ts |
| opencode/config.ts | integrations/opencode/config.ts |
| opencode/events.ts | integrations/opencode/events.ts |
| opencode/history.ts | integrations/opencode/history.ts |
| opencode/mcp-bridge.ts | integrations/opencode/mcp-bridge.ts |
| opencode/process.ts | integrations/opencode/process.ts |
| opencode/provider.ts | integrations/opencode/provider.ts |
| opencode/resources.ts | integrations/opencode/resources.ts |
| opencode/runtime.ts | integrations/opencode/runtime.ts |

Keep storage-root, web-state, CLI, static asset strings, and startup at their existing paths.
Image selection coordinates deck work, so it stays in the deck feature.
Image HTTP clients and publisher metadata parsing belong to integrations.

- [x] **Step 2: Preserve dependency direction**

Construct provider and research clients in startup.
Pass the clients through existing constructor dependencies.
ProviderStore cannot create its provider transport.
ResearchService cannot create TavilyClient.
Keep Source tool permission preparation in the application.
Keep path checks and bounded reads in `tools/filesystem`.
Integrations cannot grant request capability or publish terminal status.

Use feature and integration `index.ts` files for external imports.
Use relative imports inside each owner.
Do not create a pass-through class for each moved file.

- [x] **Step 3: Remove HTTP errors from features**

Keep each feature's safe failure code and safe detail.
Move its existing status-selection expression into `local-transport.ts`.
Extend the Host-only mapApplicationFailure callback with these owner classes.
Keep the two OUTLINE_NOT_FOUND failure reasons distinct.
Map current-outline-required to 409 and restore-outline-missing to 404.
Preserve all other current status-selection branches and safe details.
Keep each feature's failure type beside that feature.
Do not create a common error service.

Wrap the public feature operation at the transport adapter.
Keep runtime and domain error translation separate.
Move no retry, cleanup, or terminal policy into the HTTP adapter.
Update internal catches to test owner error types.
Do not read a status number in a feature.

- [x] **Step 4: Check the moved owners**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:local-web`.
Run `corepack pnpm@11.28.5 test:source-permissions`.
Run `corepack pnpm@11.28.5 test:attachments`.
Run `corepack pnpm@11.28.5 test:research`.
Run `corepack pnpm@11.28.5 test:deck-review`.
Run `corepack pnpm@11.28.5 test:generation-publication`.
Expected: build exits with code 0. Each suite prints `# fail 0`, except for the recorded baseline failure in `portable-generation-http.test.mjs` (test #60, `REQUEST_TIMEOUT`).
Report that baseline failure separately without fixing it. Stop on any other failure in `test:generation-publication`.
Check source-relative resource URLs after the additional integration directory.
Do not use a successful warm build as proof that resource paths work.

- [x] **Final step: Report and stop**

Send this report in the conversation:

- Files changed, including moves.
- Commands run, exit codes, and the last 20 output lines.
- Test and skip counts.
- Items that a decision table sends to the report.
- Existing failures and unresolved decisions.
- What the commands do not prove.

Mark steps complete only after their Expected results occur.
Do not start another task until the task owner accepts this report.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)
