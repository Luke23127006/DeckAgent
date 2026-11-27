# Task 7: Add React shell, routes, main.tsx and legacy mount

Read this file to learn the steps of Task 7, which adds `AppShell`, the declarative routes, `main.tsx` and the temporary mount for the legacy Browser screens.

**Type:** Code

**Read first:**
- [Revision 2 Global Constraints](README.md#revision-2-global-constraints) and [Task protocol](README.md#task-protocol) in `README.md`
- `apps/web/src/browser/boot.ts`
- `apps/web/src/browser/shell-dom.ts`
- `apps/web/src/browser/theme.ts`
- `apps/web/src/browser/chat-navigation.ts` (the method `start`)
- `apps/web/src/hooks/use-change-feed.ts` and `apps/web/src/hooks/use-host-connection.ts`
- `apps/web/src/text.ts`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Create: `apps/web/src/layouts/app-shell.tsx`, `apps/web/src/components/legacy-browser-mount.tsx`, `apps/web/src/pages/home/home-page.tsx`, `apps/web/src/pages/chat/chat-page.tsx`, `apps/web/src/pages/settings/settings-page.tsx`, `apps/web/src/routes.tsx`, `apps/web/src/main.tsx`
- Change: `apps/web/src/browser/shell-dom.ts`, `apps/web/src/browser/theme.ts`, `apps/web/src/browser/boot.ts`, `apps/web/tsconfig.json`
- Test: `apps/web/tests/app-shell-routes.test.tsx`

**Interfaces:**
- Uses: `readTokenFromHash` and `configureApiClient` from `./api/client.ts` (in `main.tsx` only). Also uses `useChangeFeed` from `../hooks/use-change-feed.ts`, `useHostConnection` from `../hooks/use-host-connection.ts` and `appText` from `../text.ts`.
- Produces:
  - `apps/web/src/browser/boot.ts`: `export interface LegacyBrowserOptions { readonly origin: string; readonly token: string; readonly initialSessionId?: string; readonly openSettings?: boolean; readonly onMissingSession?: () => void }` and `export function mountLegacyBrowser(root: HTMLElement, options: LegacyBrowserOptions): () => void`.
  - `apps/web/src/layouts/app-shell.tsx`: `export function AppShell()`.
  - `apps/web/src/components/legacy-browser-mount.tsx`: `export function LegacyBrowserMount(props: { readonly initialSessionId?: string; readonly openSettings?: boolean; readonly onMissingSession?: () => void })`.
  - `apps/web/src/routes.tsx`: `export function AppRoutes()`.

**STOP when:** `vite build` fails on `apps/web/src/main.tsx` or `oxlint` reports a Browser folder violation.

**Forbidden:** Do not import `src/api/` from `pages/`, `components/` or `layouts/`. Do not change any legacy CSS class name or DOM selector used by `e2e/browser-smoke.test.mjs`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/app-shell-routes.test.tsx` with a header comment that follows `docs/conventions/testware.md`:

```tsx
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
const emptySettings = { providers: [], providersVersion: 0, preferencesVersion: 0, persistentKeys: false, builtIns: [], runtime: { available: false } }
const emptyChat = { sessionId: 'chat-1', workspaceId: 'default', createdAt: '2026-11-27T00:00:00.000Z', updatedAt: '2026-11-27T00:00:00.000Z', messageCount: 0, readable: true, selectable: false, hasSlides: false, hasDraft: false }
const server = setupServer(
  http.get(`${ORIGIN}/api/settings`, () => HttpResponse.json(emptySettings)),
  http.get(`${ORIGIN}/api/workspaces`, () => HttpResponse.json({ workspaces: [{ id: 'default', name: 'Mặc định', default: true, status: 'ready' }], selectedId: 'default', version: 0 })),
  http.get(`${ORIGIN}/api/sessions`, () => HttpResponse.json([])),
  http.post(`${ORIGIN}/api/sessions`, () => HttpResponse.json(emptyChat)),
  http.get(`${ORIGIN}/api/sessions/:id/history`, () => HttpResponse.json([])),
  http.get(`${ORIGIN}/api/sessions/:id/requests`, () => HttpResponse.json([])),
  http.get(`${ORIGIN}/api/sessions/:id/activities`, () => HttpResponse.json([])),
  http.get(`${ORIGIN}/api/sessions/:id/draft`, ({ params }) => HttpResponse.json({ sessionId: String(params.id), text: '', revision: 0, attachments: [] })),
  http.get(`${ORIGIN}/api/sessions/:id/brief`, ({ params }) => HttpResponse.json({ sessionId: String(params.id), brief: null, version: 0 })),
  http.get(`${ORIGIN}/api/sessions/:id/outlines`, ({ params }) => HttpResponse.json({ sessionId: String(params.id), version: 0, proposals: [] })),
  http.get(`${ORIGIN}/api/sessions/:id/deck`, ({ params }) => HttpResponse.json({ sessionId: String(params.id), revision: 0, slides: [] })),
  http.get(`${ORIGIN}/api/preferences`, () => HttpResponse.json({ theme: 'system', version: 0 })),
  http.get(`${ORIGIN}/api/changes`, () => new HttpResponse(null, { status: 401 })),
  http.get(`${ORIGIN}/api/sessions/:id/changes`, () => new HttpResponse(null, { status: 401 })),
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
  Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) })
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
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
    await waitFor(() => expect(screen.getByText(appText.missingChat)).toBeInTheDocument())
    expect(document.querySelector('#app .chat-navigation')).not.toBeNull()
    rendered.unmount()
  })
})
```

- [ ] **Step 2: Run the test and make sure that it fails**

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/app-shell-routes.test.tsx`
Expected: FAIL. The output reports that `routes.tsx` does not exist.

