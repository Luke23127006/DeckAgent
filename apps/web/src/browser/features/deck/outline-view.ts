import type { BriefRecord, OutlineProposal } from '@deckagent/host-contracts'
import { button, element } from '../../dom.ts'
import { briefDetails, briefFieldLabel, sourceReferences } from './brief-view.ts'
import { renderImageReviewFigure } from './outline-image-review.ts'
import type { ImagePreview } from './outline-image-review.ts'

export type OutlineAction = (type: 'confirm' | 'cancel', proposal: OutlineProposal) => void

interface OutlineCard {
  readonly node: HTMLElement
  readonly status: HTMLElement
  readonly blockers: HTMLElement
  readonly actions: HTMLElement
  readonly buttons: readonly HTMLButtonElement[]
  proposal: OutlineProposal
}

interface CardContext {
  readonly action: OutlineAction | undefined
  readonly revise: ((text?: string) => void) | undefined
  readonly dock: HTMLElement | undefined
  readonly imagePreview: ImagePreview | undefined
  readonly currentEpoch: () => number
  readonly imageUrls: Set<string>
}

function layoutIssues(proposal: OutlineProposal) {
  return proposal.layoutIssues ?? []
}

function confirmationBlocked(proposal: OutlineProposal): boolean {
  return layoutIssues(proposal).length > 0 || !!proposal.imageReview?.some(n => n.required && n.status !== 'prepared')
}

interface SlideRender {
  readonly slide: OutlineProposal['slides'][number]
  readonly slideIndex: number
  readonly proposal: OutlineProposal
  readonly detail: HTMLDetailsElement
  readonly context: CardContext
  readonly imageButtons: HTMLButtonElement[]
}

type WebImageBlock = Extract<
  NonNullable<OutlineProposal['slides'][number]['blocks']>[number],
  { readonly kind: 'web-image' }
>

function renderWebImageBlock(render: SlideRender, block: WebImageBlock, blockIndex: number): HTMLElement[] {
  const { slide, slideIndex, proposal, detail, context, imageButtons } = render
  const nodes: HTMLElement[] = [
    element('p', `Ảnh web: ${block.query}${block.required === false ? ' (tùy chọn)' : ' (cần có)'}`),
  ]
  const review = proposal.imageReview?.find(n => n.slideIndex === slideIndex && n.blockIndex === blockIndex)
  if (!review) return nodes
  const { figure, replaceButton } = renderImageReviewFigure({
    review,
    block,
    detail,
    slideIndex,
    blockIndex,
    slideTitle: slide.title,
    context: {
      outlineId: proposal.outlineId,
      sessionId: proposal.brief?.sessionId,
      preview: context.imagePreview,
      currentEpoch: context.currentEpoch,
      imageUrls: context.imageUrls,
      revise: text => context.revise?.(text),
    },
  })
  imageButtons.push(replaceButton)
  nodes.push(figure)
  return nodes
}

