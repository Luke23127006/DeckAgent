# Task 30: Diagnose the providers module

Read this file to learn the steps of Task 30, which records the facts of the `providers` module before its move, and then stops.

The `providers` module is the third module of Phase 3. Its code is in five places:

- the folder `apps/host/src/features/providers/`.
- the adapter folders `apps/host/src/integrations/providers/` and `apps/host/src/integrations/credentials/`.
- the table `providers` in `web.sqlite`, which `apps/host/src/web-state.ts` creates. The same file holds the table `preferences`.
- the three provider routes and the route `GET /api/settings` in `packages/host/api/src/transport/management-routes.ts`.
- the provider part of the error map in `apps/host/src/local-transport.ts`.

ADR-004 gives the topic `providers` the key `'host'`, a row in `change_versions` and the code `PROVIDERS_STALE`. This task collects the facts that the design of the move needs. It changes no code and it does not design the move.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (sections `## Hình dạng module` and `## Trong lúc chuyển`)
- `docs/architecture/30-decisions.md` (section `## ADR-004`)
- `docs/architecture/10-agent-core.md` (section `## Aggregate và change notice`)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-30-diagnose-providers-module.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-30-diagnose-providers-module.md`

**Interfaces:**

- Uses: no code. The task reads the files below and runs `git grep`.
- Produces: the report tables `Module files`, `Store members`, `Callers`, `Importers`, `Write sites`, `web.sqlite contents`, `Settings fields`, `Browser reads`, `Error map`, `web.sqlite schema path` and `Tests`. Each table has the columns that its step gives.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` in Step 1 prints a line.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Propose a type, a file name, an SQL statement, a route or an owner for the move. This task records facts only.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line. FAIL: one or more lines. The plan files of Revision 3f must have a commit before this task starts.

Run: `git ls-files apps/host/src/modules`

Expected: PASS. 13 lines. Nine lines start with `apps/host/src/modules/workspaces/`, and four lines start with `apps/host/src/modules/chats/`.

Run: `git grep -n "^| 29 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Record the module files**

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/host/src/features/providers/provider-settings.ts apps/host/src/features/providers/built-in-providers.ts apps/host/src/features/providers/index.ts apps/host/src/integrations/providers/provider-catalog.ts apps/host/src/integrations/providers/index.ts apps/host/src/integrations/credentials/credential-store.ts apps/host/src/integrations/credentials/index.ts apps/host/src/web-state.ts`

Expected: PASS. Eight lines, in this order: `378`, `36`, `2`, `182`, `2`, `151`, `2`, `120`.

Read each of the eight files in full. Read these ranges also:

- `packages/host/api/src/transport/management-routes.ts`, lines 6 to 70 (the constant `PROVIDER_ID` and the function `registerSettingsAndProviderRoutes`).
- `packages/host/api/src/transport/contracts.ts`, lines 101 to 122 (the interface `WebManagement`).
- `packages/host/contracts/src/management.ts`, lines 1 to 41 (the types `ProviderProtocol`, `ProviderSettings`, `WebSettings` and `ProviderTemplate`).
- `apps/host/src/local-transport.ts`, lines 15 to 33 and 121 to 127.
- `apps/host/src/server.ts`, lines 64 to 92, 160 to 215, 226 to 297, 355 to 365 and 385 to 392.
- `apps/host/src/features/requests/prepare-runtime.ts`, lines 29 to 65.
- `apps/host/src/cli.ts`, lines 1 to 40.
- `apps/web/src/browser/transport/management-client.ts`, lines 116 to 120 and 234 to 253.

Write the table `Module files` with the columns `File | Lines | Responsibility`. Add one row for each of the eight files and one row for each of the eight ranges. A range line with two or more ranges gives one row. In `Responsibility`, write one sentence about what the code does, from the code that you read. Do not write where the code goes after the move.

- [x] **Step 3: Record the store members**

Read the class `ProviderStore` in `apps/host/src/features/providers/provider-settings.ts`, lines 128 to 378.

