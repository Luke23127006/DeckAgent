import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, realpath, rename, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { FolderPolicy } from '../lib/types/modules/workspaces/folder-policy.js'
import { nameFromFolder, nameFromUser } from '../lib/types/modules/workspaces/workspace-name.js'
import { WorkspaceRegistry } from '../lib/types/modules/workspaces/workspaces.store.js'
import { WorkspaceError, mapWorkspaceError } from '../lib/types/modules/workspaces/workspaces.errors.js'

async function tree(folder) {
  const entries = []
  for (const name of (await readdir(folder)).toSorted()) {
    const info = await stat(join(folder, name))
    entries.push([name, info.size, info.mtimeMs, info.isDirectory() ? await tree(join(folder, name)) : null])
  }
  return entries
}

async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-registry-'))
  const home = join(dir, 'home')
  const dataRoot = join(dir, 'data')
  await mkdir(home)
  await mkdir(dataRoot)
  const options = { path: join(dataRoot, 'db', 'workspaces.sqlite'), home, dataRoot }
  const opened = []
  const open = () => {
    const registry = new WorkspaceRegistry(options)
    opened.push(registry)
    return registry
  }
  t.after(async () => {
    for (const registry of opened) registry.close()
    await rm(dir, { recursive: true, force: true })
  })
  return { dir, home, dataRoot, open }
}

async function folder(dir, name, files = { 'notes.md': '# Notes' }) {
  const path = join(dir, name)
  await mkdir(path, { recursive: true })
  for (const [file, content] of Object.entries(files)) await writeFile(join(path, file), content)
  return path
}

test('BR-020: names are NFC, counted in code points, trimmed only when the user gives them', () => {
  const decomposed = 'Vie\u0302\u0323t'
  assert.equal(nameFromUser(decomposed), 'Việt')
  assert.equal([...nameFromUser(decomposed)].length, 4, '"Việt" is 4 characters')
  assert.equal(nameFromUser('  \u3000Dự án\u00a0 '), 'Dự án')
  assert.equal(nameFromUser('x'.repeat(100)), 'x'.repeat(100))
  assert.equal(nameFromUser('😀'.repeat(100)).length, 200, 'Astral characters count once each')
  assert.throws(() => nameFromUser('x'.repeat(101)), { code: 'WORKSPACE_NAME_TOO_LONG' })
  for (const empty of ['', '   ', '\t\u3000\u00a0', undefined])
    assert.throws(() => nameFromUser(empty), { code: 'WORKSPACE_NAME_EMPTY' })
  assert.equal(nameFromFolder(' Thư mục ', 'Workspace'), ' Thư mục ', 'A folder name keeps its whitespace')
  assert.equal(nameFromFolder(decomposed, 'Workspace'), 'Việt')
  assert.equal(
    [...nameFromFolder('đ'.repeat(150), 'Workspace')].length,
    100,
    'A longer folder name is cut to the longest name',
  )
})

test('BR-019: refused project folders on Windows, compared without case', () => {
  const policy = new FolderPolicy({
    platform: 'win32',
    home: 'C:\\Users\\me',
    dataRoot: 'C:\\Users\\me\\AppData\\Local\\DeckAgent',
  })
  const cases = [
    ['C:\\', 'drive-root', true],
    ['D:\\', 'drive-root', true],
    ['C:\\Windows', 'system', false],
    ['c:\\windows\\System32', 'system', false],
    ['C:\\Program Files\\App', 'system', false],
    ['C:\\Program Files (x86)', 'system', false],
    ['C:\\Users\\me', 'user-folder', true],
    ['C:\\USERS\\ME\\', 'user-folder', true],
    ['C:\\Users\\me\\.ssh', 'key-folder', false],
    ['C:\\Users\\me\\.aws\\config', 'key-folder', false],
    ['C:\\Users\\me\\.gnupg', 'key-folder', false],
    ['C:\\Users\\me\\.kube', 'key-folder', false],
    ['C:\\Users\\me\\.docker', 'key-folder', false],
    ['C:\\Users\\me\\AppData\\Local\\DeckAgent', 'deckagent-data', false],
    ['C:\\Users\\me\\AppData\\Local\\DeckAgent\\files', 'deckagent-data', false],
    ['C:\\Users\\me\\AppData', 'deckagent-data', true],
  ]
  for (const [path, reason, allowInside] of cases) assert.deepEqual(policy.refusal(path), { reason, allowInside }, path)
  for (const allowed of [
    'C:\\Users\\me\\Documents\\Deck',
    'D:\\Projects',
    'C:\\Users\\me\\.sshkeys-not-a-key-folder',
    'C:\\Users\\other',
  ])
    assert.equal(policy.refusal(allowed), undefined, allowed)
})

