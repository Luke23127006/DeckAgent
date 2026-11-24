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
// points. Additional public subpaths and application/worker entry points are
// listed explicitly: workspace discovery enumerates packages, not bundler entries.
const extraEntries = {
  '@deckagent/deck': ['lib/types/brief.js'],
  '@deckagent/file-tools': ['lib/types/parser-worker.js'],
  '@deckagent/local-web': ['lib/types/cli.js'],
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
  const config = {
    cwd: resolve(pkg.path),
    config: false,
    entry: ['lib/types/index.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  }
  if (pkg.name === '@deckagent/local-web') {
    await build({
      cwd: resolve(pkg.path),
      config: false,
      entry: ['lib/browser-types/boot.js'],
      outDir: 'lib/browser',
      format: ['esm'],
      platform: 'browser',
      target: 'es2024',
      fixedExtension: false,
      dts: false,
      clean: false,
      deps: {
        alwaysBundle: ['@deckagent/host-contracts', '@deckagent/presentation-document', 'zod'],
        onlyBundle: [/^@deckagent\//, /^zod(?:\/|$)/, 'animejs'],
      },
    })
  }
  if (extraEntries[pkg.name]) config.entry.push(...extraEntries[pkg.name])
  await build(config)
}