Write the table `Store members` with the columns `Member | Tables read | Tables written | In-memory fields written | Inside this.serialize | Calls outside the store`. Add one row for each of these ten members, in this order: `load`, `providerSettings`, `persistentKeys`, `builtIns`, `selectable`, `runSettings`, `save`, `remove`, `catalog`, `close`.

- `Tables read` and `Tables written` are the SQL table names that the member and the private methods that it calls read or write. Write `none` when the member reads or writes no table.
- `In-memory fields written` is the list of the private fields `providers`, `keys`, `deleted`, `mutation` and `catalogAbort` that the member changes. Write `none` when the member changes no field.
- `Inside this.serialize` is `yes` when the body of the member is the function that `this.serialize(` receives. Otherwise it is `no`.
- `Calls outside the store` is the list of calls on `this.credentials`, `this.options.check`, `this.options.catalog` and `this.options.modelsRemoved` that the member makes, in the order of the code. Write `none` when the member makes no such call.

- [x] **Step 4: Record the callers and the importers**

Run: `git grep -n -E "providers\.(load|save|remove|catalog|selectable|runSettings|providerSettings|persistentKeys|builtIns|close)\b" -- apps/host/src packages/host/api/src ':!apps/host/src/features/providers'`

Expected: PASS. 12 lines:

- `apps/host/src/features/requests/prepare-runtime.ts:49`
- `apps/host/src/features/requests/prepare-runtime.ts:50`
- `apps/host/src/features/requests/prepare-runtime.ts:62`
- `apps/host/src/server.ts:250`
- `apps/host/src/server.ts:251`
- `apps/host/src/server.ts:292`
- `apps/host/src/server.ts:293`
- `apps/host/src/server.ts:294`
- `apps/host/src/server.ts:361`
- `apps/host/src/server.ts:362`
- `apps/host/src/server.ts:363`
- `apps/host/src/server.ts:389`

For each line, read the line and the declaration of the variable before the dot. Write the table `Callers` with the columns `Caller | Line | Member | Receiver type | Caller area`. `Member` is the name after the dot. `Receiver type` is the declared type of the variable before the dot, for example `ProviderStore` or `Pick<ProviderStore, ...>`. Use this table for `Caller area`:

| Signal | Caller area |
| --- | --- |
| `Receiver type` does not contain `ProviderStore` | `not a provider member` |
| The path starts with `apps/host/src/features/requests/` | `requests` |
| The path is `apps/host/src/server.ts` and the line is in the function `createRuntimeLayer` | `composition root, runtime layer` |
| The path is `apps/host/src/server.ts` and the line is in the function `createHostOptions` | `composition root, HTTP options` |
| The path is `apps/host/src/server.ts` | `composition root, other` |
| No row matches | Write `unknown` and add the line to the list `Open items` of the report. |

Use the rows of the decision table in order. The first row that matches gives the value.

Run: `git grep -n -E "(features|integrations)/(providers|credentials)/" -- apps packages e2e tests scripts`

Expected: PASS. 15 lines:

- `apps/host/src/cli.ts:7`
- `apps/host/src/cli.ts:8`
- `apps/host/src/features/providers/provider-settings.ts:4`
- `apps/host/src/features/providers/provider-settings.ts:5`
- `apps/host/src/features/providers/provider-settings.ts:6`
- `apps/host/src/features/providers/provider-settings.ts:7`
- `apps/host/src/features/research/research-coordinator.ts:4`
- `apps/host/src/local-transport.ts:8`
- `apps/host/src/server.ts:28`
- `apps/host/src/server.ts:30`
- `apps/host/src/server.ts:31`
- `apps/host/src/server.ts:50`
- `apps/host/tests/fixtures/b02-helpers.mjs:12`
- `apps/web/src/browser/boot.ts:12`
- `apps/web/src/browser/chat-navigation.ts:8`

Run: `git grep -n -E "from '\.\./providers/index\.ts'" -- apps/host/src/integrations`

