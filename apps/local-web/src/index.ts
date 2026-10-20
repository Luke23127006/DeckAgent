import { mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { ToolRegistry, runtimePlugin } from '@deckagent/agent-runtime'
import type { ModelAdapter, ModelSelection } from '@deckagent/agent-runtime'
import { registerFileTools } from '@deckagent/file-tools'
import { startHost } from '@deckagent/host-api'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { page, style } from './ui-assets.ts'

export interface LocalWebOptions {
  readonly model: ModelAdapter
  readonly selection: ModelSelection
  readonly workspace: string
  readonly dataDir: string
  readonly port?: number
}

/** Composition owns Host -> Agent -> tools -> storage cleanup in that order. */
export async function startLocalWeb(options: LocalWebOptions) {
  await mkdir(resolve(options.workspace), { recursive: true })
  await mkdir(resolve(options.dataDir), { recursive: true })
  const workspace = await realpath(resolve(options.workspace))
  const dataDir = await realpath(resolve(options.dataDir))
  const dataRelative = relative(workspace, dataDir)
  const outside = dataRelative === '..' || dataRelative.startsWith(`..${sep}`) || isAbsolute(dataRelative)
  if (!outside) throw new Error('Host data must be outside the Agent workspace')
  const tools = new ToolRegistry()
  const files = await registerFileTools(tools, { root: workspace })
  const ctx = new Context()
  let sessions: SqliteSessionStore | undefined
  try {
    sessions = new SqliteSessionStore(join(dataDir, 'sessions.sqlite'))
    const store = sessions
    ctx.provide('agentModel', options.model)
    ctx.provide('agentSessions', store)
    ctx.provide('agentTools', tools)
    await ctx.plugin(runtimePlugin, {
      systemPrompt:
        'You are DeckAgent. Use read_file and write_file only within the granted workspace. Write HTML drafts as new files; do not overwrite existing files.',
    })
    const assets: Record<string, { contentType: string; body: string }> = {
      '/': { contentType: 'text/html; charset=utf-8', body: page },
      '/style.css': { contentType: 'text/css; charset=utf-8', body: style },
    }
    const clientDir = dirname(fileURLToPath(import.meta.resolve('@deckagent/browser-runtime')))
    for (const name of await readdir(clientDir)) {
      if (/^[\w-]+\.js$/.test(name))
        assets[`/client/${name}`] = {
          contentType: 'text/javascript; charset=utf-8',
          body: await readFile(join(clientDir, name), 'utf8'),
        }
    }
    const host = await startHost({
      assets,
      ...(options.port === undefined ? {} : { port: options.port }),
      async openAgent(sessionId) {
        await store.bind(sessionId, options.selection)
        return ctx.agentRuntime.createAgent({ sessionId, selection: options.selection, tools: files.names })
      },
      readHistory: id => store.read(id),
    })
    let closing: Promise<void> | undefined
    return {
      origin: host.origin,
      token: host.token,
      close(): Promise<void> {
        closing ??= (async () => {
          try {
            await host.close()
          } finally {
            try {
              await ctx.fiber.dispose()
            } finally {
              files.dispose()
              store.close()
            }
          }
        })()
        return closing
      },
    }
  } catch (error) {
    try {
      await ctx.fiber.dispose()
    } finally {
      files.dispose()
      sessions?.close()
    }
    throw error
  }
}
