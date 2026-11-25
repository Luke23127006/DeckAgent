# Task 11: Diagnose the Host application package report

Read this file to learn what the Local Host process imports, who starts it and which checks name its paths.

## Files changed

- `docs/build/refactor/target-structure/plan/task-11-diagnose-host-application-package.md`: marked Steps 1 to 7 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 11 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-11-diagnose-host-application-package.md`: added this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `grep -c "from '" apps/web/src/index.ts apps/web/src/cli.ts && grep -c "^export" apps/web/src/index.ts` | 0 | `apps/web/src/index.ts:30`, `apps/web/src/cli.ts:8`, `4` |
| 2 | `grep -n "from '" apps/web/src/index.ts apps/web/src/cli.ts` | 0 | 38 lines |
| 3 | `grep -rln "@deckagent/local-web" --include=*.mjs --include=*.ts --include=*.json . \| grep -v node_modules \| grep -v "/lib/"` | 0 | 14 files |
| 3 | `grep -rln "@deckagent/host-api" --include=*.ts --include=*.mjs --include=*.json apps packages e2e scripts tests \| grep -v node_modules \| grep -v /lib/` | 0 | 28 files |
| 4 | `grep -rn "apps/web/lib\|apps/web/" package.json scripts/build-workspace.mjs scripts/package-opencode.mjs e2e/env-startup.test.mjs e2e/deck-pipeline.test.mjs` | 0 | 21 lines |
| 5 | `grep -n "local-web\|apps/web\|host-api\|packages/host/api" scripts/check-boundaries.mjs .oxlintrc.json` | 0 | 20 lines |
| 5 | `grep -n "^test(" tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs \| grep -i "host/api\|apps/web\|host-api\|lifecycle\|transport"` | 0 | 10 test names |
| 6 | `git status --short` | 0 | No output before Step 7 |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)` |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-11-diagnose-host-application-package.md` | 0 | `0 violations` |

The commands ran in Git Bash at `C:\dev_env\git\bin\bash.exe`. `python` is not in the PATH of this machine. The environment provides `python3.12`, so Step 7 ran the same script with `python3.12`.

## Import table

`index.ts` is `apps/web/src/index.ts`. `cli.ts` is `apps/web/src/cli.ts`. The line number is the line that contains `from '`. A multi-line import shows the line of its last line.

