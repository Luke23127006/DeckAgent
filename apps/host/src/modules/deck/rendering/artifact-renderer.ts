import { DeckError } from '@deckagent/deck'
import { assertValidationReport, buildValidationExpression } from './dom-validation.ts'
import { disposeManagedBrowser, launchManagedBrowser } from './cdp-browser.ts'
import type { ManagedBrowser } from './cdp-browser.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Process-wide cap: two browser renders at once at most, so the Host keeps CPU for other work. */
let activeRenders = 0

export interface ArtifactRenderer {
  render(html: string, requiredText: readonly string[], caller: AbortSignal): Promise<void>
  close(): Promise<void>
}

/** A hidden local browser checks the exact materialized document, with network access denied. */
class ManagedRenderer implements ArtifactRenderer {
  private browser: ManagedBrowser | undefined
  private launching: Promise<ManagedBrowser> | undefined
  private inFlight = 0
  private idleTimer: ReturnType<typeof setTimeout> | undefined
  private closed = false
  private disposing: Promise<void> | undefined
  private generation = 0

  constructor(
    private readonly root: string,
    private readonly idleMs: number,
  ) {}

  async render(html: string, requiredText: readonly string[], caller: AbortSignal): Promise<void> {
    if (activeRenders >= 2) throw new DeckError('ARTIFACT_RENDERER_BUSY')
    activeRenders++
    this.inFlight++
    this.clearIdleTimer()
    const signal = AbortSignal.any([caller, AbortSignal.timeout(15000)])
    try {
      const current = await this.acquireBrowser(signal)
      if (await this.runIsolatedRender(current, html, requiredText, signal)) await this.recycle(current)
    } catch (error) {
      if (caller.aborted) caller.throwIfAborted()
      throw error instanceof DeckError ? error : new DeckError('ARTIFACT_RENDERER_FAILED')
    } finally {
      this.inFlight--
      if (this.inFlight === 0) this.armIdleTimer()
      activeRenders--
    }
  }

  async close(): Promise<void> {
    this.closed = true
    this.clearIdleTimer()
    const pending = this.launching
    if (pending) await pending.catch(() => {})
    await this.recycle()
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== undefined) clearTimeout(this.idleTimer)
    this.idleTimer = undefined
  }

  private armIdleTimer(): void {
    if (this.inFlight !== 0 || this.idleMs <= 0 || !this.browser) return
    this.clearIdleTimer()
    const timer = setTimeout(() => {
      void this.recycle()
    }, this.idleMs)
    timer.unref()
    this.idleTimer = timer
  }

  private recycle(target?: ManagedBrowser): Promise<void> {
    this.clearIdleTimer()
    const current = target ?? this.browser
    if (target === undefined || target === this.browser) this.browser = undefined
    if (!current) return this.disposing ?? Promise.resolve()
    this.disposing = (this.disposing ?? Promise.resolve())
      .then(() => disposeManagedBrowser(current, this.root))
      .catch(() => {})
    return this.disposing
  }

  private async acquireBrowser(signal: AbortSignal): Promise<ManagedBrowser> {
    this.clearIdleTimer()
    if (this.closed) throw new DeckError('ARTIFACT_RENDERER_FAILED')
    if (this.browser) return this.browser
    if (this.launching) return this.launching
    const current = ++this.generation
    const starting = launchManagedBrowser(this.root, signal, () => {
      if (current === this.generation) this.browser = undefined
    })
    this.launching = starting
    try {
      const value = await starting
      this.browser = value
      return value
    } finally {
      if (this.launching === starting) this.launching = undefined
    }
  }

  /** One incognito context and target per render; a failed cleanup marks the shared browser as poisoned. */
  private async runIsolatedRender(
    current: ManagedBrowser,
    html: string,
    requiredText: readonly string[],
    signal: AbortSignal,
  ): Promise<boolean> {
    const context = await current.cdp.call('Target.createBrowserContext', { disposeOnDetach: true }, { signal })
    if (!object(context) || typeof context.browserContextId !== 'string')
      throw new DeckError('ARTIFACT_RENDERER_FAILED')
    const browserContextId = context.browserContextId
    let targetId: string | undefined
    let poisoned = false
    let failure: unknown
    try {
      const target = await current.cdp.call('Target.createTarget', { url: 'about:blank', browserContextId }, { signal })
      if (!object(target) || typeof target.targetId !== 'string') throw new DeckError('ARTIFACT_RENDERER_FAILED')
      targetId = target.targetId
      const attached = await current.cdp.call('Target.attachToTarget', { targetId, flatten: true }, { signal })
      if (!object(attached) || typeof attached.sessionId !== 'string') throw new DeckError('ARTIFACT_RENDERER_FAILED')
      const session = { sessionId: attached.sessionId, signal }
      await current.cdp.call(
        'Emulation.setDeviceMetricsOverride',
        { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false },
        session,
      )
      await current.cdp.call('Network.enable', {}, session)
      await current.cdp.call(
        'Network.setBlockedURLs',
        { urls: ['http://*', 'https://*', 'file://*', 'ftp://*', 'ws://*', 'wss://*'] },
        session,
      )
      const tree = await current.cdp.call('Page.getFrameTree', {}, session)
      if (
        !object(tree) ||
        !object(tree.frameTree) ||
        !object(tree.frameTree.frame) ||
        typeof tree.frameTree.frame.id !== 'string'
      )
        throw new DeckError('ARTIFACT_RENDERER_FAILED')
      await current.cdp.call('Page.setDocumentContent', { frameId: tree.frameTree.frame.id, html }, session)
      const report = await current.cdp.call(
        'Runtime.evaluate',
        { expression: buildValidationExpression(requiredText), awaitPromise: true, returnByValue: true },
        session,
      )
      assertValidationReport(report)
    } catch (error) {
      failure = error
    } finally {
      const cleanup = AbortSignal.timeout(3000)
      if (targetId)
        await current.cdp.call('Target.closeTarget', { targetId }, { signal: cleanup }).catch(() => {
          poisoned = true
        })
      await current.cdp.call('Target.disposeBrowserContext', { browserContextId }, { signal: cleanup }).catch(() => {
        poisoned = true
      })
    }
    if (failure !== undefined) {
      if (poisoned) await this.recycle(current)
      throw failure
    }
    return poisoned
  }
}

export function artifactRenderer(root: string, options: { readonly idleMs?: number } = {}): ArtifactRenderer {
  return new ManagedRenderer(root, options.idleMs ?? 60_000)
}
