import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: 'boolean' },
      fresh: { type: 'boolean' },
      help: { type: 'boolean' },
      model: { type: 'string' },
    },
  })
  if (values.help) {
    console.log('pnpm.cmd start:opencode [--check] [--fresh] [--model <Gemini model>]')
    console.log(
      'Builds and opens OpenCode Local Web. Reuses the manual-test profile; --fresh creates another without deleting old data. --check only checks local prerequisites.',
    )
    return
  }
  if (process.platform !== 'win32') throw new Error('This launcher requires the qualified Windows runtime.')
  const candidates = [process.execPath, join(root, '.local-only/task-001-toolchain/node_modules/node/bin/node.exe')]
  let subprocessBlocked = false
  const node = candidates.find(candidate => {
    if (!existsSync(candidate)) return false
    const version = spawnSync(candidate, ['--version'], { encoding: 'utf8', windowsHide: true })
    if (version.error?.code === 'EPERM' || version.error?.code === 'EACCES') subprocessBlocked = true
    const match = /^v(\d+)\.(\d+)\./.exec(version.stdout ?? '')
    return (
      version.status === 0 && match && (Number(match[1]) >= 24 || (Number(match[1]) === 22 && Number(match[2]) >= 19))
    )
  })
  if (!node)
    throw new Error(
      subprocessBlocked
        ? 'Node version checks were blocked from starting subprocesses. Run this launcher in your normal terminal.'
        : 'Install Node ^22.19.0 or >=24.0.0, then run this command again.',
    )
  const executable = resolve(
    root,
    process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
      '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
  )
  if (!existsSync(executable))
    throw new Error(
      'Pinned OpenCode binary missing. Set DECKAGENT_OPENCODE_EXECUTABLE to the previously qualified binary.',
    )
  const compiler = join(root, 'node_modules/typescript/bin/tsc')
  if (!existsSync(compiler)) throw new Error('Dependencies missing. Run pnpm.cmd install --frozen-lockfile first.')
  const profile = join(root, '.local-only', `opencode-manual-g001${values.fresh ? `-${randomUUID()}` : ''}`)
  console.log(`Node: ${node}\nOpenCode: ${executable}\nTest profile: ${profile}`)
  console.log(
    'The adapter verifies the runtime pin before inference. Credentials load from root .env or saved Web settings.',
  )
  if (values.check) {
    console.log(
      'Local prerequisites found. No build, server or model request started; credentials and runtime pin are not verified by this check.',
    )
    return
  }
  const env = { ...process.env, PATH: `${dirname(node)};${process.env.PATH ?? ''}` }
  for (const args of [[compiler, '-b'], ['scripts/build-workspace.mjs']]) {
    const result = spawnSync(node, args, { cwd: root, env, stdio: 'inherit', windowsHide: true })
    if (result.error || result.status !== 0)
      throw new Error('Build failed. Resolve the build errors before starting manual tests.')
  }
  const child = spawn(
    node,
    [
      '--env-file-if-exists=.env',
      '--use-system-ca',
      'apps/local-web/lib/cli.js',
      '--provider',
      'google',
      '--model',
      values.model ?? 'gemini-3.1-flash-lite',
      '--data-dir',
      profile,
      '--opencode-executable',
      executable,
    ],
    { cwd: root, env, stdio: 'inherit', windowsHide: true },
  )
  // Console Ctrl+C reaches the foreground Host too; let it drain before this wrapper exits.
  const stopping = () => {}
  process.on('SIGINT', stopping)
  try {
    await new Promise((done, reject) => {
      child.once('error', () => reject(new Error('Host could not start. Check the selected Node executable.')))
      child.once('exit', code => {
        process.exitCode = code ?? 1
        done()
      })
    })
  } finally {
    process.off('SIGINT', stopping)
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Manual-test launcher failed.')
  process.exitCode = 1
})