| ID | File:line | Specifier | Imported names | Kind | Target |
| --- | --- | --- | --- | --- | --- |
| I1 | `index.ts:1` | `node:os` | `homedir` | node | none |
| I2 | `index.ts:2` | `node:path` | `dirname`, `join` | node | none |
| I3 | `index.ts:3` | `node:url` | `fileURLToPath` | node | none |
| I4 | `index.ts:4` | `@deckagent/host-api` | `startHost`, `HostOptions` (type), `RequestRuntime` (type) | host-api | `apps/host/src/http/` and `apps/host/src/runs/` |
| I5 | `index.ts:5` | `@deckagent/host-contracts` | `WebSettings` (type) | package | `@deckagent/host-contracts` |
| I6 | `index.ts:6` | `@deckagent/session-persistence` | `SessionError`, `SqliteSessionStore`, `ModelSelection` (type) | package | `@deckagent/session-persistence` |
| I7 | `index.ts:7` | `./draft-store.ts` | `MemoryDraftStore` | local | Not in the table |
| I8 | `index.ts:8` | `@deckagent/workspace-registry` | `WorkspaceRegistry` | package | `@deckagent/workspace-registry` |
| I9 | `index.ts:9` | `@deckagent/deck` | `DeckStore`, `deckFailureMessage`, `ConfirmedDeckPlan` (type) | package | `@deckagent/deck` |
| I10 | `index.ts:10` | `@deckagent/html-format` | `HtmlFormatAdapter`, `validateLegacySlideHtml` | package | `@deckagent/html-format` |
| I11 | `index.ts:11` | `./ui-assets.ts` | `loadWebAssets` | browser-asset | React components and pages in `apps/web/src/` |
| I12 | `index.ts:12` | `./web-state.ts` | `WebState` | local | Not in the table |
| I13 | `index.ts:13` | `./features/chats/index.ts` | `createChatOperations` | feature | `apps/host/src/modules/chats/` |
| I14 | `index.ts:14` | `./features/workspaces/index.ts` | `createWorkspaceOperations` | feature | `apps/host/src/modules/workspaces/` |
| I15 | `index.ts:21` | `./local-transport.ts` | `attachmentManagement`, `chatManagement`, `mapApplicationFailure`, `sessionReadManagement`, `workspaceManagement` | error-map | Open in Project Structure |
| I16 | `index.ts:22` | `./features/providers/index.ts` | `ProviderStore`, `ProviderConnection` (type), `ProviderStoreOptions` (type) | feature | `apps/host/src/modules/providers/` |
| I17 | `index.ts:23` | `./features/requests/index.ts` | `createRequestRuntime` | feature | `apps/host/src/modules/requests/` |
| I18 | `index.ts:24` | `./integrations/providers/index.ts` | `listModels` | integration | Module that uses the adapter, or `apps/host/src/runtimes/` |
| I19 | `index.ts:25` | `./integrations/credentials/index.ts` | `defaultCredentialStore`, `CredentialStore` (type) | integration | Module that uses the adapter, or `apps/host/src/runtimes/` |
| I20 | `index.ts:26` | `./integrations/opencode/index.ts` | `OpenCodeRuntime`, `findExecutable`, `OpenCodeOptions` (type) | integration | `apps/host/src/runtimes/opencode/` |
| I21 | `index.ts:27` | `./storage-root.ts` | `StorageError`, `prepareStorage`, `resolveStorageRoot`, `StorageLayout` (type) | local | Not in the table |
| I22 | `index.ts:28` | `./features/attachments/index.ts` | `AttachmentCoordinator`, `ManagedAttachments` | feature | `apps/host/src/modules/attachments/` |
| I23 | `index.ts:29` | `./features/sources/index.ts` | `prepareSourceTools` | feature | `apps/host/src/modules/sources/` |
| I24 | `index.ts:30` | `./features/research/index.ts` | `ResearchCoordinator` | feature | `apps/host/src/modules/research/` |
| I25 | `index.ts:31` | `./integrations/research/index.ts` | `TavilyClient` | integration | Module that uses the adapter, or `apps/host/src/runtimes/` |
| I26 | `index.ts:39` | `./features/deck/index.ts` | `BriefCoordinator`, `ConfirmationCoordinator`, `DeckWorkflow`, `GenerationWorkflow`, `WebImageResearch`, `generationReport` | feature | `apps/host/src/modules/deck/` |
| I27 | `index.ts:40` | `./integrations/images/index.ts` | `CommonsImages`, `PublicImageReader`, `ImageLookup` (type) | integration | Module that uses the adapter, or `apps/host/src/runtimes/` |
| I28 | `index.ts:41` | `./integrations/rendering/index.ts` | `artifactRenderer`, `ArtifactRenderer` (type) | integration | Module that uses the adapter, or `apps/host/src/runtimes/` |
| I29 | `index.ts:43` | `./storage-root.ts` | `StorageError`, `resolveStorageRoot` | local | Not in the table |
| I30 | `index.ts:44` | `./features/providers/index.ts` | `ProviderConnection` (type) | feature | `apps/host/src/modules/providers/` |
| I31 | `cli.ts:1` | `node:child_process` | `execFile` | node | none |
| I32 | `cli.ts:2` | `node:fs/promises` | `readFile` | node | none |
| I33 | `cli.ts:3` | `node:path` | `path` (default import) | node | none |
| I34 | `cli.ts:4` | `node:util` | `parseArgs`, `promisify` | node | none |
| I35 | `cli.ts:5` | `./index.ts` | `StorageError`, `resolveStorageRoot`, `startLocalWeb` | local | Not in the table |
| I36 | `cli.ts:6` | `./index.ts` | `LocalWebOptions` (type), `ProviderConnection` (type) | local | Not in the table |
| I37 | `cli.ts:7` | `./features/providers/index.ts` | `protocols` | feature | `apps/host/src/modules/providers/` |
| I38 | `cli.ts:8` | `./integrations/providers/index.ts` | `validBaseUrl` | integration | Module that uses the adapter, or `apps/host/src/runtimes/` |

