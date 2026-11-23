import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, lstat, realpath } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { DeckError } from '@deckagent/deck'
import { inspectControlledLayout } from '@deckagent/html-format'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
let running = 0
async function executable(): Promise<string> {
  for (const path of [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]) {
    try {
      await access(path)
      return path
    } catch {
      /* Next supported local browser. */
    }
  }
  throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
}

function rendererEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const key of [
    'PATH',
    'Path',
    'SystemRoot',
    'WINDIR',
    'SystemDrive',
    'COMSPEC',
    'ProgramFiles',
    'ProgramFiles(x86)',
    'ProgramW6432',
    'PUBLIC',
    'ALLUSERSPROFILE',
    'PROGRAMDATA',
    'PROCESSOR_ARCHITECTURE',
    'NUMBER_OF_PROCESSORS',
    'OS',
    'USERNAME',
    'USERDOMAIN',
    'HOMEDRIVE',
    'HOMEPATH',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
    'HOME',
  ]) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }
  return env
}

async function connect(url: string, signal: AbortSignal) {
  const socket = new WebSocket(url)
  const pending = new Map<number, { resolve(value: unknown): void; reject(reason: unknown): void }>()
  let sequence = 0
  const abort = () => socket.close()
  signal.addEventListener('abort', abort, { once: true })
  await new Promise<void>((resolve, reject) => {
    socket.addEventListener('open', () => resolve(), { once: true })
    socket.addEventListener('error', () => reject(new DeckError('ARTIFACT_RENDERER_FAILED')), { once: true })
    socket.addEventListener('close', () => reject(new DeckError('ARTIFACT_RENDERER_FAILED')), { once: true })
  })
  socket.addEventListener('message', event => {
    const v: unknown = JSON.parse(String(event.data))
    if (!object(v) || typeof v.id !== 'number') return
    const waiter = pending.get(v.id)
    if (!waiter) return
    pending.delete(v.id)
    if (v.error) waiter.reject(new DeckError('ARTIFACT_RENDERER_FAILED'))
    else waiter.resolve(v.result)
  })
  socket.addEventListener('close', () => {
    for (const waiter of pending.values()) waiter.reject(new DeckError('ARTIFACT_RENDERER_FAILED'))
    pending.clear()
  })
  return {
    call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
      signal.throwIfAborted()
      return new Promise((resolve, reject) => {
        const id = ++sequence
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close() {
      signal.removeEventListener('abort', abort)
      socket.close()
    },
  }
}

/** A hidden local browser checks the exact materialized document, with network access denied. */
export function artifactRenderer(root: string) {
  return async (html: string, requiredText: readonly string[], caller: AbortSignal): Promise<void> => {
    if (running >= 2) throw new DeckError('ARTIFACT_RENDERER_BUSY')
    running++
    const signal = AbortSignal.any([caller, AbortSignal.timeout(15000)])
    let folder: string | undefined
    let child: ReturnType<typeof spawn> | undefined
    let protocol: Awaited<ReturnType<typeof connect>> | undefined
    const abort = () => child?.kill()
    try {
      let existing = resolve(root)
      while (!(await lstat(existing).catch(() => undefined))) {
        const parent = dirname(existing)
        if (parent === existing) throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
        existing = parent
      }
      if ((await lstat(existing)).isSymbolicLink() || (await realpath(existing)) !== existing)
        throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
      await mkdir(root, { recursive: true })
      folder = await mkdtemp(join(root, 'render-'))
      child = spawn(
        await executable(),
        [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-networking',
          '--remote-debugging-port=0',
          `--user-data-dir=${folder}`,
          'about:blank',
        ],
        {
          windowsHide: true,
          stdio: 'ignore',
          env: rendererEnvironment(),
        },
      )
      child.on('error', abort)
      signal.addEventListener('abort', abort, { once: true })
      let port = ''
      while (!port) {
        signal.throwIfAborted()
        if (child.exitCode !== null) throw new DeckError('ARTIFACT_RENDERER_FAILED')
        try {
          port = (await readFile(join(folder, 'DevToolsActivePort'), 'utf8')).split('\n')[0] ?? ''
        } catch {
          await delay(25, undefined, { signal })
        }
      }
      if (!/^\d{1,5}$/.test(port)) throw new DeckError('ARTIFACT_RENDERER_FAILED')
      const target: unknown = await (
        await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT', signal })
      ).json()
      if (
        !object(target) ||
        typeof target.webSocketDebuggerUrl !== 'string' ||
        !target.webSocketDebuggerUrl.startsWith(`ws://127.0.0.1:${port}/`)
      )
        throw new DeckError('ARTIFACT_RENDERER_FAILED')
      protocol = await connect(target.webSocketDebuggerUrl, signal)
      await protocol.call('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
      })
      await protocol.call('Network.enable')
      await protocol.call('Network.setBlockedURLs', {
        urls: ['http://*', 'https://*', 'file://*', 'ftp://*', 'ws://*', 'wss://*'],
      })
      const tree = await protocol.call('Page.getFrameTree')
      if (
        !object(tree) ||
        !object(tree.frameTree) ||
        !object(tree.frameTree.frame) ||
        typeof tree.frameTree.frame.id !== 'string'
      )
        throw new DeckError('ARTIFACT_RENDERER_FAILED')
      await protocol.call('Page.setDocumentContent', { frameId: tree.frameTree.frame.id, html })
      const expression = `(async()=>{
        await document.fonts.ready;
        const failure=(code,element)=>{
          const binding=element?.closest('[data-node-id]')?.getAttribute('data-node-id');
          const rect=element?.getBoundingClientRect();
          return {code,path:binding?'document.'+binding:'nativeSource.'+(element?.tagName.toLowerCase()??'body'),expected:rect?'Visible bounds inside 1280x720; measured '+[rect.left,rect.top,rect.right,rect.bottom].map(n=>Math.round(n)).join(','):'All required text and images visible inside 1280x720'};
        };
        const images = await Promise.all(Array.from(document.images, i=>i.decode().then(()=>i.naturalWidth>0,()=>false)));
        if(images.some(ok=>!ok)) return failure('ARTIFACT_IMAGE_UNREADABLE',document.images[images.indexOf(false)]);
        const normalize=s=>s.replace(/\\s+/g,' ').trim();
        const text=normalize(document.body.innerText);
        if(!text && !images.length) return failure('ARTIFACT_EMPTY');
        const required=${JSON.stringify(requiredText)};
        if(required.some(t=>!text.includes(normalize(t)))) return failure('ARTIFACT_REQUIRED_CONTENT_MISSING');
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()){
          const n=walker.currentNode;
          if(!n.textContent.trim() || n.parentElement.tagName==='STYLE') continue;
          const range=document.createRange();range.selectNodeContents(n);
          const rect=range.getBoundingClientRect();
          const s=getComputedStyle(n.parentElement);
          if(!rect.width || !rect.height || s.visibility!=='visible' || s.color==='rgba(0, 0, 0, 0)') return failure('ARTIFACT_UNREADABLE',n.parentElement);
          if(rect.left<0 || rect.top<0 || rect.right>1281 || rect.bottom>721) return failure('ARTIFACT_OVERFLOW',n.parentElement);
          let background='rgb(255, 255, 255)';
          for(let e=n.parentElement;e;e=e.parentElement){
            const p=getComputedStyle(e);const r=e.getBoundingClientRect();
            if(Number(p.opacity)===0 || p.visibility!=='visible') return failure('ARTIFACT_UNREADABLE',n.parentElement);
            if(background==='rgb(255, 255, 255)' && p.backgroundColor!=='rgba(0, 0, 0, 0)') background=p.backgroundColor;
            if(['hidden','clip','auto','scroll'].includes(p.overflow) && (rect.right>r.right+1 || rect.bottom>r.bottom+1 || rect.left<r.left-1 || rect.top<r.top-1)) return failure('ARTIFACT_OVERFLOW',n.parentElement);
          }
          if(s.color===background) return failure('ARTIFACT_UNREADABLE',n.parentElement);
        }
        for(const image of document.images){const r=image.getBoundingClientRect();if(!r.width||!r.height||r.left<0||r.top<0||r.right>1281||r.bottom>721)return failure('ARTIFACT_OVERFLOW',image)}
        const layoutIssue = (${inspectControlledLayout.toString()})();
        if(layoutIssue) return layoutIssue;
        return {code:'ok'};
      })()`
      const report = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (
        !object(report) ||
        report.exceptionDetails ||
        !object(report.result) ||
        !object(report.result.value) ||
        typeof report.result.value.code !== 'string'
      )
        throw new DeckError('ARTIFACT_RENDERER_FAILED')
      const codes = [
        'ARTIFACT_IMAGE_UNREADABLE',
        'ARTIFACT_EMPTY',
        'ARTIFACT_REQUIRED_CONTENT_MISSING',
        'ARTIFACT_UNREADABLE',
        'ARTIFACT_OVERFLOW',
        'ARTIFACT_LAYOUT_GEOMETRY',
      ]
      const validation = report.result.value
      if (validation.code !== 'ok') {
        if (
          !codes.includes(String(validation.code)) ||
          typeof validation.path !== 'string' ||
          validation.path.length > 130 ||
          typeof validation.expected !== 'string' ||
          validation.expected.length > 250
        )
          throw new DeckError('ARTIFACT_RENDERER_FAILED')
        throw new DeckError(String(validation.code), [
          {
            code: String(validation.code),
            path: validation.path,
            message: 'The rendered slide fails visibility or viewport validation.',
            expected: validation.expected,
          },
        ])
      }
    } catch (error) {
      if (caller.aborted) caller.throwIfAborted()
      throw error instanceof DeckError ? error : new DeckError('ARTIFACT_RENDERER_FAILED')
    } finally {
      signal.removeEventListener('abort', abort)
      if (protocol && !signal.aborted) await protocol.call('Browser.close').catch(() => {})
      protocol?.close()
      if (child && child.exitCode === null) child.kill()
      if (
        folder &&
        resolve(folder).startsWith(resolve(root) + sep) &&
        (await realpath(root).catch(() => null)) === resolve(root)
      )
        await rm(folder, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(() => {})
      running--
    }
  }
}
