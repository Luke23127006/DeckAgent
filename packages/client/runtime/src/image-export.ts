import type { ImageAsset, InsertSlideImage } from '@deckagent/deck'
import type { DeckViewState } from './deck-model.ts'
import type { DeckClient } from './deck-client.ts'
import { button, element, field } from './dom.ts'

export function imageExport(client: DeckClient, changed: () => Promise<void>) {
  const node = element('section', undefined, 'image-export'),
    heading = element('summary', 'Ảnh và xuất PDF'),
    panel = element('details')
  const url = element('input')
  url.type = 'url'
  url.maxLength = 4096
  url.placeholder = 'https://…/image.png'
  const choose = element('select'),
    alt = element('input')
  alt.maxLength = 1000
  alt.placeholder = 'Mô tả ảnh'
  const source = element('small'),
    status = element('p')
  status.setAttribute('role', 'status')
  const add = button('Thêm ảnh từ URL', () => void acquire()),
    insert = button('Chèn vào slide đang chọn', () => void insertSelected()),
    download = button('Xuất PDF', () => void exportCurrent()),
    cancel = button('Hủy tác vụ ảnh/PDF', () => active?.abort())
  cancel.hidden = true
  panel.append(
    heading,
    field('URL ảnh PNG/JPEG', url),
    add,
    field('Ảnh trong Chat', choose),
    field('Mô tả ảnh', alt),
    source,
    insert,
    download,
    cancel,
    status,
  )
  node.append(panel)
  for (const label of panel.querySelectorAll('label')) {
    label.style.display = 'grid'
    label.style.marginBottom = '8px'
  }
  let current: DeckViewState | undefined,
    chat = '',
    epoch = 0,
    enabled = false,
    images: readonly ImageAsset[] = [],
    active: AbortController | undefined,
    loading = false,
    insertSessionId: string | undefined
  let pending: { key: string; input: InsertSlideImage } | undefined
  function controls() {
    const selected = current?.snapshot?.slides.find(slide => slide.slideId === current?.selectedId)
    add.disabled = !chat || !enabled || !!active || insertSessionId === chat || loading
    choose.disabled = !!active || insertSessionId === chat || !images.length
    insert.disabled = !!active || insertSessionId === chat || loading || !selected?.revision || !choose.value
    download.disabled = !!active || insertSessionId === chat || !current?.snapshot?.outlineId
    cancel.hidden = !active
    source.textContent = images.find(image => image.assetId === choose.value)?.sourceUrl ?? ''
  }
  async function load() {
    const id = chat,
      attempt = ++epoch
    if (!id) return
    loading = true
    controls()
    try {
      const value = await client.imageAssets(id)
      if (id !== chat || attempt !== epoch) return
      enabled = value.enabled
      images = value.items
      choose.replaceChildren()
      for (const image of images) {
        const option = element('option', `${image.width}×${image.height} · ${new URL(image.sourceUrl).hostname}`)
        option.value = image.assetId
        choose.append(option)
      }
      node.hidden = false
    } catch (error) {
      if (attempt === epoch) {
        node.hidden = error instanceof Error && error.message === 'NOT_FOUND'
        status.textContent = feedback(error)
      }
    } finally {
      if (attempt === epoch) {
        loading = false
        controls()
      }
    }
  }
  async function acquire() {
    if (add.disabled) return
    const id = chat,
      abort = new AbortController()
    active = abort
    status.textContent = 'Đang tải và kiểm tra ảnh…'
    controls()
    try {
      const imported = await client.importImage(id, url.value.trim(), abort.signal)
      if (id === chat) {
        await load()
        if (id !== chat) return
        choose.value = imported.assetId
        controls()
        status.textContent = 'Ảnh đã lưu trong Chat. Chọn slide rồi chèn ảnh hoặc yêu cầu AI dùng ảnh.'
      }
    } catch (error) {
      if (id === chat)
        status.textContent = abort.signal.aborted
          ? 'Đã hủy tải ảnh. Kiểm tra thư viện trước khi thử lại.'
          : feedback(error)
    } finally {
      if (active === abort) active = undefined
      controls()
    }
  }
  async function insertSelected() {
    const snapshot = current?.snapshot,
      slide = snapshot?.slides.find(slide => slide.slideId === current?.selectedId)
    if (insert.disabled || !snapshot?.outlineId || !slide) return
    const id = chat,
      key = JSON.stringify([id, slide.slideId, choose.value, alt.value])
    if (pending?.key !== key)
      pending = {
        key,
        input: {
          outlineId: snapshot.outlineId,
          slideId: slide.slideId,
          expectedRevision: slide.revision,
          assetId: choose.value,
          publicationId: crypto.randomUUID(),
          alt: alt.value,
        },
      }
    insertSessionId = id
    controls()
    status.textContent = 'Đang chèn ảnh…'
    const command = pending
    try {
      await client.insertImage(id, command.input)
      if (pending === command) pending = undefined
      if (chat === id) {
        await changed()
        if (chat === id) status.textContent = 'Ảnh đã được chèn ở cuối slide đã chọn.'
      }
    } catch (error) {
      if (chat === id) {
        status.textContent = feedback(error)
        if (error instanceof Error && ['DECK_CONFLICT', 'DECK_PUBLICATION_CONFLICT'].includes(error.message)) {
          pending = undefined
          await changed()
        }
      }
    } finally {
      if (insertSessionId === id) insertSessionId = undefined
      controls()
    }
  }
  async function exportCurrent() {
    if (download.disabled) return
    const id = chat,
      abort = new AbortController()
    active = abort
    controls()
    status.textContent = 'Đang xuất các revision đã lưu; bản nháp chưa lưu không được đưa vào PDF.'
    try {
      const artifact = await client.exportPdf(id, abort.signal)
      abort.signal.throwIfAborted()
      const href = URL.createObjectURL(artifact.blob),
        link = element('a')
      link.href = href
      link.download = `deck-${id}-v${artifact.version}.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(href), 1000)
      if (chat === id) status.textContent = `Đã tải PDF từ bản deck ${artifact.version}.`
    } catch (error) {
      if (chat === id)
        status.textContent = abort.signal.aborted ? 'Đã hủy xuất PDF. Deck đã lưu được giữ nguyên.' : feedback(error)
    } finally {
      if (active === abort) active = undefined
      controls()
    }
  }
  choose.addEventListener('change', () => {
    pending = undefined
    controls()
  })
  return {
    node,
    update(value: DeckViewState) {
      current = value
      const id = value.snapshot?.sessionId ?? ''
      if (id !== chat) {
        active?.abort()
        active = undefined
        chat = id
        images = []
        choose.replaceChildren()
        source.textContent = ''
        url.value = ''
        alt.value = ''
        status.textContent = ''
        pending = undefined
        enabled = false
        void load()
      }
      controls()
    },
  }
}
function feedback(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  if (code === 'IMAGE_URL_DENIED')
    return 'URL ảnh không được phép. Dùng HTTPS PNG/JPEG công khai, không credentials hay địa chỉ nội bộ.'
  if (['IMAGE_FORMAT', 'IMAGE_LIMIT', 'DECK_IMAGE_LIMIT'].includes(code))
    return 'Ảnh không hợp lệ hoặc vượt giới hạn. Chọn ảnh PNG/JPEG nhỏ hơn.'
  if (['IMAGE_UNAVAILABLE', 'DECK_ASSET_UNAVAILABLE'].includes(code))
    return 'Ảnh thiếu hoặc đã thay đổi. Kiểm tra ảnh trong Chat; deck không bị ghi đè.'
  if (code === 'EXPORT_UNAVAILABLE') return 'Chưa có trình duyệt xuất PDF khả dụng. Cài Chrome/Edge rồi khởi động lại.'
  if (code === 'DECK_EXPORT_INCOMPLETE') return 'Deck còn slide chưa hoàn tất. Hoàn thành các slide rồi xuất lại.'
  if (code === 'EXPORT_LAYOUT_OVERFLOW')
    return 'Một slide tràn quá một trang PDF. Giảm nội dung/kích thước bằng chỉnh sửa rồi xuất lại.'
  if (code === 'SESSION_BUSY') return 'Chat đang chạy hoặc chờ trả lời. Chờ lượt kết thúc rồi chèn ảnh lại.'
  if (['DECK_CONFLICT', 'DECK_PUBLICATION_CONFLICT'].includes(code))
    return 'Slide đã có bản mới. Bản đã lưu giữ nguyên; kiểm tra rồi bấm Chèn lại nếu cần.'
  if (['EXPORT_BUSY', 'IMAGE_BUSY'].includes(code)) return 'Đang có tác vụ khác. Chờ hoặc hủy tác vụ đó rồi thử lại.'
  if (code === 'IMAGE_IMPORT_DISABLED') return 'Tải ảnh Internet đang tắt. Ảnh đã lưu vẫn được giữ.'
  return 'Không hoàn tất được tác vụ. Kiểm tra kết nối, URL hoặc cấu hình xuất rồi thử lại; deck đã lưu được giữ nguyên.'
}
