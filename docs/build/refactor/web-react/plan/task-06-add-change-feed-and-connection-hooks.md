# Task 6: Add change feed and host connection hooks

Read this file to learn the steps of Task 6, which adds `useChangeFeed` for TanStack Query cache invalidation and `useHostConnection` for reading the configured Host connection.

**Type:** Code

**Read first:**
- [Revision 2 Global Constraints](README.md#revision-2-global-constraints) and [Task protocol](README.md#task-protocol) in `README.md`
- `apps/web/src/api/client.ts` (the exports `ApiClientError`, `ApiClientConfig`, `getApiClientConfig`)
- `apps/web/src/api/changes.ts` (the exports `watchHostChanges`, `watchChatChanges`, `queryKeyPrefixesForNotice`)
- `apps/web/src/browser/change-watcher.ts` (the reconnect loop)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Create: `apps/web/src/hooks/use-change-feed.ts`, `apps/web/src/hooks/use-host-connection.ts`
- Test: `apps/web/tests/use-change-feed.test.tsx`

**Interfaces:**
- Uses: `ApiClientError`, `ApiClientConfig` and `getApiClientConfig` from `../api/client.ts`. Also uses `watchHostChanges`, `watchChatChanges` and `queryKeyPrefixesForNotice` from `../api/changes.ts`.
- Produces:
  - `apps/web/src/hooks/use-change-feed.ts`: `export interface ChangeFeedOptions { readonly sessionId?: string; readonly enabled?: boolean; readonly retryBaseMs?: number; readonly retryMaxMs?: number }`, `export function useChangeFeed(options?: ChangeFeedOptions): void`.
  - `apps/web/src/hooks/use-host-connection.ts`: `export function useHostConnection(): ApiClientConfig`.

**STOP when:** A test depends on real wall-clock sleep longer than 200 ms, or a hook imports JSX, `components/`, `layouts/` or `pages/`.

**Forbidden:** Do not write notice payloads into the TanStack Query cache (`setQueryData`). Invalidate query key prefixes only.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/use-change-feed.test.tsx` with a header comment that follows `docs/conventions/testware.md`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { configureApiClient } from '../src/api/client.ts'
import { useChangeFeed } from '../src/hooks/use-change-feed.ts'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function FeedHarness({ sessionId }: { readonly sessionId?: string }) {
  useChangeFeed({ sessionId, retryBaseMs: 10, retryMaxMs: 20 })
  return null
}

describe('useChangeFeed', () => {
  it('useChangeFeed invalidates query prefixes, stops on AUTH_REQUIRED and aborts on unmount', async () => {
    configureApiClient({ origin: 'http://127.0.0.1:4321', token: 'feed-token' })
    const encoder = new TextEncoder()
    let hostAborted = false
    server.use(
      http.get('http://127.0.0.1:4321/api/changes', ({ request }) => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode('event: change\ndata: {"topic":"workspaces","key":"host","version":2}\n\n'),
            )
            controller.enqueue(
              encoder.encode('event: change\ndata: {"topic":"providers","key":"host","version":1}\n\n'),
            )
            request.signal.addEventListener('abort', () => {
              hostAborted = true
              try {
                controller.close()
              } catch {
                /* Stream already closed. */
              }
            })
          },
        })
        return new HttpResponse(stream, { headers: { 'content-type': 'text/event-stream' } })
      }),
    )

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setDataSpy = vi.spyOn(queryClient, 'setQueryData')
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <FeedHarness />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workspaces'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['providers'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['settings'] })
    })
    expect(setDataSpy).not.toHaveBeenCalled()
    rendered.unmount()
    await waitFor(() => expect(hostAborted).toBe(true))

    let authAttempts = 0
    server.use(
      http.get('http://127.0.0.1:4321/api/changes', () => {
        authAttempts += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const unauthRender = render(
      <QueryClientProvider client={new QueryClient()}>
        <FeedHarness />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(authAttempts).toBe(1))
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(authAttempts).toBe(1)
    unauthRender.unmount()
  })
})
```

- [ ] **Step 2: Run the test and make sure that it fails**

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/use-change-feed.test.tsx`
Expected: FAIL. The output reports that `use-change-feed.ts` does not exist.

- [ ] **Step 3: Implement `apps/web/src/hooks/use-change-feed.ts` and `apps/web/src/hooks/use-host-connection.ts`**

1. Create `apps/web/src/hooks/use-host-connection.ts`:
   - Export `useHostConnection(): ApiClientConfig` returning `getApiClientConfig()`.
2. Create `apps/web/src/hooks/use-change-feed.ts`:
   - Implement a helper `followStream` that takes a stream factory `(signal: AbortSignal) => AsyncGenerator<ChangeNotice>`, `queryClient`, `signal`, `retryBaseMs` (default `500`) and `retryMaxMs` (default `10_000`).
   - On each yielded notice, loop over `queryKeyPrefixesForNotice(notice)` and call `void queryClient.invalidateQueries({ queryKey })`.
   - On error: return immediately when `signal.aborted` or when `error instanceof ApiClientError && error.code === 'AUTH_REQUIRED'`. Otherwise wait `retry` ms (abortable via `signal`), double `retry` up to `retryMaxMs`, and reconnect.
   - In `useChangeFeed(options = {})`:
     - First `useEffect`: when `options.enabled !== false`, create an `AbortController`, run `followStream(watchHostChanges, ...)`, and abort in the cleanup function.
     - Second `useEffect`: when `options.enabled !== false && options.sessionId`, create an `AbortController`, run `followStream(signal => watchChatChanges(sessionId, signal), ...)`, and abort in the cleanup function.

- [ ] **Step 4: Run the test and static checks**

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/use-change-feed.test.tsx`
Expected: PASS. Exit code 0.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
