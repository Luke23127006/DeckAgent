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
const log = entry =>
  appendFileSync(logFile, `${JSON.stringify({ pid: process.pid, cwd: process.cwd(), args, ...entry })}\n`)
const out = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

if (args[0] === '--version') {
  process.stdout.write(`${mode.version ?? 'fake-1.0.0'}\n`)
  process.exit(0)
}

if (args[0] === 'debug' && args[1] === 'config') {
  // The real CLI substitutes {env:...} references before parsing; so does this fixture.
  const resolved = JSON.parse(
    content
      .replaceAll('{env:DECKAGENT_PROVIDER_KEY}', key ?? '')
      .replaceAll('{env:DECKAGENT_MCP_TOKEN}', process.env.DECKAGENT_MCP_TOKEN ?? ''),
  )
  if (resolved.mcp?.deckagent) resolved.mcp.deckagent.headers.Authorization = '***'
  if (mode.unsafe) resolved.permission = { '*': 'allow' }
  log({ command: 'debug-config', keySha: key ? createHash('sha256').update(key).digest('hex') : null })
  process.stdout.write(JSON.stringify(resolved, null, 2))
  process.exit(0)
}

if (args[0] !== 'run') process.exit(64)

let prompt = ''
for await (const chunk of process.stdin) prompt += chunk
const marker = prompt.includes("The user's new request:\n")
  ? prompt.slice(prompt.lastIndexOf("The user's new request:\n"))
  : prompt
const has = name => marker.includes(`[${name}]`)
const sessionIndex = args.indexOf('--session')
const resume = sessionIndex >= 0 ? args[sessionIndex + 1] : undefined
const store = join(process.env.XDG_DATA_HOME ?? '.', 'fake-opencode-sessions.json')
mkdirSync(process.env.XDG_DATA_HOME ?? '.', { recursive: true })
const sessions = existsSync(store) ? JSON.parse(readFileSync(store, 'utf8')) : {}
log({
  command: 'run',
  resume: resume ?? null,
  prompt,
  keySha: key ? createHash('sha256').update(key).digest('hex') : null,
  configHasKeyReference: content.includes('{env:DECKAGENT_PROVIDER_KEY}'),
  configHasLiteralKey: !!key && content.includes(key),
  env: Object.keys(process.env)
    .filter(name => /^(OPENCODE_|XDG_|HOME$|USERPROFILE$|DECKAGENT_)/.test(name))
    .sort(),
})

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
const event = (type, part = {}) =>
  out({ type, timestamp: Date.now(), sessionID, ...(part ? { part: { messageID, sessionID, ...part } } : {}) })
const text = `Echo ${sessions[sessionID]}: ${marker.split('\n').at(-1)?.slice(0, 200) ?? ''}`
const overflow = () =>
  out({
    type: 'error',
    timestamp: Date.now(),
    sessionID,
    error: { name: 'ContextOverflowError', data: { message: `prompt is too long (key ${key})` } },
  })