Expected: PASS. Four lines: `apps/host/src/integrations/opencode/config.ts:3`, `apps/host/src/integrations/opencode/contracts.ts:4`, `apps/host/src/integrations/opencode/provider.ts:3` and `apps/host/src/integrations/opencode/runtime.ts:8`.

Write the table `Importers` with the columns `File | Line | Imported names | Imported folder | Importer area`. Add one row for each line of the two commands. `Imported names` is the list of names between `{` and `}` of the import. `Imported folder` is `features/providers`, `integrations/providers` or `integrations/credentials`. For the four lines of the second command, the folder is `integrations/providers`. Use this table for `Importer area`:

| Signal | Importer area |
| --- | --- |
| The path starts with `apps/web/src/browser/` | `Browser, not Host code` |
| The path starts with `apps/host/src/features/providers/` | `providers` |
| The path starts with `apps/host/src/features/research/` | `research` |
| The path starts with `apps/host/src/integrations/opencode/` | `opencode` |
| The path starts with `apps/host/tests/` | `test fixture` |
| The path is `apps/host/src/cli.ts` | `CLI` |
| The path is `apps/host/src/local-transport.ts` | `error map and HTTP adapter` |
| The path is `apps/host/src/server.ts` | `composition root` |
| No row matches | Write `unknown` and add the line to the list `Open items` of the report. |

Use the rows of the decision table in order. The first row that matches gives the value.

- [x] **Step 5: Record the write sites and the contents of web.sqlite**

Run: `git grep -n -E "\.run\(|exec\(" -- apps/host/src/features/providers apps/host/src/features/research apps/host/src/web-state.ts`

Expected: PASS. Ten lines:

- `apps/host/src/features/providers/provider-settings.ts:325`
- `apps/host/src/features/providers/provider-settings.ts:369`
- `apps/host/src/features/research/research-coordinator.ts:115`
- `apps/host/src/features/research/research-coordinator.ts:131`
- `apps/host/src/web-state.ts:55`
- `apps/host/src/web-state.ts:58`
- `apps/host/src/web-state.ts:62`
- `apps/host/src/web-state.ts:65`
- `apps/host/src/web-state.ts:88`
- `apps/host/src/web-state.ts:98`

Run: `git grep -n "this.write(" -- apps/host/src/features/providers/provider-settings.ts`

Expected: PASS. Two lines: 172 and 299.

Write the table `Write sites` with the columns `Line | Public method | Statement | Inside a SQL transaction | Credential store call before the write | Effects after the write in the same method`. Add one row for line 325 and one row for each line of the second command.

- `Public method` is the public method of `ProviderStore` that contains the line.
- `Statement` is the SQL text that the line runs. For lines 172 and 299, write the SQL text of the private method `write`.
- `Inside a SQL transaction` is `yes` when the line runs between a `BEGIN` and a `COMMIT` on the same database. Otherwise it is `no`.
- `Credential store call before the write` is the call on `this.credentials` that runs before the line in the same method, or `none`.
- `Effects after the write in the same method` is the list of the effects that run after the line, in the order of the code. An effect is a change to an in-memory field, a call on `this.credentials` or a call on `this.options.modelsRemoved`.

Then read `apps/host/src/server.ts`, lines 246 to 248 (the function `modelsRemoved`), and `packages/session/persistence/src/index.ts`, the method `clearSelections`. Add one line below the table: the table that `clearSelections` writes, and whether `clearSelections` increases the chats version.

Run: `git grep -n -E "(FROM|INTO|TABLE( IF NOT EXISTS)?) (providers|preferences)\b" -- apps/host/src`

Expected: PASS. 13 lines:

- `apps/host/src/features/providers/provider-settings.ts`: lines 144, 323 and 367.
- `apps/host/src/features/research/research-coordinator.ts`: lines 40, 113 and 129.
- `apps/host/src/web-state.ts`: lines 59, 62, 63, 73, 86, 96 and 103.

