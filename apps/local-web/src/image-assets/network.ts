import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { request } from 'node:https'
import { HttpError } from '@deckagent/host-api'

interface Address {
  readonly address: string
  readonly family: number
}
interface Hop {
  readonly status: number
  readonly location?: string
  readonly mime: string
  readonly bytes: Uint8Array
}
export interface ImageNetwork {
  resolve(host: string): Promise<readonly Address[]>
  request(url: URL, address: Address, signal: AbortSignal): Promise<Hop>
}
const denied = new BlockList(),
  globalV6 = new BlockList()
for (const [cidr, bits] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  denied.addSubnet(cidr, bits, 'ipv4')
globalV6.addSubnet('2000::', 3, 'ipv6')
for (const [cidr, bits] of [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
] as const)
  denied.addSubnet(cidr, bits, 'ipv6')
export function isPublicAddress(address: string): boolean {
  const family = isIP(address)
  return family === 4
    ? !denied.check(address, 'ipv4')
    : family === 6 && globalV6.check(address, 'ipv6') && !denied.check(address, 'ipv6')
}
const deniedUrl = (): never => {
  throw new HttpError(400, 'IMAGE_URL_DENIED')
}
export function imageUrl(value: string): URL {
  if (!value || value.length > 4096) return deniedUrl()
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return deniedUrl()
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    /(?:^|\.)(?:localhost|local|internal)\.?$/i.test(host)
  )
    return deniedUrl()
  if (isIP(host) && !isPublicAddress(host)) return deniedUrl()
  for (const key of url.searchParams.keys())
    if (/^(?:key|api[_-]?key|token|access_token|authorization|password|signature)$/i.test(key)) return deniedUrl()
  url.hash = ''
  return url
}
const MAX_BYTES = 5 * 1024 * 1024
function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const stop = () => {
      signal.removeEventListener('abort', stop)
      reject(signal.reason)
    }
    signal.addEventListener('abort', stop, { once: true })
    work.then(
      value => {
        signal.removeEventListener('abort', stop)
        resolve(value)
      },
      error => {
        signal.removeEventListener('abort', stop)
        reject(error)
      },
    )
  })
}
const native: ImageNetwork = {
  resolve: host => lookup(host, { all: true, verbatim: true }),
  request(url, address, signal) {
    return new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          method: 'GET',
          agent: false,
          family: address.family,
          lookup: (_host, _options, callback) => callback(null, address.address, address.family),
          headers: { accept: 'image/png,image/jpeg', 'accept-encoding': 'identity', 'user-agent': 'DeckAgent-Image/1' },
          signal,
        },
        async res => {
          try {
            const status = res.statusCode ?? 0
            if ([301, 302, 303, 307, 308].includes(status)) {
              const location = res.headers.location
              res.destroy()
              resolve({ status, ...(location ? { location } : {}), mime: '', bytes: new Uint8Array() })
              return
            }
            const mime = String(res.headers['content-type'] ?? '')
              .split(';')[0]!
              .toLowerCase()
            if (
              status !== 200 ||
              !['image/png', 'image/jpeg'].includes(mime) ||
              (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity')
            )
              throw new HttpError(422, 'IMAGE_FORMAT')
            if (Number(res.headers['content-length']) > MAX_BYTES) throw new HttpError(413, 'IMAGE_LIMIT')
            let size = 0
            const parts: Buffer[] = []
            for await (const part of res) {
              signal.throwIfAborted()
              const bytes = Buffer.from(part)
              size += bytes.length
              if (size > MAX_BYTES) throw new HttpError(413, 'IMAGE_LIMIT')
              parts.push(bytes)
            }
            resolve({ status, mime, bytes: Buffer.concat(parts) })
          } catch (error) {
            res.destroy()
            reject(error)
          }
        },
      )
      req.once('error', () => reject(signal.aborted ? signal.reason : new HttpError(502, 'IMAGE_FETCH_FAILED')))
      req.end()
    })
  },
}
/** Dependency injection substitutes only the external DNS/transport in fixtures. */
export async function fetchPublicImage(
  value: string,
  signal: AbortSignal,
  network: ImageNetwork = native,
): Promise<{ bytes: Uint8Array; mime: 'image/png' | 'image/jpeg'; sourceUrl: string; finalUrl: string }> {
  const original = imageUrl(value).href
  let url = imageUrl(original)
  for (let redirects = 0; redirects <= 3; redirects++) {
    signal.throwIfAborted()
    const host = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = isIP(host)
      ? [{ address: host, family: isIP(host) }]
      : await abortable(network.resolve(host), signal)
    signal.throwIfAborted()
    if (
      !addresses.length ||
      addresses.length > 32 ||
      addresses.some(address => !isPublicAddress(address.address) || address.family !== isIP(address.address))
    )
      return deniedUrl()
    const hop = await network.request(url, addresses[0]!, signal)
    signal.throwIfAborted()
    if ([301, 302, 303, 307, 308].includes(hop.status)) {
      if (!hop.location || redirects === 3) return deniedUrl()
      url = imageUrl(new URL(hop.location, url).href)
      continue
    }
    if (hop.status !== 200 || !['image/png', 'image/jpeg'].includes(hop.mime)) throw new HttpError(422, 'IMAGE_FORMAT')
    if (!hop.bytes.length || hop.bytes.length > MAX_BYTES) throw new HttpError(413, 'IMAGE_LIMIT')
    return {
      bytes: hop.bytes,
      mime: hop.mime === 'image/png' ? 'image/png' : 'image/jpeg',
      sourceUrl: original,
      finalUrl: url.href,
    }
  }
  return deniedUrl()
}
