import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { StorageError, resolveStorageRoot, startLocalWeb } from '@deckagent/host'
import { SqliteSessionStore } from '@deckagent/session-persistence'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Opens GET /api/changes. The returned function gives the next notice of one topic, or of any topic when no topic is given. */
async function changeNotices(app, t) {
  const streamControl = new AbortController()
  t.after(() => streamControl.abort())
  const streamResponse = await fetch(`${app.origin}/api/changes`, {
    headers: { authorization: `Bearer ${app.token}` },
    signal: streamControl.signal,
  })
  assert.equal(streamResponse.status, 200)
  const reader = streamResponse.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  return async topic => {
    while (true) {
      const boundary = buffer.indexOf('\n\n')
      if (boundary >= 0) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        if (!frame.startsWith('event: change\ndata: ')) continue
        const notice = JSON.parse(frame.slice('event: change\ndata: '.length))
        if (topic === undefined || notice.topic === topic) return notice
        continue
      }
      const part = await reader.read()
      if (part.done) throw new Error('Stream ended')
      buffer += decoder.decode(part.value, { stream: true }).replace(/\r\n/g, '\n')
    }
  }
}

async function tree(folder) {
  const entries = []
  for (const name of (await readdir(folder)).toSorted()) {
    const info = await stat(join(folder, name))
    entries.push([name, info.size, info.mtimeMs, info.isDirectory() ? await tree(join(folder, name)) : null])
  }
  return entries
}

