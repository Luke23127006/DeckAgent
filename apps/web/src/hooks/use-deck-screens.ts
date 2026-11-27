import type { DeckRequest, DeckSnapshot, InterviewView, OutlineProposal } from '@deckagent/host-contracts'
import { useEffect } from 'react'
import { readInterview } from '../api/deck.ts'
import { DeckModel, hostDeckApi } from './use-deck-model.ts'
import type { DeckApi, DeckViewState } from './use-deck-model.ts'
import type { ConversationDeck } from './use-conversation.ts'

/** The form controls of the Brief workflow. Their values are read when a request is sent, as the user set them. */
export interface WorkflowControls {
  mode: HTMLSelectElement | null
  material: HTMLInputElement | null
  knowledge: HTMLInputElement | null
  research: HTMLInputElement | null
  images: HTMLSelectElement | null
  format: HTMLSelectElement | null
  action: HTMLSelectElement | null
}

export interface SampleLayout {
  readonly current: number
  readonly width: number
  readonly open: boolean
}

const sampleLayoutKey = 'deckagent-sample-layout'

/** The saved layout of the sample deck. An invalid saved value gives the default layout. */
export function readSampleLayout(): SampleLayout {
  const layout = { current: 0, width: 520, open: false }
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(sampleLayoutKey) ?? 'null')
    if (!saved || typeof saved !== 'object') return layout
    if (
      'current' in saved &&
      typeof saved.current === 'number' &&
      Number.isInteger(saved.current) &&
      saved.current >= 0 &&
      saved.current < 3
    )
      layout.current = saved.current
    if (
      'width' in saved &&
      typeof saved.width === 'string' &&
      Number(saved.width) >= 320 &&
      Number(saved.width) <= 1000
    )
      layout.width = Number(saved.width)
    if ('open' in saved && saved.open === true) layout.open = true
  } catch {
    /* Ignore an invalid optional layout. */
  }
  return layout
}

export function saveSampleLayout(layout: SampleLayout): void {
  try {
    localStorage.setItem(
      sampleLayoutKey,
      JSON.stringify({ current: layout.current, width: String(layout.width), open: layout.open }),
    )
  } catch {
    /* The layout is optional; the controls stay usable without browser storage. */
  }
}

/**
 * The deck screens of the open chat: the Brief workflow, the sample deck and the published deck. The conversation
 * calls them through the `ConversationDeck` port. Only the Host snapshots set the versions and the locks; this object
 * keeps the explicit choices of the user.
 */
export class DeckScreens implements ConversationDeck {
  readonly model: DeckModel
  readonly controls: WorkflowControls = {
    mode: null,
    material: null,
    knowledge: null,
    research: null,
    images: null,
    format: null,
    action: null,
  }
  sampleOpen: boolean
  publishedOpen = false
  /** Whether the user chose the deck mode. A locked Brief keeps the mode, but no longer prepares a deck. */
  active = false
  interview: InterviewView | undefined
  private sessionId = ''
  private lastSession: string | undefined
  private shownSession = ''
  private appeared = false
  private signature = ''

  constructor(
    private readonly changed: () => void,
    api: DeckApi = hostDeckApi,
    private readonly loadInterview: (sessionId: string) => Promise<InterviewView> = readInterview,
  ) {
    this.sampleOpen = readSampleLayout().open
    this.model = new DeckModel(api, state => this.onDeck(state))
  }

  /** The workflow form gives each of its controls, and `null` when the control unmounts. */
  attach<K extends keyof WorkflowControls>(name: K, node: WorkflowControls[K]): void {
    this.controls[name] = node
  }

  /** Whether the public research choice is checked now. */
  researchChosen(): boolean {
    return this.controls.research?.checked ?? false
  }

  get deck(): DeckSnapshot | undefined {
    return this.model.state.snapshot
  }

  get briefVersion(): number | undefined {
    return this.interview?.brief.version
  }

  get locked(): boolean {
    return !!this.interview?.brief.locked
  }

  get preparingDeck(): boolean {
    return this.active && !this.locked
  }

  inputHint(proposal: OutlineProposal | undefined): 'chat' | 'collect' | 'question' | 'clarify' | 'revise' {
    if (!this.preparingDeck) return 'chat'
    if (!proposal) return 'collect'
    const action = this.controls.action?.value
    return action === 'question' || action === 'clarify' ? action : 'revise'
  }

  openChat(sessionId: string): void {
    this.lastSession = sessionId
    this.model.open(sessionId)
  }

