import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { StorageError, resolveStorageRoot, startLocalWeb } from '../apps/local-web/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function tree(folder) {
  const entries = []
  for (const name of (await readdir(folder)).sort()) {
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
  const added = (await call('workspaces', 'POST', { folder: await project('Dự án') })).data
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
  const id = (await call('workspaces', 'POST', { folder })).data.selectedId
  await call('workspaces/selected', 'PUT', { id: 'default' })
  const twice = (await call('workspaces', 'POST', { folder: `${folder}\\.` })).data
  assert.equal(twice.selectedId, id, 'The folder that already has a workspace makes it the workspace in use')
  assert.equal(twice.workspaces.length, 2)
  const chat = (await call('sessions', 'POST', {})).data
  await call(`sessions/${chat.sessionId}/draft`, 'PUT', { text: 'kept' })
  const relinked = (await call(`workspaces/${id}/folder`, 'PUT', { folder: other })).data
  assert.equal(relinked.workspaces.find(item => item.id === id).folder.endsWith('other'), true)
  assert.equal(
    (await call('sessions')).data.find(item => item.sessionId === chat.sessionId).workspaceId,
    id,
    'Relink keeps the chats',
  )
  const inUse = await call(`workspaces/default/folder`, 'PUT', { folder })
  assert.deepEqual([inUse.status, inUse.data.error.code], [409, 'WORKSPACE_DEFAULT'])
  const second = (await call('workspaces', 'POST', { folder })).data.selectedId
  const conflict = await call(`workspaces/${second}/folder`, 'PUT', { folder: other })
  assert.deepEqual(
    [conflict.status, conflict.data.error.code, conflict.data.error.detail.workspaceName],
    [409, 'WORKSPACE_FOLDER_IN_USE', 'project'],
  )
  await call('workspaces/selected', 'PUT', { id })
  const removed = (await call(`workspaces/${id}`, 'DELETE')).data
  assert.equal(
    removed.selectedId,
    'default',
    'Removing the workspace in use makes the default workspace the workspace in use',
  )
  const ungrouped = (await call('sessions')).data.find(item => item.sessionId === chat.sessionId)
  assert.equal(ungrouped.workspaceId, null, 'Its chat becomes an ungrouped chat')
  assert.equal((await call(`sessions/${chat.sessionId}/draft`)).data.text, 'kept')
  assert.deepEqual((await call(`workspaces/${id}`, 'DELETE')).data.error.code, 'WORKSPACE_NOT_FOUND')
  for (const [path, before] of snapshots)
    assert.deepEqual(await tree(path), before, `No file of ${path} was created, changed or deleted`)
})

test('drafts: each chat keeps its own while DeckAgent runs, and none is kept after DeckAgent stops', async t => {
  const { start } = await area(t)
  let app = await start()
  let call = api(app)
  const a = (await call('sessions', 'POST', {})).data.sessionId
  const b = (await call('sessions', 'POST', {})).data.sessionId
  await call(`sessions/${a}/draft`, 'PUT', { text: 'Draft A' })
  await call(`sessions/${b}/draft`, 'PUT', { text: 'Draft B' })
  assert.equal((await call(`sessions/${a}/draft`)).data.text, 'Draft A')
  assert.equal((await call(`sessions/${b}/draft`)).data.text, 'Draft B')
  assert.equal((await call('sessions')).data.find(item => item.sessionId === a).hasDraft, true)
  assert.equal((await call(`sessions/missing/draft`)).status, 404)
  assert.equal((await call(`sessions/${a}/draft`, 'PUT', { text: 'x'.repeat(16001) })).status, 413)
  assert.equal((await call(`sessions/${a}/draft`, 'PUT', { text: 'x', extra: 1 })).status, 400)
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
  const id = (await call('workspaces', 'POST', { folder })).data.selectedId
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
  const refused = await call('workspaces', 'POST', { folder: join(dir, 'does-not-exist') })
  assert.deepEqual([refused.status, refused.data.error.code], [422, 'WORKSPACE_FOLDER_UNREADABLE'])
  assert.equal(refused.text.includes(dir), false, 'Error bodies name no path')
  const reason = await call('workspaces', 'POST', { folder: options.dataDir })
  assert.deepEqual(
    [reason.status, reason.data.error.code, reason.data.error.detail.reason],
    [422, 'WORKSPACE_FOLDER_REFUSED', 'deckagent-data'],
  )
  assert.equal(reason.text.includes(dir), false)
  const name = await call(`workspaces/${id}`, 'PUT', { name: 'y'.repeat(101) })
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
  assert.equal((await call('providers/fixture', 'DELETE')).status, 200)
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
  assert.equal((await api(app)('workspaces', 'POST', { folder: outer })).status, 200)
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
  for (const name of ['index.js', 'cli.js']) {
    const bundle = await readFile(join(root, 'apps', 'local-web', 'lib', name), 'utf8')
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
  const manifest = JSON.parse(await readFile(join(root, 'apps', 'local-web', 'package.json'), 'utf8'))
  assert.deepEqual(
    Object.keys(manifest.dependencies).filter(name => /cordis|agent-runtime|presentation-tools/.test(name)),
    [],
  )
  // B03 uses the filesystem owner's read interface. Its built entry must not load the legacy runtime.
  const sourceBundle = await readFile(join(root, 'packages', 'tools', 'filesystem', 'lib', 'index.js'), 'utf8')
  assert.equal(sourceBundle.includes('@deckagent/agent-runtime'), false)
  assert.equal(sourceBundle.includes('@deepseek-ai/cordis'), false)
  const sourceComposition = await readFile(join(root, 'apps', 'local-web', 'src', 'source-tools.ts'), 'utf8')
  assert.equal(sourceComposition.includes('registerFileTools'), false, 'Production must not register the legacy write tools')
})