Rows I29 and I30 are `export ... from` lines, not import lines. Step 2 counts them because the pattern `from '` matches them. Their kind and target use the same decision table.

## Import count for each kind

| Kind | Count | IDs |
| --- | --- | --- |
| node | 7 | I1, I2, I3, I31, I32, I33, I34 |
| host-api | 1 | I4 |
| feature | 10 | I13, I14, I16, I17, I22, I23, I24, I26, I30, I37 |
| integration | 7 | I18, I19, I20, I25, I27, I28, I38 |
| error-map | 1 | I15 |
| browser-asset | 1 | I11 |
| package | 5 | I5, I6, I8, I9, I10 |
| local | 6 | I7, I12, I21, I29, I35, I36 |
| unclassified | 0 | none |

The table has 38 rows.

## Facts about the composition root

### 1. Startup order in `startLocalWeb`

| Order | Line | Step |
| --- | --- | --- |
| 1 | `index.ts:347` | `prepareStorage(options.dataDir ?? resolveStorageRoot())` opens Application Storage. |
| 2 | `index.ts:369` | `openStorageLayer(...)` creates `WorkspaceRegistry`, `SqliteSessionStore`, `DeckStore` and `WebState`. |
| 3 | `index.ts:371` | `defaultCredentialStore(layout.root)` creates the credential store when the options give none. |
| 4 | `index.ts:372` | `ManagedAttachments.open(...)` opens the attachment folder. |
| 5 | `index.ts:373` | `createRuntimeLayer(...)` creates `ProviderStore`, `OpenCodeRuntime`, the request runtime, `ResearchCoordinator` and `WebImageResearch`. |
| 6 | `index.ts:374` | `clientDir` gives the folder of the Browser assets. |
| 7 | `index.ts:375` | `loadWebAssets(clientDir, ...)` loads the Browser assets. |
| 8 | `index.ts:376` | `startHost(createHostOptions(...))` starts the HTTP server. |

Three objects come before step 1: `CommonsImages` at `index.ts:348`, the artifact renderer at `index.ts:349` and `MemoryDraftStore` at `index.ts:350`.

### 2. Order of the functions in `closers`

| Order | Line | Closer |
| --- | --- | --- |
| 1 | `index.ts:357` | `opened.registry.close()` |
| 2 | `index.ts:358` | `opened.sessions.close()` |
| 3 | `index.ts:359` | `opened.web.close()` |
| 4 | `index.ts:360` | `opened.decks.close()` |
| 5 | `index.ts:361` | `runtime.providers.close()` |
| 6 | `index.ts:362` | `runtime.inputs.close()` |
| 7 | `index.ts:363` | `runtime.images.close()` |
| 8 | `index.ts:364` | `commonsImages.close()` |
| 9 | `index.ts:365` | `renderer.close()` |
| 10 | `index.ts:366` | `host.close()` |

The array lists the open order. Both close paths call `closers.toReversed()` at `index.ts:383` and `index.ts:388`. The Host closes first and the registry closes last. `closeResources` at `index.ts:90` runs every closer and throws the first failure after the last closer.

### 3. Path of the Browser assets

`startLocalWeb` builds the folder at `index.ts:374`:

```ts
const clientDir = join(dirname(fileURLToPath(import.meta.url)), 'browser')
```

The folder is `browser` next to the compiled `index.js`. In the built package it is `apps/web/lib/browser`.

`scripts/build-workspace.mjs:73` starts a separate build for `@deckagent/local-web`. The build reads `lib/browser-types/boot.js` (line 77) and writes `lib/browser` (line 78) with `platform: 'browser'` (line 80). `apps/web/tsconfig.browser.json` compiles `src/browser` into `lib/browser-types`.

### 4. Fields of `LocalWebOptions`

