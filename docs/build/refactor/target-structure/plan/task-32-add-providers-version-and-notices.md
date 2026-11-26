# Task 32: Add the providers version and change notices

Read this file to learn the steps of Task 32, which gives the provider configurations one `version` in `web.sqlite` and a `providers` notice after each committed change.

**Type:** Code

After this task, `web.sqlite` has schema 2, and each provider `save` or `remove` that writes a row increases the version once and sends a `providers` notice before `modelsRemoved`. `load` does not increase the version. `GET /api/changes` sends the current `providers` version on connect, after `workspaces` and `chats`. `GET /api/settings` has the field `providersVersion`. The provider writes do not take `expectedVersion` yet: Task 33 adds it.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `apps/host/src/web-state.ts` (the constructor of `WebState`)
- `apps/host/src/modules/providers/providers.store.ts` and `providers.service.ts` (the methods `load`, `save` and `remove`)
- `apps/host/src/modules/workspaces/schema.ts` (the statement `CREATE TABLE change_versions`)
- `apps/host/src/server.ts` (the function `createRuntimeLayer` and the object `changes`)
- `e2e/local-foundation.test.mjs` (the functions `changeNotices`, `area` and `api`)
- `docs/architecture/10-agent-core.md` (the section `Aggregate vÃ  change notice`)

**Files:**

- Change: `apps/host/src/web-state.ts`, `apps/host/src/modules/providers/providers.store.ts`, `apps/host/src/modules/providers/providers.service.ts`, `apps/host/src/server.ts`
- Change: `packages/host/contracts/src/management.ts` (the interface `WebSettings`)
- Change: `apps/web/src/browser/transport/management-decoders.ts` (the function `decodeSettings`) and `apps/web/src/browser/chat-navigation.ts` (the function `emptySettings`)
- Change: `docs/architecture/10-agent-core.md` (the row `providers` of the aggregate table)
- Test: `e2e/local-foundation.test.mjs`

**Interfaces:**

- `SqliteProviderStore.version(): number` reads `SELECT version FROM change_versions WHERE topic = 'providers' AND key = 'host'`.
- `SqliteProviderStore.put(row: ProviderRow): number` runs `BEGIN IMMEDIATE`, the row upsert, `UPDATE change_versions SET version = version + 1 WHERE topic = 'providers' AND key = 'host'` and `COMMIT`, and returns the new version. On an error it runs `ROLLBACK` and throws the error again.
- `SqliteProviderStore.upgrade(row: ProviderRow): void` runs the row upsert only. `load` uses it for the rewrite of an older row.
- `ProviderConfigurationsOptions.onProvidersChanged?: (version: number) => void`
- `ProviderConfigurations.version(): number` returns `this.store.version()`.
- `WebSettings.providersVersion: number`. `decodeSettings` requires a non-negative safe integer, and `emptySettings` gives `0`.

**STOP when:** a test of Step 2 passes before Step 3.

**Forbidden:** change the order of the calls in `save` or `remove`, except the new call of `onProvidersChanged`.

## Schema rules

| File state | Action in the constructor of `WebState` |
| --- | --- |
| A fresh file | Create `providers`, `preferences` and `change_versions`. Insert `('providers', 'host', 0)`. Set `application_id` to `1145132866` and `user_version` to 2. |
| `application_id` `0x44415742` and `user_version` 1 | Create `change_versions`, insert `('providers', 'host', 0)` and set `user_version` to 2, between `BEGIN IMMEDIATE` and `COMMIT`. Keep each row of `providers` and `preferences`. |
| `application_id` `0x44415742` and `user_version` 2 | Keep the file. |
| Any other file | Throw `WebStateError('SETTINGS_SCHEMA')`, as now. |

`change_versions` has the same columns as in `apps/host/src/modules/workspaces/schema.ts`: `topic TEXT NOT NULL`, `key TEXT NOT NULL`, `version INTEGER NOT NULL CHECK (version >= 0)`, `PRIMARY KEY (topic, key)`, `STRICT`. Keep `CREATE TABLE IF NOT EXISTS preferences`.

## Notice rules

- `save`: call `this.options.onProvidersChanged?.(version)` after `this.keys.set` or `this.keys.delete`, before `await this.credentials.remove(previous.credentialRef)`.
- `remove`: call it after `this.keys.delete(id)`, before `await this.credentials.remove(previous.credentialRef)`.
- `server.ts`: `onProvidersChanged: version => changeFeed.publish({ topic: 'providers', key: 'host', version })`. Add `{ topic: 'providers', version: () => runtime.providers.version() }` after the `chats` entry of `hostTopics`. Add `providersVersion: providers.version()` to the function `settings` of `createRuntimeLayer`. Give `changeFeed` to `createRuntimeLayer` as a new last parameter.
- `docs/architecture/10-agent-core.md`: in the row `providers`, change the cell `KhÃ´ng cÃ³ \`version\`` to `CÃ³ \`version\` trong \`change_versions\` cá»§a \`web.sqlite\` (schema 2), notice \`providers\` sau commit`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 31 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

