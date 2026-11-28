// Checks the backdrop picker of the settings menu: the write it sends, and what it shows when the Host refuses it.
// Runs in Vitest and jsdom. MSW replaces only the Host HTTP boundary.
// Run: corepack pnpm@11.28.5 test:web
// Expected values follow the preferences HTTP contract: PUT /api/preferences takes { background, expectedVersion }.
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { configureApiClient } from '../src/api/client.ts'
import { BackgroundControl } from '../src/components/background-control.tsx'

const origin = 'http://localhost:4321'

const server = setupServer(
  http.get(`${origin}/api/preferences`, () => HttpResponse.json({ theme: 'light', background: 'none', version: 2 })),
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())

function mount() {
  configureApiClient({ origin, token: 'test-token' })
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BackgroundControl />
    </QueryClientProvider>,
  )
}

it('saves only the backdrop with the version it read, and marks the saved choice', async () => {
  let body: unknown
  server.use(
    http.put(`${origin}/api/preferences`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ theme: 'light', background: 'koi', version: 3 })
    }),
    http.get(`${origin}/api/preferences`, () =>
      HttpResponse.json({ theme: 'light', background: body ? 'koi' : 'none', version: body ? 3 : 2 }),
    ),
  )
  mount()
  const user = userEvent.setup()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true'))
  await user.click(screen.getByRole('button', { name: 'Koi pond' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Koi pond' })).toHaveAttribute('aria-pressed', 'true'))
  await waitFor(() => expect(body).toEqual({ background: 'koi', expectedVersion: 2 }))
  expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'false')
})

it('shows the saved backdrop again and says why when the Host refuses the write', async () => {
  server.use(
    http.put(`${origin}/api/preferences`, () =>
      HttpResponse.json({ error: { code: 'PREFERENCES_STALE' } }, { status: 409 }),
    ),
  )
  mount()
  const user = userEvent.setup()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true'))
  await user.click(screen.getByRole('button', { name: 'Night rain' }))
  const group = screen.getByRole('group', { name: 'Background' })
  await waitFor(() => expect(group).toHaveAttribute('title', 'The background selection was not saved. Try again.'))
  expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Night rain' })).toHaveAttribute('aria-pressed', 'false')
})
