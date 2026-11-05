import { parseArgs, isDeepStrictEqual } from 'node:util'
import { mkdtemp, mkdir, copyFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isolatedEnvironment, encodeConfiguration, object } from './opencode/config.ts'
import { providerConfiguration } from './opencode/provider.ts'
import { runOpenCode } from './opencode/process.ts'
import { DeckService } from '@deckagent/deck'
import { externalPresentation } from './external-presentation.ts'

const { values } = parseArgs({
  options: {
    profile: { type: 'string' },
    session: { type: 'string' },
    version: { type: 'string' },
    slides: { type: 'string', default: '' },
    prompt: { type: 'string' },
    opencode: { type: 'string' },
    skill: { type: 'string' },
    model: { type: 'string', default: 'gemini-3.1-flash-lite' },
  },
})
if (
  !values.profile ||
  !isAbsolute(values.profile) ||
  !values.session ||
  !values.version ||
  !values.prompt ||
  !values.opencode
)
  throw Error('Required: --profile ABSOLUTE --session ID --version N --opencode EXECUTABLE --prompt TEXT')
if (!process.env.GEMINI_API_KEY) throw Error('GEMINI_API_KEY required; no model call started')
await mkdir(join(values.profile, 'external-executions'), { recursive: true })
const root = await mkdtemp(join(values.profile, 'external-executions', 'run-')),
  abort = new AbortController()
for (const event of ['SIGINT', 'SIGTERM'] as const) process.once(event, () => abort.abort())
const timeout = setTimeout(() => abort.abort(), 180000)
let stage = 'PREFLIGHT'
try {
  const check = new DeckService(join(values.profile, 'decks.sqlite'))
  try {
    externalPresentation(check, values.session, values.slides ? values.slides.split(',') : [], Number(values.version))
  } finally {
    check.close()
  }
  const env = await isolatedEnvironment(root, process.env.GEMINI_API_KEY)
  const skillDirectory = join(env.OPENCODE_CONFIG_DIR!, 'skills', 'deckagent-presentation')
  await mkdir(skillDirectory, { recursive: true })
  await copyFile(
    values.skill
      ? resolve(values.skill)
      : fileURLToPath(new URL('../../../product-skills/deckagent-presentation/SKILL.md', import.meta.url)),
    join(skillDirectory, 'SKILL.md'),
  )
  const tools = ['presentation_state', 'read_slide', 'propose_outline', 'publish_slide', 'patch_slide']
  const permission = {
    '*': 'deny',
    skill: { '*': 'deny', 'deckagent-presentation': 'allow' },
    ...Object.fromEntries(tools.map(name => ['deckagent_' + name, 'allow'])),
  }
  const native = providerConfiguration({
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: values.model,
    key: process.env.GEMINI_API_KEY,
  })
  const config = {
    permission,
    plugin: [],
    share: 'disabled',
    snapshot: false,
    enabled_providers: ['deckagent'],
    small_model: native.selector,
    compaction: { auto: false, prune: false },
    provider: native.providers,
    agent: {
      deckagent: {
        ...native.agent,
        mode: 'primary',
        steps: 16,
        prompt:
          'Use the deckagent-presentation skill for this request. Load it with skill first. All presentation authority comes from the bound MCP server. Never use native tools to bypass it.',
        permission,
      },
    },
    mcp: {
      deckagent: {
        type: 'local',
        command: [
          process.execPath,
          join(dirname(fileURLToPath(import.meta.url)), 'external-cli.js'),
          '--profile',
          values.profile,
          '--session',
          values.session,
          '--action',
          'serve',
          '--version',
          values.version,
          '--slides',
          values.slides,
        ],
        enabled: true,
      },
    },
  }
  env.OPENCODE_CONFIG_CONTENT = encodeConfiguration(config)
  const executable = resolve(values.opencode),
    options = { cwd: root, env, signal: abort.signal }
  const version = await runOpenCode(executable, ['--version'], options)
  if (version.code !== 0 || version.stdout.trim() !== '1.19.5') throw Error('Pinned OpenCode 1.19.5 required')
  const audit = await runOpenCode(executable, ['debug', 'config', '--pure'], options),
    resolved: unknown = JSON.parse(audit.stdout)
  if (
    audit.code !== 0 ||
    !object(resolved) ||
    !isDeepStrictEqual(resolved.permission, permission) ||
    !isDeepStrictEqual(resolved.mcp, config.mcp) ||
    !Array.isArray(resolved.plugin) ||
    resolved.plugin.length ||
    !object(resolved.agent) ||
    Object.keys(resolved.agent).join() !== 'deckagent' ||
    !object(resolved.agent.deckagent) ||
    !isDeepStrictEqual(resolved.agent.deckagent.permission, permission)
  )
    throw Error('External host configuration unsafe; no model call started')
  stage = 'MODEL'
  let failed = false
  const result = await runOpenCode(
    executable,
    ['run', '--pure', '--agent', 'deckagent', '--model', native.selector, '--format', 'json'],
    {
      ...options,
      input: values.prompt,
      event(event) {
        if (!object(event) || event.type === 'error') {
          failed = true
          return
        }
        process.stdout.write(JSON.stringify(event).replaceAll(process.env.GEMINI_API_KEY!, '[redacted]') + '\n')
      },
    },
  )
  if (failed || result.code !== 0) throw Error('External model failed')
} catch {
  console.error('EXTERNAL_STAGE_' + (abort.signal.aborted ? 'CANCELLED' : stage))
  console.error('External presentation request failed; inspect the saved deck before retrying. No automatic retry.')
  process.exitCode = 1
} finally {
  clearTimeout(timeout)
}
