# Task 30: Diagnose the providers module report

Read this file to learn the code, store members, callers, write sites, settings fields and tests of the providers module before its move.

## Files changed

- `docs/build/refactor/target-structure/plan/task-30-diagnose-providers-module.md`: marked Steps 1 to 10 as done.
- `docs/build/refactor/target-structure/plan/README.md`: set the Task 30 row to `Done` and added the link to this report.
- `docs/build/refactor/target-structure/reports/README.md`: added the index row of this report.
- `docs/build/refactor/target-structure/reports/task-30-diagnose-providers-module.md` (new): this report.

No code, test, `package.json` or file in `docs/architecture/` changed. No commit and no push.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`. The table gives the pattern and the key output.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git ls-files apps/host/src/modules` | 0 | 13 lines. Nine start with `apps/host/src/modules/workspaces/` and four start with `apps/host/src/modules/chats/`. |
| 1 | `git grep -n "^| 29 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line at line 196. |
| 2 | `node -e "<line count of each file>" <the eight files>` | 0 | Eight lines with the counts `378`, `36`, `2`, `182`, `2`, `151`, `2` and `120`, in the order of the task. |
| 4 | `git grep -n -E "providers\.(load\|save\|remove\|catalog\|selectable\|runSettings\|providerSettings\|persistentKeys\|builtIns\|close)\b" -- apps/host/src packages/host/api/src ':!apps/host/src/features/providers'` | 0 | 12 lines, in the order of the task. |
| 4 | `git grep -n -E "(features\|integrations)/(providers\|credentials)/" -- apps packages e2e tests scripts` | 0 | 15 lines, in the order of the task. |
| 4 | `git grep -n -E "from '\.\./providers/index\.ts'" -- apps/host/src/integrations` | 0 | Four lines: `config.ts:3`, `contracts.ts:4`, `provider.ts:3` and `runtime.ts:8`. |
| 5 | `git grep -n -E "\.run\(\|exec\(" -- apps/host/src/features/providers apps/host/src/features/research apps/host/src/web-state.ts` | 0 | Ten lines, in the order of the task. |
| 5 | `git grep -n "this.write(" -- apps/host/src/features/providers/provider-settings.ts` | 0 | Two lines: 172 and 299. |
| 5 | `git grep -n -E "(FROM\|INTO\|TABLE( IF NOT EXISTS)?) (providers\|preferences)\b" -- apps/host/src` | 0 | 13 lines, in the order of the task. |
| 7 | `git grep -n -E "(client\|management)\.(settings\|save\|remove\|catalog)\(" -- apps/web/src/browser` | 0 | Five lines, in the order of the task. |
| 8 | `git grep -n "new ProviderFailure(" -- apps/host/src/features/providers` | 0 | 28 lines, in the order of the task. |
| 9 | `git grep -l -E 'api/providers\|api/settings[''`]' -- e2e apps/host/tests apps/web/tests packages/host/api/tests tests` | 0 | Four lines, in the order of the task. The single quotes keep the backtick in the character class. |
| 9 | The same command in double quotes | 0 | Two lines. The PowerShell double quote dropped the backtick from the character class, so two files with `` /api/settings` `` had no match. |
| 9 | `git grep -l "providerAccess" -- e2e apps/host/tests apps/web/tests tests` | 0 | 12 lines, in the order of the task. |
| 9 | `git grep -n "<file path>" -- package.json`, 16 times | 0 | 16 matches, and each file has one suite. Two files have a second suite. |
| 2 to 9 | `git grep -n <pattern> -- <files>` for the receiver types, the browser callers and the provider route use | 0 | The values of the columns `Receiver type`, `Caller area`, `Event that runs the function` and `Provider routes, store members or options`. |
| 10 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 229 file(s) checked, 0 error(s) in 0 file(s)`. The first run gave 1 error at `task-30-diagnose-providers-module.md:1`: the marked checkbox edit wrote a BOM. A new write of the task file without a BOM gives 0 errors. |
| 10 | `python -I .agents/skills/asd-ste100/scripts/ste-lint.py <report>` | 0 | `0 violations (0 hard, baseline 0), 2208 words`. The commands `python` and `python3` are not on this machine. The script ran as `C:\Users\Duy\.local\bin\python3.12.exe -I <script> <report>`. The first run gave 4 violations, the second 1 violation, and the last 0 violations. |

## Module files

| File | Lines | Responsibility |
| --- | --- | --- |
| `apps/host/src/features/providers/provider-settings.ts` | 378 | Defines `ProviderFailure`, the input check `parse`, the failure map `checkFailure` and the class `ProviderStore`, which reads and writes the `providers` table and the credential store. |
| `apps/host/src/features/providers/built-in-providers.ts` | 36 | Declares the four built-in provider templates with a fixed base URL and a required key. |
| `apps/host/src/features/providers/index.ts` | 2 | Re-exports `ProviderFailure`, `ProviderStore`, `protocols`, `ProviderConnection` and `ProviderStoreOptions`. |
| `apps/host/src/integrations/providers/provider-catalog.ts` | 182 | Defines `ProviderCheckError`, `validBaseUrl` and `listModels`, which reads at most ten pages of models with a 20 second timeout. |
| `apps/host/src/integrations/providers/index.ts` | 2 | Re-exports `ProviderCheckError`, `listModels`, `validBaseUrl`, `ProviderEndpoint` and `ProviderRunSettings`. |
| `apps/host/src/integrations/credentials/credential-store.ts` | 151 | Defines the port `CredentialStore`, the class `CredentialError`, the DPAPI call, the file store, the unavailable store and the factory. |
| `apps/host/src/integrations/credentials/index.ts` | 2 | Re-exports the three credential classes and the port type. |
| `apps/host/src/web-state.ts` | 120 | Creates and checks `web.sqlite`, and holds the theme, the last model selection and the selectability callback. |
| `packages/host/api/src/transport/management-routes.ts`, lines 6 to 70 | 65 | Declares the provider ID check and registers `GET /api/settings`, the three provider routes, and the research and preferences routes. |
| `packages/host/api/src/transport/contracts.ts`, lines 101 to 122 | 22 | Declares `WebManagement`: research, preferences, settings, the three provider calls, activities, requests and drafts. |
| `packages/host/contracts/src/management.ts`, lines 1 to 41 | 41 | Declares `ProviderProtocol`, `ProviderSettings`, `WebSettings` and `ProviderTemplate`. |
| `apps/host/src/local-transport.ts`, lines 15 to 33 and 121 to 127 | 26 | Maps each provider code to an HTTP status, and registers `ProviderFailure` first in `featureFailures`. |
| `apps/host/src/server.ts`, lines 64 to 92, 160 to 215, 226 to 297, 355 to 365 and 385 to 392 | 176 | Declares the provider options, creates `WebState`, builds `ProviderStore` with the three options, binds selectability, gives the settings reply and the three management calls, and closes the store. |
| `apps/host/src/features/requests/prepare-runtime.ts`, lines 29 to 65 | 37 | Declares the port `Pick<ProviderStore, ...>` and reads the provider settings, the selectability and the run settings of one request. |
| `apps/host/src/cli.ts`, lines 1 to 40 | 40 | Imports `protocols` and `validBaseUrl`, and checks one startup connection from the models config file. |
| `apps/web/src/browser/transport/management-client.ts`, lines 116 to 120 and 234 to 253 | 25 | Sends `GET /api/settings` and the three provider requests, and checks the provider ID before a save. |

## Store members

The class `ProviderStore` has no `BEGIN` and no `COMMIT`. No member runs in a SQL transaction.

| Member | Tables read | Tables written | In-memory fields written | Inside this.serialize | Calls outside the store |
| --- | --- | --- | --- | --- | --- |
| `load` | `providers` | `providers` (through `write`) | `deleted`, `providers`, `keys` | no | `this.credentials.adopt`, `this.credentials.read` |
| `providerSettings` | none | none | none | no | none |
| `persistentKeys` | none | none | none | no | `this.credentials.persistent` (property read) |
| `builtIns` | none | none | none | no | none |
| `selectable` | none | none | none | no | none |
| `runSettings` | none | none | none | no | none |
| `save` | none | `providers` (through `write`) | `providers`, `deleted`, `keys`, `mutation` (through `serialize`) | yes | `this.options.check`, `this.credentials.persistent` (property read), `this.credentials.save`, `this.credentials.remove` (twice), `this.options.modelsRemoved` |
| `remove` | none | `providers` | `providers`, `deleted`, `keys`, `mutation` (through `serialize`) | yes | `this.credentials.remove`, `this.options.modelsRemoved` |
| `catalog` | none | none | none | no | `this.options.catalog` |
| `close` | none | none | `catalogAbort`, `keys` | no | none |

`load` reads `providers` once, before the loop. `save` and `remove` read no table, because they read the map `providers`. `close` waits for `this.mutation` and does not change it.

## Callers

The variable `providers` of lines 361 to 363 is the field `RuntimeLayer.providers` of type `ProviderStore`. The variable of line 389 is `runtime?.providers` of the same type.

| Caller | Line | Member | Receiver type | Caller area |
| --- | --- | --- | --- | --- |
| `apps/host/src/features/requests/prepare-runtime.ts` | 49 | `providerSettings` | `Pick<ProviderStore, 'providerSettings' \| 'selectable' \| 'runSettings'>` | `requests` |
| `apps/host/src/features/requests/prepare-runtime.ts` | 50 | `selectable` | `Pick<ProviderStore, 'providerSettings' \| 'selectable' \| 'runSettings'>` | `requests` |
| `apps/host/src/features/requests/prepare-runtime.ts` | 62 | `runSettings` | `Pick<ProviderStore, 'providerSettings' \| 'selectable' \| 'runSettings'>` | `requests` |
| `apps/host/src/server.ts` | 250 | `selectable` | `ProviderStore` | `composition root, runtime layer` |
| `apps/host/src/server.ts` | 251 | `load` | `ProviderStore` | `composition root, runtime layer` |
| `apps/host/src/server.ts` | 292 | `providerSettings` | `ProviderStore` | `composition root, runtime layer` |
| `apps/host/src/server.ts` | 293 | `persistentKeys` | `ProviderStore` | `composition root, runtime layer` |
| `apps/host/src/server.ts` | 294 | `builtIns` | `ProviderStore` | `composition root, runtime layer` |
| `apps/host/src/server.ts` | 361 | `save` | `ProviderStore` | `composition root, HTTP options` |
| `apps/host/src/server.ts` | 362 | `remove` | `ProviderStore` | `composition root, HTTP options` |
| `apps/host/src/server.ts` | 363 | `catalog` | `ProviderStore` | `composition root, HTTP options` |
| `apps/host/src/server.ts` | 389 | `close` | `ProviderStore` | `composition root, other` |

## Importers

| File | Line | Imported names | Imported folder | Importer area |
| --- | --- | --- | --- | --- |
| `apps/host/src/cli.ts` | 7 | `protocols` | `features/providers` | `CLI` |
| `apps/host/src/cli.ts` | 8 | `validBaseUrl` | `integrations/providers` | `CLI` |
| `apps/host/src/features/providers/provider-settings.ts` | 4 | `CredentialError`, `ProtectedFileCredentialStore` | `integrations/credentials` | `providers` |
| `apps/host/src/features/providers/provider-settings.ts` | 5 | `CredentialStore` | `integrations/credentials` | `providers` |
| `apps/host/src/features/providers/provider-settings.ts` | 6 | `ProviderCheckError`, `validBaseUrl` | `integrations/providers` | `providers` |
| `apps/host/src/features/providers/provider-settings.ts` | 7 | `ProviderEndpoint`, `ProviderRunSettings` | `integrations/providers` | `providers` |
| `apps/host/src/features/research/research-coordinator.ts` | 4 | `CredentialStore` | `integrations/credentials` | `research` |
| `apps/host/src/local-transport.ts` | 8 | `ProviderFailure` | `features/providers` | `error map and HTTP adapter` |
| `apps/host/src/server.ts` | 28 | `ProviderStore`, `ProviderConnection`, `ProviderStoreOptions` | `features/providers` | `composition root` |
| `apps/host/src/server.ts` | 30 | `listModels` | `integrations/providers` | `composition root` |
| `apps/host/src/server.ts` | 31 | `defaultCredentialStore`, `CredentialStore` | `integrations/credentials` | `composition root` |
| `apps/host/src/server.ts` | 50 | `ProviderConnection` (re-export) | `features/providers` | `composition root` |
| `apps/host/tests/fixtures/b02-helpers.mjs` | 12 | `defaultCredentialStore` | `integrations/credentials` | `test fixture` |
| `apps/web/src/browser/boot.ts` | 12 | `modelPicker`, `settingsPanel` | `features/providers` | `Browser, not Host code` |
| `apps/web/src/browser/chat-navigation.ts` | 8 | `modelPicker`, `settingsPanel` | `features/providers` | `Browser, not Host code` |
| `apps/host/src/integrations/opencode/config.ts` | 3 | `ProviderRunSettings` | `integrations/providers` | `opencode` |
| `apps/host/src/integrations/opencode/contracts.ts` | 4 | `ProviderRunSettings` | `integrations/providers` | `opencode` |
| `apps/host/src/integrations/opencode/provider.ts` | 3 | `ProviderRunSettings` | `integrations/providers` | `opencode` |
| `apps/host/src/integrations/opencode/runtime.ts` | 8 | `ProviderRunSettings` | `integrations/providers` | `opencode` |

The two Browser lines import `apps/web/src/browser/features/providers/`, not `apps/host/src/features/providers/`. The two folders have the same name and different code.

## Write sites

| Line | Public method | Statement | Inside a SQL transaction | Credential store call before the write | Effects after the write in the same method |
| --- | --- | --- | --- | --- | --- |
| 325 | `remove` | `INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload` with `{ deleted: true }` | no | none | `this.providers.delete`, `this.deleted.add`, `this.keys.delete`, `this.credentials.remove`, `this.options.modelsRemoved` |
| 172 | `load` | `INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload` with the saved payload | no | `this.credentials.adopt` (only for a row with `encryptedKey`) | `this.providers.set`, `this.credentials.read` (the result sets `this.keys`), and for a startup connection `this.providers.set` with `bootstrap: true` and `this.keys.set` |
| 299 | `save` | `INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload` with the saved payload | no | `this.credentials.save` (only when the input has a key) | `this.providers.set`, `this.deleted.delete`, `this.keys.set` or `this.keys.delete`, `this.credentials.remove` of the previous reference, `this.options.modelsRemoved` |

Line 299 runs inside the body that `this.serialize` receives. A failure of the write removes the new credential and throws `SETTINGS_STORAGE`.

`clearSelections` writes the table `sessions` of `sessions.sqlite`. The columns `provider`, `model`, `removed_provider` and `removed_model` change. `clearSelections` increases the chats version when at least one row changed, through `changedChats`, which runs `UPDATE change_versions SET version = version + 1 WHERE topic = 'chats' AND key = 'host'`. The Host calls it through `modelsRemoved`, so the write of `providers` and the write of `sessions` are two writes to two databases with no shared transaction.

## web.sqlite contents

| Table | Key or row | Written by | Read by | Value shape |
| --- | --- | --- | --- | --- |
| `providers` | one row for a saved configuration, keyed by the provider ID | `ProviderStore.save`, and `ProviderStore.load` for a row of an older shape | `ProviderStore.load` | JSON object with `displayName`, `protocol`, `baseUrl`, `models` and an optional `credentialRef` |
| `providers` | one row for a deletion marker, keyed by the provider ID | `ProviderStore.remove` | `ProviderStore.load` | JSON object `{ deleted: true }` |
| `preferences` | key `theme` | `WebState.savePreferences` | `WebState.preferences` | text, one of `light`, `dark` and `system` |
| `preferences` | key `lastSelection` | `WebState.rememberSelection` | `WebState.lastSelection` | JSON object `{ provider, model }` |
| `preferences` | key `research` | `ResearchCoordinator.save`, `ResearchCoordinator.remove` | `ResearchCoordinator.configuration` | JSON object with `revision` and one of `reference`, `environment: true` and `disabled: true` |

`WebState` creates both tables. `WebState` never reads a row of `providers` after the schema check at line 63. The credential store keeps the key bytes, and the table keeps only `credentialRef`.

## Settings fields

The function `settings` of `createRuntimeLayer` builds the reply at `apps/host/src/server.ts:290` to `296`.

| Field | Set by | Source | Methods that change the source |
| --- | --- | --- | --- |
| `research` | `settings` of `createRuntimeLayer` | `ResearchCoordinator.settings()` | `ResearchCoordinator.save`, `ResearchCoordinator.remove` |
| `providers` | `settings` of `createRuntimeLayer` | `ProviderStore`, the map `providers` | `ProviderStore.load`, `ProviderStore.save`, `ProviderStore.remove` |
| `persistentKeys` | `settings` of `createRuntimeLayer` | `ProviderStore.persistentKeys`, which returns `this.credentials.persistent` | none, the constructor sets it once |
| `builtIns` | `settings` of `createRuntimeLayer` | `ProviderStore.builtIns`, which returns the constant `builtInProviders` | none |
| `runtime` | `settings` of `createRuntimeLayer` | `OpenCodeRuntime.availability()` | not in the lines read |
| `providers[].id` | `ProviderStore.providerSettings` | `ProviderStore`, the map `providers` | `ProviderStore.load`, `ProviderStore.save`, `ProviderStore.remove` |
| `providers[].displayName` | `ProviderStore.providerSettings` | `ProviderStore`, the map `providers` | `ProviderStore.load`, `ProviderStore.save` |
| `providers[].protocol` | `ProviderStore.providerSettings` | `ProviderStore`, the map `providers` | `ProviderStore.load`, `ProviderStore.save` |
| `providers[].baseUrl` | `ProviderStore.providerSettings` | `ProviderStore`, the map `providers` | `ProviderStore.load`, `ProviderStore.save` |
| `providers[].models` | `ProviderStore.providerSettings` | `ProviderStore`, the map `providers` | `ProviderStore.load`, `ProviderStore.save` |
| `providers[].hasKey` | `ProviderStore.providerSettings` | `credentialRef` of the map entry and `ProviderStore.keys` | `ProviderStore.load`, `ProviderStore.save`, `ProviderStore.remove` |
| `providers[].keyAvailable` | `ProviderStore.providerSettings` | `ProviderStore.keys` | `ProviderStore.load`, `ProviderStore.save`, `ProviderStore.remove`, `ProviderStore.close` |
| `providers[].builtIn` | `ProviderStore.providerSettings` | the constant `builtInProviders`, matched by ID | none |

The field `selectable` of each chat in `GET /api/sessions` reads `ProviderStore.selectable`. The chain is `createChatRoutes` then `createChatOperations().list`, then `project`, then `projectChat`, then `models.selectable(chat.selection)` on `WebState`, then `WebState.selectable`, then the callback `isSelectable`. The callback is `value => isSelectable(value)` at `apps/host/src/server.ts:187`, and `bindSelectability` sets it to `value => providers.selectable(value)` at `apps/host/src/server.ts:250`. `POST /api/sessions` and `PUT /api/sessions/:sessionId/selection` reach the same member through `createChatOperations().create` and `selectModel`.

## Browser reads

| File | Line | Client method | HTTP route | Function that makes the call | Event that runs the function | What the Browser does with the reply |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/browser/chat-navigation.ts` | 158 | `management.settings` | `GET /api/settings` | `ChatNavigation.refresh` | The settings panel change, the workspace change, the research change and the draft refresh call it. So do a `chats` notice, the model `change` and the reconnect `click`. The new-chat and open paths also call it. | Keeps the reply in `this.settings` and renders the model picker and the chat list. |
| `apps/web/src/browser/features/providers/provider-model-draft.ts` | 69 | `client.catalog` | `GET /api/providers/:providerId/catalog` | `loadCatalog` of the model draft controller | `click` on the button `Lấy model catalog`, at `settings-dom.ts:79` | Fills the `available` list with the model IDs, shows the add button when the list is not empty, and writes the message. |
| `apps/web/src/browser/features/providers/settings-panel.ts` | 154 | `client.settings` | `GET /api/settings` | `refresh` | the open of the dialog through `openPanel` at line 354, the `remove` at line 253 and the `save` at line 277 | Keeps `providers` and `builtIns`, rebuilds the chooser and the provider list, fills the form, and warns when `persistentKeys` is false. |
| `apps/web/src/browser/features/providers/settings-panel.ts` | 252 | `client.remove` | `DELETE /api/providers/:providerId` | `removeProvider` | `click` on the button `Xóa cấu hình`, at `settings-dom.ts:83`, after the user accepts the dialog | Reads the settings again at line 253, then calls `panel.changed()`. |
| `apps/web/src/browser/features/providers/settings-panel.ts` | 274 | `client.save` | `PUT /api/providers/:providerId` | `submitProvider` | `submit` of the settings form | Saves the baseline, reads the settings again with the saved ID, then calls `panel.changed()`. A failure shows the code in the message. A success writes the saved message and moves the wizard step. |

