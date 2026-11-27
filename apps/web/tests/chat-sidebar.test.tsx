// Checks the React chat list, the chat search and the workspace controls of the chat navigation.
// Runs in Vitest and jsdom. MSW replaces only the Host HTTP boundary.
// Run: corepack pnpm@11.28.5 test:web
// Expected values follow the chat list and workspace HTTP contract, UC-006 S1, UC-013 and FR-134.
import '@testing-library/jest-dom/vitest'
import type { WebSession } from '@deckagent/host-contracts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { configureApiClient } from '../src/api/client.ts'
import { ChatList } from '../src/components/chat-list.tsx'
import { ChatSearch } from '../src/components/chat-search.tsx'
import { WorkspaceControls } from '../src/components/workspace-controls.tsx'
import type { OpenChatState } from '../src/components/chat-list.tsx'

const origin = 'http://localhost:4321'

function chat(sessionId: string, fields: Partial<WebSession> = {}): WebSession {
  return {
    sessionId,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    messageCount: 1,
    selectable: true,
    workspaceId: 'default',
    readable: true,
    title: sessionId,
    ...fields,
  }
}

const defaultWorkspace = { id: 'default', name: 'Mặc định', folder: null, isDefault: true, folderStatus: 'none' }
const projectWorkspace = {
  id: 'w1',
  name: 'Dự án',
  folder: 'C:\\du-an',
  isDefault: false,
  folderStatus: 'available',
}
const twoWorkspaces = { selectedId: 'default', version: 4, workspaces: [defaultWorkspace, projectWorkspace] }
const chats = [
  chat('older', { updatedAt: '2026-11-01T00:00:00.000Z' }),
  chat('newer', { updatedAt: '2026-11-03T00:00:00.000Z' }),
  chat('empty', { messageCount: 0, title: undefined }),
  chat('loose', { workspaceId: null }),
  chat('other', { workspaceId: 'w1' }),
  chat('damaged', { readable: false }),
]

const server = setupServer(
  http.get(`${origin}/api/sessions`, () => HttpResponse.json(chats)),
  http.get(`${origin}/api/workspaces`, () => HttpResponse.json(twoWorkspaces)),
)
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  // jsdom has no modal dialog behavior; an open attribute is enough for these checks.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

interface Slots {
  readonly workspaces: HTMLElement
  readonly search: HTMLElement
  readonly chats: HTMLElement
}

/** The navigation parts of the chat screen, each in its own element, as the chat screen places them. */
function Sidebar(props: { readonly slots: Slots; readonly open: OpenChatState; readonly onOpen: (chat: WebSession) => void }) {
  const [words, setWords] = useState('')
  return (
    <>
      {createPortal(<WorkspaceControls busy={false} />, props.slots.workspaces)}
      {createPortal(<ChatSearch onWords={setWords} />, props.slots.search)}
      {createPortal(<ChatList words={words} open={props.open} onOpen={props.onOpen} />, props.slots.chats)}
    </>
  )
}

const openState: OpenChatState = { currentSessionId: 'empty', locked: false, draftIds: [] }

function mount(open: OpenChatState = openState, onOpen = vi.fn()) {
  configureApiClient({ origin, token: 'test-token' })
  const slots = {
    workspaces: document.body.appendChild(document.createElement('div')),
    search: document.body.appendChild(document.createElement('div')),
    chats: document.body.appendChild(document.createElement('nav')),
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Sidebar slots={slots} open={open} onOpen={onOpen} />
    </QueryClientProvider>,
  )
  return { slots, onOpen }
}

function listedIds(nav: HTMLElement): string[] {
  return [...nav.querySelectorAll('button')].map(button => button.dataset.sessionId ?? '')
}

it('lists the chats of the workspace in use first, newest first, then the ungrouped chats', async () => {
  const { slots, onOpen } = mount()
  await waitFor(() => expect(listedIds(slots.chats)).toEqual(['newer', 'damaged', 'empty', 'older', 'loose']))
  expect(within(slots.chats).getByRole('heading', { name: 'Chat chưa nhóm' })).toBeInTheDocument()
  expect(slots.chats.querySelector('[aria-current=true]')).toHaveAttribute('data-session-id', 'empty')
  expect(slots.chats.querySelector('[data-session-id=empty] strong')).toHaveTextContent('Chat mới')
  expect(slots.chats.querySelector('[data-session-id=damaged] strong')).toHaveTextContent('Chat không đọc được')
  expect(slots.chats.querySelector('[data-session-id=damaged]')).toHaveAttribute('data-unreadable', 'true')
  await userEvent.setup().click(slots.chats.querySelector('[data-session-id=older]') as HTMLElement)
  expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'older' }))
})

