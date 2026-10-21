import type { OutlineProposal } from '@deckagent/deck'
import { button, element } from './dom.ts'

export type OutlineAction = (type: 'confirm' | 'cancel', proposal: OutlineProposal) => void

/** Stable cards preserve reading expansion/focus. All content is text, never model-authored DOM. */
export class OutlineView {
  private readonly cards = new Map<string, { node: HTMLElement; status: HTMLElement; actions: HTMLElement;
    buttons: readonly HTMLButtonElement[]; proposal: OutlineProposal }>()
  private busy = false

  constructor(private readonly action?: OutlineAction, private readonly revise?: () => void) {}

  reset(): void { this.cards.clear() }

  setBusy(busy: boolean): void {
    this.busy = busy
    for (const card of this.cards.values()) for (const control of card.buttons)
      control.disabled = busy || card.proposal.status !== 'current' || !this.action
  }

  render(proposal: OutlineProposal): HTMLElement {
    let card = this.cards.get(proposal.outlineId)
    if (!card) {
      const node = element('section', undefined, 'outline-proposal')
      node.dataset.outlineId = proposal.outlineId
      node.setAttribute('aria-label', 'Presentation outline')
      const status = element('p', '', 'outline-status')
      const overview = element('p', proposal.overview, 'outline-overview')
      const slides = proposal.slides.map((slide, index) => {
        const detail = element('details', undefined, 'planned-slide')
        detail.append(element('summary', `${index + 1}. ${slide.title}`), element('p', slide.content))
        return detail
      })
      const viewing = element('div', undefined, 'outline-viewing')
      viewing.append(button('Expand all', () => { for (const slide of slides) slide.open = true }),
        button('Collapse all', () => { for (const slide of slides) slide.open = false }))
      const actions = element('div', undefined, 'outline-actions')
      const buttons = [button('Confirm outline', () => this.action?.('confirm', proposal)),
        button('Cancel outline', () => this.action?.('cancel', proposal)),
        button('Revise outline', () => this.revise?.())]
      actions.append(...buttons)
      node.append(element('h3', 'Presentation outline'), status, overview, viewing, ...slides, actions)
      card = { node, status, actions, buttons, proposal }
      this.cards.set(proposal.outlineId, card)
    }
    card.proposal = proposal
    const label = proposal.status === 'confirmed' ? 'Confirmed · read-only' : proposal.status === 'current'
      ? 'Review the plan. No slides are built until you confirm.' : proposal.status === 'cancelled' ? 'Cancelled' : 'Earlier proposal · superseded'
    if (card.status.textContent !== label) card.status.textContent = label
    card.node.dataset.status = proposal.status
    card.actions.hidden = proposal.status !== 'current'
    for (const control of card.buttons) control.disabled = this.busy || proposal.status !== 'current' || !this.action
    return card.node
  }
}
