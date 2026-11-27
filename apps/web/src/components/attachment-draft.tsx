import type { AttachmentView, ChatDraft } from '@deckagent/host-contracts'
import { useEffect, useEffectEvent, useRef } from 'react'
import { attachmentText } from '../text.ts'

function stateText(item: AttachmentView): string {
  if (item.state === 'preparing') return attachmentText.preparing
  if (item.state === 'rejected') return attachmentText.reasons[item.rejectionCode ?? ''] ?? attachmentText.unusable
  return item.preparation?.completeness === 'partial' ? attachmentText.partial : attachmentText.ready
}

/** The files of the draft. Only metadata shows; a file name enters a text node, never HTML. */
export function AttachmentDraft(props: {
  readonly draft: ChatDraft | undefined
  readonly busy: boolean
  readonly onPreview: (item: AttachmentView) => void
  readonly onRemove: (attachmentId: string) => void
}) {
  const items = props.draft?.attachments ?? []
  return (
    <section
      className="attachment-draft"
      aria-label={attachmentText.draftFiles}
      aria-live="polite"
      hidden={items.length === 0 && !props.busy}
    >
      {items.map(item => (
        <div key={item.attachmentId} className="attachment-row" data-attachment-id={item.attachmentId} data-state={item.state}>
          <span className="attachment-name">{item.name}</span>
          <small>{stateText(item)}</small>
          {item.preparation?.completeness === 'partial' && <small>{attachmentText.partialNote}</small>}
          <button type="button" disabled={item.state !== 'ready'} onClick={() => props.onPreview(item)}>
            {attachmentText.preview}
          </button>
          <button type="button" disabled={props.busy} onClick={() => props.onRemove(item.attachmentId)}>
            {attachmentText.remove}
          </button>
        </div>
      ))}
      {props.busy && <p>{attachmentText.saving}</p>}
    </section>
  )
}

/** The hidden file input of the composer. A native listener also gets a `change` event that a script sends. */
export function AttachmentPicker(props: { readonly onFiles: (files: readonly File[]) => void; readonly id: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const onFiles = useEffectEvent(props.onFiles)
  useEffect(() => {
    const input = ref.current
    if (!input) return
    const onChange = () => {
      const files = Array.from(input.files ?? [])
      input.value = ''
      if (files.length) onFiles(files)
    }
    input.addEventListener('change', onChange)
    return () => input.removeEventListener('change', onChange)
  }, [])
  return (
    <input
      ref={ref}
      id={props.id}
      type="file"
      accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.pptx,.zip"
      multiple
      hidden
      aria-label={attachmentText.picker}
    />
  )
}

/** The limited preview of one file in a modal dialog. */
export function AttachmentPreviewDialog(props: {
  readonly preview: { readonly name: string; readonly text?: string; readonly imageUrl?: string }
  readonly onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useEffectEvent(props.onClose)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onClose = () => close()
    dialog.addEventListener('close', onClose)
    if (!dialog.open) dialog.showModal()
    return () => dialog.removeEventListener('close', onClose)
  }, [])
  const { preview } = props
  return (
    <dialog ref={ref} className="attachment-preview">
      <h2>{preview.name}</h2>
      <p>{attachmentText.previewNote}</p>
      {preview.text !== undefined && <pre>{preview.text}</pre>}
      {preview.imageUrl !== undefined && <img src={preview.imageUrl} alt={preview.name} />}
      <button type="button" onClick={() => ref.current?.close()}>
        {attachmentText.closePreview}
      </button>
    </dialog>
  )
}
