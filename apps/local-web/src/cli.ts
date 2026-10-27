import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs, promisify } from 'node:util'
import { ModelProviders } from '@deckagent/model-providers'
import { RuntimeError } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import { startLocalWeb, importLegacyProfile, LegacyImportError } from './index.ts'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function connection(value: unknown): ModelConnection {
  if (
    !object(value) ||
    typeof value.id !== 'string' ||
    typeof value.baseUrl !== 'string' ||
    (value.protocol !== 'gemini' && value.protocol !== 'chat-completions' && value.protocol !== 'anthropic-messages') ||
    (value.apiKeyEnv !== undefined && typeof value.apiKeyEnv !== 'string') ||
    (value.timeoutMs !== undefined && typeof value.timeoutMs !== 'number') ||
    (value.maxOutputTokens !== undefined && typeof value.maxOutputTokens !== 'number') ||
    (value.temperature !== undefined && typeof value.temperature !== 'number') ||
    (value.tokenLimitField !== undefined &&
      value.tokenLimitField !== 'max_tokens' &&
      value.tokenLimitField !== 'max_completion_tokens') ||
    Object.keys(value).some(
      key =>
        ![
          'id',
          'baseUrl',
          'protocol',
          'apiKeyEnv',
          'timeoutMs',
          'maxOutputTokens',
          'temperature',
          'tokenLimitField',
        ].includes(key),
    )
  )
    throw new Error('Invalid model config')
  return {
    id: value.id,
    baseUrl: value.baseUrl,
    protocol: value.protocol,
    ...(value.apiKeyEnv === undefined ? {} : { apiKeyEnv: value.apiKeyEnv }),
    ...(value.timeoutMs === undefined ? {} : { timeoutMs: value.timeoutMs }),
    ...(value.maxOutputTokens === undefined ? {} : { maxOutputTokens: value.maxOutputTokens }),
    ...(value.temperature === undefined ? {} : { temperature: value.temperature }),
    ...(value.tokenLimitField === undefined ? {} : { tokenLimitField: value.tokenLimitField }),
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      config: { type: 'string' },
      provider: { type: 'string' },
      model: { type: 'string' },
      workspace: { type: 'string' },
      'data-dir': { type: 'string' },
      'import-legacy': { type: 'string' },
      port: { type: 'string' },
      help: { type: 'boolean' },
      'no-open': { type: 'boolean' },
      'confirmed-deck': { type: 'string' },
    },
  })
  if (values.help) {
    console.log(
      'pnpm start:local-web [--provider <connection-id> --model <model-id>] [--config config/models.example.json] [--data-dir <profile>] [--workspace <private-work-base>] [--import-legacy <stopped-profile>] [--confirmed-deck <fixture>] [--port 0] [--no-open]\nDefault profile: ~/.deckagent; private work defaults to <profile>/work. Project folders are registered in the browser and remain read-only. --import-legacy requires an explicit new --data-dir target and all old writers stopped; it preserves the original and a backup. Saved Web Settings take precedence over CLI provider settings. Ctrl+C drains Host. --confirmed-deck is a trusted test fixture, not outline confirmation.',
    )
    return
  }
  const dataDir = values['data-dir'] ?? join(homedir(), '.deckagent')
  if (values['import-legacy']) {
    if (!values['data-dir']) throw new Error('Legacy import requires an explicit target')
    const imported = await importLegacyProfile({ source: values['import-legacy'], target: dataDir })
    console.log(imported.imported ? 'Legacy profile copied and verified; original and backup preserved.' : 'Legacy profile was already imported; existing data kept.')
  }
  const provider = values.provider ?? process.env.DECKAGENT_PROVIDER
  const model = values.model ?? process.env.DECKAGENT_MODEL
  if (!!provider !== !!model) throw new Error('Supply provider and model together')
  let connections: ModelConnection[] = []
  if (provider && model) {
    const config: unknown = JSON.parse(await readFile(values.config ?? process.env.DECKAGENT_MODELS_CONFIG ?? 'config/models.example.json', 'utf8'))
    if (!object(config) || !Array.isArray(config.connections) || Object.keys(config).some(key => key !== 'connections')) throw new Error('Invalid config')
    connections = config.connections.map(connection)
    if (!connections.some(entry => entry.id === provider)) throw new Error('Unknown provider')
    new ModelProviders(connections)
  }
  const port = Number(values.port ?? 0)
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port')
  let confirmedDecks: NonNullable<Parameters<typeof startLocalWeb>[0]['confirmedDecks']> = []
  if (values['confirmed-deck']) {
    const value: unknown = JSON.parse(await readFile(values['confirmed-deck'], 'utf8'))
    if (!object(value) || typeof value.sessionId !== 'string' || typeof value.outlineId !== 'string' || !Array.isArray(value.slides)
      || Object.keys(value).some(key => !['sessionId', 'outlineId', 'slides'].includes(key))) throw new Error('Invalid confirmed deck fixture')
    confirmedDecks = [{ sessionId: value.sessionId, outlineId: value.outlineId, slides: value.slides.map((slide: unknown) => {
      if (!object(slide) || typeof slide.slideId !== 'string' || typeof slide.title !== 'string' || Object.keys(slide).some(key => !['slideId', 'title'].includes(key))) throw new Error('Invalid planned slide')
      return { slideId: slide.slideId, title: slide.title }
    }) }]
  }
  const app = await startLocalWeb({
    confirmedDecks,
    connections,
    ...(provider && model ? { selection: { provider, model } } : {}),
    ...(values.workspace ? { workspace: values.workspace } : {}),
    dataDir,
    port,
  })
  const stop = () => {
    app.close().then(
      () => {
        process.exitCode = 0
      },
      () => {
        console.error('Local Host cleanup failed')
        process.exitCode = 1
      },
    )
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  if (values['no-open']) {
    console.log(`DeckAgent Local Host: ${app.origin}. Browser opening disabled. Ctrl+C to stop.`)
    return
  }
  try {
    const url = `${app.origin}/#token=${app.token}`
    // No shell interpolation and no capability token in stdout/stderr.
    const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open'
    const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url]
    await promisify(execFile)(command, args)
    console.log(`DeckAgent Local Host: ${app.origin}. Browser opened. Ctrl+C to stop.`)
  } catch {
    await app.close()
    throw new Error('Cannot open browser')
  }
}

main().catch(error => {
  if (error instanceof LegacyImportError) {
    console.error(`${error.code}: Stop all old profile writers. Keep the original and backup; use a new --data-dir target. No source data was removed.`)
    process.exitCode = 1
    return
  }
  if (error instanceof RuntimeError && error.code === 'PROVIDER_CREDENTIALS') {
    console.error(
      'PROVIDER_CREDENTIALS: Set a valid API key in the root .env or terminal environment, then restart Host. Terminal variables override .env, even when empty; remove an old variable to use .env. Keys must have no whitespace or invisible characters.',
    )
    process.exitCode = 1
    return
  }
  console.error(
    'Local Web failed. Check arguments, model configuration, environment credentials, workspace and permissions.',
  )
  process.exitCode = 1
})