Write the table `web.sqlite contents` with the columns `Table | Key or row | Written by | Read by | Value shape`. Add one row for each row kind of the two tables:

- `providers`: one row for a saved configuration and one row for a deletion marker (`{ deleted: true }`).
- `preferences`: one row for each `key` value that the code writes (`theme`, `lastSelection` and `research`).

`Written by` and `Read by` are the class and the method, for example `ProviderStore.save` or `WebState.preferences`.

- [x] **Step 6: Record the fields of the settings reply**

Read `apps/host/src/server.ts`, lines 290 to 296 (the function `settings` of `createRuntimeLayer`), and the method `providerSettings` of `ProviderStore`.

Write the table `Settings fields` with the columns `Field | Set by | Source | Methods that change the source`. Add one row for each of the five fields of the interface `WebSettings` in `packages/host/contracts/src/management.ts`, in the order of the interface. Then add one row for each of the eight fields of the interface `ProviderSettings`, in the order of the interface, with the field name `providers[].<field>`.

- `Set by` is the function that writes the field into the object: `settings` of `createRuntimeLayer`, or `ProviderStore.providerSettings`.
- `Source` is the store and the value that gives the field, for example `ProviderStore, providers map` or `ResearchCoordinator.settings()`.
- `Methods that change the source` is the list of the methods that change the source, from the code that you read. When you did not read the method, write `not in the lines read`.

Then read `apps/host/src/server.ts`, lines 160 to 215, and `apps/host/src/web-state.ts`, lines 101 to 115. Add one line below the table: which field of the chat list (`GET /api/sessions`) reads `ProviderStore.selectable`, and through which functions.

- [x] **Step 7: Record the Browser reads**

Run: `git grep -n -E "(client|management)\.(settings|save|remove|catalog)\(" -- apps/web/src/browser`

Expected: PASS. Five lines:

- `apps/web/src/browser/chat-navigation.ts:158`
- `apps/web/src/browser/features/providers/provider-model-draft.ts:69`
- `apps/web/src/browser/features/providers/settings-panel.ts:154`
- `apps/web/src/browser/features/providers/settings-panel.ts:252`
- `apps/web/src/browser/features/providers/settings-panel.ts:274`

Read 30 lines before each line of the output and 10 lines after each line of the output. Read also each caller of the function that contains the line, in `apps/web/src/browser/`. Use `git grep -n "<function name>" -- apps/web/src/browser` to find the callers.

Write the table `Browser reads` with the columns `File | Line | Client method | HTTP route | Function that makes the call | Event that runs the function | What the Browser does with the reply`. `Event` is the user action, the timer or the change notice that you see in the code, for example a click handler, `focus` or a `chats` notice. When the code that you read does not show the event, write `not in the lines read`.

- [x] **Step 8: Record the error map and the web.sqlite schema path**

Run: `git grep -n "new ProviderFailure(" -- apps/host/src/features/providers`

Expected: PASS. 28 lines:

- Lines 93, 94, 98, 112, 113, 114, 116, 118, 119, 121 and 151.
- Lines 239, 241, 257, 259, 261, 262, 266, 267, 269, 270 and 272.
- Lines 286, 302, 319, 337, 338 and 352.

Write the table `Error map` with the columns `Code | HTTP status in providerStatus | Thrown at | Public method | HTTP route`. Add one row for each key of `providerStatus` in `apps/host/src/local-transport.ts`, lines 15 to 33, in the order of the object.

- `Thrown at` is the list of lines of the command output that give the code. Line 286 gives the code of a `CredentialError` or `CREDENTIAL_NOT_SAVED`. Read the class `CredentialError` in `apps/host/src/integrations/credentials/credential-store.ts` and list line 286 for each `CredentialErrorCode`.
- `Public method` is the public method of `ProviderStore` that contains the line, or the method that calls the function `parse` or `checkFailure` that contains the line.
- `HTTP route` is `PUT /api/providers/:providerId` for `save`, `DELETE /api/providers/:providerId` for `remove`, `GET /api/providers/:providerId/catalog` for `catalog`, and the request route that `prepare-runtime.ts` serves for `runSettings`. Write `startup` for `load`.

