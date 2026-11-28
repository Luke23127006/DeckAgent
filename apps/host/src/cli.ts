import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs, promisify } from 'node:util'
import { StorageError, resolveStorageRoot, startLocalWeb } from './server.ts'
import type { LocalWebOptions, ProviderConnection } from './server.ts'
import { providerProtocols } from '@deckagent/host-contracts'
import { validBaseUrl } from './modules/providers/index.ts'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** A startup connection of the models config file. Tuning fields of older files are accepted and not used. */
function connection(value: unknown): ProviderConnection {
  if (!object(value)) throw new Error('Invalid model config')
  const protocol = providerProtocols.find(item => item === value.protocol)
  if (
    typeof value.id !== 'string' ||
    !/^[\w.-]{1,100}$/.test(value.id) ||
    typeof value.baseUrl !== 'string' ||
    !validBaseUrl(value.baseUrl) ||
    !protocol ||
    (value.apiKeyEnv !== undefined &&
      (typeof value.apiKeyEnv !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.apiKeyEnv))) ||
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
    protocol,
    ...(typeof value.apiKeyEnv === 'string' ? { apiKeyEnv: value.apiKeyEnv } : {}),
  }
}

async function loadConnections(
  provider: string | undefined,
  model: string | undefined,
  configPath: string | undefined,
): Promise<ProviderConnection[]> {
  if (!provider || !model) throw new Error('Supply provider and model together')
  const config: unknown = JSON.parse(
    await readFile(configPath ?? process.env.DECKAGENT_MODELS_CONFIG ?? 'config/models.example.json', 'utf8'),
  )
  if (!object(config) || !Array.isArray(config.connections) || Object.keys(config).some(key => key !== 'connections'))
    throw new Error('Invalid config')
  const connections = config.connections.map(connection)
  if (!connections.some(entry => entry.id === provider)) throw new Error('Unknown provider')
  return connections
}

async function loadConfirmedDecks(fixturePath: string): Promise<NonNullable<LocalWebOptions['confirmedDecks']>> {
  const value: unknown = JSON.parse(await readFile(fixturePath, 'utf8'))
  if (
    !object(value) ||
    typeof value.sessionId !== 'string' ||
    typeof value.outlineId !== 'string' ||
    !Array.isArray(value.slides) ||
    Object.keys(value).some(key => !['sessionId', 'outlineId', 'slides'].includes(key))
  )
    throw new Error('Invalid confirmed deck fixture')
  return [
    {
      sessionId: value.sessionId,
      outlineId: value.outlineId,
      slides: value.slides.map((slide: unknown) => {
        if (
          !object(slide) ||
          typeof slide.slideId !== 'string' ||
          typeof slide.title !== 'string' ||
          Object.keys(slide).some(key => !['slideId', 'title'].includes(key))
        )
          throw new Error('Invalid planned slide')
        return { slideId: slide.slideId, title: slide.title }
      }),
    },
  ]
}

async function openBrowser(origin: string, token: string): Promise<void> {
  const url = `${origin}/#token=${token}`
  // No shell interpolation and no capability token in stdout/stderr.
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url]
  await promisify(execFile)(command, args)
}

function shutdown(app: { close(): Promise<void> }): void {
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

async function main() {
  const { values } = parseArgs({
    options: {
      config: { type: 'string' },
      provider: { type: 'string' },
      model: { type: 'string' },
      'data-dir': { type: 'string' },
      port: { type: 'string' },
      help: { type: 'boolean' },
      'no-open': { type: 'boolean' },
      'confirmed-deck': { type: 'string' },
      opencode: { type: 'string' },
    },
  })

  if (values.help) {
    console.log(
      'pnpm web [--provider <connection-id> --model <model-id>] [--config config/models.example.json] [--data-dir <folder>] [--confirmed-deck config/deck.confirmed.example.json] [--opencode <path-to-opencode-executable>] [--port 0] [--no-open]\nRequests run with the OpenCode CLI (pinned version), found by --opencode, else DECKAGENT_OPENCODE, prepared app resources, the installed platform dependency, then opencode on PATH. Windows x64 dependency installation includes the runtime; no global install is needed. Startup checks its version; unavailable runtime keeps Settings, history and drafts. Data folder: --data-dir, else DECKAGENT_DATA_DIR, else the app-data folder of the OS. Optional CLI configuration bootstraps an existing environment connection. Saved Web Settings take precedence. --confirmed-deck imports a trusted Host-confirmed plan for manual testing only. Ctrl+C shuts down Host.',
    )
    return
  }

  const provider = values.provider ?? process.env.DECKAGENT_PROVIDER
  const model = values.model ?? process.env.DECKAGENT_MODEL
  const connections = provider || model ? await loadConnections(provider, model, values.config) : []
  const port = Number(values.port ?? 0)
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port')

  const confirmedDecks = values['confirmed-deck'] ? await loadConfirmedDecks(values['confirmed-deck']) : []
  const app = await startLocalWeb({
    confirmedDecks,
    connections,
    ...(provider && model ? { selection: { provider, model } } : {}),
    dataDir: resolveStorageRoot({ flag: values['data-dir'] }),
    ...(values.opencode ? { openCode: { executable: path.resolve(values.opencode) } } : {}),
    port,
  })
  process.once('SIGINT', () => shutdown(app))
  process.once('SIGTERM', () => shutdown(app))

  if (values['no-open']) {
    console.log(`DeckAgent Local Host: ${app.origin}. Browser opening disabled. Ctrl+C to stop.`)
    return
  }

  try {
    await openBrowser(app.origin, app.token)
    console.log(`DeckAgent Local Host: ${app.origin}. Browser opened. Ctrl+C to stop.`)
  } catch {
    await app.close()
    throw new Error('Cannot open browser')
  }
}

main().catch(error => {
  if (error instanceof StorageError) {
    console.error(`${error.code}: ${error.message}`)
    process.exitCode = 1
    return
  }
  console.error(
    'Local Web failed. Check the arguments, the model configuration and the permissions of the data folder.',
  )
  process.exitCode = 1
})