/** A temp area with a home folder, a data root and helpers that close every Host before the folder is removed. */
async function area(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-foundation-'))
  const home = join(dir, 'home')
  await mkdir(home)
  const apps = []
  t.after(async () => {
    for (const app of apps) await app.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  const options = { dataDir: join(dir, 'data'), home }
  const start = async (extra = {}) => {
    const app = await startLocalWeb({ ...options, ...extra })
    apps.push(app)
    return app
  }
  const project = async (name, files = { 'notes.md': '# Notes', '.hidden': 'h' }) => {
    const path = join(dir, name)
    await mkdir(path, { recursive: true })
    for (const [file, content] of Object.entries(files)) await writeFile(join(path, file), content)
    return path
  }
  return { dir, home, options, start, project }
}

function api(app) {
  return async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const text = await response.text()
    return { status: response.status, data: text ? JSON.parse(text) : undefined, text }
  }
}

test('Application Storage root: --data-dir, then DECKAGENT_DATA_DIR, then the app-data folder of the OS', () => {
  assert.equal(
    resolveStorageRoot({
      flag: 'D:\\data',
      env: { DECKAGENT_DATA_DIR: 'E:\\other' },
      platform: 'win32',
      home: 'C:\\Users\\me',
    }),
    'D:\\data',
  )
  assert.equal(
    resolveStorageRoot({ env: { DECKAGENT_DATA_DIR: 'E:\\other' }, platform: 'win32', home: 'C:\\Users\\me' }),
    'E:\\other',
  )
  assert.equal(
    resolveStorageRoot({
      env: { LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' },
      platform: 'win32',
      home: 'C:\\Users\\me',
    }),
    'C:\\Users\\me\\AppData\\Local\\DeckAgent',
  )
  assert.equal(
    resolveStorageRoot({ env: {}, platform: 'win32', home: 'C:\\Users\\me' }),
    'C:\\Users\\me\\AppData\\Local\\DeckAgent',
  )
  assert.equal(
    resolveStorageRoot({ env: {}, platform: 'darwin', home: '/Users/me' }),
    '/Users/me/Library/Application Support/DeckAgent',
  )
  assert.equal(
    resolveStorageRoot({ env: { XDG_DATA_HOME: '/xdg' }, platform: 'linux', home: '/home/me' }),
    '/xdg/deckagent',
  )
  assert.equal(resolveStorageRoot({ env: {}, platform: 'linux', home: '/home/me' }), '/home/me/.local/share/deckagent')
  assert.equal(
    resolveStorageRoot({ flag: '  ', env: {}, platform: 'linux', home: '/home/me' }),
    '/home/me/.local/share/deckagent',
    'A blank flag is ignored',
  )
})

test('first boot -> default workspace -> create chat -> restart -> reopen with the same IDs and workspace in use', async t => {
  const { start, project, options } = await area(t)
  let app = await start()
  let call = api(app)
  const first = (await call('workspaces')).data
  assert.deepEqual(
    first.workspaces.map(item => [item.id, item.isDefault, item.folder, item.folderStatus]),
    [['default', true, null, 'none']],
  )
  assert.equal(first.selectedId, 'default')
  const inDefault = (await call('sessions', 'POST', {})).data
  assert.equal(inDefault.workspaceId, 'default')
  assert.equal(first.version, 0)
  const added = (await call('workspaces', 'POST', { folder: await project('Dự án'), expectedVersion: first.version }))
    .data
  const workspaceId = added.selectedId
  assert.notEqual(workspaceId, 'default')
  assert.equal(added.workspaces.find(item => item.id === workspaceId).name, 'Dự án')
  const inProject = (await call('sessions', 'POST', {})).data
  assert.equal(inProject.workspaceId, workspaceId, 'A new chat joins the workspace in use')
  await app.close()
  app = await start()
  call = api(app)
  const again = (await call('workspaces')).data
  assert.equal(again.selectedId, workspaceId, 'The workspace in use when DeckAgent stopped is in use again')
  const chats = (await call('sessions')).data
  assert.deepEqual(
    chats.map(chat => [chat.sessionId, chat.workspaceId]).toSorted(),
    [
      [inDefault.sessionId, 'default'],
      [inProject.sessionId, workspaceId],
    ].toSorted(),
  )
  assert.deepEqual((await call(`sessions/${inProject.sessionId}/history`)).data, [])
  const layout = await readdir(options.dataDir)
  assert.deepEqual(layout.toSorted(), ['db', 'files'], 'Application Storage keeps databases and managed files apart')
})

test('the same folder twice gives one workspace; relink keeps ID and chats; remove makes chats ungrouped; no file changes', async t => {
  const { start, project } = await area(t)
  const app = await start()
  const call = api(app)
  const folder = await project('project')
  const other = await project('other')
  const snapshots = [
    [folder, await tree(folder)],
    [other, await tree(other)],
  ]
  const firstAdd = (await call('workspaces', 'POST', { folder, expectedVersion: 0 })).data
  const id = firstAdd.selectedId
  const selectedDefault = (
    await call('workspaces/selected', 'PUT', { id: 'default', expectedVersion: firstAdd.version })
  ).data
  const twice = (await call('workspaces', 'POST', { folder: `${folder}\\.`, expectedVersion: selectedDefault.version }))
    .data
  assert.equal(twice.selectedId, id, 'The folder that already has a workspace makes it the workspace in use')
  assert.equal(twice.workspaces.length, 2)
  const chat = (await call('sessions', 'POST', {})).data
  await call(`sessions/${chat.sessionId}/draft`, 'PUT', { text: 'kept', expectedRevision: 0 })
  const relinked = (await call(`workspaces/${id}/folder`, 'PUT', { folder: other, expectedVersion: twice.version }))
    .data
  assert.equal(relinked.workspaces.find(item => item.id === id).folder.endsWith('other'), true)
  assert.equal(
    (await call('sessions')).data.find(item => item.sessionId === chat.sessionId).workspaceId,
    id,
    'Relink keeps the chats',
  )
  const inUse = await call(`workspaces/default/folder`, 'PUT', { folder, expectedVersion: relinked.version })
  assert.deepEqual([inUse.status, inUse.data.error.code], [409, 'WORKSPACE_DEFAULT'])
  const secondAdd = (await call('workspaces', 'POST', { folder, expectedVersion: relinked.version })).data
  const second = secondAdd.selectedId
  const conflict = await call(`workspaces/${second}/folder`, 'PUT', {
    folder: other,
    expectedVersion: secondAdd.version,
  })
  assert.deepEqual(
    [conflict.status, conflict.data.error.code, conflict.data.error.detail.workspaceName],
    [409, 'WORKSPACE_FOLDER_IN_USE', 'project'],
  )
  const reselected = (await call('workspaces/selected', 'PUT', { id, expectedVersion: secondAdd.version })).data
  const removed = (await call(`workspaces/${id}`, 'DELETE', { expectedVersion: reselected.version })).data
  assert.equal(
    removed.selectedId,
    'default',
    'Removing the workspace in use makes the default workspace the workspace in use',
  )
  const ungrouped = (await call('sessions')).data.find(item => item.sessionId === chat.sessionId)
  assert.equal(ungrouped.workspaceId, null, 'Its chat becomes an ungrouped chat')
  assert.equal((await call(`sessions/${chat.sessionId}/draft`)).data.text, 'kept')
  assert.deepEqual(
    (await call(`workspaces/${id}`, 'DELETE', { expectedVersion: removed.version })).data.error.code,
    'WORKSPACE_NOT_FOUND',
  )
  for (const [path, before] of snapshots)
    assert.deepEqual(await tree(path), before, `No file of ${path} was created, changed or deleted`)
})

test('drafts: each chat keeps its own while DeckAgent runs, and none is kept after DeckAgent stops', async t => {
  const { start } = await area(t)
  let app = await start()
  let call = api(app)
  const a = (await call('sessions', 'POST', {})).data.sessionId
  const b = (await call('sessions', 'POST', {})).data.sessionId
  await call(`sessions/${a}/draft`, 'PUT', { text: 'Draft A', expectedRevision: 0 })
  await call(`sessions/${b}/draft`, 'PUT', { text: 'Draft B', expectedRevision: 0 })
  assert.equal((await call(`sessions/${a}/draft`)).data.text, 'Draft A')
  assert.equal((await call(`sessions/${b}/draft`)).data.text, 'Draft B')
  assert.equal((await call('sessions')).data.find(item => item.sessionId === a).hasDraft, true)
  assert.equal((await call(`sessions/missing/draft`)).status, 404)
  assert.equal((await call(`sessions/${a}/draft`, 'PUT', { text: 'x'.repeat(16001), expectedRevision: 1 })).status, 413)
  assert.equal((await call(`sessions/${a}/draft`, 'PUT', { text: 'x', extra: 1, expectedRevision: 1 })).status, 400)
  assert.equal((await call(`sessions/${a}/draft`)).data.text, 'Draft A', 'A refused draft changes nothing')
  await app.close()
  app = await start()
  call = api(app)
  assert.equal((await call(`sessions/${a}/draft`)).data.text, '', 'FR-038: the draft is not kept after DeckAgent stops')
})

test('search, unreadable chats and folder status: a missing folder keeps its workspace and every chat readable', async t => {
  const { dir, options, start, project } = await area(t)
  const store = new SqliteSessionStore(join(options.dataDir, 'db', 'sessions.sqlite'))
  await store.open('recycling')
  await store.append('recycling', [
    { role: 'user', content: 'Tái chế giấy' },
    { role: 'assistant', content: 'Dàn ý về NHỰA' },
  ])
  await store.open('broken')
  await store.append('broken', [{ role: 'user', content: 'x' }])
  store.close()
  const raw = new DatabaseSync(join(options.dataDir, 'db', 'sessions.sqlite'))
  raw.prepare("UPDATE messages SET payload='{' WHERE session_id='broken'").run()
  raw.close()
  const folder = await project('moving')
  let app = await start()
  let call = api(app)
  const id = (await call('workspaces', 'POST', { folder, expectedVersion: 0 })).data.selectedId
  const chat = (await call('sessions', 'POST', {})).data.sessionId
  assert.deepEqual(
    (await call('sessions/search', 'POST', { words: 'nhựa' })).data.map(item => item.sessionId),
    ['recycling'],
  )
  assert.deepEqual((await call('sessions/search', 'POST', { words: 'không có' })).data, [])
  assert.equal((await call('sessions/search', 'POST', { words: 1 })).status, 400)
  const broken = (await call('sessions')).data.find(item => item.sessionId === 'broken')
  assert.equal(broken.readable, false, 'The unreadable chat stays listed')
  const unreadable = await call('sessions/broken/history')
  assert.deepEqual([unreadable.status, unreadable.data.error.code], [409, 'CHAT_UNREADABLE'])
  await app.close()
  await rename(folder, join(dir, 'moved-away'))
  app = await start()
  call = api(app)
  const status = (await call('workspaces')).data.workspaces.find(item => item.id === id)
  assert.equal(
    status.folderStatus,
    'unreadable',
    'The folder that cannot be read is reported, the workspace stays set up',
  )
  assert.equal((await call(`sessions/${chat}/history`)).status, 200, 'Every chat of it stays readable')
  const refused = await call('workspaces', 'POST', { folder: join(dir, 'does-not-exist'), expectedVersion: 1 })
  assert.deepEqual([refused.status, refused.data.error.code], [422, 'WORKSPACE_FOLDER_UNREADABLE'])
  assert.equal(refused.text.includes(dir), false, 'Error bodies name no path')
  const reason = await call('workspaces', 'POST', { folder: options.dataDir, expectedVersion: 1 })
  assert.deepEqual(
    [reason.status, reason.data.error.code, reason.data.error.detail.reason],
    [422, 'WORKSPACE_FOLDER_REFUSED', 'deckagent-data'],
  )
  assert.equal(reason.text.includes(dir), false)
  const name = await call(`workspaces/${id}`, 'PUT', { name: 'y'.repeat(101), expectedVersion: 1 })
  assert.deepEqual([name.status, name.data.error.code], [400, 'WORKSPACE_NAME_TOO_LONG'])
})

test('a new chat gets the most recent model choice of any chat while it is selectable, and otherwise none', async t => {
  const { start } = await area(t)
  const provider = {
    selection: { provider: 'fixture', model: 'first' },
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:1' }],
  }
  let app = await start(provider)
  let call = api(app)
  const before = (await call('sessions', 'POST', {})).data
  assert.equal(
    before.selection,
    undefined,
    'No model was ever chosen: the new chat has none and none is picked by itself',
  )
  await call(`sessions/${before.sessionId}/selection`, 'PUT', { provider: 'fixture', model: 'first' })
  const after = (await call('sessions', 'POST', {})).data
  assert.deepEqual(after.selection, { provider: 'fixture', model: 'first' })
  await app.close()
  app = await start(provider)
  call = api(app)
  assert.deepEqual(
    (await call('sessions', 'POST', {})).data.selection,
    { provider: 'fixture', model: 'first' },
    'The choice survives a restart',
  )
  assert.equal(
    (await call('providers/fixture', 'DELETE', { expectedVersion: (await call('settings')).data.providersVersion }))
      .status,
    200,
  )
  assert.equal(
    (await call('sessions', 'POST', {})).data.selection,
    undefined,
    'A choice that is no longer selectable gives no model',
  )
})

test('bad Application Storage fails clearly and leaves every file unchanged', async t => {
  const { dir, options, start, project } = await area(t)
  const file = join(dir, 'a-file')
  await writeFile(file, 'user content')
  await assert.rejects(
    startLocalWeb({ dataDir: file }),
    error => error instanceof StorageError && error.code === 'STORAGE_NOT_DIRECTORY',
  )
  assert.equal(await readFile(file, 'utf8'), 'user content')
  await mkdir(join(options.dataDir, 'db'), { recursive: true })
  const damaged = join(options.dataDir, 'db', 'sessions.sqlite')
  await writeFile(damaged, 'this is not a SQLite database, keep me')
  await assert.rejects(
    startLocalWeb(options),
    error =>
      error instanceof StorageError &&
      error.code === 'STORAGE_CORRUPT' &&
      error.message.includes('kept unchanged') &&
      !error.message.includes(dir),
  )
  assert.equal(
    await readFile(damaged, 'utf8'),
    'this is not a SQLite database, keep me',
    'A damaged database is never reset',
  )
  await rm(damaged)
  // A data root inside a registered project folder is refused at start. BR-019 already refuses registering a
  // folder that holds the data root, so the case arises when the data root moves: copy a registry that knows `outer`.
  const outer = await project('outer')
  const app = await start()
  assert.equal((await api(app)('workspaces', 'POST', { folder: outer, expectedVersion: 0 })).status, 200)
  await app.close()
  const nested = join(outer, 'nested-data')
  await mkdir(join(nested, 'db'), { recursive: true })
  await writeFile(
    join(nested, 'db', 'workspaces.sqlite'),
    await readFile(join(options.dataDir, 'db', 'workspaces.sqlite')),
  )
  await assert.rejects(
    startLocalWeb({ ...options, dataDir: nested }),
    error => error instanceof StorageError && error.code === 'STORAGE_INSIDE_WORKSPACE',
  )
  assert.deepEqual(
    (await readdir(join(nested, 'db'))).filter(name => name.endsWith('.sqlite')),
    ['workspaces.sqlite'],
    'The refused start creates no other database',
  )
})

test('the Local Web production path loads no custom Agent Loop or Cordis runtime', async () => {
  for (const name of ['server.js', 'cli.js']) {
    const bundle = await readFile(join(root, 'apps', 'host', 'lib', name), 'utf8')
    for (const legacy of [
      '@deepseek-ai/cordis',
      '@deckagent/agent-runtime',
      'runtimePlugin',
      'AgentRuntime',
      'ToolRegistry',
      '@deckagent/presentation-tools',
    ])
      assert.equal(bundle.includes(legacy), false, `${name} must not reference ${legacy}`)
  }
  const manifest = JSON.parse(await readFile(join(root, 'apps', 'host', 'package.json'), 'utf8'))
  assert.deepEqual(
    Object.keys(manifest.dependencies).filter(name => /cordis|agent-runtime|presentation-tools/.test(name)),
    [],
  )
  // B03 uses the filesystem owner's read interface. Its built entry must not load the legacy runtime.
  const sourceBundle = await readFile(join(root, 'apps', 'host', 'lib', 'types', 'tools', 'index.js'), 'utf8')
  assert.equal(sourceBundle.includes('@deckagent/agent-runtime'), false)
  assert.equal(sourceBundle.includes('@deepseek-ai/cordis'), false)
  const sourceComposition = await readFile(
    join(root, 'apps', 'host', 'src', 'tools', 'executors', 'source-tools.ts'),
    'utf8',
  )
  assert.equal(
    sourceComposition.includes('registerFileTools'),
    false,
    'Production must not register the legacy write tools',
  )
})

test('workspace manifests, TypeScript projects and lockfile exclude the legacy runtime', async () => {
  const retired = /cordis|@deepseek-ai\/|@deckagent\/(?:agent-runtime|model-providers|presentation-tools)/i
  const manifests = [join(root, 'package.json')]
  for (const app of await readdir(join(root, 'apps'))) manifests.push(join(root, 'apps', app, 'package.json'))
  for (const domain of await readdir(join(root, 'packages'))) {
    for (const name of await readdir(join(root, 'packages', domain)))
      manifests.push(join(root, 'packages', domain, name, 'package.json'))
  }
  for (const path of manifests) {
    let source
    try {
      source = await readFile(path, 'utf8')
    } catch (error) {
      if (error.code === 'ENOENT') continue
      throw error
    }
    assert.doesNotMatch(source, retired, path)
    const manifest = JSON.parse(source)
    if (manifest.name === 'deckagent-tooling') assert.equal(manifest.workspaces.includes('vendor/*'), false)
  }
  for (const name of ['tsconfig.json', 'tsconfig.base.json', 'pnpm-lock.yaml'])
    assert.doesNotMatch(await readFile(join(root, name), 'utf8'), retired, name)
  const toolsEntry = await readFile(join(root, 'apps', 'host', 'lib', 'types', 'tools', 'index.js'), 'utf8')
  assert.equal(toolsEntry.includes('registerFileTools'), false)
  assert.equal(toolsEntry.includes('createWorkspaceReader'), false)
})

test('workspace routes check expectedVersion, return 409 WORKSPACES_STALE and publish change notices after ungroup', async t => {
  const { start, project } = await area(t)
  const app = await start()
  const call = api(app)
  const folder = await project('noticed')

  const missingVersion = await call('workspaces', 'POST', { folder })
  assert.deepEqual([missingVersion.status, missingVersion.data.error.code], [400, 'INVALID_REQUEST'])

  const nextNotice = await changeNotices(app, t)

  assert.deepEqual(await nextNotice('workspaces'), { topic: 'workspaces', key: 'host', version: 0 })

  const added = await call('workspaces', 'POST', { folder, expectedVersion: 0 })
  assert.equal(added.status, 200)
  assert.equal(added.data.version, 1)
  assert.deepEqual(await nextNotice('workspaces'), { topic: 'workspaces', key: 'host', version: 1 })

  const stale = await call(`workspaces/${added.data.selectedId}`, 'PUT', { name: 'Old', expectedVersion: 0 })
  assert.deepEqual([stale.status, stale.data.error.code], [409, 'WORKSPACES_STALE'])

  const chat = (await call('sessions', 'POST', {})).data
  assert.equal(chat.workspaceId, added.data.selectedId)

  const noticeAfterRemove = nextNotice('workspaces')
  const removed = await call(`workspaces/${added.data.selectedId}`, 'DELETE', { expectedVersion: 1 })
  assert.equal(removed.status, 200)
  assert.equal(removed.data.version, 2)
  assert.deepEqual(await noticeAfterRemove, { topic: 'workspaces', key: 'host', version: 2 })
  const sessionsAfterNotice = (await call('sessions')).data
  assert.equal(sessionsAfterNotice.find(item => item.sessionId === chat.sessionId).workspaceId, null)
})

test('chat writes publish a chats notice after the commit, and each connection starts with the current version', async t => {
  const { start } = await area(t)
  const app = await start()
  const call = api(app)
  const nextNotice = await changeNotices(app, t)
  assert.deepEqual(await nextNotice('chats'), { topic: 'chats', key: 'host', version: 0 })

  const created = await call('sessions', 'POST', {})
  assert.equal(created.status, 201)
  assert.deepEqual(await nextNotice('chats'), { topic: 'chats', key: 'host', version: 1 })
  assert.ok((await call('sessions')).data.some(item => item.sessionId === created.data.sessionId))

  const later = await changeNotices(app, t)
  assert.deepEqual(await later('chats'), { topic: 'chats', key: 'host', version: 1 })
})

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
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 0 })
  assert.equal((await call('settings')).data.providersVersion, 0)

  assert.equal(
    (await call('providers/fixture', 'PUT', { ...fixtureProvider(['a', 'b']), new: true, expectedVersion: 0 })).status,
    200,
  )
  assert.deepEqual(await nextNotice(), { topic: 'providers', key: 'host', version: 1 })
  const first = await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'b' } })
  assert.equal(first.status, 201)
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 1 })

  assert.equal((await call('providers/fixture', 'PUT', { ...fixtureProvider(['a']), expectedVersion: 1 })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'providers', key: 'host', version: 2 })
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 2 })

  const invalid = await call('providers/fixture', 'PUT', { ...fixtureProvider('a'), expectedVersion: 2 })
  assert.deepEqual([invalid.status, invalid.data.error.code], [400, 'INVALID_PROVIDER'])
  assert.equal((await call('settings')).data.providersVersion, 2, 'A refused write keeps the version')

  const second = await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'a' } })
  assert.equal(second.status, 201)
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 3 })
  assert.equal((await call('providers/fixture', 'DELETE', { expectedVersion: 2 })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'providers', key: 'host', version: 3 })
  assert.deepEqual(await nextNotice(), { topic: 'chats', key: 'host', version: 4 })

  await app.close()
  const restarted = await start({ providerAccess })
  assert.equal((await api(restarted)('settings')).data.providersVersion, 3, 'A start keeps the version')
})

