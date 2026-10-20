import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { RuntimeError } from '@deckagent/agent-runtime'
import type { ModelSelection } from '@deckagent/agent-runtime'
import { ModelProviders } from '@deckagent/model-providers'
import type { ModelConnection } from '@deckagent/model-providers'
import { readLocal, writeLocal } from './local-files.ts'
import { WindowsCredentialVault } from './credentials.ts'
import type { CredentialVault } from './credentials.ts'

export interface SetupPrompts {
  ask(label: string, secret?: boolean): Promise<string>
  info(message: string): void
  readonly signal: AbortSignal
}

interface ChatProfile {
  readonly version: 1
  readonly connections: readonly ModelConnection[]
  readonly selection: ModelSelection
}

export interface ChatSetupOptions {
  readonly dataDir: string
  readonly configPath?: string
  readonly provider?: string
  readonly model?: string
  readonly sessionSelection?: ModelSelection
  readonly setup?: boolean
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly prompts?: SetupPrompts
  readonly vault?: CredentialVault
}

async function profile(path: string): Promise<ChatProfile | undefined> {
  const bytes = await readLocal(path)
  if (!bytes) return undefined
  try {
    const value = JSON.parse(bytes.toString('utf8')) as ChatProfile
    if (!value || value.version !== 1 || Object.keys(value).some(key => !['version', 'connections', 'selection'].includes(key))
      || !Array.isArray(value.connections) || !value.selection || typeof value.selection.model !== 'string' || !value.selection.model.trim()
      || !value.connections.some(connection => connection.id === value.selection.provider) || Object.keys(value.selection).some(key => !['provider', 'model'].includes(key))) throw new Error()
    new ModelProviders(value.connections)
    return value
  } catch { throw new RuntimeError('CLI_CONFIG', 'Local chat profile is invalid or unsupported. Run pnpm chat --setup to configure it again') }
}

async function connections(path: string): Promise<readonly ModelConnection[]> {
  let parsed: readonly ModelConnection[]
  try {
    const value: unknown = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
    if (!value || typeof value !== 'object' || !('connections' in value) || Object.keys(value).some(key => key !== 'connections') || !Array.isArray(value.connections)) throw new Error()
    parsed = value.connections as ModelConnection[]
  } catch { throw new RuntimeError('CLI_CONFIG', 'Cannot read valid model configuration JSON. Check --config') }
  new ModelProviders(parsed)
  return parsed
}

async function choose(prompts: SetupPrompts, choices: readonly ModelConnection[]): Promise<ModelConnection> {
  prompts.info('Chọn provider:')
  const labels: Record<string, string> = { google: 'Google Gemini', openai: 'OpenAI', anthropic: 'Anthropic', deepseek: 'DeepSeek' }
  choices.forEach((connection, index) => prompts.info(`  ${index + 1}. ${labels[connection.id] ?? connection.id}`))
  prompts.info(`  ${choices.length + 1}. Endpoint tương thích khác`)
  for (;;) {
    const answer = (await prompts.ask('Provider (số hoặc connection ID): ')).trim()
    if (answer === String(choices.length + 1)) return customConnection(prompts)
    const connection = choices.find(item => item.id === answer) ?? choices[Number(answer) - 1]
    if (connection) return connection
    prompts.info('Chọn một provider trong danh sách.')
  }
}

async function yesNo(prompts: SetupPrompts, label: string, fallback: boolean): Promise<boolean> {
  for (;;) {
    const answer = (await prompts.ask(label)).trim().toLowerCase()
    if (!answer) return fallback
    if (['c', 'co', 'có', 'y', 'yes'].includes(answer)) return true
    if (['k', 'khong', 'không', 'n', 'no'].includes(answer)) return false
    prompts.info('Nhập c (có) hoặc k (không).')
  }
}

