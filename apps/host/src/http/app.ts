import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { HttpError } from './http-error.ts'
import type { HostOptions } from './contracts.ts'
import express, { type Express, type NextFunction, type Request, type Response, type Router } from 'express'
import { writeRouteError } from './error-handler.ts'

export interface HttpAppConfig {
  readonly options: HostOptions
  readonly token: string
  readonly router: Router
  origin(): string
  closing(): boolean
}

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.setHeader('referrer-policy', 'no-referrer')
  res.setHeader(
    'content-security-policy',
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src blob: data:; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  )
}

function checkOrigin(req: IncomingMessage, origin: string): void {
  if (
    req.headers.host !== new URL(origin).host ||
    (req.headers.origin !== undefined && req.headers.origin !== origin) ||
    req.headers['sec-fetch-site'] === 'cross-site'
  )
    throw new HttpError(403, 'ORIGIN_DENIED')
}

function isSpaRoutePath(pathname: string): boolean {
  const reserved = pathname.toLowerCase()
  if (reserved.startsWith('/api/') || reserved.startsWith('/assets/') || reserved.startsWith('/samples/')) return false
  if (pathname.includes('%')) return false
  return !pathname.slice(pathname.lastIndexOf('/') + 1).includes('.')
}

function serveAsset(req: IncomingMessage, res: ServerResponse, pathname: string, options: HostOptions): void {
  if (req.method !== 'GET') throw new HttpError(404, 'NOT_FOUND')
  const owned = options.assets && Object.hasOwn(options.assets, pathname) ? options.assets[pathname] : undefined
  const fallback =
    options.spaFallback && isSpaRoutePath(pathname) && options.assets && Object.hasOwn(options.assets, '/')
      ? options.assets['/']
      : undefined
  const asset = owned ?? fallback
  if (!asset) throw new HttpError(404, 'NOT_FOUND')
  if (asset.sandboxed)
    res.setHeader(
      'content-security-policy',
      "sandbox; default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
    )
  res.writeHead(200, { 'content-type': asset.contentType })
  res.end(asset.body)
}

export function createHttpApp(config: HttpAppConfig): Express {
  const { options } = config
  const expected = Buffer.from(`Bearer ${config.token}`)
  const app = express()
  app.disable('x-powered-by')
  app.set('etag', false)
  app.set('case sensitive routing', true)
  app.set('strict routing', true)
  app.use((req: Request, res: Response, next: NextFunction) => {
    setSecurityHeaders(res)
    if (config.closing()) throw new HttpError(503, 'HOST_CLOSED')
    const origin = config.origin()
    checkOrigin(req, origin)
    const url = new URL(req.originalUrl, origin)
    if (url.search) throw new HttpError(400, 'INVALID_REQUEST')
    if (!url.pathname.startsWith('/api/')) {
      serveAsset(req, res, url.pathname, options)
      return
    }
    const auth = Buffer.from(req.headers.authorization ?? '')
    if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) throw new HttpError(401, 'AUTH_REQUIRED')
    if (req.method === 'HEAD' || req.method === 'OPTIONS' || url.pathname.includes('%'))
      throw new HttpError(404, 'NOT_FOUND')
    req.url = url.pathname
    next()
  })
  app.use(config.router)
  app.use(() => {
    throw new HttpError(404, 'NOT_FOUND')
  })
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    writeRouteError(res, error, options)
  })
  return app
}