| Field | Type | Line |
| --- | --- | --- |
| `imageAccess` | `{ readonly fetch: typeof fetch; readonly resolve?: ImageLookup }` | `index.ts:48` |
| `generationRuntime` | `RequestRuntime` | `index.ts:50` |
| `confirmedDecks` | `readonly (ConfirmedDeckPlan & { readonly sessionId: string })[]` | `index.ts:52` |
| `selection` | `ModelSelection` | `index.ts:53` |
| `connections` | `readonly ProviderConnection[]` | `index.ts:55` |
| `dataDir` | `string` | `index.ts:57` |
| `port` | `number` | `index.ts:58` |
| `home` | `string` | `index.ts:60` |
| `openCode` | `OpenCodeOptions` | `index.ts:62` |
| `credentials` | `CredentialStore` | `index.ts:64` |
| `providerAccess` | `Pick<ProviderStoreOptions, 'check' \| 'catalog'>` | `index.ts:66` |
| `researchAccess` | `{ readonly fetch: typeof fetch; readonly key?: string }` | `index.ts:68` |

Every field is optional.

### 5. What `cli.ts` does before it calls `startLocalWeb`

1. `cli.ts:120` `parseArgs` reads nine flags: `--config`, `--provider`, `--model`, `--data-dir`, `--port`, `--help`, `--no-open`, `--confirmed-deck` and `--opencode`.
2. `cli.ts:133` prints the usage text and returns when `--help` is present.
3. `cli.ts:139` reads `DECKAGENT_PROVIDER` when `--provider` is absent.
4. `cli.ts:140` reads `DECKAGENT_MODEL` when `--model` is absent.
5. `cli.ts:141` calls `loadConnections` when a provider or a model is present. `loadConnections` reads a file at `cli.ts:62`: `--config`, else `DECKAGENT_MODELS_CONFIG`, else `config/models.example.json`.
6. `cli.ts:142` converts `--port` with the default `0`.
7. `cli.ts:143` rejects a port that is not an integer from 0 to 65535.
8. `cli.ts:144` calls `loadConfirmedDecks(values['confirmed-deck'])`. The function reads the file at `cli.ts:72`.
9. `cli.ts:145` calls `startLocalWeb`. Line `cli.ts:149` gives `dataDir: resolveStorageRoot({ flag: values['data-dir'] })`. `resolveStorageRoot` reads `--data-dir`, then `DECKAGENT_DATA_DIR`, then the app-data folder of the OS (`storage-root.ts:49`).
10. `cli.ts:153` and `cli.ts:154` register the `SIGINT` and `SIGTERM` handlers.
11. After startup, `cli.ts:155` prints the origin when `--no-open` is present. Otherwise `cli.ts:160` opens `origin/#token=<token>`.

## Callers of `@deckagent/local-web`

The first command in Step 3 finds 14 files. Eleven of them are e2e tests. The other three declare the dependency (`apps/web/package.json`), run the build and the tests (`package.json`) and build the package (`scripts/build-workspace.mjs`).

| ID | File | Imported names | Uses origin and token |
| --- | --- | --- | --- |
| C1 | `e2e/attachment-admission.test.mjs` | `startLocalWeb` | yes |
| C2 | `e2e/browser-smoke.test.mjs` | `startLocalWeb` | yes |
| C3 | `e2e/deck-pipeline.test.mjs` | `startLocalWeb` | yes |
| C4 | `e2e/layout-review-browser.test.mjs` | `startLocalWeb` | yes |
| C5 | `e2e/local-foundation.test.mjs` | `StorageError`, `resolveStorageRoot`, `startLocalWeb` | yes |
| C6 | `e2e/local-web.test.mjs` | `StorageError`, `startLocalWeb` | yes |
| C7 | `e2e/opencode-brief-live.test.mjs` | `startLocalWeb` | yes |
| C8 | `e2e/opencode-generation-live.test.mjs` | `startLocalWeb` | yes |
| C9 | `e2e/opencode-live.test.mjs` | `startLocalWeb` | yes |
| C10 | `e2e/opencode-source-live.test.mjs` | `startLocalWeb` | yes |
| C11 | `e2e/research-live.test.mjs` | `startLocalWeb` | yes |

Each test reads `origin` or `token` from the object that `startLocalWeb` returns. The first read is a call with `` `${app.origin}` `` or a client constructor with `app.origin` and `app.token`.

