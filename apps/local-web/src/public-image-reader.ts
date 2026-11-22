import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { BlockList, isIP } from 'node:net'
import { DeckError } from '@deckagent/deck'

export type ImageLookup = (hostname: string) => Promise<readonly { address: string; family: number }[]>
const blocked = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['192.88.99.0', 24],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of [
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2001:2::', 48],
  ['2001:10::', 28],
  ['2001:20::', 28],
  ['2002::', 16],
  ['3fff::', 20],
] as const)
  blocked.addSubnet(address, prefix, 'ipv6')
const publicAddress = (address: string) =>
  isIP(address) === 4
    ? !blocked.check(address, 'ipv4')
    : isIP(address) === 6 && /^[23][a-f\d]{3}:/i.test(address) && !blocked.check(address, 'ipv6')

/** Resolves once and pins the connection to that public address, including every redirect. */
export class PublicImageReader {
  constructor(
    private readonly fetcher?: typeof fetch,
    private readonly resolve: ImageLookup = hostname => lookup(hostname, { all: true, verbatim: true }),
  ) {}
  async read(value: string, signal: AbortSignal, max: number, accept: readonly string[], hops = 0): Promise<Buffer> {
    signal.throwIfAborted()
    const fail = () => new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw fail()
    }
    if (
      value.length > 2048 ||
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      /(?:^|\.)(?:localhost|local|internal|home|lan)\.?$/i.test(url.hostname)
    )
      throw fail()
    const hostname = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await new Promise<Awaited<ReturnType<ImageLookup>>>((resolve, reject) => {
          const aborted = () => reject(signal.reason)
          signal.addEventListener('abort', aborted, { once: true })
          this.resolve(hostname)
            .then(resolve, reject)
            .finally(() => signal.removeEventListener('abort', aborted))
        })
    signal.throwIfAborted()
    if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw fail()
    const headers = { Accept: accept.join(','), 'User-Agent': 'DeckAgent/0.0.0', 'Accept-Encoding': 'identity' }
    const response = this.fetcher
      ? await this.fetcher(url.href, { signal, redirect: 'manual', headers })
      : await new Promise<Response>((resolve, reject) => {
          const req = request(
            {
              protocol: 'https:',
              hostname: addresses[0]!.address,
              servername: isIP(hostname) ? undefined : hostname,
              port: 443,
              method: 'GET',
              path: `${url.pathname}${url.search}`,
              headers: { ...headers, Host: url.host },
              signal,
            },
            incoming => {
              const responseHeaders = new Headers()
              for (const [key, value] of Object.entries(incoming.headers))
                if (value !== undefined) responseHeaders.set(key, Array.isArray(value) ? value.join(',') : value)
              if ([204, 205, 304].includes(incoming.statusCode ?? 0)) {
                incoming.resume()
                resolve(new Response(null, { status: incoming.statusCode!, headers: responseHeaders }))
                return
              }
              const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                  incoming.on('data', chunk => {
                    incoming.pause()
                    controller.enqueue(Buffer.from(chunk))
                  })
                  incoming.on('end', () => controller.close())
                  incoming.on('error', error => controller.error(error))
                },
                pull() {
                  incoming.resume()
                },
                cancel() {
                  incoming.destroy()
                },
              })
              resolve(new Response(stream, { status: incoming.statusCode ?? 502, headers: responseHeaders }))
            },
          )
          req.on('error', reject)
          req.end()
        })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      if (hops >= 2 || !response.headers.get('location')) throw fail()
      return this.read(new URL(response.headers.get('location')!, url).href, signal, max, accept, hops + 1)
    }
    if (
      !response.ok ||
      !response.body ||
      !accept.includes(response.headers.get('content-type')?.split(';')[0]?.trim() ?? '') ||
      Number(response.headers.get('content-length') ?? 0) > max
    ) {
      await response.body?.cancel()
      throw fail()
    }
    const reader = response.body.getReader(),
      chunks: Uint8Array[] = []
    let size = 0
    try {
      for (;;) {
        signal.throwIfAborted()
        const part = await reader.read()
        if (part.done) break
        size += part.value.length
        if (size > max) throw fail()
        chunks.push(part.value)
      }
      signal.throwIfAborted()
      return Buffer.concat(chunks)
    } finally {
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  }
}
