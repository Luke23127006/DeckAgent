import type { OutlineProposal } from '@deckagent/deck'
import { button, element } from './dom.ts'

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
      node.dataset.outlineId = proposal.outlineId
      node.setAttribute('aria-label', 'Outline đề xuất')
      const status = element('p', '', 'outline-status')
      const overview = element('p', proposal.overview, 'outline-overview')
      const slides = proposal.slides.map((slide, index) => {
        const detail = element('details', undefined, 'planned-slide')
        detail.append(element('summary', `${index + 1}. ${slide.title}`), element('p', slide.content))
        for (const block of slide.blocks ?? []) {
          if ('text' in block) detail.append(element('p', block.text))
          else if (block.kind === 'bullets') for (const item of block.items) detail.append(element('p', `• ${item}`))
          else if (block.kind === 'columns')
            for (const column of block.columns)
              for (const item of column.bullets) detail.append(element('p', `• ${item}`))
          else if (block.kind === 'metrics')
            for (const item of block.items) detail.append(element('p', `${item.value}: ${item.label}`))
          else if (block.kind === 'image')
            detail.append(element('p', `Ảnh đã chọn: ${block.attachmentId} ${block.caption ?? ''}`))
        }
        for (const source of slide.sources ?? [])
          detail.append(element('p', `Nguồn ${source.sourceId} · v${source.version}`))
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
        ...(!proposal.brief ? [button('Hủy outline', () => this.action?.('cancel', proposal))] : []),
      ]
      actions.append(
        element('strong', 'Bạn muốn làm gì với outline này?'),
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
              `Thay đổi: ${changes.added.length} slide mới, ${changes.removed.length} slide bỏ, ${changes.changed.length} slide sửa. ${changes.orderChanged ? 'Đổi thứ tự.' : ''} Brief: ${changes.briefFields.join(', ') || 'giữ nguyên'}.`,
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
        const record = element('details')
        record.append(element('summary', `Brief gắn với đề xuất v${proposal.brief.version}`))
        const draft = proposal.brief.draft
        for (const [key, value] of Object.entries(draft)) {
          if (typeof value === 'string' || typeof value === 'number') record.append(element('p', `${key}: ${value}`))
        }
        for (const requirement of draft.requirements) record.append(element('p', `Yêu cầu: ${requirement}`))
        for (const assumption of draft.assumptions) record.append(element('p', `Giả định: ${assumption}`))
        for (const answer of draft.answers) record.append(element('p', `${answer.topic}: ${answer.value}`))
        record.append(
          element(
            'p',
            `Nguồn: tài liệu ${draft.sources.material ? 'có' : 'không'}, kiến thức mô hình ${draft.sources.modelKnowledge ? 'có' : 'không'}, research ${draft.sources.publicResearch ? 'có' : 'không'}. Ảnh: ${draft.images.mode}.`,
          ),
        )
        for (const source of draft.sources.refs)
          record.append(element('p', `Nguồn ${source.sourceId} · v${source.version} · ${source.kind}`))
        if (proposal.brief.design) {
          record.append(
            element('p', `HTML · ${proposal.brief.design.template.id} · ${proposal.brief.design.designSystem.id}`),
          )
          for (const [role, value] of Object.entries(proposal.brief.design.theme))
            record.append(element('p', `${role}: ${value}`))
        }
        for (const need of draft.images.unmetRequirements) record.append(element('p', `Ảnh chưa đáp ứng: ${need}`))
        node.append(record)
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
    if (proposal.status === 'current' && this.dock && card.actions.parentElement !== this.dock)
      this.dock.replaceChildren(card.actions)
    for (const control of card.buttons) control.disabled = this.busy || proposal.status !== 'current' || !this.action
    return card.node
  }
}
