import { build } from 'tsdown'
import { spawnSync } from 'node:child_process'
import { openSync, closeSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// Discover workspace packages through pnpm, the single source of truth for the
// globs declared in pnpm-workspace.yaml. This avoids hard-coding directories and
// avoids re-implementing YAML or glob parsing: pnpm lists exactly the projects it
// manages, so unrelated directories are never picked up. Stdout is captured to a
// file (not a pipe) so discovery also works in sandboxes that block pipe I/O.
function discoverWorkspacePackages() {
  const outFile = join(tmpdir(), `deckagent-workspace-${process.pid}.json`)
  const fd = openSync(outFile, 'w')
  try {
    const args = ['list', '--recursive', '--depth', '-1', '--json']
    const pnpmScript = process.env.npm_execpath
    const result = pnpmScript?.endsWith('js')
      ? spawnSync(process.execPath, [pnpmScript, ...args], { stdio: ['ignore', fd, 'inherit'] })
      : spawnSync('pnpm', args, { shell: true, stdio: ['ignore', fd, 'inherit'] })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`pnpm list exited with code ${result.status}`)
    return JSON.parse(readFileSync(outFile, 'utf8'))
  } finally {
    closeSync(fd)
    rmSync(outFile, { force: true })
  }
}

// tsc -b emits checked JavaScript and declarations first. tsdown then bundles each
// package's lib/types entry. External package imports retain their public entry
// points. Additional application, worker and public subpath entries are listed
// explicitly: workspace discovery enumerates packages, not bundler entries.
// A package that forks a worker from the output folder names its entries, so the
// worker keeps a flat name beside the bundle that resolves it.
const namedEntries = {
  '@deckagent/host': {
    server: 'lib/types/server.js',
    cli: 'lib/types/cli.js',
    'parser-worker': 'lib/types/tools/sources/parser-worker.js',
  },
}

// An application whose public entry is not lib/types/index.js names its entry here.
const mainEntries = {
  '@deckagent/host': 'lib/types/server.js',
}

const discovered = discoverWorkspacePackages()
  .filter(pkg => pkg.name !== 'deckagent-tooling') // exclude the root project
  .toSorted((a, b) => a.path.localeCompare(b.path)) // deterministic build order

// Browser bundles inline the pure document contract. Build public dependency
// entries first so a fresh checkout does not need artifacts from an earlier build.
const packages = []

const visited = new Set(),
  visiting = new Set()

const byName = new Map(discovered.map(pkg => [pkg.name, pkg]))

function visit(pkg) {
  if (visited.has(pkg.name)) return
  if (visiting.has(pkg.name)) throw new Error(`Cyclic workspace dependency: ${pkg.name}`)
  visiting.add(pkg.name)
  const manifest = JSON.parse(readFileSync(join(pkg.path, 'package.json'), 'utf8'))
  for (const name of Object.keys(manifest.dependencies ?? {}).toSorted()) if (byName.has(name)) visit(byName.get(name))
  visiting.delete(pkg.name)
  visited.add(pkg.name)
  packages.push(pkg)
}

for (const pkg of discovered) visit(pkg)

for (const pkg of packages) {
  if (pkg.name === '@deckagent/local-web') {
    const vite = spawnSync(
      process.execPath,
      [resolve(pkg.path, 'node_modules/vite/bin/vite.js'), 'build', '--configLoader', 'native'],
      { cwd: resolve(pkg.path), stdio: 'inherit' },
    )
    if (vite.error) throw vite.error
    if (vite.status !== 0) throw new Error(`Vite build for ${pkg.name} exited with code ${vite.status}`)
    continue
  }
  const config = {
    cwd: resolve(pkg.path),
    config: false,
    entry: namedEntries[pkg.name] ?? [mainEntries[pkg.name] ?? 'lib/types/index.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  }
  await build(config)
}
