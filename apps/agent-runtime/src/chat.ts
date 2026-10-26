import { createInterface } from 'node:readline'
import { parseArgs } from 'node:util'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { RuntimeError, ToolRegistry } from '@deckagent/agent-runtime'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { startAgentRuntime } from './index.ts'
import { prepareChat } from './setup.ts'
import { TerminalPrompts } from './terminal.ts'

const help = `DeckAgent chat
  Start: pnpm chat (first-run setup in an interactive terminal; saved defaults thereafter)
  Configure again: pnpm chat --setup
  pnpm chat --config config/models.example.json --provider <connection-id> --model <model-id>
  Resume: pnpm chat --session <session-id> [--config <file>]
  List without API keys: pnpm chat --list-sessions
  Read without API keys: pnpm chat --session <id> --history
  Optional: --prompt <text> (one turn), --tools (enable the harmless noop echo tool)
  Storage: --session <id> (otherwise a new ID), --data-dir <directory> (default .deckagent)
  Environment alternatives: DECKAGENT_MODELS_CONFIG, DECKAGENT_PROVIDER, DECKAGENT_MODEL
  Chat commands: /exit, /history. Ctrl+C cancels the active turn; at idle it exits.
  API keys: environment first, saved encrypted Windows credentials next, hidden prompt if missing.
  Setup saves non-secret defaults in profile.json; connection checks do not enter chat history.
  For trusted OS certificate authorities, start Node.js with --use-system-ca.
  History persists locally in sessions.sqlite. Use the same data directory after restarting.
  An existing session keeps its provider/model; --tools must be enabled again when needed.`

type ChatArgsValues = {
  config?: string
  provider?: string
  model?: string
  prompt?: string
  tools?: boolean
  help?: boolean
  session?: string
  'data-dir'?: string
  'list-sessions'?: boolean
  history?: boolean
  setup?: boolean
}

