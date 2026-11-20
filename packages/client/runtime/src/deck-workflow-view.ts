import type { DeckRequest } from '@deckagent/host-api'
import type { OutlineProposal } from '@deckagent/deck'
import type { BriefClient } from './brief-client.ts'
import { button, element } from './dom.ts'
import { briefDetails } from './brief-view.ts'

/** Collects explicit user choices; only Host snapshots determine versions and locks. */
export class DeckWorkflowView {
  readonly node = element('section', undefined, 'deck-workflow')
  private sessionId = ''
  private state: Awaited<ReturnType<BriefClient['interview']>> | undefined
  private active = false
  private busy = false
  private current: OutlineProposal | undefined
  private readonly mode = element('select')
  private readonly material = element('input')
  private readonly knowledge = element('input')
  private readonly research = element('input')
  private readonly images = element('select')
  private readonly format = element('select')
  private readonly action = element('select')
  private readonly questions = element('div')
  private readonly blockers = element('div')
  private readonly summary = element('details')
  private readonly skip: HTMLButtonElement
  private researchAvailable = false
  private rendered = ''

  constructor(
    private readonly client: BriefClient,
    private readonly choose: (text: string) => void,
    skip: () => void,
    private readonly changed: () => void = () => {},
  ) {
    this.node.setAttribute('aria-label', 'Chuẩn bị deck')
    this.questions.setAttribute('aria-label', 'Câu hỏi cần bổ sung')
    this.blockers.setAttribute('aria-label', 'Thông tin cần xử lý')
    this.mode.setAttribute('aria-label', 'Chế độ hội thoại')
    this.mode.append(new Option('Chat thông thường', 'chat'), new Option('Tạo deck', 'deck'))
    this.mode.onchange = () => {
      this.active = this.mode.value === 'deck'
      this.render()
      this.changed()
    }
    this.node.append(this.mode)
    for (const [input, label] of [
      [this.material, 'Dùng tài liệu của chat'],
      [this.knowledge, 'Dùng kiến thức chung của mô hình'],
      [this.research, 'Tìm nguồn công khai (chỉ miễn phí)'],
    ] as const) {
      input.type = 'checkbox'
      const row = element('label', label)
      row.prepend(input)
      this.node.append(row)
      if (input === this.research)
        row.title = 'Truy vấn được gửi tới Tavily và có thể chứa thông tin từ tài liệu; chỉ dùng quota miễn phí.'
    }
    this.images.setAttribute('aria-label', 'Lựa chọn ảnh')
    this.images.append(
      new Option('Giữ yêu cầu ảnh hiện tại', ''),
      new Option('Không cần ảnh', 'none'),
      new Option('Dùng ảnh đã đính kèm', 'attachments'),
    )
    this.format.setAttribute('aria-label', 'Định dạng deck')
    this.format.append(
      new Option('Giữ yêu cầu định dạng hiện tại', ''),
      new Option('HTML · HTML Basic · DeckAgent Neutral', 'html'),
    )
    this.action.setAttribute('aria-label', 'Loại yêu cầu Outline')
    this.action.append(
      new Option('Trả lời / yêu cầu sửa Outline', 'revise'),
      new Option('Chỉ hỏi về Outline', 'question'),
      new Option('Làm rõ yêu cầu', 'clarify'),
    )
    this.action.onchange = () => this.changed()
    this.skip = button('Bỏ qua câu hỏi còn lại', skip)
    this.node.append(this.format, this.images, this.action, this.questions, this.blockers, this.skip, this.summary)
    this.render()
  }

  async open(id: string): Promise<void> {
    this.sessionId = id
    this.state = undefined
    this.current = undefined
    this.active = false
    this.rendered = ''
    this.material.checked = this.knowledge.checked = this.research.checked = false
    this.images.value = this.format.value = ''
    this.action.value = 'revise'
    await this.refresh(id)
  }

  async refresh(id: string): Promise<void> {
    const next = await this.client.interview(id)
    if (this.sessionId !== id) return
    const changed = this.state?.brief.version !== next.brief.version
    if (!this.state) this.active = next.brief.version > 0
    this.state = next
    if (changed && next.brief.current) {
      const sources = next.brief.current.draft.sources
      this.material.checked = sources.material
      this.knowledge.checked = sources.modelKnowledge
      this.research.checked = sources.publicResearch
    }
    this.render()
  }

