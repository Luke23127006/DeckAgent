import type { OutlineProposal } from '@deckagent/deck'
import { button, element } from './dom.ts'
import { briefDetails, briefFieldLabel, sourceReferences } from './brief-view.ts'
import { imageFailure } from './image-review-client.ts'

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
  private epoch = 0
  private readonly imageUrls = new Set<string>()

  constructor(
    private readonly action?: OutlineAction,
    private readonly revise?: (text?: string) => void,
    private readonly dock?: HTMLElement,
    private readonly imagePreview?: (sessionId: string, outlineId: string, needId: string) => Promise<Blob>,
  ) {}

  reset(): void {
    this.epoch++
    for (const url of this.imageUrls) URL.revokeObjectURL(url)
    this.imageUrls.clear()
    this.cards.clear()
  }

  setBusy(busy: boolean): void {
    this.busy = busy
    for (const card of this.cards.values())
      for (const [index, control] of card.buttons.entries())
        control.disabled =
          busy ||
          card.proposal.status !== 'current' ||
          !this.action ||
          (index === 0 && !!card.proposal.imageReview?.some(n => n.required && n.status !== 'prepared'))
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
      const imageButtons: HTMLButtonElement[] = []
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
        for (const [blockIndex, block] of (slide.blocks ?? []).entries()) {
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
          else if (block.kind === 'web-image') {
            content.append(
              element('p', `Ảnh web: ${block.query}${block.required === false ? ' (tùy chọn)' : ' (cần có)'}`),
            )
            const review = proposal.imageReview?.find(n => n.slideIndex === index && n.blockIndex === blockIndex)
            if (review) {
              const figure = element('figure', undefined, 'outline-image-review')
              if (review.status === 'prepared' && this.imagePreview && proposal.brief) {
                const image = element('img')
                image.alt = review.selection?.description || block.intent?.subject || block.query
                const epoch = this.epoch,
                  sessionId = proposal.brief.sessionId
                let loaded = false
                detail.addEventListener('toggle', () => {
                  if (!detail.open || loaded) return
                  loaded = true
                  void this.imagePreview!(sessionId, proposal.outlineId, review.needId)
                    .then(blob => {
                      if (epoch !== this.epoch) return
                      const url = URL.createObjectURL(blob)
                      this.imageUrls.add(url)
                      image.src = url
                    })
                    .catch(() => {
                      image.remove()
                      figure.append(element('p', 'Không đọc được ảnh đã lưu. Sửa Outline để chọn lại ảnh.'))
                    })
                })
                figure.append(image)
              }
              figure.append(
                element(
                  'figcaption',
                  review.status === 'prepared'
                    ? 'Ảnh đã chuẩn bị · cần bạn duyệt trước khi tạo slide'
                    : `${imageFailure(review.failure)}${review.required ? ' Cần có ảnh trước khi xác nhận.' : ' Slide sẽ bỏ phần ảnh này.'}`,
                ),
              )
              if (review.selection)
                figure.append(
                  element('p', `Lý do chọn: ${review.selection.reason}`),
                  element('p', 'Đánh giá dựa trên mô tả nguồn; chưa kiểm chứng trực quan bằng model.'),
                )
              if (review.credit) {
                const link = element('a', 'Xem trang nguồn')
                link.href = review.credit.url
                link.target = '_blank'
                link.rel = 'noopener noreferrer'
                figure.append(element('p', `${review.credit.author} · ${review.credit.license}`), link)
                if (review.credit.licenseUrl.startsWith('https://')) {
                  const license = element('a', 'Điều kiện sử dụng ảnh')
                  license.href = review.credit.licenseUrl
                  license.target = '_blank'
                  license.rel = 'noopener noreferrer'
                  figure.append(document.createTextNode(' · '), license)
                }
              }
              if (review.attempts?.length) {
                const audit = element('details')
                audit.append(element('summary', `Lịch sử kiểm tra ảnh (${review.attempts.length} lần)`))
                for (const attempt of review.attempts) {
                  audit.append(element('p', imageFailure(attempt.code)))
                  for (const check of attempt.checks)
                    audit.append(
                      element(
                        'p',
                        `${new URL(check.sourceUrl).hostname}: ${imageFailure(check.code)}${check.httpStatus ? ` (HTTP ${check.httpStatus})` : ''}`,
                      ),
                    )
                }
                figure.append(audit)
              }
              const replace = button('Tìm ảnh khác', () =>
                this.revise?.(
                  `Thay ảnh tại slide ${index + 1} “${slide.title}”, vị trí ảnh ${blockIndex + 1}. Giữ nội dung và các vị trí khác; đặt replace:true cho vị trí này và tìm ảnh khác phù hợp với vai trò.`,
                ),
              )
              imageButtons.push(replace)
              figure.append(replace)
              content.append(figure)
            }
          }
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
        ...imageButtons,
      ]
      actions.append(
        element(
          'strong',
          `Outline v${proposal.version} · ${proposal.slides.length} slide${proposal.brief ? ` · Brief v${proposal.brief.version}` : ''}`,
        ),
        element('p', 'Chưa có slide nào được tạo cho đến khi bạn xác nhận.'),
        ...buttons.filter(control => !imageButtons.includes(control)),
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
          ? proposal.imageReview?.some(n => n.required && n.status !== 'prepared')
              ? `Chưa thể xác nhận · còn ${proposal.imageReview.filter(n => n.required && n.status !== 'prepared').length} ảnh bắt buộc chưa chuẩn bị`
              : 'Hiện tại · chờ bạn xác nhận'
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
    for (const [index, control] of card.buttons.entries())
      control.disabled =
        this.busy ||
        proposal.status !== 'current' ||
        !this.action ||
        (index === 0 && !!proposal.imageReview?.some(n => n.required && n.status !== 'prepared'))
    return card.node
  }
}