The Browser opens the dialog on a `click` on the settings button and on a `click` on the model picker, at `boot.ts:81`, `:121` and `:122`.

## Error map

| Code | HTTP status in providerStatus | Thrown at | Public method | HTTP route |
| --- | --- | --- | --- | --- |
| `INVALID_PROVIDER` | 400 | 93, 94, 98 | `load`, `save` (through `parse`) | `startup`, `PUT /api/providers/:providerId` |
| `PROVIDER_KEY_REQUIRED` | 400 | 267, 269 | `save` | `PUT /api/providers/:providerId` |
| `PROVIDER_NOT_FOUND` | 404 | 319, 337 | `remove`, `catalog` | `DELETE /api/providers/:providerId`, `GET /api/providers/:providerId/catalog` |
| `MODEL_NOT_SELECTABLE` | 409 | 239 | `runSettings` | `POST /api/requests` |
| `PROVIDER_KEY_UNAVAILABLE` | 409 | 241 | `runSettings` | `POST /api/requests` |
| `PROVIDER_ID_TAKEN` | 409 | 257, 259 | `save` | `PUT /api/providers/:providerId` |
| `PROVIDER_NAME_EXISTS` | 409 | 261 | `save` | `PUT /api/providers/:providerId` |
| `PROTOCOL_IMMUTABLE` | 409 | 262 | `save` | `PUT /api/providers/:providerId` |
| `NEW_ENDPOINT_REQUIRES_KEY` | 409 | 266 | `save` | `PUT /api/providers/:providerId` |
| `PROVIDER_KEY_REFUSED` | 422 | 112 | `save` (through `checkFailure`) | `PUT /api/providers/:providerId` |
| `PROVIDER_CHECK_FAILED` | 422 | 116, 118, 119 | `save` (through `checkFailure`) | `PUT /api/providers/:providerId` |
| `CREDENTIAL_STORE_UNAVAILABLE` | 422 | 270, 286 | `save` | `PUT /api/providers/:providerId` |
| `CATALOG_UNAVAILABLE` | 502 | 338, 352 | `catalog` | `GET /api/providers/:providerId/catalog` |
| `PROVIDER_NO_ANSWER` | 504 | 113, 114, 121, 272 | `save` and `save` through `checkFailure` | `PUT /api/providers/:providerId` |
| `SETTINGS_STORAGE` | 500 | 151, 302 | `load`, `save` | `startup`, `PUT /api/providers/:providerId` |
| `CREDENTIAL_NOT_SAVED` | 500 | 286 | `save` | `PUT /api/providers/:providerId` |
| `CREDENTIAL_UNAVAILABLE` | 500 | 286 | `save` | `PUT /api/providers/:providerId` |