test('web.sqlite schema 1 upgrades to schema 3 in place and keeps providers and preferences', {
  timeout: 30000,
}, async t => {
  const { start, options } = await area(t)
  const first = await start({ providerAccess })
  const call = api(first)
  assert.equal(
    (await call('providers/kept', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })).status,
    200,
  )
  const gone = { ...fixtureProvider(['b']), displayName: 'Gone', new: true }
  assert.equal((await call('providers/gone', 'PUT', { ...gone, expectedVersion: 1 })).status, 200)
  assert.equal((await call('providers/gone', 'DELETE', { expectedVersion: 2 })).status, 200)
  assert.equal(
    (
      await call('preferences', 'PUT', {
        theme: 'dark',
        expectedVersion: (await call('settings')).data.preferencesVersion,
      })
    ).status,
    200,
  )
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
  assert.deepEqual((await api(second)('preferences')).data, { theme: 'dark', version: 0 })
  const check = new DatabaseSync(path, { readOnly: true })
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 3)
  assert.deepEqual(
    check
      .prepare('SELECT topic, key, version FROM change_versions')
      .all()
      .map(row => ({ ...row })),
    [
      { topic: 'providers', key: 'host', version: 0 },
      { topic: 'preferences', key: 'host', version: 0 },
    ],
  )
  check.close()
  await second.close()

  const future = new DatabaseSync(path)
  future.exec('PRAGMA user_version=4')
  future.close()
  await assert.rejects(
    start({ providerAccess }),
    error => error instanceof StorageError && error.code === 'STORAGE_CORRUPT',
  )
})