## Importers of `@deckagent/host-api` by folder

The second command in Step 3 finds 28 files.

| Folder | File count | Files |
| --- | --- | --- |
| `apps/web/src/features/` | 12 | `attachments/attachment-coordinator.ts`, `deck/brief-coordinator.ts`, `deck/confirmation-coordinator.ts`, `deck/deck-prompts.ts`, `deck/deck-tool-session.ts`, `deck/deck-workflow.ts`, `deck/generation-execution.ts`, `deck/generation-prompts.ts`, `deck/generation-tools.ts`, `deck/generation-workflow.ts`, `requests/prepare-runtime.ts`, `sources/source-tools.ts` |
| `apps/web/src/integrations/` | 5 | `opencode/contracts.ts`, `opencode/history.ts`, `opencode/mcp-bridge.ts`, `opencode/runtime.ts`, `opencode/stream-tracker.ts` |
| `apps/web/src/` (other files) | 2 | `index.ts`, `local-transport.ts` |
| `apps/web/tests/` | 1 | `browser-runtime.test.mjs` |
| `e2e/` | 3 | `attachment-admission.test.mjs`, `attachment-storage.test.mjs`, `request-lifecycle.test.mjs` |
| Other folders | 5 | `apps/web/package.json`, `packages/host/api/package.json`, `scripts/check-boundaries.mjs`, `tests/check-boundaries.test.mjs`, `tests/oxlint-boundaries.test.mjs` |

## Paths that start, build and package the Host

| File:line | Purpose | What the line does |
| --- | --- | --- |
| `package.json:8` | test | The `test:local-foundation` script runs `e2e/local-foundation.test.mjs` and `apps/web/tests/draft-store.test.mjs`. |
| `package.json:9` | test | The `test:model-requests` script runs `apps/web/tests/opencode-adapter.test.mjs` and `apps/web/tests/wait-for.test.mjs`. |
| `package.json:10` | test | The `test:source-permissions` script runs `apps/web/tests/mcp-bridge.test.mjs`. |
| `package.json:12` | test | The `test:research` script runs `apps/web/tests/research.test.mjs`. |
| `package.json:13` | test | The `test:images` script runs three tests in `apps/web/tests/`. |
| `package.json:16` | test | The `test:outline-workflow` script runs `apps/web/tests/outline-client.test.mjs`. |
| `package.json:17` | test | The `test:brief-foundation` script runs `apps/web/tests/brief-host.test.mjs` and `apps/web/tests/brief-client.test.mjs`. |
| `package.json:18` | test | The `test:deck-review` script runs `apps/web/tests/outline-client.test.mjs` and `apps/web/tests/layout-review.test.mjs`. |
| `package.json:19` | test | The `test:generation-publication` script runs four tests in `apps/web/tests/`. |
| `package.json:20` | test | The `test:slide-pipeline` script runs `apps/web/tests/deck-model.test.mjs` and `apps/web/tests/deck-client.test.mjs`. |
| `package.json:34` | test | The `test:tools-browser` script runs `apps/web/tests/browser-runtime.test.mjs`. |
| `package.json:35` | start | The `web` script runs `apps/web/lib/cli.js`. |
| `package.json:36` | start | The `start:local` script runs `apps/web/lib/cli.js` with Node 22.19.0. |
| `package.json:38` | test | The `test:opencode-resources` script runs `apps/web/tests/opencode-resources.test.mjs`. |
| `package.json:41` | test | The `test:local-web` script runs `apps/web/tests/web-session.test.mjs` and `apps/web/tests/web-management.test.mjs`. |
| `package.json:42` | test | The `test:layouts` script runs `apps/web/tests/layout-review.test.mjs`. |
| `scripts/package-opencode.mjs:11` | package | `appRoot` is the folder with the `package.json` and the resources that the script packages. |
| `scripts/package-opencode.mjs:23` | package | The usage text names the default folder `apps/web/resources/opencode`. |
| `e2e/env-startup.test.mjs:67` | start | The test starts the built `apps/web/lib/cli.js` in a child process. |
| `e2e/deck-pipeline.test.mjs:11` | test | The test imports the browser driver fixture from `apps/web/tests/fixtures/`. |
| `e2e/deck-pipeline.test.mjs:30` | start | The test starts the built `apps/web/lib/cli.js` in a child process. |