- [ ] **Step 3: Refactor `shell-dom.ts`, `theme.ts` and `boot.ts` for explicit mount and cleanup**

1. Update `apps/web/src/browser/shell-dom.ts`: accept `(root: HTMLElement, changed: () => void)` in `ShellDom` and `createShellDom`, call `root.replaceChildren()`, save the `keydown`, `pointerdown` and `compactNavigation` listener functions, and remove them with `navigationSize?.disconnect()` in `dispose()`.
2. Update `apps/web/src/browser/theme.ts`: toggle `document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches))` without writing `dataset.theme`. Listen to `matchMedia('(prefers-color-scheme: dark)')` when `current === 'system'` and return `{ node: group, update, dispose }`.
3. Update `apps/web/src/browser/boot.ts`: export `LegacyBrowserOptions` and `mountLegacyBrowser(root, options): () => void` using `options.origin` and `options.token`. Do not run boot code at module top level. Track `disposed = false`, sync initial theme via `management.preferences()`, open `options.initialSessionId` if present or call `options.onMissingSession?.()`, and open `settingsUI.open()` when `options.openSettings` is true. Return a cleanup function that sets `disposed = true`, removes `pagehide` and `pageshow` listeners, disposes all controllers and clears `root.replaceChildren()`.
4. Update `apps/web/tsconfig.json`: remove `"exclude": ["src/browser/**"]` and add `{ "path": "../../packages/presentation/document" }` to `"references"`.

- [ ] **Step 4: Implement `AppShell`, `LegacyBrowserMount`, pages, `routes.tsx` and `main.tsx`**

1. Create `apps/web/src/layouts/app-shell.tsx`: call `useHostConnection()` and `useChangeFeed({ enabled: connection.token.length > 0 })`, and render `<div className="h-dvh w-full"><Outlet /></div>`.
2. Create `apps/web/src/components/legacy-browser-mount.tsx`: call `useHostConnection()`, render `<main id="app" ref={containerRef} />`, and run `mountLegacyBrowser` inside `useEffect` with its cleanup return.
3. Create `apps/web/src/pages/home/home-page.tsx`: read `useLocation().state` for `{ missingChat?: boolean }`, render a status banner with `appText.missingChat` when `missingChat` is true, and render `<LegacyBrowserMount />`.
4. Create `apps/web/src/pages/chat/chat-page.tsx`: read `const { sessionId } = useParams()` and `useNavigate()`, and render `<LegacyBrowserMount initialSessionId={sessionId} onMissingSession={() => navigate('/', { replace: true, state: { missingChat: true } })} />`.
5. Create `apps/web/src/pages/settings/settings-page.tsx`: render `<LegacyBrowserMount openSettings />`.
6. Create `apps/web/src/routes.tsx`: export `AppRoutes()` with `<Routes>`, `<Route element={<AppShell />}>`, `<Route index element={<HomePage />} />`, `<Route path="/chats/:sessionId" element={<ChatPage />} />`, `<Route path="/settings" element={<SettingsPage />} />`, and `<Route path="*" element={<Navigate to="/" replace />} />`.
7. Create `apps/web/src/main.tsx`: import `'@/styles/app.css'`, read the hash token once with `readTokenFromHash(window.location.hash)`, call `configureApiClient({ origin: window.location.origin, token })`, create `new QueryClient()`, and mount `<StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><AppRoutes /></BrowserRouter></QueryClientProvider></StrictMode>` on `document.getElementById('root')`.

- [ ] **Step 5: Run tests, Vite build and static checks**

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/app-shell-routes.test.tsx`
Expected: PASS. Exit code 0.

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vite build --configLoader native`
Expected: exit code 0. `apps/web/dist/index.html` and `apps/web/dist/samples/1.html` exist.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
