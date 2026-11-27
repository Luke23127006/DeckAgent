// What this file checks: useChangeFeed invalidates the TanStack Query prefixes of the notices that the Host stream
// sends, writes no cache data, stops after AUTH_REQUIRED and aborts the open stream when the component unmounts.
// Environment: Vitest with jsdom and Testing Library. MSW replaces the Host at the network boundary, so `apiFetch` and
// the SSE reader run unchanged. The retry delays are 10 ms and 20 ms, and the file does not use a fake clock.
// How to run: corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/use-change-feed.test.tsx
// Expected result: the one test passes. The query key literals and the notice payloads come from
// docs/build/refactor/web-react/plan/task-06-add-change-feed-and-connection-hooks.md.
// Fault tried: the MSW handler path `/api/changes` changed to `/api/wrong`. The test failed with "intercepted a request
// without a matching request handler", so the test uses the MSW handler and the real network is not a fallback.
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