No line names a build output, and no line names the Browser bundle. The build finds its folders through `discoverWorkspacePackages` at `scripts/build-workspace.mjs:14` and has no literal `apps/web` path. The Browser bundle path is `outDir: 'lib/browser'` at `scripts/build-workspace.mjs:78`.

### 1. `extraEntries` and the special build steps

`extraEntries` at `scripts/build-workspace.mjs:34` has two rows:

| Package | Entry |
| --- | --- |
| `@deckagent/file-tools` | `lib/types/parser-worker.js` |
| `@deckagent/local-web` | `lib/types/cli.js` |

The main build reads `lib/types/index.js` (line 64) and writes `lib` (line 65) for each package. Line 91 adds the `extraEntries` row to the entry list.

`@deckagent/local-web` has one extra build before the main build (line 73). That build reads `lib/browser-types/boot.js` (line 77) and writes `lib/browser` (line 78). It uses `platform: 'browser'` (line 80) and the bundles that line 86 and line 87 list. The bundle list contains `@deckagent/host-contracts`, `@deckagent/presentation-document`, `zod`, every `@deckagent/` path and `animejs`.

### 2. Dependencies

| Package | `dependencies` |
| --- | --- |
| `@deckagent/local-web` | `@deckagent/deck`, `@deckagent/design`, `@deckagent/html-format`, `@deckagent/file-tools`, `@deckagent/host-api`, `@deckagent/host-contracts`, `@deckagent/presentation-document`, `@deckagent/session-persistence`, `@deckagent/workspace-registry`, `@modelcontextprotocol/sdk` 1.26.0 |
| `@deckagent/host-api` | `@deckagent/deck`, `@deckagent/host-contracts`, `@deckagent/session-persistence`, `busboy` 1.6.0 |

`@deckagent/local-web` also has `animejs` 4.5.0 in `devDependencies` and `opencode-windows-x64` 1.19.5 in `optionalDependencies`. `@deckagent/host-api` also has `@types/busboy` 1.5.4 in `devDependencies`.

### 3. TypeScript project references

`apps/web/tsconfig.json` references nine projects: `../../packages/presentation/html`, `../../packages/presentation/design`, `../../packages/tools/filesystem`, `../../packages/presentation/deck`, `../../packages/host/api`, `../../packages/host/contracts`, `./tsconfig.browser.json`, `../../packages/session/persistence` and `../../packages/workspace/registry`.

`apps/web/tsconfig.browser.json` compiles the Browser source in `src/browser` with the DOM library and no Node types. It writes `lib/browser-types`. It references `../../packages/host/contracts` and `../../packages/presentation/document`. `apps/web/tsconfig.json` excludes `src/browser/**` from the Node build.

## Checks that name the moved paths