test('a provider write with an old expectedVersion gets PROVIDERS_STALE and changes nothing', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  let checks = 0
  const app = await start({
    providerAccess: {
      check: async () => {
        checks += 1
      },
      catalog: async () => [],
    },
  })
  const call = api(app)
  const saved = await call('providers/fixture', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })
  assert.equal(saved.status, 200)
  assert.equal(checks, 1)
  const moved = { ...fixtureProvider(['a']), baseUrl: 'http://127.0.0.1:2', expectedVersion: 0 }
  const staleSave = await call('providers/fixture', 'PUT', moved)
  assert.deepEqual([staleSave.status, staleSave.data.error.code], [409, 'PROVIDERS_STALE'])
  assert.equal(checks, 1, 'A stale save must not call the provider')
  const staleRemove = await call('providers/fixture', 'DELETE', { expectedVersion: 0 })
  assert.deepEqual([staleRemove.status, staleRemove.data.error.code], [409, 'PROVIDERS_STALE'])
  const settings = (await call('settings')).data
  assert.deepEqual(
    [settings.providersVersion, settings.providers.map(provider => provider.baseUrl)],
    [1, ['http://127.0.0.1:1']],
  )
  for (const body of [fixtureProvider(['a']), { ...fixtureProvider(['a']), expectedVersion: -1 }]) {
    const invalid = await call('providers/fixture', 'PUT', body)
    assert.deepEqual([invalid.status, invalid.data.error.code], [400, 'INVALID_REQUEST'])
  }
  const noBody = await call('providers/fixture', 'DELETE')
  assert.deepEqual([noBody.status, noBody.data.error.code], [400, 'INVALID_REQUEST'])
  assert.equal((await call('providers/fixture', 'DELETE', { expectedVersion: 1 })).status, 200)
  assert.equal((await call('settings')).data.providersVersion, 2)
})