async function customConnection(prompts: SetupPrompts): Promise<ModelConnection> {
  const protocols = ['chat-completions', 'anthropic-messages', 'gemini'] as const
  prompts.info('Chuẩn API: 1. Chat Completions  2. Anthropic Messages  3. Gemini')
  let protocol: ModelConnection['protocol'] | undefined
  while (!protocol) {
    const answer = (await prompts.ask('Chuẩn API (mặc định 1): ')).trim() || '1'
    protocol = protocols.find(item => item === answer) ?? protocols[Number(answer) - 1]
  }
  for (;;) {
    const baseUrl = (await prompts.ask('API root URL (chưa có /chat/completions hoặc endpoint suffix): ')).trim()
    const id = 'custom-' + createHash('sha256').update(JSON.stringify([protocol, baseUrl.replace(/\/+$/, '')])).digest('hex').slice(0, 12)
    const connection: ModelConnection = { id, protocol, baseUrl }
    try { new ModelProviders([connection]) }
    catch { prompts.info('URL không hợp lệ. Dùng HTTPS; HTTP chỉ cho localhost. URL không chứa key, username hoặc query.'); continue }
    const needsKey = await yesNo(prompts, 'API này yêu cầu key? (c/k, mặc định c): ', true)
    return { ...connection, ...(needsKey ? { apiKeyEnv: 'DECKAGENT_CUSTOM_API_KEY' } : {}) }
  }
}

async function credentialFor(connection: ModelConnection, environment: Record<string, string | undefined>, vault: CredentialVault, prompts?: SetupPrompts, force = false): Promise<{ entered: boolean; save: boolean }> {
  if (!connection.apiKeyEnv) return { entered: false, save: false }
  let credential = force ? undefined : environment[connection.apiKeyEnv]
  if (!force && !credential?.trim()) {
    try { credential = await vault.read(connection) }
    catch (error) {
      if (!prompts) throw error
      prompts.info('Không đọc được key đã lưu trên máy. Hãy nhập lại key.')
    }
  }
  let entered = false, save = false
  if ((!credential || !/^[\x21-\x7e]+$/.test(credential)) && prompts) {
    entered = true
    do {
      credential = await prompts.ask('API key (ẩn khi nhập): ', true)
      if (!/^[\x21-\x7e]+$/.test(credential)) prompts.info('Key phải có giá trị, không chứa khoảng trắng hoặc ký tự ẩn. Hãy nhập lại.')
    } while (!/^[\x21-\x7e]+$/.test(credential))
    if (vault.available) save = await yesNo(prompts, 'Lưu key mã hóa trên máy để dùng lần sau? (c/k, mặc định k): ', false)
    else prompts.info('Máy này chưa hỗ trợ lưu key mã hóa. Key chỉ dùng trong lần chạy hiện tại.')
  }
  if (credential !== undefined) environment[connection.apiKeyEnv] = credential
  return { entered, save }
}

async function checkConnection(providers: ModelProviders, selection: ModelSelection, prompts: SetupPrompts): Promise<void> {
  prompts.info('Đang kiểm tra kết nối...')
  let completed = false
  for await (const event of providers.stream({ selection, messages: [{ role: 'user', content: 'Reply only OK.' }], tools: [], signal: prompts.signal })) {
    if (event.type === 'finish' && event.reason === 'stop') completed = true
  }
  if (!completed) throw new RuntimeError('MODEL_PROTOCOL', 'Connection check did not complete a text response')
}

function assertActive(prompts?: SetupPrompts): void {
  if (prompts?.signal.aborted) throw new RuntimeError('CLI_CANCELLED', 'Đã hủy thiết lập chat')
}

