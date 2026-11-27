# Task 5: Add api/client.ts, api/changes.ts and text.ts

Read this file to learn the steps of Task 5, which adds the API client, change-notice reader and error text map.

**Type:** Code

**Read first:**
- [Revision 2 Global Constraints](README.md#revision-2-global-constraints) and [Task protocol](README.md#task-protocol) in `README.md`
- `apps/web/src/browser/transport/http.ts`
- `apps/web/src/browser/transport/change-client.ts`
- `apps/web/src/browser/transport/host-client.ts` (the array `allowed`)
- `apps/web/src/browser/transport/management-client.ts` (the array `allowedCodes`)
- `apps/web/src/browser/features/requests/request-feedback.ts` (the map `errors`)
- `packages/host/contracts/src/changes.ts`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Create: `apps/web/src/api/client.ts`, `apps/web/src/api/changes.ts`, `apps/web/src/text.ts`
- Test: `apps/web/tests/api-client.test.ts`

**Interfaces:**
- Uses: `decodeChangeNotice`, `RequestValidationError`, `ChangeNotice` from `@deckagent/host-contracts`.
- Produces:
  - `apps/web/src/api/client.ts`: `ClientErrorCode`, `ApiClientError`, `ApiClientConfig`, `SseFrameOptions`, `readTokenFromHash(hash: string): string`, `configureApiClient(config: ApiClientConfig): void`, `getApiClientConfig(): ApiClientConfig`, `apiFetch(path: string, init?: RequestInit): Promise<Response>`, `apiJson<T>(path: string, decode: (value: unknown) => T, init?: RequestInit): Promise<T>`, `readSseFrames(response: Response, options: SseFrameOptions): AsyncGenerator<string>`.
  - `apps/web/src/api/changes.ts`: `watchHostChanges(signal: AbortSignal): AsyncGenerator<ChangeNotice>`, `watchChatChanges(sessionId: string, signal: AbortSignal): AsyncGenerator<ChangeNotice>`, `queryKeyPrefixesForNotice(notice: ChangeNotice): readonly (readonly unknown[])[]`.
  - `apps/web/src/text.ts`: `appText`, `errorText: Readonly<Record<ClientErrorCode, string>>`, `formatClientError(code: ClientErrorCode): string`.

**STOP when:** `oxlint` reports any import violation in `apps/web/src/api/` or `apps/web/src/text.ts`.

**Forbidden:** Do not import React, TanStack Query, Node modules or UI folders in `apps/web/src/api/`. Do not declare a TypeScript `enum`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/api-client.test.ts` with a header comment that follows `docs/conventions/testware.md`:

```ts
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
```

- [ ] **Step 2: Run the test and make sure that it fails**

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/api-client.test.ts`
Expected: FAIL. The output reports that `api/client.ts`, `api/changes.ts` or `text.ts` does not exist.

- [ ] **Step 3: Implement `apps/web/src/api/client.ts`, `apps/web/src/api/changes.ts` and `apps/web/src/text.ts`**

1. Create `apps/web/src/api/client.ts`:
   - Define `CLIENT_ERROR_CODES` as an `as const` array containing the union of all error codes from `HostClient`, `ManagementClient`, `request-feedback.ts`, plus `HOST_REQUEST_FAILED`, `SETTINGS_REQUEST_FAILED`, `CHANGES_REQUEST_FAILED`, `CHANGES_CONNECTION_LOST`, `CONNECTION_LOST`, and `INVALID_RESPONSE`. Export `type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number]`.
   - Export `ApiClientError extends Error` with `readonly code: ClientErrorCode`, `readonly status: number`, `readonly detail: Readonly<Record<string, string | boolean>>`.
   - Export `readTokenFromHash`, `configureApiClient`, `getApiClientConfig`, `apiFetch`, `apiJson` and `readSseFrames`.
   - In `apiJson`, send `Authorization: Bearer <token>`, `credentials: 'omit'` and `redirect: 'error'`. On `!response.ok`, parse `{ error: { code, detail } }`, match `code` against `CLIENT_ERROR_CODES`, fall back to `AUTH_REQUIRED` when `response.status === 401`, and fall back to `HOST_REQUEST_FAILED` otherwise. On `response.ok`, parse JSON and run `decode`. Convert JSON parse errors, `RequestValidationError` and `Error('INVALID_RESPONSE')` into `new ApiClientError('INVALID_RESPONSE', response.status)`.
2. Create `apps/web/src/api/changes.ts`:
   - Export `watchHostChanges(signal)` reading `/api/changes` and `watchChatChanges(sessionId, signal)` reading `/api/sessions/${encodeURIComponent(sessionId)}/changes`. On `!response.ok`, throw `ApiClientError` with `AUTH_REQUIRED` on 401 or `CHANGES_REQUEST_FAILED` otherwise. Decode every `event: change` frame with `decodeChangeNotice`.
   - Export `queryKeyPrefixesForNotice(notice)` mapping: `workspaces` -> `[['workspaces']]`, `chats` -> `[['chats']]`, `providers` -> `[['providers'], ['settings']]`, `preferences` -> `[['preferences'], ['settings']]`, and `draft`/`brief`/`outline`/`deck` -> `[['chats', notice.key, notice.topic]]`.
3. Create `apps/web/src/text.ts`:
   - Import `type { ClientErrorCode } from './api/client.ts'`.
   - Export `appText` with Vietnamese shell strings (`appName: 'DeckAgent'`, `loadingWorkspace: 'Đang mở không gian làm việc…'`, `missingChat: 'Không tìm thấy chat này. Đã chuyển về màn hình chính.'`).
   - Export `errorText: Readonly<Record<ClientErrorCode, string>>` mapping every `ClientErrorCode` to its Vietnamese message (reusing the copy in `request-feedback.ts` where it exists).
   - Export `formatClientError(code: ClientErrorCode): string`.

- [ ] **Step 4: Run the test and static checks**

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/api-client.test.ts`
Expected: PASS. Exit code 0.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