test('preferences and research writes increase the preferences version, send notices and keep version on rememberSelection and reopen', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  const freeUsage = {
    key: { usage: 0, limit: null },
    account: { current_plan: 'Researcher', plan_usage: 0, plan_limit: 1000, paygo_usage: 0, paygo_limit: null },
  }
  const researchAccess = {
    key: 'env-research-key',
    fetch: async (_url, init) =>
      init?.headers?.Authorization === 'Bearer bad-key'
        ? new Response('denied', { status: 401 })
        : Response.json(freeUsage),
  }
  const app = await start({ providerAccess, researchAccess })
  const call = api(app)
  const nextNotice = await changeNotices(app, t)
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 0 })
  assert.equal((await call('settings')).data.preferencesVersion, 0)
  assert.deepEqual((await call('preferences')).data, { theme: 'system', version: 0 })

  const dark = await call('preferences', 'PUT', {
    theme: 'dark',
    expectedVersion: (await call('settings')).data.preferencesVersion,
  })
  assert.equal(dark.status, 200)
  assert.deepEqual(dark.data, { theme: 'dark', version: 1 })
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 1 })

  assert.equal(
    (
      await call('research', 'PUT', {
        useEnvironment: true,
        expectedVersion: (await call('settings')).data.preferencesVersion,
      })
    ).status,
    200,
  )
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 2 })
  assert.equal((await call('settings')).data.preferencesVersion, 2)

  assert.equal(
    (
      await call('research', 'PUT', {
        key: 'bad-key',
        expectedVersion: (await call('settings')).data.preferencesVersion,
      })
    ).status,
    503,
  )
  assert.equal((await call('settings')).data.preferencesVersion, 2, 'A refused write keeps the version')

  assert.equal(
    (await call('research', 'DELETE', { expectedVersion: (await call('settings')).data.preferencesVersion })).status,
    200,
  )
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 3 })

  assert.equal(
    (await call('providers/fixture', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })).status,
    200,
  )
  assert.equal((await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'a' } })).status, 201)
  assert.equal((await call('settings')).data.preferencesVersion, 3, 'rememberSelection keeps the preferences version')

  await app.close()
  const restarted = await start({ providerAccess, researchAccess })
  assert.equal((await api(restarted)('settings')).data.preferencesVersion, 3, 'A start keeps the version')
})

