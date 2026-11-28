// What this file checks: AppRoutes renders the shell route tree and, for an unknown chat id, the home route shows the missing-chat notice.
// Environment: Vitest with jsdom and Testing Library. MSW replaces the Host HTTP API; there is no real Host, no fake clock and no browser.
// How to run: corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/app-shell-routes.test.tsx
// Expected result: the one test passes. The notice text is the shell copy that appText owns in src/text.ts.
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { configureApiClient } from '../src/api/client.ts'
import { AppRoutes } from '../src/routes.tsx'
import { appText } from '../src/text.ts'

const ORIGIN = 'http://127.0.0.1:4321'

const emptySettings = {
  providers: [],
  providersVersion: 0,
  preferencesVersion: 0,
  persistentKeys: false,
  builtIns: [],
  runtime: { available: false },
}

const emptyChat = {
  sessionId: 'chat-1',
  workspaceId: 'default',
  createdAt: '2026-11-27T00:00:00.000Z',
  updatedAt: '2026-11-27T00:00:00.000Z',
  messageCount: 0,
  readable: true,
  selectable: false,
  hasSlides: false,
  hasDraft: false,
}

const server = setupServer(
  http.get(`${ORIGIN}/api/settings`, () => HttpResponse.json(emptySettings)),
  http.get(`${ORIGIN}/api/workspaces`, () =>
    HttpResponse.json({
      workspaces: [{ id: 'default', name: 'Mặc định', folder: null, isDefault: true, folderStatus: 'none' }],
      selectedId: 'default',
      version: 0,
    }),
  ),
  http.get(`${ORIGIN}/api/sessions`, () => HttpResponse.json([])),
  http.post(`${ORIGIN}/api/sessions`, () => HttpResponse.json(emptyChat)),
  http.get(`${ORIGIN}/api/sessions/:id/history`, () => HttpResponse.json([])),
  http.get(`${ORIGIN}/api/sessions/:id/requests`, () => HttpResponse.json([])),
  http.get(`${ORIGIN}/api/sessions/:id/activities`, () => HttpResponse.json([])),
  http.get(`${ORIGIN}/api/sessions/:id/draft`, ({ params }) =>
    HttpResponse.json({ sessionId: String(params.id), text: '', revision: 0, attachments: [] }),
  ),
  http.get(`${ORIGIN}/api/sessions/:id/brief`, ({ params }) =>
    HttpResponse.json({ sessionId: String(params.id), brief: null, version: 0 }),
  ),
  http.get(`${ORIGIN}/api/sessions/:id/outlines`, ({ params }) =>
    HttpResponse.json({ sessionId: String(params.id), version: 0, proposals: [] }),
  ),
  http.get(`${ORIGIN}/api/sessions/:id/deck`, ({ params }) =>
    HttpResponse.json({ sessionId: String(params.id), revision: 0, slides: [] }),
  ),
  http.get(`${ORIGIN}/api/preferences`, () => HttpResponse.json({ theme: 'system', version: 0 })),
  http.get(`${ORIGIN}/api/changes`, () => new HttpResponse(null, { status: 401 })),
  http.get(`${ORIGIN}/api/sessions/:id/changes`, () => new HttpResponse(null, { status: 401 })),
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AppRoutes', () => {
  it('AppRoutes renders shell routes and shows missing chat notice', async () => {
    configureApiClient({ origin: ORIGIN, token: 'route-token' })
    const rendered = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/chats/missing-chat']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await waitFor(() => expect(screen.getByText(appText.missingChat)).toBeInTheDocument(), { timeout: 5000 })
    await waitFor(() => expect(document.querySelector('#app .chat-navigation')).not.toBeNull())
    rendered.unmount()
  })
})