test('BR-019: refused project folders on POSIX systems; the Windows system list is closed', () => {
  const policy = new FolderPolicy({ platform: 'linux', home: '/home/me', dataRoot: '/home/me/.local/share/deckagent' })
  assert.deepEqual(policy.refusal('/'), { reason: 'drive-root', allowInside: true })
  assert.deepEqual(policy.refusal('/home/me'), { reason: 'user-folder', allowInside: true })
  assert.deepEqual(policy.refusal('/home/me/.kube/x'), { reason: 'key-folder', allowInside: false })
  assert.deepEqual(policy.refusal('/home/me/.local'), { reason: 'deckagent-data', allowInside: true })
  assert.equal(policy.refusal('/usr/share/project'), undefined)
  assert.equal(policy.refusal('/home/Me'), undefined, 'POSIX paths compare with case')
})

test('first start has a default workspace with no folder, in use, and it can be renamed but never removed or relinked', async t => {
  const { dir, open } = await setup(t)
  const registry = open()
  const [only] = await registry.list()
  assert.deepEqual(only, {
    id: 'default',
    name: 'Workspace mặc định',
    folder: null,
    isDefault: true,
    folderStatus: 'none',
  })
  assert.equal(registry.selectedId(), 'default')
  assert.throws(() => registry.remove('default'), { code: 'WORKSPACE_DEFAULT' })
  await assert.rejects(registry.relink('default', await folder(dir, 'any')), { code: 'WORKSPACE_DEFAULT' })
  assert.equal(registry.rename('default', '  Riêng tôi ').name, 'Riêng tôi')
  assert.throws(() => registry.rename('default', ' '), { code: 'WORKSPACE_NAME_EMPTY' })
  assert.equal((await registry.get('default')).name, 'Riêng tôi', 'A refused name changes nothing')
  assert.throws(() => registry.select('missing'), { code: 'WORKSPACE_NOT_FOUND' })
})

test('adding a folder sets up one workspace named after it; the same folder by another path selects that workspace', async t => {
  const { dir, open } = await setup(t)
  const registry = open()
  const project = await folder(dir, 'Dự án tái chế')
  const before = await tree(project)
  const added = await registry.add(project)
  assert.equal(added.outcome, 'created')
  assert.equal(added.workspace.name, 'Dự án tái chế')
  assert.equal(registry.selectedId(), added.workspace.id)
  registry.select('default')
  const variants = [`${project}${sep}`, join(project, '.')]
  if (process.platform === 'win32') variants.push(project.toUpperCase())
  const link = join(dir, 'link-to-project')
  await symlink(project, link, process.platform === 'win32' ? 'junction' : 'dir')
  variants.push(link)
  for (const variant of variants) {
    const again = await registry.add(variant)
    assert.equal(again.outcome, 'existing', variant)
    assert.equal(again.workspace.id, added.workspace.id, variant)
    assert.equal(registry.selectedId(), added.workspace.id)
  }
  assert.equal((await registry.list()).length, 2, 'No second workspace for the same folder')
  assert.equal(
    (await registry.get(added.workspace.id)).folder,
    added.workspace.folder,
    'The link is followed: the canonical folder is stored',
  )
  assert.deepEqual(await tree(project), before, 'Setting up reads and writes no file of the folder')
})