| File:line | Rule ID or `files` pattern | Path or package that the rule names |
| --- | --- | --- |
| `scripts/check-boundaries.mjs:33` | `browser-node-import`, constant `BROWSER_DIRECTORIES` | `apps/web/src/browser`, `packages/client/runtime/src` |
| `scripts/check-boundaries.mjs:46` | `domain-runtime-dependency`, constant `RUNTIME_PACKAGES` | `@deckagent/host-api`, `@deckagent/browser-runtime` |
| `scripts/check-boundaries.mjs:50` | `lifecycle-transport-import`, constant `LIFECYCLE_DIRECTORIES` | `packages/host/api/src/lifecycle` |
| `scripts/check-boundaries.mjs:248` | `browser-node-import`, condition `escapesBrowserIntoHost` | `apps/web/src/browser` |
| `scripts/check-boundaries.mjs:249` | `browser-node-import`, condition `escapesBrowserIntoHost` | `apps/web/src` |
| `scripts/check-boundaries.mjs:250` | `browser-node-import`, condition `escapesBrowserIntoHost` | `apps/web/src/browser` |
| `scripts/check-boundaries.mjs:281` | `lifecycle-transport-import`, condition `isLifecycleSource` | `packages/host/api/src/request-controller.ts` |
| `scripts/check-boundaries.mjs:287` | `lifecycle-transport-import`, condition `isTransportModule` | `packages/host/api/src/transport` |
| `scripts/check-boundaries.mjs:351` | `feature-private-import`, public entry | `apps/web/src/features/<name>/index` |
| `scripts/check-boundaries.mjs:367` | `browser-feature-private-import`, public entry | `apps/web/src/browser/features/<name>/index` |
| `scripts/check-boundaries.mjs:381` | `browser-transport-ui-import`, source condition | `apps/web/src/browser/transport` |
| `scripts/check-boundaries.mjs:383` | `browser-transport-ui-import`, target condition | `apps/web/src/browser/features` |
| `scripts/check-boundaries.mjs:395` | `integration-private-import`, public entry | `apps/web/src/integrations/<name>/index` |
| `scripts/check-boundaries.mjs:473` | `feature-cycle`, report path | `apps/web/src/features/<name>` |
| `scripts/check-boundaries.mjs:485` | `browser-feature-cycle`, report path | `apps/web/src/browser/features/<name>` |
| `.oxlintrc.json:45` | `files` pattern of the Browser override | `**/apps/web/src/browser/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` |
| `.oxlintrc.json:68` | `eslint/no-restricted-imports`, group "Browser code must not import Local Host or domain packages" | `@deckagent/host-api` |
| `.oxlintrc.json:106` | `eslint/no-restricted-imports`, group "Host contracts must not import runtime implementations", override for `**/packages/host/contracts/src/**` | `@deckagent/host-api` |
| `.oxlintrc.json:125` | `files` pattern of the Request Lifecycle override | `**/packages/host/api/src/lifecycle/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` |
| `.oxlintrc.json:126` | `files` pattern of the Request Lifecycle override | `**/packages/host/api/src/request-controller.ts` |

The `check:boundaries` script derives `apps/web` folder names from the files. A folder-level rule for `apps/host/src/modules/` and `apps/web/src/api/` does not exist yet. The enforcement table of [Project Structure](../../../../conventions/project-structure.md#enforcement) lists it as a target check.

## Test names for the moved paths

These tests are the negative fixtures of the rules in the table above.

| # | Test name |
| --- | --- |
| 1 | `rejects both node builtin and private subpath in apps/web/src/browser` |
| 2 | `rejects @deckagent/host-api import in apps/web/src/browser` |
| 3 | `rejects @deckagent/deck import in apps/web/src/browser` |
| 4 | `rejects node:fs/promises subpath import in apps/web/src/browser` |
| 5 | `rejects @deckagent/host-api import inside packages/host/contracts/src` |
| 6 | `rejects node:http import inside packages/host/api/src/lifecycle` |
| 7 | `rejects relative http-error import inside packages/host/api/src/lifecycle` |
| 8 | `rejects relative http-error import inside packages/host/api/src/request-controller.ts` |
| 9 | `checkBoundaries rejects transport imports in Request Lifecycle` |
| 10 | `checkBoundaries rejects browser transport importing browser UI features` |

Tests 1 to 8 are in `tests/oxlint-boundaries.test.mjs`. Tests 9 and 10 are in `tests/check-boundaries.test.mjs`.

## Items with kind `unclassified`

No item has kind `unclassified`. All 38 rows match one row of the import decision table. Row I15 has kind `error-map`, and its target is `Open in Project Structure` as the table states.

## What the commands do not prove

1. The searches find names in files. They do not find a dynamic import or a path that the code builds at run time.
2. A file count does not prove that each importer uses the package at run time. A comment or a type-only import gives the same hit.
3. The `Target` column comes from [Project Structure](../../../../conventions/project-structure.md#trong-lúc-chuyển). It does not decide what `apps/host/` contains in Phase 2.
4. The line counts of Step 1 prove the start state only.
5. `git status --short` shows the tracked and the untracked files of this repository. It does not show a change outside the repository.
6. The test names of Step 5 come from the `test(` calls. A test can name a path and check a different behavior.
