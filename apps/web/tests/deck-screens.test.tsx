// Checks the React deck screens of the chat screen: the Brief workflow, the Outline proposal with its actions, and the
// published deck with its stage and filmstrip. Runs in Vitest and jsdom. MSW replaces only the Host HTTP boundary.
// Run: corepack pnpm@11.28.5 test:web
// Expected values follow UC-004 (Brief and Outline), the deck routes of the Host and the preview security rule of
// docs/build/refactor/web-react/web-rules.md (empty sandbox, slide CSP in srcdoc).
import '@testing-library/jest-dom/vitest'
import type {
  BriefRecord,
  BriefView,
  DeckChange,
  DeckSnapshot,
  InterviewState,
  InterviewView,
  OutlineProposal,
} from '@deckagent/host-contracts'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { useEffect, useReducer } from 'react'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { configureApiClient } from '../src/api/client.ts'
import { DeckWorkflow } from '../src/components/deck-workflow.tsx'
import { OutlineCard, OutlineDock } from '../src/components/outline-card.tsx'
import type { OutlineActions } from '../src/components/outline-card.tsx'
import { PublishedDeck } from '../src/components/published-deck.tsx'
import { slideCsp } from '../src/components/slide-frame.tsx'
import { DeckModel } from '../src/hooks/use-deck-model.ts'
import type { DeckApi } from '../src/hooks/use-deck-model.ts'
import { DeckScreens } from '../src/hooks/use-deck-screens.ts'

const origin = 'http://localhost:4321'
const chatId = 'chat-1'

const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  configureApiClient({ origin, token: 'test-token' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.restoreAllMocks()
})

afterAll(() => server.close())

function briefRecord(fields: Partial<BriefRecord['draft']> = {}): BriefRecord {
  return {
    sessionId: chatId,
    briefId: 'brief-1',
    version: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
    draft: {
      topic: 'Năng lượng mặt trời',
      requirements: [],
      answers: [],
      assumptions: ['Người nghe là sinh viên'],
      sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
      images: { mode: 'none', attachmentIds: [], unmetRequirements: [] },
      ...fields,
    },
    design: null,
  }
}

function interview(brief: Partial<BriefView> = {}, state: Partial<InterviewState> = {}): InterviewView {
  return {
    brief: { sessionId: chatId, version: 0, current: null, locked: false, sourceStates: [], ...brief },
    state: {
      questions: [
        { topic: 'audience', prompt: 'Ai sẽ nghe?', suggestions: ['Sinh viên', 'Giáo viên'], required: true },
      ],
      blockers: [],
      readyForOutline: false,
      skipAllowed: true,
      notice: 'Cần trả lời',
      ...state,
    },
  }
}

const idleDeck: DeckApi = {
  snapshot: async id => ({ sessionId: id, deckId: id, outlineId: null, version: 0, slides: [] }),
  content: async () => {
    throw new Error('NO_CONTENT')
  },
  // A connection always starts with a notice of the current version, also for an empty deck.
  async *watch(id, signal): AsyncGenerator<DeckChange> {
    yield { sessionId: id, deckId: id, version: 0 }
    await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
  },
}

/** Renders the workflow again on each change of the deck screens, as the conversation does. */
function mountWorkflow(view: InterviewView, props: { researchAvailable?: boolean; proposal?: OutlineProposal } = {}) {
  let rerender = () => {}
  const deck = new DeckScreens(
    () => rerender(),
    idleDeck,
    async () => view,
  )
  const onChoose = vi.fn()
  function Harness() {
    const [, force] = useReducer((n: number) => n + 1, 0)
    useEffect(() => {
      rerender = force
    }, [])
    return (
      <DeckWorkflow
        deck={deck}
        proposal={props.proposal}
        busy={false}
        researchAvailable={props.researchAvailable ?? false}
        onChoose={onChoose}
        onSkip={() => {}}
      />
    )
  }
  const { container } = render(<Harness />)
  return { deck, onChoose, root: container.querySelector('.deck-workflow') as HTMLElement }
}

it('switches to the deck mode on a change event that does not bubble and sends the choices of the form', async () => {
  const { deck, onChoose, root } = mountWorkflow(interview())
  await act(() => deck.openWorkflow(chatId))
  const mode = screen.getByLabelText('Conversation mode') as HTMLSelectElement
  expect(mode.value).toBe('chat')
  expect(screen.getByLabelText('Open questions')).not.toBeVisible()
  act(() => {
    mode.value = 'deck'
    mode.dispatchEvent(new Event('change'))
  })
  expect(deck.preparingDeck).toBe(true)
  const inputs = root.querySelectorAll('input')
  expect([...inputs].map(input => input.closest('label')?.textContent)).toEqual([
    'Use the chat documents',
    'Use the general knowledge of the model',
    'Search public sources (free only)',
  ])
  expect(inputs[2], 'unconfigured research does not look available').toBeDisabled()
  fireEvent.click(within(screen.getByLabelText('Open questions')).getByRole('button', { name: 'Giáo viên' }))
  expect(onChoose).toHaveBeenCalledWith('Giáo viên')
  // A script sets a choice without an event; the request reads the form as it is now.
  ;(inputs[1] as HTMLInputElement).checked = true
  ;(screen.getByLabelText('Image options') as HTMLSelectElement).value = 'commons'
  expect(deck.command(false, undefined)).toEqual({
    action: 'collect',
    expectedBriefVersion: 0,
    expectedOutline: null,
    sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
    imageChoice: 'public-research',
    imageProviderChoice: 'commons',
  })
  expect(deck.command(true, undefined)?.action).toBe('skip')
  expect(deck.inputHint(undefined)).toBe('collect')
})