test('a folder that cannot be read or cannot be a project folder sets up no workspace and keeps the one in use', async t => {
  const { dir, home, dataRoot, open } = await setup(t)
  const registry = open()
  const file = join(dir, 'file.txt')
  await writeFile(file, 'not a folder')
  for (const [value, code] of [
    [undefined, 'WORKSPACE_FOLDER_REQUIRED'],
    ['  ', 'WORKSPACE_FOLDER_REQUIRED'],
    ['relative\\folder', 'WORKSPACE_FOLDER_INVALID'],
    ['relative/folder', 'WORKSPACE_FOLDER_INVALID'],
    [`${dir}\0x`, 'WORKSPACE_FOLDER_INVALID'],
    [42, 'WORKSPACE_FOLDER_INVALID'],
    [join(dir, 'missing'), 'WORKSPACE_FOLDER_UNREADABLE'],
    [file, 'WORKSPACE_FOLDER_UNREADABLE'],
  ])
    await assert.rejects(registry.add(value), { code }, String(value))
  await assert.rejects(
    registry.add(home),
    error =>
      error.code === 'WORKSPACE_FOLDER_REFUSED' &&
      error.detail.reason === 'user-folder' &&
      error.detail.allowInside === true,
  )
  await mkdir(join(home, '.ssh', 'inner'), { recursive: true })
  await assert.rejects(
    registry.add(join(home, '.ssh', 'inner')),
    error =>
      error.code === 'WORKSPACE_FOLDER_REFUSED' &&
      error.detail.reason === 'key-folder' &&
      error.detail.allowInside === false,
  )
  await assert.rejects(
    registry.add(dataRoot),
    error => error.code === 'WORKSPACE_FOLDER_REFUSED' && error.detail.reason === 'deckagent-data',
  )
  await assert.rejects(
    registry.add(parse(dir).root),
    error => error.code === 'WORKSPACE_FOLDER_REFUSED' && error.detail.reason === 'drive-root',
  )
  assert.equal((await registry.list()).length, 1)
  assert.equal(registry.selectedId(), 'default')
})

test('folder refusals follow junctions in the configured home and data roots', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const alias = join(dir, 'alias')
  await symlink(dir, alias, process.platform === 'win32' ? 'junction' : 'dir')
  const policy = new FolderPolicy({ home: join(alias, 'home'), dataRoot: join(alias, 'data') })
  await assert.rejects(policy.inspect(home), {
    code: 'WORKSPACE_FOLDER_REFUSED',
    detail: { reason: 'user-folder', allowInside: true },
  })
  await mkdir(join(home, '.ssh'))
  await assert.rejects(policy.inspect(join(home, '.ssh')), {
    code: 'WORKSPACE_FOLDER_REFUSED',
    detail: { reason: 'key-folder', allowInside: false },
  })
  await assert.rejects(policy.inspect(dataRoot), {
    code: 'WORKSPACE_FOLDER_REFUSED',
    detail: { reason: 'deckagent-data', allowInside: false },
  })
})

test('folder refusals expand Windows short names like asynchronous realpath', {
  skip: process.platform !== 'win32',
}, async t => {
  const { dataRoot } = await setup(t)
  const shortHome = join(parse(process.env.SystemRoot ?? 'C:\\Windows').root, 'PROGRA~1')
  let home
  try {
    home = await realpath(shortHome)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    t.skip('The system drive has no PROGRA~1 short name')
    return
  }
  const policy = new FolderPolicy({ home: shortHome, dataRoot, systemFolders: [] })
  await assert.rejects(policy.inspect(home), {
    code: 'WORKSPACE_FOLDER_REFUSED',
    detail: { reason: 'user-folder', allowInside: true },
  })
  const dataPolicy = new FolderPolicy({ home: dataRoot, dataRoot: shortHome, systemFolders: [] })
  await assert.rejects(dataPolicy.inspect(home), {
    code: 'WORKSPACE_FOLDER_REFUSED',
    detail: { reason: 'deckagent-data', allowInside: false },
  })
})

