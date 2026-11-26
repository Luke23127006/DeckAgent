import type { AttachmentView, ChatDraft } from '@deckagent/host-contracts'
import { button, element } from './dom.ts'
import { ManagementError } from './transport/index.ts'
import type { ManagementClient } from './transport/index.ts'

export interface DraftSyncOptions {
  readonly management: ManagementClient
  readonly input: HTMLTextAreaElement
  readonly status: HTMLElement
  readonly currentSessionId: () => string | undefined
  readonly changed: () => void
  readonly refresh: () => Promise<void>
}

/**
 * The Host keeps the draft of each chat (FR-038): a reload and every open interface see the same draft. `drafts`
 * mirrors what this page last read or typed; it is not a second store.
 */
export class DraftSync {
  private readonly drafts = new Map<string, string>()
  private readonly draftStates = new Map<string, ChatDraft>()
  private readonly draftWork = new Map<string, Promise<void>>()
  private readonly pendingDrafts = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly attachmentBusy = new Set<string>()
  private readonly onFocus = () => this.syncFocusedDraft()
  private attachmentTimer: ReturnType<typeof setInterval> | undefined
  private previewDialog: HTMLDialogElement | undefined
  private previewUrl: string | undefined
  private checkingAttachments = false
  private disposed = false

  constructor(private readonly options: DraftSyncOptions) {
    this.attachmentTimer = setInterval(() => this.checkAttachments(), 500)
    window.addEventListener('focus', this.onFocus)
  }
  readonly getDraftState = (id: string): ChatDraft | undefined => this.draftStates.get(id)
  readonly isAttachmentBusy = (id: string): boolean => this.attachmentBusy.has(id)
  readonly hasDraftText = (id: string): boolean => !!this.drafts.get(id)?.trim()
  readonly clearMirror = (id: string): void => {
    this.drafts.set(id, '')
  }
  enqueueDraft<T>(id: string, action: () => Promise<T>): Promise<T> {
    const work = (this.draftWork.get(id) ?? Promise.resolve()).then(action)
    this.draftWork.set(
      id,
      work.then(
        () => {},
        () => {},
      ),
    )
    return work
  }
  receiveDraft(draft: ChatDraft, acknowledgedText = false): void {
    const before = this.draftStates.get(draft.sessionId)
    if (before?.revision !== undefined && draft.revision !== undefined && draft.revision < before.revision) return
    if (!acknowledgedText && before && draft.text !== before.text && draft.text !== this.drafts.get(draft.sessionId)) {
      // Polling must not acquire a newer revision while silently retaining older text in the editor.
      this.options.status.hidden = false
      this.options.status.dataset.kind = 'error'
      this.options.status.textContent =
        'Bản nháp đã đổi ở giao diện khác. Giữ nội dung đang soạn và mở lại chat để đối chiếu trước khi lưu hoặc gửi.'
      return
    }
    const attachments = draft.attachments?.map(item => {
      const known = before?.attachments?.find(previous => previous.attachmentId === item.attachmentId)
      return known && known.state !== 'preparing' && item.state === 'preparing' ? known : item
    })
    this.draftStates.set(draft.sessionId, { ...draft, ...(attachments ? { attachments } : {}) })
    if (this.options.currentSessionId() === draft.sessionId) this.options.changed()
  }
  saveDraft(): void {
    const id = this.options.currentSessionId()
    if (!id) return
    this.drafts.set(id, this.options.input.value)
    clearTimeout(this.pendingDrafts.get(id))
    this.pendingDrafts.set(
      id,
      setTimeout(() => {
        void this.flushDraft(id)
      }, 250),
    )
  }
  async flushDraft(id: string): Promise<boolean> {
    const timer = this.pendingDrafts.get(id)
    if (timer === undefined) {
      await this.draftWork.get(id)
      return true
    }
    clearTimeout(timer)
    this.pendingDrafts.delete(id)
    try {
      const text = this.drafts.get(id) ?? ''
      await this.enqueueDraft(id, async () => {
        const revision = this.draftStates.get(id)?.revision
        if (revision === undefined) throw new ManagementError('DRAFT_CONFLICT')
        const draft = await this.options.management.saveDraftState(id, text, revision)
        this.receiveDraft(draft, true)
      })
      return true
    } catch {
      this.options.status.hidden = false
      this.options.status.dataset.kind = 'error'
      this.options.status.textContent =
        'Chưa lưu được bản nháp vào DeckAgent. Kiểm tra kết nối; nội dung vẫn còn trong ô soạn thảo.'
      return false
    }
  }
  async readDraft(id: string): Promise<string> {
    if (!(await this.flushDraft(id))) throw new Error('DRAFT_NOT_SAVED')
    const draft = await this.options.management.draftState(id)
    this.receiveDraft(draft, true)
    const text = draft.text
    this.drafts.set(id, text)
    return text
  }
  async uploadAttachments(files: File[]): Promise<void> {
    const id = this.options.currentSessionId()
    if (!id || this.attachmentBusy.has(id)) return
    this.attachmentBusy.add(id)
    this.options.changed()
    try {
      if (!(await this.flushDraft(id))) return
      for (const file of files)
        await this.enqueueDraft(id, async () => {
          const draft = this.draftStates.get(id)
          if (draft?.revision === undefined) throw new Error('DRAFT_CONFLICT')
          const uploaded = await this.options.management.uploadAttachment(id, file, draft.revision)
          this.receiveDraft(uploaded.draft)
        })
      await this.options.refresh()
    } catch (error) {
      this.receiveDraft(await this.options.management.draftState(id))
      throw error
    } finally {
      this.attachmentBusy.delete(id)
      this.options.changed()
    }
  }
  async removeAttachment(attachmentId: string): Promise<void> {
    const id = this.options.currentSessionId()
    if (!id || this.attachmentBusy.has(id)) return
    this.attachmentBusy.add(id)
    this.options.changed()
    try {
      if (!(await this.flushDraft(id))) return
      await this.enqueueDraft(id, async () => {
        const draft = this.draftStates.get(id)
        if (draft?.revision === undefined) throw new Error('DRAFT_CONFLICT')
        this.receiveDraft(await this.options.management.removeAttachment(id, attachmentId, draft.revision))
      })
      await this.options.refresh()
    } finally {
      this.attachmentBusy.delete(id)
      this.options.changed()
    }
  }
  closePreview(): void {
    this.previewDialog?.remove()
    this.previewDialog = undefined
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
    this.previewUrl = undefined
  }
  async previewAttachment(item: AttachmentView): Promise<void> {
    const id = this.options.currentSessionId()
    if (!id) return
    const preview = await this.options.management.previewAttachment(id, item.attachmentId)
    if (this.options.currentSessionId() !== id) return
    this.closePreview()
    const dialog = element('dialog', undefined, 'attachment-preview')
    dialog.append(
      element('h2', item.name),
      element('p', 'Bản xem trước có giới hạn; phần chưa đọc hoặc đã thu nhỏ được báo trong trạng thái tệp.'),
    )
    if (typeof preview === 'string') dialog.append(element('pre', preview))
    else {
      this.previewUrl = URL.createObjectURL(preview)
      const image = element('img')
      image.src = this.previewUrl
      image.alt = item.name
      dialog.append(image)
    }
    dialog.append(
      button('Đóng xem trước', () => {
        dialog.close()
        this.closePreview()
      }),
    )
    dialog.addEventListener('close', () => this.closePreview(), { once: true })
    document.body.append(dialog)
    this.previewDialog = dialog
    dialog.showModal()
  }
  private checkAttachments(): void {
    const id = this.options.currentSessionId()
    if (
      !id ||
      this.disposed ||
      this.checkingAttachments ||
      this.attachmentBusy.has(id) ||
      this.pendingDrafts.has(id) ||
      !this.draftStates.get(id)?.attachments?.some(item => item.state === 'preparing')
    )
      return
    this.checkingAttachments = true
    void this.options.management
      .draftState(id)
      .then(
        draft => this.receiveDraft(draft),
        () => {},
      )
      .finally(() => {
        this.checkingAttachments = false
      })
  }
  private syncFocusedDraft(): void {
    const id = this.options.currentSessionId()
    if (!id || this.pendingDrafts.has(id) || document.activeElement === this.options.input) return
    this.options.management.draftState(id).then(
      draft => {
        const text = draft.text
        if (this.options.currentSessionId() !== id || this.pendingDrafts.has(id)) return
        this.receiveDraft(draft, true)
        if (this.options.input.value === text) return
        this.drafts.set(id, text)
        this.options.input.value = text
        this.options.changed()
      },
      () => {
        /* The draft on screen stays; the next save reports a lost connection. */
      },
    )
  }

  dispose(): void {
    this.disposed = true
    clearInterval(this.attachmentTimer)
    window.removeEventListener('focus', this.onFocus)
    this.closePreview()
  }
}

export const createDraftSync = (options: DraftSyncOptions): DraftSync => new DraftSync(options)