Line 286 throws the code of a `CredentialError`. The class `CredentialError` has the three codes `CREDENTIAL_STORE_UNAVAILABLE`, `CREDENTIAL_UNAVAILABLE` and `CREDENTIAL_NOT_SAVED`, so line 286 appears in the three rows.

**Codes thrown with no providerStatus key:** None.

**providerStatus keys with no throw:** None.

## web.sqlite schema path

| Condition on user_version, application_id and tables | Action | Line |
| --- | --- | --- |
| `application_id` is 0, `user_version` is 0 and `sqlite_master` has no table whose name does not start with `sqlite_` | Create `providers`. Set `application_id` to `1145132866` and `user_version` to 1. | 57 to 60 |
| `application_id` is `0x44415742` and `user_version` is 1 | Keep the file as it is. | 54 |
| Any other pair of `application_id` and `user_version`, or a file with a table | Throw `WebStateError('SETTINGS_SCHEMA')` and close the database. | 54, 67 |
| Every file that reaches line 62 | Run the statement. It creates `preferences` when the table is absent. | 62 |
| Every file that reaches line 64 | Run `PRAGMA quick_check`. A result other than `ok` throws `SETTINGS_STORAGE` and closes the database. | 64, 67 |

The constructor runs lines 55 to 65 between `BEGIN IMMEDIATE` and `COMMIT`. The `catch` closes the database for every failure, so a refused file stays unchanged.