if (has('crash')) process.exit(2)
if (has('malformed')) {
  process.stdout.write('this is not json\n')
  process.exit(0)
}
if (has('stderr-secret')) process.stderr.write(`provider said: invalid key ${key}\n`)
if (has('overflow') || has('overflow-fail')) {
  // 1.19.5 with compaction.auto: the refused call is reported, a summary message is written, the request is
  // answered again; the run then exits 1 because an error was reported.
  event('step_start', { id: 'prt_refused', type: 'step-start' })
  overflow()
  messageID = 'msg_summary'
  event('step_start', { id: 'prt_sum_start', type: 'step-start' })
  if (has('overflow-fail')) {
    overflow()
    process.exit(1)
  }
  event('text', { id: 'prt_summary', type: 'text', text: 'SUMMARY-TEXT-FOR-THE-MODEL', time: { start: 1, end: 2 } })
  event('step_finish', { id: 'prt_sum_finish', type: 'step-finish', reason: 'stop' })
  // A synthetic user part (OpenCode's own "continue" note) has an end time and is printed too.
  messageID = 'msg_user_continue'
  event('text', {
    id: 'prt_continue',
    type: 'text',
    synthetic: true,
    text: 'Continue if you have next steps',
    time: { start: 1, end: 2 },
  })
  messageID = 'msg_answer'
  event('step_start', { id: 'prt_answer_start', type: 'step-start' })
  event('text', { id: 'prt_answer', type: 'text', text })
  event('step_finish', { id: 'prt_answer_finish', type: 'step-finish', reason: 'stop' })
  process.exit(1)
}
event('step_start', { id: 'prt_step1', type: 'step-start' })
if (existsSync(`${logFile}.generation.json`)) {
  const config = JSON.parse(
    content
      .replaceAll('{env:DECKAGENT_PROVIDER_KEY}', key ?? '')
      .replaceAll('{env:DECKAGENT_MCP_TOKEN}', process.env.DECKAGENT_MCP_TOKEN ?? ''),
  )
  const bridge = config.mcp?.deckagent
  if (config.permission.deckagent_publish_slide === 'allow') {
    const call = async (name, value, raw = false) => {
      const response = await fetch(bridge.url, {
        method: 'POST',
        headers: {
          ...bridge.headers,
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: name,
          method: 'tools/call',
          params: { name, arguments: raw ? value : { json: JSON.stringify(value) } },
        }),
      })
      const responseBody = await response.json()
      const tool = responseBody.result
      if (!tool || tool.isError) throw new Error(tool?.content?.[0]?.text ?? 'TOOL_FAILED')
      return JSON.parse(tool.content[0].text)
    }
    const plan = await call('read_generation_plan', {})
    if (plan.sources.length) {
      const source = await call('read_source', { path: plan.sources[0].label }, true)
      if (!source.text.includes('project marker')) throw new Error('Selected source not readable')
      let denied = false
      try {
        await call('read_source', { path: 'secret.txt' }, true)
      } catch {
        denied = true
      }
      if (!denied) throw new Error('Unselected source was exposed')
      event('text', { id: 'prt_sources', type: 'text', text: 'Selected source readable; unselected source refused' })
    }
    const fixture = JSON.parse(readFileSync(`${logFile}.generation.json`, 'utf8'))
    if (fixture.negative) {
      for (const [name, value] of [
        ['stage_brief', {}],
        ['stage_outline', {}],
        ['confirm_outline', {}],
        ['begin_slide', { slideId: 'foreign-slide', layoutId: 'title-body' }],
        ['read_source', { path: 'secret.txt' }],
      ]) {
        let rejected = false
        try {
          await call(name, value)
        } catch {
          rejected = true
        }
        if (!rejected) throw new Error(`Unexpected generation permission: ${name}`)
      }
      event('text', { id: 'prt_negative', type: 'text', text: 'Generation phase escalation and foreign scope refused' })
    }
    const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    let publishedCount = 0
    for (const slide of plan.slides) {
      const stage = await call('begin_slide', { slideId: slide.slideId, layoutId: slide.candidates[0].id })
      const imageTags = []
      for (const block of slide.blocks.filter(b => !stage.document && b.kind === 'web-image')) {
        try {
          const image = await call('find_slide_image', {
            stageId: stage.stageId,
            slideId: slide.slideId,
            query: block.query,
          })
          imageTags.push(
            `<img src="asset:${image.assetId}" alt="Public illustration" style="width:80px;height:80px">${block.caption ? `<p>${escapeHtml(block.caption)}</p>` : ''}`,
          )
        } catch (error) {
          if (block.required !== false) throw error
        }
      }
      const html =
        stage.starter ??
        `<h1>${escapeHtml(slide.title)}</h1><ul>${slide.blocks
          .flatMap(b => b.items ?? [])
          .map(text => `<li>${escapeHtml(text)}</li>`)
          .join('')}</ul>${imageTags.join('')}`
      await call('append_slide', { stageId: stage.stageId, sequence: 0, text: html, final: true })
      if (fixture.negative) {
        let rejected = false
        try {
          await call('record_slide_provenance', {
            stageId: stage.stageId,
            entries: [{ text: slide.content, kind: 'fact', evidenceId: 'evidence-forged', quote: 'fabricated' }],
          })
        } catch {
          rejected = true
        }
        if (!rejected) throw new Error('Forged source evidence was accepted')
      }
      const source = plan.sources?.find(s => s.kind === 'project-file')
      const proof = source ? await call('read_source', { path: source.label }, true) : undefined
      await call('record_slide_provenance', {
        stageId: stage.stageId,
        ...(plan.outline.brief.draft.presenterNotes
          ? { notes: `Present ${slide.title} using a concrete example for the audience.` }
          : {}),
        entries: [
          ...(stage.document
            ? [
                stage.document.title,
                ...stage.document.nodes.flatMap(n =>
                  n.kind === 'bullets'
                    ? n.items
                    : n.kind === 'columns'
                      ? n.columns.flatMap(c => c.bullets)
                      : n.kind === 'metrics'
                        ? n.items.flatMap(m => [m.value, m.label])
                        : n.kind === 'image'
                          ? n.caption
                            ? [n.caption]
                            : []
                          : [n.text],
                ),
              ]
                .filter(text => text !== slide.content)
                .map(text => ({ text, kind: 'wording' }))
            : []),
          {
            text: slide.content,
            kind: proof ? 'fact' : 'wording',
            ...(proof ? { evidenceId: proof.evidenceId, quote: proof.text } : {}),
          },
        ],
      })
      if (stage.document) {
        const validation = await call('validate_slide', { stageId: stage.stageId, slideId: slide.slideId })
        if (!validation.valid) throw new Error(`Template validation: ${JSON.stringify(validation.issues)}`)
      }
      await call('publish_slide', {
        stageId: stage.stageId,
        slideId: slide.slideId,
        expectedRevision: 0,
        publicationId: `pub-${slide.slideId}`,
      })
      publishedCount++
      if (fixture.stopAfterFirst || publishedCount === fixture.stopAfter) {
        event('text', { id: 'prt_partial', type: 'text', text: 'First published; waiting for Stop' })
        await sleep(10 * 60 * 1000)
      }
    }
  }
}
if (has('workflow') && existsSync(`${logFile}.workflow.json`)) {
  const workflow = JSON.parse(readFileSync(`${logFile}.workflow.json`, 'utf8'))
  const config = JSON.parse(
    content
      .replaceAll('{env:DECKAGENT_PROVIDER_KEY}', key ?? '')
      .replaceAll('{env:DECKAGENT_MCP_TOKEN}', process.env.DECKAGENT_MCP_TOKEN ?? ''),
  )
  const bridge = config.mcp.deckagent
  if (
    workflow.expectedImageChoice &&
    !config.agent.deckagent.prompt.includes(`"imageChoice":"${workflow.expectedImageChoice}"`)
  )
    throw new Error('Host image choice missing from workflow context')
  for (const [name, value] of [
    ['stage_brief', workflow.brief],
    ['stage_outline', workflow.outline],
  ]) {
    if (value === undefined) continue
    const response = await fetch(bridge.url, {
      method: 'POST',
      headers: { ...bridge.headers, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: name,
        method: 'tools/call',
        params: { name, arguments: { json: JSON.stringify(value) } },
      }),
    })
    const result = await response.json()
    event('text', { id: `prt_${name}`, type: 'text', text: result.result?.content?.[0]?.text ?? 'TOOL_FAILED' })
  }
}
if (
  has('mcp-read') ||
  has('mcp-external') ||
  has('mcp-twice') ||
  has('mcp-forbidden') ||
  has('mcp-attachment') ||
  has('mcp-research') ||
  has('mcp-research-read')
) {
  const config = JSON.parse(
    content
      .replaceAll('{env:DECKAGENT_PROVIDER_KEY}', key ?? '')
      .replaceAll('{env:DECKAGENT_MCP_TOKEN}', process.env.DECKAGENT_MCP_TOKEN ?? ''),
  )
  const bridge = config.mcp?.deckagent
  if (!bridge) process.exit(3)
  const external = has('mcp-external') || has('mcp-twice')
  const markerName = has('mcp-twice') ? '[mcp-twice]' : '[mcp-external]'
  const path = external
    ? marker
        .slice(marker.lastIndexOf(markerName) + markerName.length)
        .trim()
        .split('\n')[0]
    : 'notes.txt'
  for (let i = 0; i < (has('research-budget') ? 4 : has('mcp-twice') ? 3 : 1); i++) {
    const name = has('mcp-research-read')
      ? 'read_research'
      : has('mcp-research')
        ? 'research_public'
        : has('mcp-attachment')
          ? 'read_attachment'
          : has('mcp-forbidden')
            ? 'write_file'
            : external
              ? 'read_external'
              : 'read_source'
    const toolArguments = has('mcp-research-read')
      ? { sourceId: marker.match(/src-[a-f0-9-]{36}/)?.[0] }
      : has('mcp-research')
        ? { query: 'public fixture facts' }
        : has('mcp-attachment')
          ? { attachmentId: marker.match(/att-[a-f0-9-]{36}/)?.[0] }
          : { path }
    const response = await fetch(bridge.url, {
      method: 'POST',
      headers: { ...bridge.headers, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: i + 1,
        method: 'tools/call',
        params: { name, arguments: toolArguments },
      }),
    })
    const result = await response.json()
    event('text', { id: `prt_mcp_${i}`, type: 'text', text: result.result?.content?.[0]?.text ?? 'TOOL_FAILED' })
  }
}
if (has('auth')) {
  out({
    type: 'error',
    timestamp: Date.now(),
    sessionID,
    error: { name: 'APIError', data: { message: `bad key ${key}`, statusCode: 401 } },
  })
  process.exit(1)
}
if (has('hang')) {
  event('text', { id: 'prt_partial', type: 'text', text: 'Partial answer before Stop' })
  process.on('SIGTERM', () => {})
  await sleep(10 * 60 * 1000)
}
if (has('tool')) {
  event('tool_use', {
    id: 'prt_tool',
    callID: 'call_1',
    tool: 'read',
    state: { status: 'error', error: 'denied by permission' },
  })
  event('step_finish', { id: 'prt_finish1', type: 'step-finish', reason: 'tool-calls' })
  event('step_start', { id: 'prt_step2', type: 'step-start' })
}
if (has('slow')) {
  event('text', { id: 'prt_text', type: 'text', text: 'Partial' })
  await sleep(1500)
}
if (has('split')) {
  // One JSON line written in two chunks.
  const line = JSON.stringify({
    type: 'text',
    timestamp: Date.now(),
    sessionID,
    part: { id: 'prt_split', type: 'text', text: 'Split frame' },
  })
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