After the table, add two lists. The list `Codes thrown with no providerStatus key` holds each code of the command output that has no key in `providerStatus`. The list `providerStatus keys with no throw` holds each key that no line of the command output gives. Write `None` for an empty list.

Read `apps/host/src/web-state.ts`, lines 39 to 70.

Write the table `web.sqlite schema path` with the columns `Condition on user_version, application_id and tables | Action | Line`. Write one row for each branch of the constructor: the fresh file, a file with `application_id` `0x44415742` and `user_version` 1, and any other file. Add one row for the statement on line 62 and one row for the check on line 64.

- [x] **Step 9: Record the tests**

Run: `git grep -l -E "api/providers|api/settings['\`]" -- e2e apps/host/tests apps/web/tests packages/host/api/tests tests`

Expected: PASS. Four lines: `apps/host/tests/opencode-resources.test.mjs`, `apps/host/tests/web-management.test.mjs`, `e2e/env-startup.test.mjs` and `e2e/opencode-live.test.mjs`.

Run: `git grep -l "providerAccess" -- e2e apps/host/tests apps/web/tests tests`

Expected: PASS. 12 lines: three files in `apps/host/tests/` (`brief-host.test.mjs`, `research-image-generation.test.mjs`, `research.test.mjs`) and nine files in `e2e/` (`artifact-rendering.test.mjs`, `attachment-admission.test.mjs`, `generation-bridge.test.mjs`, `generation-continuation-http.test.mjs`, `image-recovery-http.test.mjs`, `interview-workflow.test.mjs`, `layout-review-http.test.mjs`, `portable-generation-http.test.mjs`, `source-requests.test.mjs`).

Write the table `Tests` with the columns `File | Suite in package.json | Provider routes, store members or options that the file uses`. Add one row for each file of the two commands. To find the suite, run `git grep -n "<file path>" -- package.json` for each file. When the output has no line, write `no suite`.

Then read the tests of `apps/host/tests/web-management.test.mjs` that call `api/providers`. Add one line below the table for each of these behaviors, with the test name that covers it, or `no test found`:

- A save with a new key calls the check before the write.
- A save with fewer models than before clears the selection of the chats that selected a model that is no longer in the list.
- A delete writes the deletion marker, and a later start with a CLI flag for the same provider does not bring it back.
- A failed write of the table `providers` deletes the new credential.

- [x] **Step 10: Write the report file and stop**

1. Mark Steps 1 to 9 as `- [x]` in this file. Change the Task 30 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and link `../reports/task-30-diagnose-providers-module.md`.
2. Create `docs/build/refactor/target-structure/reports/task-30-diagnose-providers-module.md` with:
   - The H1 `# Task 30: Diagnose the providers module report` and the purpose line `Read this file to learn the code, the store members, the callers, the write sites, the settings fields and the tests of the providers module before its move.`
   - Files changed.
   - Commands run, with the exit code and the key output of each command.
   - The eleven tables of Steps 2 to 9.
   - The lines below the tables of Steps 5, 6 and 9, and the two lists of Step 8.
   - The list `Open items`, with each line that a decision table sent to the report. Write `None` when the list is empty.
   - What the commands do not prove. Include at least these three items. Step 4 does not find a caller that uses a variable with another name than `providers`. Step 5 does not find a write to `web.sqlite` through a variable with another name than `this.db`. Step 7 does not find a Browser read that a helper with another name than `client` or `management` makes.
3. Add a row for Task 30 in `docs/build/refactor/target-structure/reports/README.md`.
4. Run `corepack pnpm@11.28.5 check:docs`. Expected: PASS. The output contains `0 error(s)`.
5. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-30-diagnose-providers-module.md`. When `python` is not available, run the same script with `python3` or `python3.12`. Expected: PASS. The output contains `0 violations`.
6. Mark Step 10 as `- [x]`, stop, and send the report summary.
