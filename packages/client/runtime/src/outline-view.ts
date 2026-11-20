import type { OutlineProposal } from '@deckagent/deck'
import { button, element } from './dom.ts'
import { briefDetails, briefFieldLabel, sourceReferences } from './brief-view.ts'

export type OutlineAction = (type: 'confirm' | 'cancel', proposal: OutlineProposal) => void

/** Stable cards preserve reading expansion/focus. All content is text, never model-authored DOM. */
export class OutlineView {
  private readonly cards = new Map<
    string,
    {
      node: HTMLElement
      status: HTMLElement
      actions: HTMLElement
      buttons: readonly HTMLButtonElement[]
      proposal: OutlineProposal
    }
  >()
  private busy = false

  constructor(
    private readonly action?: OutlineAction,
    private readonly revise?: () => void,
    private readonly dock?: HTMLElement,
  ) {}

  reset(): void {
    this.cards.clear()
  }

  setBusy(busy: boolean): void {
    this.busy = busy
    for (const card of this.cards.values())
      for (const control of card.buttons) control.disabled = busy || card.proposal.status !== 'current' || !this.action
  }

  render(proposal: OutlineProposal): HTMLElement {
    let card = this.cards.get(proposal.outlineId)
    if (!card) {
      const node = element('section', undefined, 'outline-proposal')
      node.id = `outline-${proposal.outlineId}`
      node.dataset.outlineId = proposal.outlineId
      node.setAttribute('aria-label', 'Outline đề xuất')
      const status = element('p', '', 'outline-status')
      const overview = element('p', proposal.overview, 'outline-overview')
      const slides = proposal.slides.map((slide, index) => {
        const detail = element('details', undefined, 'planned-slide')
        const content = element('div')
        content.setAttribute('aria-label', 'Nội dung dự kiến')
        const blockText = (slide.blocks ?? []).flatMap(block =>
          'text' in block
            ? [block.text]
            : block.kind === 'bullets'
              ? [...block.items]
              : block.kind === 'columns'
                ? block.columns.flatMap(column => [...column.bullets])
                : block.kind === 'metrics'
                  ? block.items.map(item => `${item.value}: ${item.label}`)
                  : [block.caption ?? ''],
        )
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
        if (
          !blockText.length ||
          ![...blockText, blockText.join('\n')].some(text => normalize(text) === normalize(slide.content))
        )
          content.append(element('p', slide.content))
        for (const block of slide.blocks ?? []) {
          if ('text' in block) content.append(element('p', block.text))
          else if (block.kind === 'bullets') {
            const list = element('ul')
            for (const item of block.items) list.append(element('li', item))
            content.append(list)
          } else if (block.kind === 'columns')
            for (const column of block.columns) {
              const list = element('ul')
              for (const item of column.bullets) list.append(element('li', item))
              content.append(list)
            }
          else if (block.kind === 'metrics')
            for (const item of block.items) content.append(element('p', `${item.value}: ${item.label}`))
          else if (block.kind === 'image')
            content.append(element('p', `Ảnh đính kèm${block.caption ? `: ${block.caption}` : ''}`))
        }
        detail.append(element('summary', `${index + 1}. ${slide.title}`), content)
        if (slide.sources?.length) detail.append(sourceReferences(slide.sources))
        return detail
      })
      const viewing = element('div', undefined, 'outline-viewing')
      viewing.append(
        button('Mở chi tiết', () => {
          for (const slide of slides) slide.open = true
        }),
        button('Thu gọn', () => {
          for (const slide of slides) slide.open = false
        }),
      )
      const actions = element('div', undefined, 'outline-actions')
      const buttons = [
        button('Xác nhận outline và tạo slide', () => this.action?.('confirm', proposal)),
        button('Yêu cầu sửa outline', () => this.revise?.()),
        button('Xem Outline đang xác nhận', () => {
          node.scrollIntoView({ block: 'center' })
          node.tabIndex = -1
          node.focus({ preventScroll: true })
        }),
        ...(!proposal.brief ? [button('Hủy outline', () => this.action?.('cancel', proposal))] : []),
      ]
      actions.append(
        element(
          'strong',
          `Outline v${proposal.version} · ${proposal.slides.length} slide${proposal.brief ? ` · Brief v${proposal.brief.version}` : ''}`,
        ),
        element('p', 'Chưa có slide nào được tạo cho đến khi bạn xác nhận.'),
        ...buttons,
        element('p', 'Hoặc gõ thay đổi bạn muốn vào khung bên dưới.'),
      )
      node.append(element('h3', 'Đề xuất outline'), status, overview, viewing, ...slides)
      if (proposal.brief) {
        node.append(element('p', `${proposal.slides.length} slide · Brief v${proposal.brief.version}`))
        for (const item of proposal.revisionSuggestions ?? []) node.append(element('p', `Gợi ý sửa: ${item}`))
        const changes = proposal.changes
        if (changes)
          node.append(
            element(
              'p',
              `Thay đổi: ${changes.added.length} slide mới, ${changes.removed.length} slide bỏ, ${changes.changed.length} slide sửa. ${changes.orderChanged ? 'Đổi thứ tự.' : ''} Brief: ${changes.briefFields.map(briefFieldLabel).join(', ') || 'giữ nguyên'}.`,
            ),
          )
        if (changes) {
          const diff = element('details')
          diff.append(element('summary', 'Toàn bộ thay đổi của đề xuất'))
          for (const [label, ids] of [
            ['Thêm', changes.added],
            ['Bỏ', changes.removed],
            ['Sửa', changes.changed],
          ] as const)
            for (const id of ids)
              diff.append(element('p', `${label}: ${proposal.slides.find(s => s.slideId === id)?.title ?? id}`))
          diff.append(
            element(
              'p',
              `Tổng quan: ${changes.overviewChanged ? 'đã đổi' : 'giữ nguyên'} · Gợi ý sửa: ${changes.suggestionsChanged ? 'đã đổi' : 'giữ nguyên'}`,
            ),
          )
          node.append(diff)
        }
        node.append(briefDetails(proposal.brief))
      }
      if (!this.dock) node.append(actions)
      card = { node, status, actions, buttons, proposal }
      this.cards.set(proposal.outlineId, card)
    }
    card.proposal = proposal
    const label =
      proposal.status === 'confirmed'
        ? 'Đã xác nhận · chỉ đọc'
        : proposal.status === 'current'
          ? 'Hiện tại · chờ bạn xác nhận'
          : proposal.status === 'cancelled'
            ? 'Đã hủy'
            : 'Đề xuất cũ · không còn là hiện tại'
    if (card.status.textContent !== label) card.status.textContent = label
    card.node.dataset.status = proposal.status
    card.actions.hidden = proposal.status !== 'current'
    if (proposal.status === 'current' && this.dock && card.actions.parentElement !== this.dock) {
      this.dock.replaceChildren(card.actions)
      this.dock.dataset.outlineId = proposal.outlineId
    }
    for (const control of card.buttons) control.disabled = this.busy || proposal.status !== 'current' || !this.action
    return card.node
  }
}