it('takes the source choices of a saved Brief and asks about the current Outline with the chosen action', async () => {
  const brief = briefRecord()
  const view = interview({ version: 1, current: brief }, { questions: [] })
  const proposal = boundProposal()
  const { deck, root } = mountWorkflow(view, { proposal })
  await act(() => deck.openWorkflow(chatId))
  expect(screen.getByLabelText('Conversation mode')).toHaveValue('deck')
  expect(root.querySelectorAll('input')[1]).toBeChecked()
  expect(root.querySelector('details summary')).toHaveTextContent('Current Brief · v1 and assumptions')
  expect(root.querySelector('details')).toHaveTextContent('Assumption: Người nghe là sinh viên')
  const action = screen.getByLabelText('Outline request type') as HTMLSelectElement
  expect(action).toBeVisible()
  const skip = [...root.querySelectorAll('button')].find(
    button => button.textContent === 'Skip the remaining questions',
  )
  expect(skip).not.toBeVisible()
  action.value = 'question'
  expect(deck.command(false, proposal)).toMatchObject({
    action: 'question',
    expectedBriefVersion: 1,
    expectedOutline: { outlineId: 'out-2', version: 2 },
  })
  expect(deck.inputHint(proposal)).toBe('question')
  act(() => deck.requestRevision())
  expect(action.value).toBe('revise')
})

it('keeps a locked Brief read-only and sends a chat request without deck fields', async () => {
  const view = interview({ version: 2, current: { ...briefRecord(), version: 2 }, locked: true }, { questions: [] })
  const { deck, root } = mountWorkflow(view)
  await act(() => deck.openWorkflow(chatId))
  expect(root.querySelector('details summary')).toHaveTextContent('The Brief is locked for this deck')
  expect(root.querySelector('label')).not.toBeVisible()
  expect(deck.preparingDeck).toBe(false)
  expect(deck.command(false, undefined)).toBeUndefined()
  expect(deck.inputHint(undefined)).toBe('chat')
})

function boundProposal(fields: Partial<OutlineProposal> = {}): OutlineProposal {
  return {
    outlineId: 'out-2',
    requestId: 'req-2',
    version: 2,
    responseIndex: 1,
    overview: 'Ba phần chính',
    status: 'current',
    brief: briefRecord(),
    slides: [
      {
        slideId: 's1',
        title: 'Giới thiệu',
        content: 'Mở đầu',
        blocks: [
          { kind: 'bullets', items: ['Mở đầu'] },
          { kind: 'web-image', query: 'solar panel', required: true },
        ],
      },
      { slideId: 's2', title: 'Kết luận', content: 'Tóm tắt' },
    ],
    imageReview: [
      {
        needId: 'need-1',
        slideIndex: 0,
        blockIndex: 1,
        required: true,
        status: 'unavailable',
        failure: 'RESEARCH_IMAGE_NO_MATCH',
      },
    ],
    ...fields,
  }
}

function actions(fields: Partial<OutlineActions> = {}): OutlineActions {
  return { busy: false, confirm: vi.fn(), revise: vi.fn(), ...fields }
}

it('blocks the confirmation while a required image is missing and asks for another image of that slide', () => {
  const proposal = boundProposal()
  const handlers = actions()
  const { container } = render(
    <>
      <OutlineCard proposal={proposal} actions={handlers} />
      <OutlineDock proposal={proposal} actions={handlers} />
    </>,
  )
  const card = container.querySelector('.outline-proposal[data-status=current]') as HTMLElement
  expect(card.querySelector('.outline-status')).toHaveTextContent(
    'You cannot confirm yet · required images not ready: 1',
  )
  const planned = card.querySelector('.planned-slide [aria-label="Planned content"]')
  expect(planned?.textContent?.split('Mở đầu').length, 'structured content does not repeat the content paragraph').toBe(
    2,
  )
  const dock = container.querySelector('.outline-dock') as HTMLElement
  expect(dock.dataset.outlineId).toBe('out-2')
  expect(dock).toHaveTextContent('Outline v2 · 2 slides · Brief v1')
  expect(within(dock).getByRole('button', { name: 'Confirm the outline and make slides' })).toBeDisabled()
  expect(within(dock).queryByRole('button', { name: 'Cancel the outline' })).toBeNull()
  fireEvent.click(within(card).getByRole('button', { name: 'Find a different image', hidden: true }))
  expect(handlers.revise).toHaveBeenCalledWith(
    expect.stringContaining('Replace the image on slide 1 “Giới thiệu”, image position 2.'),
  )
  fireEvent.click(within(dock).getByRole('button', { name: 'Ask for outline changes' }))
  expect(handlers.revise).toHaveBeenLastCalledWith()
})

