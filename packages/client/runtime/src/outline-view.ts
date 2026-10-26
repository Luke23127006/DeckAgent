import type { OutlineProposal } from '@deckagent/deck'
import { button, element } from './dom.ts'

export type OutlineAction = (type: 'confirm' | 'cancel', proposal: OutlineProposal) => void

/** Stable cards preserve reading expansion/focus. All content is text, never model-authored DOM. */
export class OutlineView {
  private readonly cards = new Map<string, { node: HTMLElement; status: HTMLElement; actions: HTMLElement;
    buttons: readonly HTMLButtonElement[]; proposal: OutlineProposal }>()
  private busy = false

  constructor(private readonly action?: OutlineAction, private readonly revise?: () => void, private readonly dock?: HTMLElement) {}

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
      node.setAttribute('aria-label', 'Outline đề xuất')
      const status = element('p', '', 'outline-status')
      const overview = element('p', proposal.overview, 'outline-overview')
      const slides = proposal.slides.map((slide, index) => {
        const detail = element('details', undefined, 'planned-slide')
        detail.append(element('summary', `${index + 1}. ${slide.title}`), element('p', slide.content))
        return detail
      })
      const viewing = element('div', undefined, 'outline-viewing')
      viewing.append(button('Mở chi tiết', () => { for (const slide of slides) slide.open = true }),
        button('Thu gọn', () => { for (const slide of slides) slide.open = false }))
      const actions = element('div', undefined, 'outline-actions')
      const buttons = [button('①  Xác nhận outline và tạo slide', () => this.action?.('confirm', proposal)),
        button('②  Hủy outline', () => this.action?.('cancel', proposal)),
        button('Yêu cầu sửa outline', () => this.revise?.())]
      actions.append(element('strong', 'Bạn muốn làm gì với outline này?'), ...buttons,
        element('p', 'Hoặc gõ thay đổi bạn muốn ở khung bên dưới. Chọn là gửi ngay; chữ chưa gửi vẫn ở lại khung nhập.'))
      node.append(element('h3', 'Đề xuất outline'), status, overview, viewing, ...slides)
      if (!this.dock) node.append(actions)
      card = { node, status, actions, buttons, proposal }
      this.cards.set(proposal.outlineId, card)
    }
    card.proposal = proposal
    const label = proposal.status === 'confirmed' ? 'Đã xác nhận · chỉ đọc' : proposal.status === 'current'
      ? 'Hiện tại · Chưa có slide nào được tạo cho đến khi bạn xác nhận.' : proposal.status === 'cancelled' ? 'Đã hủy' : 'Đề xuất cũ · không còn là hiện tại'
    if (card.status.textContent !== label) card.status.textContent = label
    card.node.dataset.status = proposal.status
    card.actions.hidden = proposal.status !== 'current'
    if (proposal.status === 'current' && this.dock && card.actions.parentElement !== this.dock) this.dock.replaceChildren(card.actions)
    for (const control of card.buttons) control.disabled = this.busy || proposal.status !== 'current' || !this.action
    return card.node
  }
}