function renderSlideBlocks(render: SlideRender): HTMLElement {
  const { slide } = render
  const content = element('div')
  content.setAttribute('aria-label', 'Nội dung dự kiến')
  const blocks = slide.blocks ?? []
  const blockText = blocks.flatMap(block =>
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
  for (const [blockIndex, block] of blocks.entries()) {
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
    else content.append(...renderWebImageBlock(render, block, blockIndex))
  }
  return content
}

function renderPlannedSlide(
  slide: OutlineProposal['slides'][number],
  index: number,
  proposal: OutlineProposal,
  context: CardContext,
  imageButtons: HTMLButtonElement[],
): HTMLDetailsElement {
  const detail = element('details', undefined, 'planned-slide')
  const render: SlideRender = { slide, slideIndex: index, proposal, detail, context, imageButtons }
  detail.append(element('summary', `${index + 1}. ${slide.title}`), renderSlideBlocks(render))
  if (slide.sources?.length) detail.append(sourceReferences(slide.sources))
  return detail
}

function renderProposalChanges(proposal: OutlineProposal, brief: BriefRecord): HTMLElement[] {
  const nodes: HTMLElement[] = [element('p', `${proposal.slides.length} slide · Brief v${brief.version}`)]
  for (const item of proposal.revisionSuggestions ?? []) nodes.push(element('p', `Gợi ý sửa: ${item}`))
  const changes = proposal.changes
  if (changes) {
    nodes.push(
      element(
        'p',
        `Thay đổi: ${changes.added.length} slide mới, ${changes.removed.length} slide bỏ, ${changes.changed.length} slide sửa. ${changes.orderChanged ? 'Đổi thứ tự.' : ''} Brief: ${changes.briefFields.map(briefFieldLabel).join(', ') || 'giữ nguyên'}.`,
      ),
    )
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
    nodes.push(diff)
  }
  nodes.push(briefDetails(brief))
  return nodes
}

function buildProposalCard(proposal: OutlineProposal, context: CardContext): OutlineCard {
  const node = element('section', undefined, 'outline-proposal')
  node.id = `outline-${proposal.outlineId}`
  node.dataset.outlineId = proposal.outlineId
  node.setAttribute('aria-label', 'Outline đề xuất')
  const status = element('p', '', 'outline-status')
  const blockers = element('div', undefined, 'outline-layout-blockers')
  blockers.setAttribute('role', 'status')
  const overview = element('p', proposal.overview, 'outline-overview')
  const imageButtons: HTMLButtonElement[] = []
  const slides = proposal.slides.map((slide, index) =>
    renderPlannedSlide(slide, index, proposal, context, imageButtons),
  )
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
    button('Xác nhận outline và tạo slide', () => context.action?.('confirm', proposal)),
    button('Yêu cầu sửa outline', () => context.revise?.()),
    button('Xem Outline đang xác nhận', () => {
      node.scrollIntoView({ block: 'center' })
      node.tabIndex = -1
      node.focus({ preventScroll: true })
    }),
    ...(!proposal.brief ? [button('Hủy outline', () => context.action?.('cancel', proposal))] : []),
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
  node.append(element('h3', 'Đề xuất outline'), status, blockers, overview, viewing, ...slides)
  if (proposal.brief) node.append(...renderProposalChanges(proposal, proposal.brief))
  if (!context.dock) node.append(actions)
  return { node, status, blockers, actions, buttons, proposal }
}

function updateCardState(card: OutlineCard, proposal: OutlineProposal, busy: boolean, context: CardContext): void {
  const issues = layoutIssues(proposal)
  card.blockers.replaceChildren(
    ...issues.map(issue => {
      const field = issue.path.endsWith('.title')
        ? 'Tiêu đề'
        : issue.path.endsWith('.caption')
          ? 'Chú thích ảnh'
          : 'Nội dung'
      return element(
        'p',
        issue.actual !== undefined && issue.limit !== undefined
          ? `Slide ${issue.slideIndex + 1} · ${field}: ${issue.actual} ký tự, tối đa ${issue.limit}. Yêu cầu sửa outline để diễn đạt gọn hơn và giữ ý chính.`
          : `Slide ${issue.slideIndex + 1} · Nội dung chưa phù hợp bố cục. Yêu cầu sửa outline để sắp xếp lại nội dung và giữ các yêu cầu đã chọn.`,
      )
    }),
  )
  card.blockers.hidden = issues.length === 0
  const label =
    proposal.status === 'confirmed'
      ? 'Đã xác nhận · chỉ đọc'
      : proposal.status === 'current'
        ? issues.length
          ? 'Chưa thể xác nhận · cần sửa nội dung cho phù hợp bố cục'
          : proposal.imageReview?.some(n => n.required && n.status !== 'prepared')
            ? `Chưa thể xác nhận · còn ${proposal.imageReview.filter(n => n.required && n.status !== 'prepared').length} ảnh bắt buộc chưa chuẩn bị`
            : 'Hiện tại · chờ bạn xác nhận'
        : proposal.status === 'cancelled'
          ? 'Đã hủy'
          : 'Đề xuất cũ · không còn là hiện tại'
  if (card.status.textContent !== label) card.status.textContent = label
  card.node.dataset.status = proposal.status
  card.actions.hidden = proposal.status !== 'current'
  if (proposal.status === 'current' && context.dock && card.actions.parentElement !== context.dock) {
    context.dock.replaceChildren(card.actions)
    context.dock.dataset.outlineId = proposal.outlineId
  }
  for (const [index, control] of card.buttons.entries())
    control.disabled =
      busy || proposal.status !== 'current' || !context.action || (index === 0 && confirmationBlocked(proposal))
}

/** Stable cards preserve reading expansion/focus. All content is text, never model-authored DOM. */
export class OutlineView {
  private readonly cards = new Map<string, OutlineCard>()
  private busy = false
  private epoch = 0
  private readonly imageUrls = new Set<string>()

  constructor(
    private readonly action?: OutlineAction,
    private readonly revise?: (text?: string) => void,
    private readonly dock?: HTMLElement,
    private readonly imagePreview?: ImagePreview,
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
          (index === 0 && confirmationBlocked(card.proposal))
  }

  render(proposal: OutlineProposal): HTMLElement {
    const context: CardContext = {
      action: this.action,
      revise: this.revise,
      dock: this.dock,
      imagePreview: this.imagePreview,
      currentEpoch: () => this.epoch,
      imageUrls: this.imageUrls,
    }
    let card = this.cards.get(proposal.outlineId)
    if (!card) {
      card = buildProposalCard(proposal, context)
      this.cards.set(proposal.outlineId, card)
    }
    card.proposal = proposal
    updateCardState(card, proposal, this.busy, context)
    return card.node
  }
}