## Tests

| File | Suite in package.json | Provider routes, store members or options that the file uses |
| --- | --- | --- |
| `apps/host/tests/opencode-resources.test.mjs` | `test:opencode-resources` | `GET /api/settings`, the field `runtime` |
| `apps/host/tests/web-management.test.mjs` | `test:local-web` | `GET /api/settings`, `PUT /api/providers/:providerId`, `DELETE /api/providers/:providerId`, `ProviderStore.load`, `save`, `remove`, `selectable`, the options `check` and `catalog`, and the deletion marker |
| `e2e/env-startup.test.mjs` | `test:env-startup` | `GET /api/settings` with no token, which expects 401 |
| `e2e/opencode-live.test.mjs` | `test:opencode-live` | `PUT /api/providers/:providerId` with a live key and a live model list |
| `apps/host/tests/brief-host.test.mjs` | `test:brief-foundation` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `ProviderStore.selectable` through a chat selection |
| `apps/host/tests/research-image-generation.test.mjs` | `test:generation-publication` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable`, the option `credentials` |
| `apps/host/tests/research.test.mjs` | `test:research` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable`, the option `credentials` |
| `e2e/artifact-rendering.test.mjs` | `test:generation-publication` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable`, the option `credentials` |
| `e2e/attachment-admission.test.mjs` | `test:attachments` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable` |
| `e2e/generation-bridge.test.mjs` | `test:generation-publication` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable` |
| `e2e/generation-continuation-http.test.mjs` | `test:generation-publication` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable`, the option `credentials` |
| `e2e/image-recovery-http.test.mjs` | `test:images`, and `test:generation-publication` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable`, the option `credentials` |
| `e2e/interview-workflow.test.mjs` | `test:deck-review` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable`, the option `credentials` |
| `e2e/layout-review-http.test.mjs` | `test:deck-review`, and `test:layouts` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable` |
| `e2e/portable-generation-http.test.mjs` | `test:images`, and `test:generation-publication` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable` |
| `e2e/source-requests.test.mjs` | `test:source-permissions` | `providerAccess.check`, `providerAccess.catalog`, `PUT /api/providers/test`, `selectable` |