In `e2e/local-foundation.test.mjs`, change the function that `changeNotices` returns: `if (topic === undefined || notice.topic === topic) return notice`. Change its comment to `Opens GET /api/changes. The returned function gives the next notice of one topic, or of any topic when no topic is given.` Then add these two tests after the last test that uses `changeNotices`:

```js
const providerAccess = { check: async () => {}, catalog: async () => [] }
const fixtureProvider = models => ({
  displayName: 'Fixture',
  protocol: 'chat-completions',
  baseUrl: 'http://127.0.0.1:1',
  models,
})

test('provider writes increase the providers version and send the providers notice before the chats notice', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  const app = await start({ providerAccess })
  const call = api(app)
  const nextNotice = await changeNotices(app, t)
  assert.deepEqual(await nextNotice('providers'), { topic: 'providers', key: 'host', version: 0 })
  assert.equal((await call('settings')).data.providersVersion, 0)

  assert.equal((await call('providers/fixture', 'PUT', { ...fixtureProvider(['a', 'b']), new: true })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'providers', key: 'host', version: 1 })
  const first = await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'b' } })
  assert.equal(first.status, 201)
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 1 })

  assert.equal((await call('providers/fixture', 'PUT', fixtureProvider(['a']))).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'providers', key: 'host', version: 2 })
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 2 })

  const invalid = await call('providers/fixture', 'PUT', fixtureProvider('a'))
  assert.deepEqual([invalid.status, invalid.data.error.code], [400, 'INVALID_PROVIDER'])
  assert.equal((await call('settings')).data.providersVersion, 2, 'A refused write keeps the version')

  const second = await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'a' } })
  assert.equal(second.status, 201)
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 3 })
  assert.equal((await call('providers/fixture', 'DELETE')).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'providers', key: 'host', version: 3 })
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 4 })

  await app.close()
  const restarted = await start({ providerAccess })
  assert.equal((await api(restarted)('settings')).data.providersVersion, 3, 'A start keeps the version')
})

test('web.sqlite schema 1 upgrades to schema 2 in place and keeps providers and preferences', {
  timeout: 30000,
}, async t => {
  const { start, options } = await area(t)
  const first = await start({ providerAccess })
  const call = api(first)
  assert.equal((await call('providers/kept', 'PUT', { ...fixtureProvider(['a']), new: true })).status, 200)
  const gone = { ...fixtureProvider(['b']), displayName: 'Gone', new: true }
  assert.equal((await call('providers/gone', 'PUT', gone)).status, 200)
  assert.equal((await call('providers/gone', 'DELETE')).status, 200)
  assert.equal((await call('preferences', 'PUT', { theme: 'dark' })).status, 200)
  await first.close()
  const path = join(options.dataDir, 'db', 'web.sqlite')
  const old = new DatabaseSync(path)
  old.exec('DROP TABLE change_versions; PRAGMA user_version=1')
  old.close()

  const second = await start({ providerAccess })
  const settings = (await api(second)('settings')).data
  assert.deepEqual(
    settings.providers.map(provider => provider.id),
    ['kept'],
  )
  assert.equal(settings.providersVersion, 0)
  assert.deepEqual((await api(second)('preferences')).data, { theme: 'dark' })
  const check = new DatabaseSync(path, { readOnly: true })
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 2)
  assert.deepEqual(
    check
      .prepare('SELECT topic, key, version FROM change_versions')
      .all()
      .map(row => ({ ...row })),
    [{ topic: 'providers', key: 'host', version: 0 }],
  )
  check.close()
  await second.close()

  const future = new DatabaseSync(path)
  future.exec('PRAGMA user_version=3')
  future.close()
  await assert.rejects(start({ providerAccess }), error => error instanceof StorageError && error.code === 'STORAGE_CORRUPT')
})
```

Run: `corepack pnpm@11.28.5 build` and then `node --test e2e/local-foundation.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [x] **Step 3: Write the code**

Do the changes of the sections `Interfaces`, `Schema rules` and `Notice rules`.

Run: `corepack pnpm@11.28.5 build` and then `node --test e2e/local-foundation.test.mjs`

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the tests fail**

1. In `providers.service.ts`, move the call of `onProvidersChanged` in `save` to after `await this.options.modelsRemoved?.(id, removed)`. Build and run `node --test e2e/local-foundation.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change.
2. In `providers.store.ts`, remove the `UPDATE change_versions` statement from `put`. Build and run the same command. Expected: FAIL. `# fail 1`. Undo the change.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the Browser does not read `providersVersion` or the `providers` notice yet. Task 34 adds it. The upgrade test reads one schema 1 file that the current code made.
- `CHANGELOG.md` line: ``- Upgrade `web.sqlite` to schema 2 with `change_versions`, increase the providers version in the transaction of each provider save and removal, publish `{ topic: 'providers', key: 'host' }` notices before the chats notice of a removed model, and add `providersVersion` to `GET /api/settings`. Task 32 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: add the providers version and change notices`
