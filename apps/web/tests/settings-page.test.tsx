// Checks provider writes, credential handling, stale recovery, and theme persistence.
// Runs in Vitest and jsdom. MSW replaces only the Host HTTP boundary.
// Run: corepack pnpm@11.28.5 test:web
// Expected values follow the existing settings HTTP contract and the Phase 3 requirements.
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { configureApiClient } from '../src/api/client.ts'
import { SettingsPage } from '../src/pages/settings/settings-page.tsx'

const origin = 'http://localhost:4321'

const settings = {
  providers: [],
  builtIns: [],
  providersVersion: 3,
  preferencesVersion: 2,
  persistentKeys: true,
  runtime: { available: true },
}

const server = setupServer(
  http.get(`${origin}/api/settings`, () => HttpResponse.json(settings)),
  http.get(`${origin}/api/preferences`, () => HttpResponse.json({ theme: 'light', version: 2 })),
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
  document.documentElement.classList.remove('dark')
})

afterAll(() => server.close())

function mount() {
  configureApiClient({ origin, token: 'test-token' })
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('creates a provider with a version and clears the credential after submission', async () => {
  let body: unknown
  server.use(
    http.put(`${origin}/api/providers/river`, async ({ request }) => {
      expect(request.headers.get('authorization')).toBe('Bearer test-token')
      body = await request.json()
      return HttpResponse.json({ saved: true })
    }),
  )
  mount()
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Provider ID'), 'river')
  await user.type(screen.getByLabelText('Tên hiển thị'), 'River')
  await user.type(screen.getByLabelText('Base URL'), 'https://example.com/v1')
  await user.type(screen.getByLabelText('API key'), 'private-test-key')
  await user.type(screen.getByLabelText('Model ID'), 'deepseek\ndeepseek')
  await user.click(screen.getByRole('button', { name: 'Lưu provider' }))
  await waitFor(() =>
    expect(body).toEqual({
      displayName: 'River',
      protocol: 'chat-completions',
      baseUrl: 'https://example.com/v1',
      models: ['deepseek'],
      key: 'private-test-key',
      new: true,
      expectedVersion: 3,
    }),
  )
  expect(screen.getByLabelText('API key')).toHaveValue('')
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã lưu'))
})

it('rejects malformed settings responses', async () => {
  server.use(http.get(`${origin}/api/settings`, () => HttpResponse.json({ ...settings, providersVersion: -1 })))
  mount()
  expect(await screen.findByRole('alert')).toHaveTextContent('Chưa đọc được dữ liệu từ Host')
})

it('saves theme using the read version and applies the saved theme', async () => {
  let saved = false
  server.use(
    http.put(`${origin}/api/preferences`, async ({ request }) => {
      expect(await request.json()).toEqual({ theme: 'dark', expectedVersion: 2 })
      saved = true
      return HttpResponse.json({ theme: 'dark', version: 3 })
    }),
    http.get(`${origin}/api/preferences`, () =>
      HttpResponse.json({ theme: saved ? 'dark' : 'light', version: saved ? 3 : 2 }),
    ),
  )
  mount()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Tối' }))
  await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
})

it('updates an existing provider without sending a blank key, then explicitly removes its key', async () => {
  const provider = {
    id: 'river',
    displayName: 'River',
    protocol: 'chat-completions',
    baseUrl: 'https://example.com/v1',
    models: ['old'],
    hasKey: true,
    keyAvailable: true,
    builtIn: false,
  }
  const bodies: unknown[] = []
  server.use(
    http.get(`${origin}/api/settings`, () => HttpResponse.json({ ...settings, providers: [provider] })),
    http.put(`${origin}/api/providers/river`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ saved: true })
    }),
  )
  mount()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /River/ }))
  expect(screen.getByLabelText('Provider ID')).toBeDisabled()
  expect(screen.getByLabelText('API protocol')).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Lưu provider' }))
  await waitFor(() => expect(bodies).toHaveLength(1))
  expect(bodies[0]).toEqual({
    displayName: 'River',
    protocol: 'chat-completions',
    baseUrl: 'https://example.com/v1',
    models: ['old'],
    expectedVersion: 3,
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu provider' })).toBeEnabled())
  await user.click(screen.getByLabelText('Gỡ key đã lưu'))
  await user.click(screen.getByRole('button', { name: 'Lưu provider' }))
  await waitFor(() => expect(bodies).toHaveLength(2))
  expect(bodies[1]).toEqual({
    displayName: 'River',
    protocol: 'chat-completions',
    baseUrl: 'https://example.com/v1',
    models: ['old'],
    key: '',
    expectedVersion: 3,
  })
})