test('web.sqlite schema 2 upgrades to schema 3 in place and keeps providers, providersVersion and preferences', {
  timeout: 30000,
}, async t => {
  const { start, options } = await area(t)
  const first = await start({ providerAccess })
  const call = api(first)
  assert.equal(
    (await call('providers/kept', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })).status,
    200,
  )
  assert.equal(
    (
      await call('preferences', 'PUT', {
        theme: 'dark',
        expectedVersion: (await call('settings')).data.preferencesVersion,
      })
    ).status,
    200,
  )
  await first.close()

  const path = join(options.dataDir, 'db', 'web.sqlite')
  const old = new DatabaseSync(path)
  old.exec("DELETE FROM change_versions WHERE topic = 'preferences'; PRAGMA user_version=2")
  old.close()

  const second = await start({ providerAccess })
  const settings = (await api(second)('settings')).data
  assert.equal(settings.providersVersion, 1)
  assert.deepEqual(
    settings.providers.map(({ id, displayName, protocol, baseUrl, models }) => ({
      id,
      displayName,
      protocol,
      baseUrl,
      models,
    })),
    [
      {
        id: 'kept',
        displayName: 'Fixture',
        protocol: 'chat-completions',
        baseUrl: 'http://127.0.0.1:1',
        models: ['a'],
      },
    ],
  )
  assert.equal(settings.preferencesVersion, 0)
  assert.deepEqual((await api(second)('preferences')).data, { theme: 'dark', version: 0 })
  const check = new DatabaseSync(path, { readOnly: true })
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 3)
  check.close()
})