/** Application setup only. Runtime and provider configuration contracts remain unchanged. */
export async function prepareChat(options: ChatSetupOptions): Promise<{ providers: ModelProviders; selection: ModelSelection }> {
  const inherited = options.environment ?? process.env
  let environment = { ...inherited }
  const path = join(options.dataDir, 'profile.json')
  let archive: ChatProfile | undefined
  try { archive = await profile(path) }
  catch (error) {
    if (!(error instanceof RuntimeError && error.code === 'CLI_CONFIG' && (options.setup || options.configPath))) throw error
  }
  const saved = options.setup || options.configPath ? undefined : archive
  assertActive(options.prompts)
  const selectedProvider = options.sessionSelection?.provider ?? options.provider ?? (environment.DECKAGENT_PROVIDER || undefined) ?? saved?.selection.provider
  const selectedModel = options.sessionSelection?.model ?? options.model ?? (environment.DECKAGENT_MODEL || undefined)
    ?? (selectedProvider === saved?.selection.provider ? saved?.selection.model : undefined)
  const available = saved && (!selectedProvider || saved.connections.some(item => item.id === selectedProvider))
    ? saved.connections : await connections(options.configPath ?? 'config/models.example.json')
  let wizard = Boolean(options.setup || !selectedProvider?.trim() || !selectedModel?.trim())
  if (wizard && !options.prompts) throw new RuntimeError('CLI_CONFIG', 'A new session requires --provider and --model, or run pnpm chat in an interactive terminal for setup')
  if (wizard) options.prompts!.info('Chào mừng đến DeckAgent! Thiết lập chat.')
  let connection = options.setup || !selectedProvider?.trim() ? await choose(options.prompts!, available)
    : available.find(item => item.id === selectedProvider)
  if (!connection) throw new RuntimeError('PROVIDER_NOT_FOUND', 'Selected model connection is not configured')
  let model = options.setup ? '' : selectedModel ?? ''
  const vault = options.vault ?? new WindowsCredentialVault(options.dataDir)
  let saveCredential = false
  let forceKey = false
  for (;;) {
    while (!model.trim()) model = (await options.prompts!.ask('Model ID: ')).trim()
    const selection = { provider: connection.id, model }
    const credential = await credentialFor(connection, environment, vault, options.prompts, forceKey)
    assertActive(options.prompts)
    if (credential.entered) { wizard = true; saveCredential = credential.save }
    forceKey = false
    const providers = new ModelProviders([connection], { environment })
    try {
      providers.validateSelection(selection)
      if (wizard) await checkConnection(providers, selection, options.prompts!)
    } catch (error) {
      if (!options.prompts) throw error
      if (options.prompts.signal.aborted) throw new RuntimeError('CLI_CANCELLED', 'Đã hủy thiết lập chat')
      options.prompts.info(error instanceof RuntimeError ? `[${error.code}] ${error.message}` : 'Không thể kiểm tra kết nối.')
      options.prompts.info('Sửa: 1. API key  2. Model ID  3. Provider/endpoint  0. Thoát')
      for (;;) {
        const action = (await options.prompts.ask('Lựa chọn: ')).trim()
        if (action === '0') throw new RuntimeError('CLI_CANCELLED', 'Đã hủy thiết lập; cấu hình cũ được giữ nguyên')
        if (action === '1' && connection.apiKeyEnv) { forceKey = true; break }
        if (options.sessionSelection && ['2', '3'].includes(action)) {
          options.prompts.info('Session này giữ provider/model đã lưu. Hãy tạo Session mới để đổi model.'); continue
        }
        if (action === '2') { model = ''; break }
        if (action === '3') {
          connection = await choose(options.prompts, available)
          environment = { ...inherited }
          model = ''
          saveCredential = false
          break
        }
        options.prompts.info('Chọn thao tác phù hợp trong danh sách.')
      }
      wizard = true
      continue
    }
    if (wizard) {
      assertActive(options.prompts)
      if (saveCredential) await vault.write(connection, environment[connection.apiKeyEnv!]!)
      const catalog = new Map(archive?.connections.map(item => [item.id, item]))
      catalog.set(connection.id, connection)
      assertActive(options.prompts)
      await writeLocal(path, JSON.stringify({ version: 1, connections: [...catalog.values()], selection } satisfies ChatProfile, null, 2) + '\n')
      options.prompts!.info('Kết nối thành công! Đã lưu cấu hình chat.')
    }
    assertActive(options.prompts)
    return { providers, selection }
  }
}
