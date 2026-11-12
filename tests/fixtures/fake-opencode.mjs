// Fake OpenCode CLI for developer checks: `node fake-opencode.mjs <log-file> <opencode arguments...>`.
// It imitates the pinned CLI's `--version`, `debug config` and `run --format json` wire shapes. Never live-model evidence.
// A marker in the user's newest request text chooses the behavior: [hang] [slow] [auth] [crash] [malformed]
// [incomplete] [tool] [stderr-secret] [split] [overflow] [overflow-fail]. `<log-file>.mode.json` can set
// { "version", "unsafe" }. The overflow sequences follow the 1.19.5 run loop and compaction code, read from the
// pinned binary; they are not output captured from a real run.
import { createHash, randomUUID } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [logFile, ...args] = process.argv.slice(2)
const mode = existsSync(`${logFile}.mode.json`) ? JSON.parse(readFileSync(`${logFile}.mode.json`, 'utf8')) : {}
const key = process.env.DECKAGENT_PROVIDER_KEY
const content = process.env.OPENCODE_CONFIG_CONTENT ?? ''
const log = entry => appendFileSync(logFile, `${JSON.stringify({ pid: process.pid, cwd: process.cwd(), args, ...entry })}\n`)
const out = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

if (args[0] === '--version') {
  process.stdout.write(`${mode.version ?? 'fake-1.0.0'}\n`)
  process.exit(0)
}

if (args[0] === 'debug' && args[1] === 'config') {
  // The real CLI substitutes {env:...} references before parsing; so does this fixture.
  const resolved = JSON.parse(content.replaceAll('{env:DECKAGENT_PROVIDER_KEY}', key ?? '').replaceAll('{env:DECKAGENT_MCP_TOKEN}', process.env.DECKAGENT_MCP_TOKEN ?? ''))
  if (resolved.mcp?.deckagent) resolved.mcp.deckagent.headers.Authorization = '***'
  if (mode.unsafe) resolved.permission = { '*': 'allow' }
  log({ command: 'debug-config', keySha: key ? createHash('sha256').update(key).digest('hex') : null })
  process.stdout.write(JSON.stringify(resolved, null, 2))
  process.exit(0)
}

if (args[0] !== 'run') process.exit(64)

let prompt = ''
for await (const chunk of process.stdin) prompt += chunk
const marker = prompt.includes("The user's new request:\n") ? prompt.slice(prompt.lastIndexOf("The user's new request:\n")) : prompt
const has = name => marker.includes(`[${name}]`)
const sessionIndex = args.indexOf('--session')
const resume = sessionIndex >= 0 ? args[sessionIndex + 1] : undefined
const store = join(process.env.XDG_DATA_HOME ?? '.', 'fake-opencode-sessions.json')
mkdirSync(process.env.XDG_DATA_HOME ?? '.', { recursive: true })
const sessions = existsSync(store) ? JSON.parse(readFileSync(store, 'utf8')) : {}
log({ command: 'run', resume: resume ?? null, prompt, keySha: key ? createHash('sha256').update(key).digest('hex') : null,
  configHasKeyReference: content.includes('{env:DECKAGENT_PROVIDER_KEY}'), configHasLiteralKey: !!key && content.includes(key),
  env: Object.keys(process.env).filter(name => /^(OPENCODE_|XDG_|HOME$|USERPROFILE$|DECKAGENT_)/.test(name)).sort() })

if (resume && !sessions[resume]) {
  // 1.19.5 prints this on stderr and exits 1 before any JSON event.
  process.stderr.write('Error: Session not found\n')
  process.exit(1)
}
const sessionID = resume ?? `ses_${randomUUID().replaceAll('-', '')}`
sessions[sessionID] = (sessions[sessionID] ?? 0) + 1
writeFileSync(store, JSON.stringify(sessions))
// Every part names its native message, as in 1.19.5; assistant steps start with a step_start part.
let messageID = `msg_a${sessions[sessionID]}_1`
const event = (type, part = {}) => out({ type, timestamp: Date.now(), sessionID, ...(part ? { part: { messageID, sessionID, ...part } } : {}) })
const text = `Echo ${sessions[sessionID]}: ${marker.split('\n').at(-1)?.slice(0, 200) ?? ''}`
const overflow = () => out({ type: 'error', timestamp: Date.now(), sessionID,
  error: { name: 'ContextOverflowError', data: { message: `prompt is too long (key ${key})` } } })