test('research and preferences writes reject a stale expectedVersion with PREFERENCES_STALE before calling Tavily', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  let checks = 0
  const freeUsage = {
    key: { usage: 0, limit: null },
    account: { current_plan: 'Researcher', plan_usage: 0, plan_limit: 1000, paygo_usage: 0, paygo_limit: null },
  }
  const app = await start({
    researchAccess: {
      key: 'env-key',
      fetch: async () => {
        checks += 1
        return Response.json(freeUsage)
      },
    },
  })
  const call = api(app)
  assert.equal((await call('preferences', 'PUT', { theme: 'dark', expectedVersion: 0 })).status, 200)
  const staleTheme = await call('preferences', 'PUT', { theme: 'light', expectedVersion: 0 })
  assert.deepEqual([staleTheme.status, staleTheme.data.error.code], [409, 'PREFERENCES_STALE'])
  assert.deepEqual((await call('preferences')).data, { theme: 'dark', version: 1 })

  const staleSave = await call('research', 'PUT', { key: 'new-key', expectedVersion: 0 })
  assert.deepEqual([staleSave.status, staleSave.data.error.code], [409, 'PREFERENCES_STALE'])
  assert.equal(checks, 0, 'A stale research save must not call Tavily')

  const staleRemove = await call('research', 'DELETE', { expectedVersion: 0 })
  assert.deepEqual([staleRemove.status, staleRemove.data.error.code], [409, 'PREFERENCES_STALE'])

  for (const [path, method, body] of [
    ['preferences', 'PUT', { theme: 'light' }],
    ['research', 'PUT', { useEnvironment: true }],
    ['research', 'DELETE', undefined],
  ]) {
    const res = await call(path, method, body)
    assert.deepEqual([res.status, res.data.error.code], [400, 'INVALID_REQUEST'], `${method} ${path}`)
  }
  assert.equal((await call('research', 'PUT', { useEnvironment: true, expectedVersion: 1 })).status, 200)
  assert.equal(checks, 1)
  assert.equal((await call('research', 'DELETE', { expectedVersion: 2 })).status, 200)
  assert.equal((await call('settings')).data.preferencesVersion, 3)
})
