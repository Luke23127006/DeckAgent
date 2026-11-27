import type {
  ConfirmationResult,
  ConfirmationTarget,
  DeckRequest,
  DeckSnapshot,
  OutlineProposal,
  OutlineSnapshot,
} from '@deckagent/host-contracts'
import { element } from './dom.ts'
import { BriefClient, ConfirmationClient, DeckClient, HostClient, OutlineClient } from './transport/index.ts'
import { DeckWorkflowView, mountDeckCanvas, mountDeckTab, OutlineView } from './features/deck/index.ts'

export interface DeckBridgeOptions {
  readonly origin: string
  readonly token: string
  /** Adds a suggested answer of the Brief interview to the draft. */
  readonly choose: (text: string) => void
  /** Skips the remaining interview questions. */
  readonly skip: () => void
  readonly confirmOutline: (proposal: OutlineProposal) => void
  /** Selects a revision of the current Outline, and adds `text` to the draft when it is given. */
  readonly revise: (text?: string) => void
  readonly changed: () => void
}

/**
 * The deck screens that stay legacy until Phase 6: the Brief workflow, the Outline cards, the sample deck and the deck
 * canvas. The React conversation screen places the nodes and calls the bridge.
 */
export interface DeckBridge {
  readonly workflow: HTMLElement
  readonly outlineDock: HTMLElement
  readonly sampleDeck: HTMLElement
  readonly publishedDeck: HTMLElement
  readonly briefVersion: number | undefined
  readonly preparingDeck: boolean
  readonly inputHint: string
  readonly deck: DeckSnapshot | undefined
  openChat(sessionId: string): void
  openWorkflow(sessionId: string): Promise<void>
  refreshWorkflow(sessionId: string): Promise<void>
  updateWorkflow(proposal: OutlineProposal | undefined, busy: boolean): void
  setResearchAvailable(available: boolean): void
  requestRevision(): void
  command(skip: boolean): DeckRequest | undefined
  readOutlines(sessionId: string): Promise<OutlineSnapshot>
  setOutlines(snapshot: OutlineSnapshot): void
  outlineCard(proposal: OutlineProposal): HTMLElement
  setOutlineBusy(busy: boolean): void
  resetOutlines(): void
  confirm(sessionId: string, target: ConfirmationTarget): Promise<ConfirmationResult>
  showPublishedDeck(): void
  dispose(): void
}

export function createDeckBridge(options: DeckBridgeOptions): DeckBridge {
  const host = new HostClient(options.origin, options.token)
  const outlines = new OutlineClient(options.origin, options.token)
  const confirmations = new ConfirmationClient(options.origin, options.token)
  const workflow = new DeckWorkflowView(
    new BriefClient(options.origin, options.token),
    options.choose,
    options.skip,
    options.changed,
  )
  const outlineDock = element('section', undefined, 'outline-dock')
  outlineDock.hidden = true
  const outlineView = new OutlineView(
    (action, proposal) => {
      if (action === 'confirm') options.confirmOutline(proposal)
    },
    options.revise,
    outlineDock,
    (sessionId, outlineId, needId) => host.outlineImage(sessionId, outlineId, needId),
  )
  const sampleDeck = element('aside', undefined, 'deck-sidebar')
  sampleDeck.hidden = true
  const publishedDeck = element('aside', undefined, 'deck-sidebar published-deck-sidebar')
  publishedDeck.hidden = true
  mountDeckTab(sampleDeck)
  const deckModel = mountDeckCanvas(publishedDeck, new DeckClient(options.origin, options.token), () => {
    sampleDeck.hidden = true
    options.changed()
  })
  return {
    workflow: workflow.node,
    outlineDock,
    sampleDeck,
    publishedDeck,
    get briefVersion() {
      return workflow.briefVersion
    },
    get preparingDeck() {
      return workflow.preparingDeck
    },
    get inputHint() {
      return workflow.inputHint
    },
    get deck() {
      return deckModel.state.snapshot
    },
    openChat: sessionId => deckModel.open(sessionId),
    openWorkflow: sessionId => workflow.open(sessionId),
    refreshWorkflow: sessionId => workflow.refresh(sessionId),
    updateWorkflow: (proposal, busy) => workflow.update(proposal, busy),
    setResearchAvailable: available => workflow.setResearchAvailable(available),
    requestRevision: () => workflow.requestRevision(),
    command: skip => workflow.command(skip),
    readOutlines: sessionId => outlines.snapshot(sessionId),
    setOutlines: snapshot => {
      outlineDock.hidden = !snapshot.proposals.some(proposal => proposal.status === 'current')
    },
    outlineCard: proposal => outlineView.render(proposal),
    setOutlineBusy: busy => outlineView.setBusy(busy),
    resetOutlines: () => {
      outlineView.reset()
      outlineDock.replaceChildren()
      outlineDock.hidden = true
    },
    confirm: (sessionId, target) => confirmations.confirm(sessionId, target),
    showPublishedDeck: () => {
      sampleDeck.hidden = true
      publishedDeck.hidden = false
    },
    dispose: () => deckModel.close(),
  }
}