it('hides an empty chat that is not open unless it has local draft text, and locks the list while switching', async () => {
  const { slots } = mount({ currentSessionId: 'newer', locked: true, draftIds: [] })
  await waitFor(() => expect(listedIds(slots.chats)).toEqual(['newer', 'damaged', 'older', 'loose']))
  for (const button of slots.chats.querySelectorAll('button')) expect(button).toBeDisabled()
  cleanup()
  document.body.replaceChildren()
  const next = mount({ currentSessionId: 'newer', locked: false, draftIds: ['empty'] })
  await waitFor(() => expect(listedIds(next.slots.chats)).toContain('empty'))
})

it('shows only the chats that hold the words and keeps the words when nothing matches', async () => {
  const searches: unknown[] = []
  server.use(
    http.post(`${origin}/api/sessions/search`, async ({ request }) => {
      const body = (await request.json()) as { words: string }
      searches.push(body)
      return HttpResponse.json(body.words === 'nhựa' ? [chats[0]] : [])
    }),
  )
  const { slots } = mount()
  await waitFor(() => expect(listedIds(slots.chats)).toHaveLength(5))
  const input = screen.getByRole('searchbox', { name: 'Tìm chat trước theo từ' }) as HTMLInputElement
  input.value = 'nhựa'
  fireEvent.submit(input.form as HTMLFormElement)
  await waitFor(() => expect(listedIds(slots.chats)).toEqual(['older']))
  expect(searches).toEqual([{ words: 'nhựa' }])
  input.value = 'không có từ này'
  fireEvent.submit(input.form as HTMLFormElement)
  await waitFor(() => expect(slots.chats).toHaveTextContent('Không có chat nào khớp với các từ đã nhập.'))
  expect(input.value).toBe('không có từ này')
  // A script sends an `input` event that does not bubble; the list returns after the wait.
  input.value = ''
  input.dispatchEvent(new Event('input'))
  await waitFor(() => expect(listedIds(slots.chats)).toHaveLength(5))
})

it('switches the workspace with the version it read and shows the chats of the new workspace', async () => {
  let body: unknown
  server.use(
    http.put(`${origin}/api/workspaces/selected`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...twoWorkspaces, selectedId: 'w1', version: 5 })
    }),
  )
  const { slots } = mount()
  const select = (await screen.findByRole('combobox', { name: 'Workspace' })) as HTMLSelectElement
  await waitFor(() => expect(select.options).toHaveLength(2))
  expect(select.options[0]).toHaveTextContent('Mặc định · mặc định')
  select.value = 'w1'
  select.dispatchEvent(new Event('change'))
  await waitFor(() => expect(body).toEqual({ id: 'w1', expectedVersion: 4 }))
  await waitFor(() => expect(select.value).toBe('w1'))
  await waitFor(() => expect(listedIds(slots.chats)).toEqual(['other', 'loose']))
})

it('keeps a refused folder out of the list and says why in the dialog', async () => {
  server.use(
    http.post(`${origin}/api/workspaces`, () =>
      HttpResponse.json(
        { error: { code: 'WORKSPACE_FOLDER_REFUSED', detail: { reason: 'drive-root', allowInside: true } } },
        { status: 400 },
      ),
    ),
  )
  mount()
  const user = userEvent.setup()
  const add = await screen.findByRole('button', { name: '+ Thư mục' })
  await waitFor(() => expect(add).toBeEnabled())
  await user.click(add)
  const dialog = document.querySelector('.workspace-dialog') as HTMLDialogElement
  expect(dialog.open).toBe(true)
  await user.type(within(dialog).getByLabelText('Đường dẫn thư mục'), 'C:\\')
  await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
  await waitFor(() =>
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Thư mục này không thể là thư mục dự án: đây là thư mục gốc của ổ đĩa. Bạn có thể chọn một thư mục bên trong nó.',
    ),
  )
  expect(dialog.open).toBe(true)
})

it('closes the add dialog without a write when no folder is given (UC-013 A9)', async () => {
  mount()
  const user = userEvent.setup()
  const add = await screen.findByRole('button', { name: '+ Thư mục' })
  await waitFor(() => expect(add).toBeEnabled())
  await user.click(add)
  const dialog = document.querySelector('.workspace-dialog') as HTMLDialogElement
  await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
  expect(dialog.open).toBe(false)
})

it('reads the list again after a stale write and names the cause', async () => {
  let reads = 0
  server.use(
    http.get(`${origin}/api/workspaces`, () => {
      reads++
      return HttpResponse.json({ ...twoWorkspaces, selectedId: 'w1' })
    }),
    http.delete(`${origin}/api/workspaces/w1`, () =>
      HttpResponse.json({ error: { code: 'WORKSPACES_STALE' } }, { status: 409 }),
    ),
  )
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mount()
  const remove = await screen.findByRole('button', { name: 'Gỡ' })
  await waitFor(() => expect(remove).toBeEnabled())
  await userEvent.setup().click(remove)
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Gỡ workspace “Dự án”?'))
  await waitFor(() =>
    expect(document.querySelector('.workspace-controls > [role=alert]')).toHaveTextContent(
      'Danh sách workspace vừa thay đổi ở nơi khác.',
    ),
  )
  await waitFor(() => expect(reads).toBe(2))
})
