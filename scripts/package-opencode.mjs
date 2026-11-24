import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, promisify } from 'node:util'

const appRoot = fileURLToPath(new URL('../apps/web/', import.meta.url))

async function digest(file) {
  const hash = createHash('sha256')
  for await (const bytes of createReadStream(file)) hash.update(bytes)
  return hash.digest('hex')
}

async function main() {
  const { values } = parseArgs({ options: { output: { type: 'string' }, help: { type: 'boolean' } } })
  if (values.help) {
    console.log(
      'pnpm package:opencode [--output <empty-directory>]\nPrepare installed OpenCode as release resources; defaults to apps/web/resources/opencode. No network download or global install.',
    )
    return
  }
  if (process.platform !== 'win32' || process.arch !== 'x64')
    throw new Error('OpenCode resource packaging is verified for Windows x64 only.')
  const require = createRequire(join(appRoot, 'package.json'))
  const app = JSON.parse(await readFile(join(appRoot, 'package.json'), 'utf8'))
  const packageName = 'opencode-windows-x64'
  let manifestPath
  try {
    manifestPath = require.resolve(`${packageName}/package.json`)
  } catch {
    throw new Error(
      'OpenCode dependency is missing. Run pnpm install --frozen-lockfile with optional dependencies enabled.',
    )
  }
  const installed = JSON.parse(await readFile(manifestPath, 'utf8'))
  const version = app.optionalDependencies[packageName]
  if (installed.version !== version)
    throw new Error('Installed OpenCode differs from the package pin. Reinstall dependencies.')
  const binary = join(dirname(manifestPath), 'bin', 'opencode.exe')
  const runtime = {
    version,
    platform: process.platform,
    arch: process.arch,
    package: packageName,
    binary: 'bin/opencode.exe',
    sha256: await digest(binary),
  }
  const output = resolve(values.output ?? join(appRoot, 'resources', 'opencode'))
  const existing = await stat(output).catch(error => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  if (existing) {
    let valid = false
    try {
      const saved = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'))
      valid =
        Object.keys(runtime).every(key => saved[key] === runtime[key]) &&
        (await digest(join(output, runtime.binary))) === runtime.sha256 &&
        (await readFile(join(output, 'LICENSE'), 'utf8')) ===
          (await readFile(join(appRoot, 'OPENCODE-LICENSE'), 'utf8'))
    } catch {
      // Never replace an existing destination that is not the verified resource set.
    }
    if (!valid)
      throw new Error(
        'The output already exists and is not the pinned resource set. Choose an empty --output directory.',
      )
    console.log(`OpenCode ${version} resources already prepared.`)
    return
  }
  await mkdir(dirname(output), { recursive: true })
  const stage = await mkdtemp(join(dirname(output), '.opencode-'))
  const checkRoot = await mkdtemp(join(tmpdir(), 'deckagent-opencode-check-'))
  try {
    await mkdir(join(stage, 'bin'))
    await copyFile(binary, join(stage, runtime.binary))
    await copyFile(manifestPath, join(stage, 'package.json'))
    await copyFile(join(appRoot, 'OPENCODE-LICENSE'), join(stage, 'LICENSE'))
    const result = await promisify(execFile)(binary, ['--version'], {
      cwd: checkRoot,
      env: {
        PATH: process.env.PATH ?? '',
        SystemRoot: process.env.SystemRoot ?? '',
        HOME: checkRoot,
        USERPROFILE: checkRoot,
      },
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 4096,
    }).catch(() => {
      throw new Error('The installed OpenCode executable could not report its pinned version.')
    })
    if (result.stdout.trim() !== version || (await digest(join(stage, runtime.binary))) !== runtime.sha256)
      throw new Error('The staged OpenCode version or checksum differs from the installed package.')
    await writeFile(join(stage, 'manifest.json'), JSON.stringify(runtime, null, 2) + '\n')
    await rename(stage, output)
    console.log(`Prepared OpenCode ${version} resources for ${process.platform}-${process.arch}.`)
  } finally {
    // Both roots are newly allocated under the explicitly selected parent/temp directory.
    if (dirname(stage) === dirname(output) && stage.startsWith(join(dirname(output), '.opencode-')))
      await rm(stage, { recursive: true, force: true })
    if (dirname(checkRoot) === resolve(tmpdir()) && checkRoot.startsWith(join(tmpdir(), 'deckagent-opencode-check-')))
      await rm(checkRoot, { recursive: true, force: true })
  }
}

main().catch(error => {
  // Child-process stderr and inherited provider settings never enter installation diagnostics.
  console.error(error.message?.startsWith('Command failed:') ? 'OpenCode resource packaging failed.' : error.message)
  process.exitCode = 1
})
