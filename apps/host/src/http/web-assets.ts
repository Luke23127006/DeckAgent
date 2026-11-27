import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import type { WebPreferences } from '@deckagent/host-contracts'
import type { HostOptions } from './contracts.ts'

type WebAsset = NonNullable<HostOptions['assets']>[string]

const contentTypes: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

/** Applies the Host-saved choice before first paint. "system" follows the media query. */
export function themeBootstrap(theme: WebPreferences['theme']): string {
  if (theme === 'dark') return "document.documentElement.classList.add('dark')"
  if (theme === 'light') return "document.documentElement.classList.remove('dark')"
  return "if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')"
}

/** Reads the Vite build output once. Requests never read the disk. */
export async function loadWebDistAssets(
  distDir: string,
  getTheme: () => WebPreferences['theme'],
): Promise<NonNullable<HostOptions['assets']>> {
  const assets: Record<string, WebAsset> = {}
  for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const relativePath = relative(distDir, join(entry.parentPath, entry.name)).replaceAll('\\', '/')
    const pathname = relativePath === 'index.html' ? '/' : `/${relativePath}`
    const contentType = contentTypes[extname(entry.name).toLowerCase()] ?? 'application/octet-stream'
    const sandboxed = pathname.startsWith('/samples/') && pathname.endsWith('.html')
    assets[pathname] = {
      contentType,
      body: await readFile(join(entry.parentPath, entry.name)),
      ...(sandboxed ? { sandboxed: true } : {}),
    }
  }
  Object.defineProperty(assets, '/theme.js', {
    enumerable: true,
    get: () => ({ contentType: 'text/javascript; charset=utf-8', body: themeBootstrap(getTheme()) }),
  })
  return assets
}