  async openWorkflow(sessionId: string): Promise<void> {
    this.sessionId = sessionId
    this.interview = undefined
    this.active = false
    const { material, knowledge, research, images, format, action } = this.controls
    for (const box of [material, knowledge, research]) if (box) box.checked = false
    for (const select of [images, format]) if (select) select.value = ''
    if (action) action.value = 'revise'
    this.changed()
    await this.refreshWorkflow(sessionId)
  }

  async refreshWorkflow(sessionId: string): Promise<void> {
    const next = await this.loadInterview(sessionId)
    if (this.sessionId !== sessionId) return
    const versionChanged = this.interview?.brief.version !== next.brief.version
    if (!this.interview) this.active = next.brief.version > 0
    else if (versionChanged && next.brief.version > 0) this.active = true
    this.interview = next
    const sources = next.brief.current?.draft.sources
    if (versionChanged && sources) {
      if (this.controls.material) this.controls.material.checked = sources.material
      if (this.controls.knowledge) this.controls.knowledge.checked = sources.modelKnowledge
      if (this.controls.research) this.controls.research.checked = sources.publicResearch
    }
    this.changed()
  }

  /** The user chose the chat mode or the deck mode. */
  setMode(deck: boolean): void {
    this.active = deck
    this.changed()
  }

  /** The user chose another kind of Outline request. The composer shows another hint. */
  chooseAction(): void {
    this.changed()
  }

  requestRevision(): void {
    this.active = true
    if (this.controls.action) this.controls.action.value = 'revise'
    this.changed()
  }

  command(skip: boolean, proposal: OutlineProposal | undefined): DeckRequest | undefined {
    if (!this.active || this.locked) return undefined
    if (!this.interview) throw new Error('BRIEF_UNAVAILABLE')
    const { material, knowledge, research, images, format, action } = this.controls
    const chosen = action?.value
    const kind = proposal ? (chosen === 'question' || chosen === 'clarify' ? chosen : 'revise') : 'collect'
    const image = images?.value ?? ''
    return {
      action: skip ? 'skip' : kind,
      expectedBriefVersion: this.interview.brief.version,
      expectedOutline: proposal ? { outlineId: proposal.outlineId, version: proposal.version } : null,
      sourceChoice: {
        material: material?.checked ?? false,
        modelKnowledge: knowledge?.checked ?? false,
        publicResearch: research?.checked ?? false,
      },
      ...(format?.value === 'html' ? { formatChoice: 'html' as const } : {}),
      ...(image === 'none' || image === 'attachments'
        ? { imageChoice: image }
        : image === 'public-research' || image === 'commons'
          ? {
              imageChoice: 'public-research' as const,
              imageProviderChoice: image === 'commons' ? ('commons' as const) : ('tavily' as const),
            }
          : {}),
    }
  }

  setSampleOpen(open: boolean): void {
    this.sampleOpen = open
    this.changed()
  }

  setPublishedOpen(open: boolean): void {
    this.publishedOpen = open
    this.changed()
  }

  showPublishedDeck(): void {
    this.sampleOpen = false
    this.publishedOpen = true
    this.changed()
  }

  /** Starts the deck model again after a mount. */
  activate(): void {
    if (this.lastSession) this.model.open(this.lastSession)
  }

  dispose(): void {
    this.model.close()
  }

  // A deck with a confirmed Outline opens once for each chat. The conversation renders again only when a value that
  // it shows changes, not on each slide read.
  private onDeck(state: DeckViewState): void {
    const snapshot = state.snapshot
    if (!snapshot) {
      this.publishedOpen = false
      this.appeared = false
    } else {
      if (this.shownSession !== snapshot.sessionId) {
        this.shownSession = snapshot.sessionId
        this.appeared = false
      }
      if (snapshot.outlineId && !this.appeared) {
        this.appeared = true
        this.sampleOpen = false
        this.publishedOpen = true
      }
    }
    const signature = JSON.stringify([
      snapshot?.sessionId,
      snapshot?.outlineId,
      snapshot?.generation,
      this.publishedOpen,
      this.sampleOpen,
    ])
    if (signature === this.signature) return
    this.signature = signature
    this.changed()
  }
}

/** Starts the deck model of `deck` on mount and closes it on unmount. */
export function useDeckScreens(deck: DeckScreens): DeckScreens {
  useEffect(() => {
    deck.activate()
    return () => deck.dispose()
  }, [deck])
  return deck
}
