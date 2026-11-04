import type { EditableSlide, SlideEdit, SlideEditOperation } from '@deckagent/deck'
import type { DeckViewState } from './deck-model.ts'
import type { DeckClient } from './deck-client.ts'
import { button, element, field } from './dom.ts'

interface Draft {
  readonly document: EditableSlide
  readonly operations: Map<string, SlideEditOperation>
  editId: string
  selected: string
  preview?: string
}
const previewHtml = (html: string) =>
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">${html}`

/** Original slide HTML is confined to the opaque preview, never to the editor DOM. */
export function slideEditor(client: DeckClient, saved: () => Promise<void>) {
  const node = element('section', undefined, 'slide-editor'),
    panel = element('div'),
    notice = element('p')
  notice.setAttribute('role', 'status')
  const choose = element('select'),
    text = element('textarea'),
    font = element('input'),
    align = element('select'),
    top = element('input'),
    left = element('input')
  for (const [value, label] of [
    ['', 'Giữ nguyên'],
    ['left', 'Trái'],
    ['center', 'Giữa'],
    ['right', 'Phải'],
  ] as const) {
    const option = element('option', label)
    option.value = value
    align.append(option)
  }
  font.type = top.type = left.type = 'number'
  font.min = '8'
  font.max = '144'
  top.min = left.min = '-1000'
  top.max = left.max = '1000'
  text.maxLength = 16000
  for (const input of [font, top, left]) input.placeholder = 'Giữ nguyên'
  const frame = element('iframe')
  frame.title = 'Direct edit preview'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  frame.style.width = '100%'
  frame.style.height = '320px'
  node.style.minWidth = '0'
  text.rows = 4
  text.style.boxSizing = 'border-box'
  text.style.width = '100%'
  const drafts = new Map<string, Draft>()
  let current: { key: string; sessionId: string; slideId: string; revision: number } | undefined,
    opened = false,
    epoch = 0,
    busy = false,
    timer: ReturnType<typeof setTimeout> | undefined
  const toggle = button('Sửa trực tiếp', () => {
    opened = !opened
    panel.hidden = !opened
    toggle.setAttribute('aria-expanded', String(opened))
    if (opened) void load()
  })
  toggle.disabled = true
  toggle.setAttribute('aria-expanded', 'false')
  panel.hidden = true
  const save = button('Lưu slide', () => void persist()),
    discard = button('Bỏ bản nháp, tải bản mới', () => {
      if (current) {
        drafts.delete(current.key)
        void load()
      }
    })
  save.setAttribute('aria-label', 'Lưu slide')
  panel.append(
    element(
      'p',
      'Chọn khối văn bản, sửa chữ hoặc bố cục rồi lưu. Preview chưa phải bản đã lưu. Bản nháp chưa lưu chỉ giữ trong lần mở trang này.',
    ),
    field('Khối văn bản', choose),
    field('Nội dung', text),
    field('Cỡ chữ (px)', font),
    field('Căn lề', align),
    field('Cách trên (px)', top),
    field('Cách trái (px)', left),
    save,
    discard,
    notice,
    frame,
  )
  node.append(toggle, panel)
  for (const label of panel.querySelectorAll('label')) {
    label.style.display = 'grid'
    label.style.gap = '4px'
    label.style.marginBottom = '8px'
  }
  const draft = () => (current ? drafts.get(current.key) : undefined)
  function populate() {
    const d = draft(),
      selected = d?.document.nodes.find(n => n.nodeId === d.selected),
      operation = d?.operations.get(d.selected)
    text.value = operation?.text ?? selected?.text ?? ''
    font.value = String(operation?.layout?.fontSize ?? '')
    align.value = operation?.layout?.textAlign ?? ''
    top.value = String(operation?.layout?.marginTop ?? '')
    left.value = String(operation?.layout?.marginLeft ?? '')
    text.disabled = choose.disabled = busy || !selected
    for (const input of [font, align, top, left]) input.disabled = busy || !selected?.layoutEditable
    save.disabled = busy || !d?.operations.size
  }
  async function load() {
    if (!current || !opened) return
    const c = current,
      attempt = ++epoch
    let d = drafts.get(c.key)
    if (d?.operations.size) {
      choose.replaceChildren()
      for (const item of d.document.nodes) {
        const option = element('option', `${item.tag}: ${item.text.slice(0, 100)}`)
        option.value = item.nodeId
        choose.append(option)
      }
      choose.value = d.selected
      frame.srcdoc = previewHtml(d.preview ?? d.document.html)
      notice.textContent =
        d.document.revision !== c.revision
          ? 'Slide đã có bản mới. Bản nháp giữ nguyên; tải bản mới trước khi sửa tiếp.'
          : 'Bản nháp chưa lưu.'
      populate()
      return
    }
    busy = true
    populate()
    choose.replaceChildren()
    frame.removeAttribute('srcdoc')
    notice.textContent = 'Đang đọc bản slide đã lưu…'
    try {
      const document = await client.editableSlide(c.sessionId, c.slideId)
      if (attempt !== epoch || current?.key !== c.key) return
      d = { document, operations: new Map(), editId: crypto.randomUUID(), selected: document.nodes[0]?.nodeId ?? '' }
      drafts.set(c.key, d)
      for (const item of document.nodes) {
        const option = element('option', `${item.tag}: ${item.text.slice(0, 100)}`)
        option.value = item.nodeId
        choose.append(option)
      }
      choose.value = d.selected
      frame.srcdoc = previewHtml(document.html)
      notice.textContent = document.nodes.length
        ? `Đang sửa từ bản ${document.revision}. Chưa lưu thay đổi.`
        : 'HTML này vẫn xem được nhưng không có khối văn bản có thể sửa an toàn. Không tự chuyển đổi.'
    } catch {
      if (attempt === epoch)
        notice.textContent = 'Không mở được phần chỉnh sửa. Kiểm tra kết nối hoặc tải lại bản slide.'
    } finally {
      if (attempt === epoch) {
        busy = false
        populate()
      }
    }
  }
  const command = (d: Draft): SlideEdit => ({
    outlineId: d.document.outlineId,
    slideId: d.document.slideId,
    expectedRevision: d.document.revision,
    baseHash: d.document.baseHash,
    editId: d.editId,
    operations: [...d.operations.values()],
  })
  function edit() {
    const d = draft(),
      selected = d?.document.nodes.find(n => n.nodeId === d.selected)
    if (!d || !selected) return
    const layout: NonNullable<SlideEditOperation['layout']> = {
      ...(font.value ? { fontSize: Number(font.value) } : {}),
      ...(align.value === 'left' || align.value === 'center' || align.value === 'right'
        ? { textAlign: align.value }
        : {}),
      ...(top.value ? { marginTop: Number(top.value) } : {}),
      ...(left.value ? { marginLeft: Number(left.value) } : {}),
    }
    if (text.value === selected.text && !Object.keys(layout).length) d.operations.delete(d.selected)
    else
      d.operations.set(d.selected, {
        nodeId: d.selected,
        text: text.value,
        ...(Object.keys(layout).length ? { layout } : {}),
      })
    d.editId = crypto.randomUUID()
    save.disabled = !d.operations.size
    notice.textContent = 'Bản nháp chưa lưu.'
    clearTimeout(timer)
    const c = current,
      attempt = ++epoch
    if (!d.operations.size) {
      frame.srcdoc = previewHtml(d.document.html)
      return
    }
    const input = command(d)
    timer = setTimeout(async () => {
      if (!c) return
      try {
        const html = await client.previewSlideEdit(c.sessionId, input)
        if (attempt === epoch && current?.key === c.key) {
          d.preview = html
          frame.srcdoc = previewHtml(html)
        }
      } catch (error) {
        if (attempt === epoch) notice.textContent = feedback(error)
      }
    }, 250)
  }
  async function persist() {
    const c = current,
      d = draft()
    if (!c || !d || !d.operations.size || busy) return
    clearTimeout(timer)
    ++epoch
    busy = true
    populate()
    notice.textContent = 'Đang lưu slide…'
    try {
      await client.editSlide(c.sessionId, command(d))
      drafts.delete(c.key)
      if (current?.key === c.key) {
        await saved()
        if (current?.key === c.key) {
          busy = false
          await load()
          notice.textContent = 'Đã lưu thay đổi.'
        }
      }
    } catch (error) {
      if (current?.key === c.key) notice.textContent = feedback(error)
    } finally {
      busy = false
      populate()
    }
  }
  choose.addEventListener('change', () => {
    const d = draft()
    if (d) {
      d.selected = choose.value
      populate()
    }
  })
  for (const input of [text, font, align, top, left]) input.addEventListener('input', edit)
  return {
    node,
    update(value: DeckViewState) {
      const slide = value.snapshot?.slides.find(s => s.slideId === value.selectedId)
      toggle.disabled = !slide?.revision
      const next =
        value.snapshot && slide?.revision
          ? {
              key: `${value.snapshot.sessionId}/${slide.slideId}`,
              sessionId: value.snapshot.sessionId,
              slideId: slide.slideId,
              revision: slide.revision,
            }
          : undefined
      const changed = current?.key !== next?.key || current?.revision !== next?.revision
      current = next
      if (changed) {
        ++epoch
        clearTimeout(timer)
        busy = false
        choose.replaceChildren()
        frame.removeAttribute('srcdoc')
        text.value = ''
        if (opened) void load()
      }
      panel.hidden = !opened || !current
    },
  }
}
function feedback(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  if (code === 'DECK_CONFLICT' || code === 'DECK_PUBLICATION_CONFLICT')
    return 'Slide đã có bản mới hoặc edit ID đã thay đổi. Bản nháp giữ nguyên, chưa ghi đè. Chọn bỏ bản nháp và tải bản mới để sửa lại.'
  if (code === 'SESSION_BUSY')
    return 'Chat đang chạy hoặc chờ trả lời. Bản nháp giữ nguyên; chờ lượt kết thúc rồi bấm Lưu lại.'
  if (code === 'DECK_EDIT_UNSUPPORTED')
    return 'Khối hoặc kiểu bố cục không thể sửa an toàn. Bản nháp giữ nguyên; chọn khối khác hoặc chỉ sửa chữ.'
  return 'Không lưu hoặc xem trước được thay đổi. Kiểm tra giá trị, kết nối rồi thử lại. Bản nháp được giữ; không tự gửi lại.'
}