if (has('crash')) process.exit(2)
if (has('malformed')) { process.stdout.write('this is not json\n'); process.exit(0) }
if (has('stderr-secret')) process.stderr.write(`provider said: invalid key ${key}\n`)
if (has('overflow') || has('overflow-fail')) {
  // 1.19.5 with compaction.auto: the refused call is reported, a summary message is written, the request is
  // answered again; the run then exits 1 because an error was reported.
  event('step_start', { id: 'prt_refused', type: 'step-start' })
  overflow()
  messageID = 'msg_summary'
  event('step_start', { id: 'prt_sum_start', type: 'step-start' })
  if (has('overflow-fail')) { overflow(); process.exit(1) }
  event('text', { id: 'prt_summary', type: 'text', text: 'SUMMARY-TEXT-FOR-THE-MODEL', time: { start: 1, end: 2 } })
  event('step_finish', { id: 'prt_sum_finish', type: 'step-finish', reason: 'stop' })
  // A synthetic user part (OpenCode's own "continue" note) has an end time and is printed too.
  messageID = 'msg_user_continue'
  event('text', { id: 'prt_continue', type: 'text', synthetic: true, text: 'Continue if you have next steps', time: { start: 1, end: 2 } })
  messageID = 'msg_answer'
  event('step_start', { id: 'prt_answer_start', type: 'step-start' })
  event('text', { id: 'prt_answer', type: 'text', text })
  event('step_finish', { id: 'prt_answer_finish', type: 'step-finish', reason: 'stop' })
  process.exit(1)
}
event('step_start', { id: 'prt_step1', type: 'step-start' })
if (has('mcp-read') || has('mcp-external') || has('mcp-twice') || has('mcp-forbidden')) {
  const config = JSON.parse(content.replaceAll('{env:DECKAGENT_PROVIDER_KEY}', key ?? '').replaceAll('{env:DECKAGENT_MCP_TOKEN}', process.env.DECKAGENT_MCP_TOKEN ?? ''))
  const bridge = config.mcp?.deckagent
  if (!bridge) process.exit(3)
  const external = has('mcp-external') || has('mcp-twice')
  const markerName = has('mcp-twice') ? '[mcp-twice]' : '[mcp-external]'
  const path = external ? marker.slice(marker.lastIndexOf(markerName) + markerName.length).trim().split('\n')[0] : 'notes.txt'
  for (let i = 0; i < (has('mcp-twice') ? 3 : 1); i++) {
    const name = has('mcp-forbidden') ? 'write_file' : external ? 'read_external' : 'read_source'
    const response = await fetch(bridge.url, { method: 'POST', headers: { ...bridge.headers, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: i + 1, method: 'tools/call', params: { name, arguments: { path } } }) })
    const result = await response.json()
    event('text', { id: `prt_mcp_${i}`, type: 'text', text: result.result?.content?.[0]?.text ?? 'TOOL_FAILED' })
  }
}
if (has('auth')) {
  out({ type: 'error', timestamp: Date.now(), sessionID, error: { name: 'APIError', data: { message: `bad key ${key}`, statusCode: 401 } } })
  process.exit(1)
}
if (has('hang')) {
  event('text', { id: 'prt_partial', type: 'text', text: 'Partial answer before Stop' })
  process.on('SIGTERM', () => {})
  await sleep(10 * 60 * 1000)
}
if (has('tool')) {
  event('tool_use', { id: 'prt_tool', callID: 'call_1', tool: 'read', state: { status: 'error', error: 'denied by permission' } })
  event('step_finish', { id: 'prt_finish1', type: 'step-finish', reason: 'tool-calls' })
  event('step_start', { id: 'prt_step2', type: 'step-start' })
}
if (has('slow')) {
  event('text', { id: 'prt_text', type: 'text', text: 'Partial' })
  await sleep(1500)
}
if (has('split')) {
  // One JSON line written in two chunks.
  const line = JSON.stringify({ type: 'text', timestamp: Date.now(), sessionID, part: { id: 'prt_split', type: 'text', text: 'Split frame' } })
  process.stdout.write(line.slice(0, 20))
  await sleep(100)
  process.stdout.write(`${line.slice(20)}\n`)
}
event('text', { id: 'prt_text', type: 'text', text })
// A repeated frame of the same part must not duplicate the reply.
event('text', { id: 'prt_text', type: 'text', text })
if (has('incomplete')) process.exit(0)
event('step_finish', { id: 'prt_finish', type: 'step-finish', reason: 'stop', tokens: { input: 10, output: 5 } })
process.exit(0)