it('reads fresh settings after a stale write and never retries the write', async () => {
  let reads = 0
  let writes = 0
  server.use(
    http.get(`${origin}/api/settings`, () => {
      reads++
      return HttpResponse.json({ ...settings, providersVersion: writes ? 4 : 3 })
    }),
    http.put(`${origin}/api/providers/river`, () => {
      writes++
      return HttpResponse.json({ error: { code: 'PROVIDERS_STALE' } }, { status: 409 })
    }),
  )
  mount()
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Provider ID'), 'river')
  await user.type(screen.getByLabelText('Tên hiển thị'), 'River')
  await user.type(screen.getByLabelText('Base URL'), 'https://example.com/v1')
  await user.click(screen.getByRole('button', { name: 'Lưu provider' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Danh sách provider đã thay đổi'))
  expect(writes).toBe(1)
  expect(reads).toBe(2)
  expect(screen.getByLabelText('Provider ID')).toHaveValue('')
})

it('loads a catalog, adds a model, and deletes the selected provider with the read version', async () => {
  const provider = {
    id: 'river',
    displayName: 'River',
    protocol: 'chat-completions',
    baseUrl: 'https://example.com/v1',
    models: [],
    hasKey: false,
    keyAvailable: false,
    builtIn: false,
  }
  let deleted: unknown
  server.use(
    http.get(`${origin}/api/settings`, () => HttpResponse.json({ ...settings, providers: [provider] })),
    http.get(`${origin}/api/providers/river/catalog`, () => HttpResponse.json(['catalog-model'])),
    http.delete(`${origin}/api/providers/river`, async ({ request }) => {
      deleted = await request.json()
      return HttpResponse.json({ saved: true })
    }),
  )
  mount()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /River/ }))
  await user.click(screen.getByRole('button', { name: 'Lấy model catalog' }))
  await user.click(await screen.findByRole('button', { name: 'catalog-model' }))
  expect(screen.getByLabelText('Model ID')).toHaveValue('catalog-model')
  const original = window.confirm
  window.confirm = () => true
  try {
    await user.click(screen.getByRole('button', { name: 'Xóa cấu hình' }))
    await waitFor(() => expect(deleted).toEqual({ expectedVersion: 3 }))
  } finally {
    window.confirm = original
  }
})

it('keeps the saved theme when the Host refuses a preference write', async () => {
  server.use(
    http.put(`${origin}/api/preferences`, () =>
      HttpResponse.json({ error: { code: 'PREFERENCES_STALE' } }, { status: 409 }),
    ),
  )
  mount()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Tối' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Cài đặt hiển thị đã thay đổi')
  expect(document.documentElement).not.toHaveClass('dark')
  expect(screen.getByRole('button', { name: 'Sáng' })).toHaveAttribute('aria-pressed', 'true')
})

it('clears a rejected credential and shows only the stable error text', async () => {
  server.use(
    http.put(`${origin}/api/providers/river`, () =>
      HttpResponse.json(
        {
          error: { code: 'PROVIDER_KEY_REFUSED', message: 'private-test-key' },
        },
        { status: 400 },
      ),
    ),
  )
  mount()
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Provider ID'), 'river')
  await user.type(screen.getByLabelText('Tên hiển thị'), 'River')
  await user.type(screen.getByLabelText('Base URL'), 'https://example.com/v1')
  await user.type(screen.getByLabelText('API key'), 'private-test-key')
  await user.click(screen.getByRole('button', { name: 'Lưu provider' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Provider từ chối key')
  expect(screen.getByLabelText('API key')).toHaveValue('')
  expect(document.body).not.toHaveTextContent('private-test-key')
})

it('follows system theme changes and removes the listener when settings unmounts', async () => {
  const original = window.matchMedia
  let matches = false
  const listeners = new Set<() => void>()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => ({
      get matches() {
        return matches
      },
      addEventListener: (_name: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_name: string, listener: () => void) => listeners.delete(listener),
    }),
  })
  server.use(http.get(`${origin}/api/preferences`, () => HttpResponse.json({ theme: 'system', version: 2 })))
  try {
    const rendered = mount()
    await screen.findByRole('button', { name: 'Hệ thống', pressed: true })
    expect(document.documentElement).not.toHaveClass('dark')
    matches = true
    for (const listener of listeners) listener()
    expect(document.documentElement).toHaveClass('dark')
    rendered.unmount()
    expect(listeners.size).toBe(0)
  } finally {
    window.matchMedia = original
  }
})

it('keeps the draft guard when the selected provider is clicked again', async () => {
  mount()
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Provider ID'), 'river')
  const original = window.confirm
  let confirmations = 0
  window.confirm = () => {
    confirmations += 1
    return true
  }
  try {
    await user.click(screen.getByRole('button', { name: 'Custom model API' }))
    expect(confirmations).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Quay lại chat' }))
    expect(confirmations).toBe(1)
  } finally {
    window.confirm = original
  }
})