test('a moved folder: its workspace becomes unreadable, keeps its chats, and takes the new place when the folder is chosen', async t => {
  const { dir, open } = await setup(t)
  const registry = open()
  const original = await folder(dir, 'original')
  const { workspace } = await registry.add(original)
  const moved = join(dir, 'moved-here')
  await rename(original, moved)
  assert.equal((await registry.get(workspace.id)).folderStatus, 'unreadable')
  registry.select('default')
  const found = await registry.add(moved)
  assert.equal(found.outcome, 'moved')
  assert.equal(found.workspace.id, workspace.id, 'The workspace keeps its ID')
  assert.equal(found.workspace.name, 'original', 'The workspace keeps its name')
  assert.equal((await registry.get(workspace.id)).folderStatus, 'available')
  assert.equal(registry.selectedId(), workspace.id)
})

test('a different folder at the place is reported, read nowhere, and can be taken over or set up as its own workspace', async t => {
  const { dir, open } = await setup(t)
  const registry = open()
  const place = await folder(dir, 'place')
  const { workspace } = await registry.add(place)
  await rename(place, join(dir, 'chosen-folder-moved-away'))
  await folder(dir, 'place', { 'other.md': 'someone else' })
  const before = await tree(place)
  assert.equal((await registry.get(workspace.id)).folderStatus, 'different-folder')
  const separate = await registry.add(place)
  assert.equal(separate.outcome, 'created', 'Adding the different folder sets up a new workspace for it')
  assert.notEqual(separate.workspace.id, workspace.id)
  assert.equal(
    (await registry.get(workspace.id)).folderStatus,
    'different-folder',
    'The first workspace keeps reporting a different folder',
  )
  registry.remove(separate.workspace.id)
  const adopted = await registry.relink(workspace.id, place)
  assert.equal(adopted.id, workspace.id)
  assert.equal(
    (await registry.get(workspace.id)).folderStatus,
    'available',
    'Choosing the folder at the place takes it over',
  )
  assert.deepEqual(await tree(place), before)
})

test('relink keeps ID, name and selection; a folder of another workspace is refused naming that workspace', async t => {
  const { dir, open } = await setup(t)
  const registry = open()
  const first = (await registry.add(await folder(dir, 'first'))).workspace
  const second = (await registry.add(await folder(dir, 'second'))).workspace
  registry.rename(second.id, 'Thứ hai')
  await assert.rejects(
    registry.relink(second.id, first.folder),
    error => error.code === 'WORKSPACE_FOLDER_IN_USE' && error.detail.workspaceName === 'first',
  )
  const target = await folder(dir, 'third')
  const relinked = await registry.relink(second.id, target)
  assert.equal(relinked.id, second.id)
  assert.equal(relinked.name, 'Thứ hai', 'Choosing another folder keeps the name')
  assert.equal((await registry.get(second.id)).folder, relinked.folder)
  await assert.rejects(registry.relink(second.id, join(dir, 'missing')), { code: 'WORKSPACE_FOLDER_UNREADABLE' })
  assert.equal((await registry.get(second.id)).folder, relinked.folder, 'A refused folder changes no workspace')
})

test('remove: the default becomes the workspace in use; IDs, names and the selection survive a restart; folder untouched', async t => {
  const { dir, open } = await setup(t)
  let registry = open()
  const project = await folder(dir, 'project', { 'a.txt': 'A', '.hidden': 'H' })
  const before = await tree(project)
  const kept = (await registry.add(await folder(dir, 'kept'))).workspace
  const removed = (await registry.add(project)).workspace
  registry.remove(removed.id)
  assert.equal(registry.selectedId(), 'default')
  assert.deepEqual(registry.activeIds().toSorted(), ['default', kept.id].toSorted())
  assert.throws(() => registry.remove(removed.id), { code: 'WORKSPACE_NOT_FOUND' })
  assert.deepEqual(await tree(project), before, 'Removing changes no file of the user')
  registry.select(kept.id)
  registry.close()
  registry = open()
  assert.equal(registry.selectedId(), kept.id, 'The workspace in use when DeckAgent stopped is in use again')
  assert.deepEqual(
    (await registry.list()).map(item => [item.id, item.name]),
    [
      ['default', 'Workspace mặc định'],
      [kept.id, 'kept'],
    ],
  )
  const again = await registry.add(project)
  assert.equal(again.outcome, 'created', 'The folder of a removed workspace sets up a new workspace')
  assert.notEqual(again.workspace.id, removed.id)
})