- A save with a new key calls the check before the write: the test `settings persist encrypted keys, keep the chat selection across restart, and open for repair of a damaged key`. The fixture endpoint answers only the key `fixture-key-`, and the save with `key: 'wrong'` gives `PROVIDER_KEY_REFUSED`. The later save of `providers/other` gives `PROVIDER_NAME_EXISTS`, so the refused save wrote no row.
- A save with fewer models than before clears the selection of the chats that selected a removed model: the same test. The save with `models: []` makes `GET /api/sessions` give `selectable: false`.
- Removing a provider writes the marker `{ deleted: true }`, and a later start with a CLI flag for the same provider does not bring it back: the test `deleting an environment-bootstrapped provider persists across restart with the same startup options`.
- A failed write of the table `providers` removes the new credential: no test found.

## Open items

None.

## What the commands do not prove

- Step 4 does not find a caller that uses a variable with another name than `providers`.
- Step 5 does not find a write to `web.sqlite` through a variable with another name than `this.db`.
- Step 7 does not find a Browser read that a helper with another name than `client` or `management` makes.
- Step 4 reads the declared type only. It does not prove that the value of `providers` in `prepare-runtime.ts` is the store of the running Host.
- Step 4 does not find a member that a caller takes from the store with destructuring or passes as a function value.
- Step 5 lists the lines that call `.run(` and `exec(`. A write through another driver method has no row.
- Step 5 does not prove that a row of `providers` and its credential file always change together. The code removes the new credential after a failed write only.
- Step 6 lists the methods that the code shows. A source that changes without a method call, for example the map `providers`, has no entry.
- Step 8 lists the codes of `new ProviderFailure(`. Other error classes of the two adapter folders, for example `ProviderCheckError` and `CredentialError`, reach the Browser through this map only.
- Step 9 records the suite names of `package.json` at this commit. The table does not prove that each suite passes.
- No command runs a test suite or the build. The tables record text matches and code reads only.