  update(proposal: OutlineProposal | undefined, busy: boolean): void {
    this.current = proposal
    this.busy = busy
    this.render()
  }

  get preparingDeck(): boolean {
    return this.active && !this.state?.brief.locked
  }

  get inputHint(): string {
    if (!this.preparingDeck) return 'Nhập tin nhắn của bạn…'
    if (!this.current) return 'Mô tả deck hoặc trả lời các câu hỏi ở trên…'
    if (this.action.value === 'question') return 'Nhập câu hỏi về Outline; nội dung sẽ được giữ nguyên…'
    if (this.action.value === 'clarify') return 'Làm rõ yêu cầu trước khi sửa Outline…'
    return 'Mô tả thay đổi bạn muốn cho Outline hiện tại…'
  }

  setResearchAvailable(available: boolean): void {
    if (this.researchAvailable === available) return
    this.researchAvailable = available
    this.render()
  }

  requestRevision(): void {
    this.active = true
    this.action.value = 'revise'
    this.render()
    this.changed()
  }

  command(skip = false): DeckRequest | undefined {
    if (!this.active || this.state?.brief.locked) return undefined
    if (!this.state) throw new Error('BRIEF_UNAVAILABLE')
    const action = this.current
      ? this.action.value === 'question'
        ? 'question'
        : this.action.value === 'clarify'
          ? 'clarify'
          : 'revise'
      : 'collect'
    return {
      action: skip ? 'skip' : action,
      expectedBriefVersion: this.state.brief.version,
      expectedOutline: this.current ? { outlineId: this.current.outlineId, version: this.current.version } : null,
      sourceChoice: {
        material: this.material.checked,
        modelKnowledge: this.knowledge.checked,
        publicResearch: this.research.checked,
      },
      ...(this.format.value === 'html' ? { formatChoice: 'html' } : {}),
      ...(this.images.value === 'none' || this.images.value === 'attachments'
        ? { imageChoice: this.images.value }
        : {}),
    }
  }

  private render(): void {
    this.mode.value = this.active ? 'deck' : 'chat'
    const locked = !!this.state?.brief.locked
    for (const control of this.node.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
      'input,select,button',
    ))
      control.disabled = this.busy || locked || !this.state
    this.mode.disabled = this.busy || !this.state
    this.research.disabled ||= !this.researchAvailable && !this.research.checked
    for (const child of this.node.children)
      if (child instanceof HTMLElement && child !== this.mode) child.hidden = !this.active
    if (locked)
      for (const child of this.node.children)
        if (child instanceof HTMLElement && child !== this.mode && child !== this.summary) child.hidden = true
    this.action.hidden = !this.active || !this.current || locked
    this.skip.hidden = !this.active || !!this.current || locked
    this.questions.hidden = !this.active || !!this.current || locked
    this.blockers.hidden = !this.active || locked || !this.state?.state.blockers.length
    const key = JSON.stringify([
      this.sessionId,
      this.state?.brief.version,
      this.current?.outlineId,
      this.active,
      locked,
      this.state?.state,
    ])
    if (this.rendered === key) return
    this.rendered = key
    this.questions.replaceChildren()
    this.blockers.replaceChildren()
    if (this.active && this.state && !locked) {
      for (const q of this.state.state.questions) {
        const row = element('div')
        row.append(element('p', q.prompt))
        for (const suggestion of q.suggestions) {
          const choice = button(suggestion, () => this.choose(suggestion))
          choice.disabled = this.busy
          row.append(choice)
        }
        this.questions.append(row)
      }
      for (const blocker of this.state.state.blockers) this.blockers.append(element('p', blocker.message))
    }
    this.summary.replaceChildren(
      element('summary', locked ? 'Brief đã khóa cho deck này' : 'Brief hiện tại và giả định'),
    )
    const brief = this.state?.brief.current
    if (brief) {
      const detail = briefDetails(
        brief,
        locked ? 'Brief đã khóa cho deck này' : `Brief hiện tại · v${brief.version} và giả định`,
      )
      this.summary.replaceChildren(...detail.childNodes)
    }
  }
}