async function main(): Promise<void> {
  let values: ChatArgsValues
  try {
    values = parseArgs({ options: {
      config: { type: 'string' }, provider: { type: 'string' }, model: { type: 'string' },
      prompt: { type: 'string' }, tools: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
      session: { type: 'string' }, 'data-dir': { type: 'string' },
      'list-sessions': { type: 'boolean' }, history: { type: 'boolean' },
      setup: { type: 'boolean' },
    } }).values
  } catch { throw new RuntimeError('CLI_CONFIG', 'Unknown or invalid arguments. Use pnpm chat --help') }
  if (values.help) { console.log(help); return }
  if (values.prompt !== undefined && !values.prompt.trim()) throw new RuntimeError('CLI_CONFIG', 'Prompt must not be empty')
  if (values.session !== undefined && !values.session.trim()) throw new RuntimeError('CLI_CONFIG', 'Session ID must not be empty')
  if (values['data-dir'] !== undefined && !values['data-dir'].trim()) throw new RuntimeError('CLI_CONFIG', 'Data directory must not be empty')
  if (values.history && !values.session) throw new RuntimeError('CLI_CONFIG', '--history requires --session <id>')
  if (values.setup && (values.session || values.prompt !== undefined || values.provider || values.model)) throw new RuntimeError('CLI_CONFIG', 'Use --setup separately from --session, --prompt, --provider or --model')
  if ((values['list-sessions'] && (values.session || values.history || values.prompt !== undefined || values.provider || values.model || values.tools || values.setup))
    || (values.history && (values.prompt !== undefined || values.provider || values.model || values.tools || values.setup))) {
    throw new RuntimeError('CLI_CONFIG', 'Use --list-sessions or --session <id> --history separately from chat options')
  }
  const dataDir = resolve(values['data-dir'] ?? '.deckagent')
  const sessions = new SqliteSessionStore(resolve(dataDir, 'sessions.sqlite'))
  try {
    if (values['list-sessions']) { console.log(JSON.stringify(await sessions.list(), null, 2)); return }
    if (values.history) { console.log(JSON.stringify(await sessions.read(values.session!), null, 2)); return }
    const sessionId = values.session ?? `chat-${randomUUID()}`
    const saved = await sessions.getInfo(sessionId)
    if (saved?.selection && ((values.provider !== undefined && values.provider !== saved.selection.provider)
      || (values.model !== undefined && values.model !== saved.selection.model))) {
      throw new RuntimeError('SESSION_CONFLICT', 'Session uses a different provider or model. Choose another session ID')
    }
    const configPath = values.config ?? (process.env.DECKAGENT_MODELS_CONFIG || undefined)
    const terminal = process.stdin.isTTY && process.stdout.isTTY && values.prompt === undefined ? new TerminalPrompts() : undefined
    let prepared: Awaited<ReturnType<typeof prepareChat>>
    try {
      prepared = await prepareChat({
        dataDir, setup: Boolean(values.setup),
        ...(configPath === undefined ? {} : { configPath }),
        ...(values.provider === undefined ? {} : { provider: values.provider }),
        ...(values.model === undefined ? {} : { model: values.model }),
        ...(saved?.selection ? { sessionSelection: saved.selection } : {}),
        ...(terminal ? { prompts: terminal } : {}),
      })
    } finally { terminal?.close() }
    const { providers, selection } = prepared
    const { provider, model } = selection
    await sessions.bind(sessionId, selection)
    const tools = new ToolRegistry()
    if (values.tools) tools.register({
      name: 'noop', description: 'Return the supplied value unchanged. Use this to check tool calling.',
      parameters: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'], additionalProperties: false },
      execute: async args => {
        const value = String(args.value)
        console.log(`Tool noop: ${value}`)
        return value
      },
    })
    const ctx = await startAgentRuntime({ model: providers, sessions, tools, systemPrompt: 'You are DeckAgent. Help the user and use tools only when needed.' })
    let lines: ReturnType<typeof createInterface> | undefined
    let active: AbortController | undefined
    let closing = false
    const interrupt = () => {
      if (active && !active.signal.aborted) active.abort()
      else { closing = true; lines?.close() }
    }
    process.on('SIGINT', interrupt)
    try {
      const agent = await ctx.get('agentRuntime')!.createAgent({ sessionId, selection, tools: values.tools ? ['noop'] : [] })
      const send = async (input: string) => {
        active = new AbortController()
        try {
          const result = await agent.send(input, { signal: active.signal })
          if (result.text) console.log(`Assistant: ${result.text}`)
          if (result.status !== 'completed') {
            console.error(`[${result.error.code}] ${result.error.message}`)
            if (values.prompt !== undefined) process.exitCode = 1
          }
        } finally { active = undefined }
      }
      console.log(`Connection: ${provider}; model: ${model}. Session: ${sessionId}`)
      console.log(`History: SQLite (${dataDir}). Resume with --session ${sessionId}`)
      if (values.prompt !== undefined) { await send(values.prompt); return }
      lines = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) })
      lines.on('SIGINT', interrupt)
      if (process.stdin.isTTY) process.stdout.write('You: ')
      for await (const line of lines) {
        if (closing || line.trim() === '/exit') break
        if (line.trim() === '/history') {
          for (const message of await agent.history()) console.log(`${message.role}: ${message.content}`)
        } else if (line.trim()) await send(line)
        if (!closing && process.stdin.isTTY) process.stdout.write('You: ')
      }
    } finally {
      process.off('SIGINT', interrupt)
      lines?.close()
      await ctx.fiber.dispose()
    }
  } finally { sessions.close() }
}

main().catch(error => {
  // Unexpected exceptions may include request URLs, bodies or credentials: never print them.
  console.error(error instanceof RuntimeError ? `[${error.code}] ${error.message}` : '[CLI_FAILED] Unable to start or complete chat')
  process.exitCode = error instanceof RuntimeError && error.code === 'CLI_CANCELLED' ? 130 : 1
})