test('a damaged or foreign Workspace database is refused without being reset', async t => {
  const { dataRoot } = await setup(t)
  const path = join(dataRoot, 'db', 'other.sqlite')
  await mkdir(join(dataRoot, 'db'), { recursive: true })
  await writeFile(path, 'not a database at all')
  assert.throws(() => new WorkspaceRegistry({ path, home: dataRoot, dataRoot }), { code: 'WORKSPACE_STORAGE' })
  assert.equal((await stat(path)).size, 'not a database at all'.length)
})

test('schema 1 workspaces.sqlite upgrades to schema 2 in place while keeping workspaces and selection', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const dbPath = join(dataRoot, 'db', 'workspaces.sqlite')
  await mkdir(join(dataRoot, 'db'), { recursive: true })
  const project = await folder(dir, 'legacy-project')
  const v1 = new DatabaseSync(dbPath)
  v1.exec(`
    CREATE TABLE workspaces (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, folder TEXT, folder_key TEXT, dev TEXT, ino TEXT,
      is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
      created_at TEXT NOT NULL, removed_at TEXT,
      CHECK ((folder IS NULL) = (folder_key IS NULL) AND (folder IS NULL) = (dev IS NULL) AND (folder IS NULL) = (ino IS NULL)),
      CHECK (is_default = 0 OR (folder IS NULL AND removed_at IS NULL))
    ) STRICT;
    CREATE INDEX workspace_identity ON workspaces(dev, ino) WHERE removed_at IS NULL;
    CREATE TABLE registry_state (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    PRAGMA application_id = 1145132883;
    PRAGMA user_version = 1;
  `)
  v1.prepare(
    "INSERT INTO workspaces (id, name, is_default, created_at) VALUES ('default', 'Default', 1, '2026-01-01T00:00:00.000Z')",
  ).run()
  v1.prepare(
    "INSERT INTO workspaces (id, name, folder, folder_key, dev, ino, is_default, created_at) VALUES ('ws-1', 'Legacy', ?, ?, '1', '2', 0, '2026-01-02T00:00:00.000Z')",
  ).run(project, project)
  v1.prepare("INSERT INTO registry_state (key, value) VALUES ('selected', 'ws-1')").run()
  v1.close()

  const registry = new WorkspaceRegistry({ path: dbPath, home, dataRoot })
  t.after(() => registry.close())
  assert.equal(registry.version(), 0)
  assert.equal(registry.selectedId(), 'ws-1')
  assert.deepEqual(
    (await registry.list()).map(item => [item.id, item.name]),
    [
      ['default', 'Default'],
      ['ws-1', 'Legacy'],
    ],
  )
  registry.rename('ws-1', 'Upgraded', 0)
  assert.equal(registry.version(), 1)
  registry.close()

  const check = new DatabaseSync(dbPath)
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 2)
  check.close()
})

