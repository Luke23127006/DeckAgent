// What this file checks: api/client, api/changes and text. The bearer header, the error code of a 401, a known 409 and
// invalid JSON, the query key prefixes of each change topic, and the text of every client error code.
// Environment: Vitest in Node with MSW at the network boundary. MSW replaces the real Host, so apiFetch runs unchanged.
// `onUnhandledRequest: 'error'` makes a missing handler fail the test. There is no fake clock and no browser.
// How to run: corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/api-client.test.ts
// Expected result: three tests pass. The literals come from
// docs/build/refactor/web-react/plan/task-05-add-api-client-changes-and-text.md.
// Fault tried: the handler path `/api/ok` changed to `/api/wrong`. The test failed with "intercepted a request without a
// matching request handler" and `ECONNREFUSED`, so the test uses the MSW handler and the real network is not a fallback.
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { queryKeyPrefixesForNotice } from '../src/api/changes.ts'
import { ApiClientError, apiJson, configureApiClient, readTokenFromHash } from '../src/api/client.ts'
import { errorText, formatClientError } from '../src/text.ts'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('api/client, api/changes and text', () => {
  it('reads the token from hash', () => {
    expect(readTokenFromHash('#token=abc123&other=1')).toBe('abc123')
    expect(readTokenFromHash('')).toBe('')
  })

  it('apiJson attaches bearer token, decodes errors and rejects malformed JSON', async () => {
    configureApiClient({ origin: 'http://127.0.0.1:4321', token: 'secret-token' })
    server.use(
      http.get('http://127.0.0.1:4321/api/ok', ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer secret-token')
        return HttpResponse.json({ ok: true })
      }),
      http.get('http://127.0.0.1:4321/api/unauth', () => new HttpResponse(null, { status: 401 })),
      http.get('http://127.0.0.1:4321/api/stale', () =>
        HttpResponse.json({ error: { code: 'PREFERENCES_STALE', detail: { field: 'theme' } } }, { status: 409 }),
      ),
      http.get('http://127.0.0.1:4321/api/broken', () => new HttpResponse('not-json', { status: 200 })),
    )

    const ok = await apiJson('/api/ok', value => value as { ok: boolean })
    expect(ok).toEqual({ ok: true })

    await expect(apiJson('/api/unauth', v => v)).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'AUTH_REQUIRED',
      status: 401,
    })
    await expect(apiJson('/api/stale', v => v)).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'PREFERENCES_STALE',
      status: 409,
      detail: { field: 'theme' },
    })
    await expect(apiJson('/api/broken', v => v)).rejects.toBeInstanceOf(ApiClientError)
    await expect(apiJson('/api/broken', v => v)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('maps change notices to query key prefixes and maps every error code to non-empty text', () => {
    expect(queryKeyPrefixesForNotice({ topic: 'workspaces', key: 'host', version: 2 })).toEqual([['workspaces']])
    expect(queryKeyPrefixesForNotice({ topic: 'providers', key: 'host', version: 3 })).toEqual([
      ['providers'],
      ['settings'],
    ])
    expect(queryKeyPrefixesForNotice({ topic: 'preferences', key: 'host', version: 4 })).toEqual([
      ['preferences'],
      ['settings'],
    ])
    expect(queryKeyPrefixesForNotice({ topic: 'outline', key: 'chat-1', version: 5 })).toEqual([
      ['chats', 'chat-1', 'outline'],
    ])
    expect(formatClientError('AUTH_REQUIRED')).toBe(errorText.AUTH_REQUIRED)
    for (const text of Object.values(errorText)) expect(text.length).toBeGreaterThan(0)
  })
})