it('confirms the current Outline once it is ready and keeps an older proposal read-only', () => {
  const ready = boundProposal({ imageReview: [] })
  const handlers = actions()
  const { container, rerender } = render(<OutlineDock proposal={ready} actions={handlers} />)
  fireEvent.click(screen.getByRole('button', { name: 'Confirm the outline and make slides' }))
  expect(handlers.confirm).toHaveBeenCalledWith(ready)
  rerender(<OutlineDock proposal={ready} actions={actions({ busy: true })} />)
  expect(screen.getByRole('button', { name: 'Confirm the outline and make slides' })).toBeDisabled()
  rerender(<OutlineDock proposal={{ ...ready, status: 'superseded' }} actions={handlers} />)
  expect(container.querySelector('.outline-dock')).not.toBeVisible()
  cleanup()
  render(<OutlineCard proposal={{ ...boundProposal(), status: 'superseded' }} actions={handlers} />)
  expect(screen.getByText('Old proposal · no longer current')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Find a different image', hidden: true })).toBeDisabled()
})

function deckSnapshot(): DeckSnapshot {
  return {
    sessionId: chatId,
    deckId: chatId,
    outlineId: 'out-2',
    version: 3,
    slides: [
      { slideId: 'a', title: 'Giới thiệu', order: 0, revision: 1, status: 'published' },
      { slideId: 'b', title: 'Kết luận', order: 1, revision: 0, status: 'pending' },
    ],
  }
}

it('renders the saved slide in a sandboxed frame with the slide CSP and shows a pending slide as a placeholder', async () => {
  server.use(
    http.get(`${origin}/api/sessions/${chatId}/deck/slides/a/revisions/1`, () =>
      HttpResponse.json({ sessionId: chatId, slideId: 'a', revision: 1, html: '<h1>thumbnail</h1>' }),
    ),
  )
  const model = new DeckModel({
    snapshot: async () => deckSnapshot(),
    content: async (id, slideId, revision) => ({ sessionId: id, slideId, revision, html: '<h1>intro published</h1>' }),
    async *watch(id, signal): AsyncGenerator<DeckChange> {
      yield { sessionId: id, deckId: id, version: 3 }
      await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
    },
  })
  const { container } = render(<PublishedDeck model={model} open onClose={() => {}} />)
  act(() => model.open(chatId))
  const stageFrame = () => container.querySelector('.deck-stage iframe') as HTMLIFrameElement
  await waitFor(() => expect(stageFrame().getAttribute('srcdoc')).toBe(`${slideCsp}<h1>intro published</h1>`))
  expect(stageFrame().getAttribute('sandbox')).toBe('')
  expect(container.querySelector('.deck-placeholder')).not.toBeVisible()
  expect(container.querySelector('.deck-progress')).toHaveTextContent('1/2 slides saved')
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  const list = container.querySelector('.deck-slide-list') as HTMLElement
  expect(list.querySelector('[aria-current=true]')).toHaveAttribute('aria-label', '1. Giới thiệu · Version 1')
  await waitFor(() => expect(list.querySelector('.thumbnail iframe')?.getAttribute('srcdoc')).toContain('thumbnail'))
  expect(list.querySelector('.thumbnail iframe')).toHaveAttribute('sandbox', '')
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(list.querySelector('[aria-current=true]')).toHaveAttribute('data-status', 'pending')
  expect(stageFrame()).not.toBeVisible()
  expect(container.querySelector('.deck-placeholder')).toHaveTextContent('This slide is not complete.')
  expect(container.querySelector('.slide-caption')).toHaveTextContent('Slide 2/2 · Not complete')
  act(() => model.close())
})

it('opens the published deck once for each chat with a confirmed Outline and hides the sample deck', async () => {
  const opened = vi.fn()
  const deck = new DeckScreens(opened, {
    ...idleDeck,
    snapshot: async () => deckSnapshot(),
    content: async (id, slideId, revision) => ({ sessionId: id, slideId, revision, html: '<h1>saved</h1>' }),
    async *watch(id, signal): AsyncGenerator<DeckChange> {
      yield { sessionId: id, deckId: id, version: 3 }
      await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
    },
  })
  deck.sampleOpen = true
  deck.openChat(chatId)
  await waitFor(() => expect(deck.publishedOpen).toBe(true))
  expect(deck.sampleOpen).toBe(false)
  deck.setPublishedOpen(false)
  await deck.model.refresh()
  expect(deck.publishedOpen, 'a closed deck stays closed until the chat opens again').toBe(false)
  deck.dispose()
})