test('every workspace write increments version inside a transaction and publishes notices after commit', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const notices = []
  const registry = new WorkspaceRegistry({
    path: join(dataRoot, 'db', 'workspaces.sqlite'),
    home,
    dataRoot,
    publish: notice => notices.push(notice),
  })
  t.after(() => registry.close())
  assert.equal(registry.version(), 0)

  const firstDir = await folder(dir, 'first')
  const secondDir = await folder(dir, 'second')
  const added = await registry.add(firstDir, 0)
  assert.equal(registry.version(), 1)
  registry.select('default', 1)
  assert.equal(registry.version(), 2)
  const existing = await registry.add(firstDir, 2)
  assert.equal(existing.outcome, 'existing')
  assert.equal(registry.version(), 3)
  registry.rename(added.workspace.id, 'First Renamed', 3)
  assert.equal(registry.version(), 4)
  await registry.relink(added.workspace.id, secondDir, 4)
  assert.equal(registry.version(), 5)
  const movedDir = join(dir, 'second-moved')
  await rename(secondDir, movedDir)
  const moved = await registry.add(movedDir, 5)
  assert.equal(moved.outcome, 'moved')
  assert.equal(registry.version(), 6)

  const removedVersion = registry.remove(added.workspace.id, 6, { publish: false })
  assert.equal(removedVersion, 7)
  assert.equal(registry.version(), 7)
  assert.equal(notices.length, 6)
  registry.publishVersion(removedVersion)
  assert.deepEqual(
    notices,
    [1, 2, 3, 4, 5, 6, 7].map(version => ({ topic: 'workspaces', key: 'host', version })),
  )
  registry.close()
})

test('stale expectedVersion throws WORKSPACES_STALE, changes no row and publishes no notice', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const notices = []
  const registry = new WorkspaceRegistry({
    path: join(dataRoot, 'db', 'workspaces.sqlite'),
    home,
    dataRoot,
    publish: notice => notices.push(notice),
  })
  t.after(() => registry.close())
  const one = await folder(dir, 'one')
  const two = await folder(dir, 'two')
  const added = await registry.add(one, 0)
  assert.equal(registry.version(), 1)
  notices.length = 0

  assert.throws(() => registry.select('default', 0), { code: 'WORKSPACES_STALE' })
  await assert.rejects(registry.add(two, 0), { code: 'WORKSPACES_STALE' })
  assert.throws(() => registry.rename(added.workspace.id, 'Nope', 0), { code: 'WORKSPACES_STALE' })
  await assert.rejects(registry.relink(added.workspace.id, two, 0), { code: 'WORKSPACES_STALE' })
  assert.throws(() => registry.remove(added.workspace.id, 0), { code: 'WORKSPACES_STALE' })
  assert.equal(registry.version(), 1)
  assert.equal(registry.selectedId(), added.workspace.id)
  assert.deepEqual(notices, [])
  registry.close()
})

test('WorkspaceError and mapWorkspaceError map codes to HTTP status and safe detail', () => {
  const active = new WorkspaceError('WORKSPACE_REQUEST_ACTIVE', 'Workspace has an active request')
  assert.equal(active.name, 'WorkspaceError')
  assert.deepEqual(mapWorkspaceError(active), { status: 409, code: 'WORKSPACE_REQUEST_ACTIVE' })
  assert.deepEqual(
    mapWorkspaceError(
      new WorkspaceError('WORKSPACE_FOLDER_IN_USE', 'Another workspace has this folder', {
        workspaceName: 'Alpha',
      }),
    ),
    { status: 409, code: 'WORKSPACE_FOLDER_IN_USE', detail: { workspaceName: 'Alpha' } },
  )
  assert.deepEqual(
    mapWorkspaceError(
      new WorkspaceError('WORKSPACE_FOLDER_REFUSED', 'The folder cannot be a project folder', {
        reason: 'user-folder',
        allowInside: true,
      }),
    ),
    { status: 422, code: 'WORKSPACE_FOLDER_REFUSED', detail: { reason: 'user-folder', allowInside: true } },
  )
  assert.deepEqual(mapWorkspaceError(new WorkspaceError('WORKSPACE_NOT_FOUND', 'Workspace is not set up')), {
    status: 404,
    code: 'WORKSPACE_NOT_FOUND',
  })
  assert.deepEqual(mapWorkspaceError(new WorkspaceError('WORKSPACES_STALE', 'Stale')), {
    status: 409,
    code: 'WORKSPACES_STALE',
  })
  assert.equal(mapWorkspaceError(new Error('other')), undefined)
})
