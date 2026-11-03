import type { MaterialInfo } from '@deckagent/host-api'
import { button, element } from './dom.ts'

/** IDs and preparation state belong to one Chat; bytes never enter tab storage. */
export function materialsView(origin: string, token: string, changed: () => void) {
  const node = element('section', undefined, 'materials-preparation')
  node.setAttribute('aria-label', 'Tài liệu của yêu cầu')
  const items = element('div'),
    notice = element('p')
  items.setAttribute('aria-live', 'polite')
  notice.setAttribute('role', 'status')
  const picker = element('input')
  picker.type = 'file'
  picker.multiple = true
  picker.accept = '.txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.pptx'
  picker.hidden = true
  const add = button('+', () => picker.click())
  add.disabled = true
  const path = element('input')
  path.placeholder = 'Đường dẫn tương đối trong project folder'
  path.setAttribute('aria-label', 'Tham chiếu file hoặc thư mục')
  const reference = button('Thêm tham chiếu', () => {
    void addReference()
  })
  reference.disabled = true
  const states = new Map<string, MaterialInfo[]>()
  const busy = new Set<string>()
  let current: string | undefined,
    enabled = false,
    revision = 0
  const key = (id: string) => `deckagent-material-draft:${id}`
  const save = (id: string) => {
    try {
      const selected = states.get(id) ?? []
      sessionStorage.setItem(
        key(id),
        JSON.stringify({
          ids: selected.map(item => item.materialId),
          labels: selected,
          rejected: selected.filter(
            item => item.reason === 'MATERIAL_UPLOAD_FAILED' || item.reason === 'MATERIAL_UPLOAD_PENDING',
          ),
        }),
      )
    } catch {
      /* Optional tab recovery. */
    }
  }
  const request = async (id: string, suffix: string, init: RequestInit = {}) => {
    const response = await fetch(`${origin}/api/sessions/${encodeURIComponent(id)}/${suffix}`, {
      ...init,
      redirect: 'error',
      headers: { ...init.headers, authorization: `Bearer ${token}` },
    })
    const data: unknown = await response.json()
    if (!response.ok) {
      const code =
        data &&
        typeof data === 'object' &&
        'error' in data &&
        data.error &&
        typeof data.error === 'object' &&
        'code' in data.error
          ? data.error.code
          : undefined
      if (code === 'MATERIAL_REFERENCE_WORKSPACE_REQUIRED')
        throw new Error(
          'Chat này chưa có project folder khả dụng. Chọn workspace có thư mục và tạo Chat mới trong workspace đó, hoặc kiểm tra lại thư mục đã lưu.',
        )
      if (code === 'MATERIAL_INVALID_REFERENCE')
        throw new Error(
          'Nhập đường dẫn tương đối tính từ project folder của Chat, ví dụ permission-test.txt. Không thêm tên thư mục gốc lần nữa.',
        )
      if (code === 'MATERIALS_DISABLED')
        throw new Error(
          'Tài liệu chưa được bật cho phiên này. Khởi động lại đúng profile với cấu hình tài liệu đã dùng trước đó.',
        )
      throw new Error('Không thể cập nhật tài liệu. Kiểm tra file, project folder và thử lại.')
    }
    return data
  }
  const material = (value: unknown, id: string): MaterialInfo => {
    if (
      !value ||
      typeof value !== 'object' ||
      !('materialId' in value) ||
      typeof value.materialId !== 'string' ||
      !/^[\w-]+$/.test(value.materialId) ||
      !('sessionId' in value) ||
      value.sessionId !== id ||
      !('originalName' in value) ||
      typeof value.originalName !== 'string' ||
      !('status' in value) ||
      !['preparing', 'ready', 'rejected'].includes(String(value.status)) ||
      !('kind' in value) ||
      !['attachment', 'reference'].includes(String(value.kind)) ||
      !('mediaType' in value) ||
      typeof value.mediaType !== 'string' ||
      !('sizeBytes' in value) ||
      typeof value.sizeBytes !== 'number' ||
      !('warnings' in value) ||
      !Array.isArray(value.warnings) ||
      value.warnings.some(item => typeof item !== 'string')
    )
      throw new Error('Phản hồi tài liệu không hợp lệ.')
    return {
      materialId: value.materialId,
      sessionId: id,
      originalName: value.originalName,
      status: value.status === 'ready' ? 'ready' : value.status === 'preparing' ? 'preparing' : 'rejected',
      kind: value.kind === 'reference' ? 'reference' : 'attachment',
      mediaType: value.mediaType,
      sizeBytes: value.sizeBytes,
      warnings: value.warnings,
      ...('sent' in value && typeof value.sent === 'boolean' ? { sent: value.sent } : {}),
      ...('reason' in value && typeof value.reason === 'string' ? { reason: value.reason } : {}),
    }
  }
  function render() {
    items.replaceChildren()
    for (const info of current ? (states.get(current) ?? []) : []) {
      const row = element('div')
      row.dataset.materialId = info.materialId
      row.dataset.status = info.status
      row.append(
        element(
          'span',
          `${info.kind === 'reference' ? 'Tham chiếu' : 'Tệp'}: ${info.originalName} · ${info.status === 'ready' ? 'Sẵn sàng' : info.status === 'preparing' ? 'Đang chuẩn bị' : 'Bị từ chối'}${info.reason && info.status === 'rejected' ? ` · ${rejection(info.reason)}` : ''}`,
        ),
      )
      if (info.warnings.length)
        row.append(
          element(
            'small',
            info.kind === 'reference'
              ? 'File gốc được kiểm tra lại khi đọc; tham chiếu không cấp thêm quyền.'
              : info.warnings.includes('NO_USABLE_TEXT')
                ? 'Tệp không có nội dung văn bản dùng được.'
                : 'Chỉ đọc nội dung văn bản; hình, bố cục hoặc nội dung nhúng có thể chưa được đọc.',
          ),
        )
      row.append(
        button('Xem thông tin', () => {
          notice.textContent = `${info.originalName}: ${info.mediaType}, ${info.sizeBytes} bytes. Chưa có bản xem trước cho loại này.`
        }),
      )
      row.append(
        button('Gỡ', () => {
          if (!current || busy.has(current)) return
          const id = current
          const remove = async () => {
            if (
              enabled &&
              !info.sent &&
              !['MATERIAL_UPLOAD_FAILED', 'MATERIAL_NOT_FOUND', 'MATERIALS_DISABLED'].includes(info.reason ?? '')
            )
              await request(id, `${info.kind === 'reference' ? 'references' : 'attachments'}/${info.materialId}`, {
                method: 'DELETE',
              })
            states.set(
              id,
              (states.get(id) ?? []).filter(item => item.materialId !== info.materialId),
            )
            save(id)
            if (current === id) render()
            changed()
          }
          void remove().catch(error => {
            if (current === id) notice.textContent = error.message
          })
        }),
      )
      items.append(row)
    }
    add.disabled = !current || !enabled || (!!current && busy.has(current))
    add.title = enabled ? 'Đính kèm tài liệu' : 'Tài liệu chưa được bật cho phiên này.'
    reference.disabled = add.disabled
    path.disabled = add.disabled
    node.hidden = !enabled && (!current || !states.get(current)?.length)
  }
  async function ingest(files: readonly File[]) {
    if (!current || !enabled || busy.has(current)) return
    const id = current
    let pendingId: string | undefined,
      pendingName = ''
    busy.add(id)
    render()
    changed()
    try {
      for (const file of files) {
        pendingId = `pending-${crypto.randomUUID()}`
        pendingName = file.name
        states.set(id, [
          ...(states.get(id) ?? []),
          {
            materialId: pendingId,
            sessionId: id,
            kind: 'attachment',
            originalName: file.name,
            mediaType: 'application/octet-stream',
            sizeBytes: file.size,
            status: 'preparing',
            reason: 'MATERIAL_UPLOAD_PENDING',
            warnings: [],
          },
        ])
        save(id)
        if (current === id) render()
        if (current === id) notice.textContent = `Đang chuẩn bị ${file.name}…`
        const info = material(
          await request(id, 'attachments', {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name) },
            body: file,
          }),
          id,
        )
        states.set(
          id,
          (states.get(id) ?? []).map(item => (item.materialId === pendingId ? info : item)),
        )
        save(id)
        if (current === id) render()
      }
      if (current === id) notice.textContent = ''
    } catch (error) {
      states.set(id, [
        ...(states.get(id) ?? []).filter(item => item.materialId !== pendingId),
        {
          materialId: crypto.randomUUID(),
          sessionId: id,
          kind: 'attachment',
          originalName: pendingName || 'Tệp chưa upload xong',
          mediaType: 'application/octet-stream',
          sizeBytes: 0,
          status: 'rejected',
          reason: 'MATERIAL_UPLOAD_FAILED',
          warnings: [],
        },
      ])
      save(id)
      if (current === id) notice.textContent = error instanceof Error ? error.message : 'Không thể thêm tài liệu.'
    } finally {
      busy.delete(id)
      if (current === id) render()
      changed()
      picker.value = ''
    }
  }
  async function addReference() {
    if (!current || !enabled || busy.has(current) || !path.value.trim()) return
    const id = current,
      value = path.value.trim()
    busy.add(id)
    render()
    changed()
    try {
      const info = material(
        await request(id, 'references', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: value }),
        }),
        id,
      )
      states.set(id, [...(states.get(id) ?? []), info])
      save(id)
      if (current === id) {
        path.value = ''
        notice.textContent = ''
      }
    } catch (error) {
      if (current === id) notice.textContent = error instanceof Error ? error.message : 'Tham chiếu không khả dụng.'
    } finally {
      busy.delete(id)
      if (current === id) render()
      changed()
    }
  }
  picker.addEventListener('change', () => {
    void ingest([...(picker.files ?? [])])
  })
  node.addEventListener('dragover', event => {
    event.preventDefault()
  })
  node.addEventListener('drop', event => {
    event.preventDefault()
    void ingest([...(event.dataTransfer?.files ?? [])])
  })
  node.append(picker, path, reference, notice, items)
  return {
    node,
    action: add,
    async open(id: string) {
      current = id
      const attempt = ++revision
      render()
      try {
        const response = await request(id, 'materials')
        if (
          !response ||
          typeof response !== 'object' ||
          !('enabled' in response) ||
          typeof response.enabled !== 'boolean' ||
          !('items' in response) ||
          !Array.isArray(response.items)
        )
          throw new Error('Phản hồi tài liệu không hợp lệ.')
        const available = response.items.map(value => material(value, id))
        if (!states.has(id)) {
          let selected: unknown = []
          let stored: string | null = null
          try {
            stored = sessionStorage.getItem(key(id))
            selected = JSON.parse(stored ?? '[]')
          } catch {
            /* Optional draft. */
          }
          const ids = Array.isArray(selected)
            ? selected
            : selected && typeof selected === 'object' && 'ids' in selected && Array.isArray(selected.ids)
              ? selected.ids
              : []
          const rejected =
            selected && typeof selected === 'object' && 'rejected' in selected && Array.isArray(selected.rejected)
              ? selected.rejected
                  .map(value => material(value, id))
                  .filter(item => item.reason === 'MATERIAL_UPLOAD_FAILED' || item.reason === 'MATERIAL_UPLOAD_PENDING')
                  .map(item => ({ ...item, status: 'rejected' as const, reason: 'MATERIAL_UPLOAD_FAILED' }))
              : []
          const labels =
            selected && typeof selected === 'object' && 'labels' in selected && Array.isArray(selected.labels)
              ? selected.labels.map(value => material(value, id))
              : []
          const missing = labels
            .filter(
              item =>
                ids.includes(item.materialId) &&
                !available.some(info => info.materialId === item.materialId) &&
                !rejected.some(info => info.materialId === item.materialId),
            )
            .map(item => ({
              ...item,
              status: 'rejected' as const,
              reason: response.enabled ? 'MATERIAL_NOT_FOUND' : 'MATERIALS_DISABLED',
            }))
          states.set(id, [
            ...available.filter(item => (stored === null ? !item.sent : ids.includes(item.materialId))),
            ...rejected,
            ...missing,
          ])
        } else {
          states.set(
            id,
            (states.get(id) ?? []).map(
              item =>
                available.find(current => current.materialId === item.materialId) ??
                (item.reason === 'MATERIAL_UPLOAD_FAILED' || (item.reason === 'MATERIAL_UPLOAD_PENDING' && busy.has(id))
                  ? item
                  : { ...item, status: 'rejected' as const, reason: 'MATERIAL_NOT_FOUND' }),
            ),
          )
        }
        if (attempt === revision && current === id) {
          enabled = response.enabled
          render()
          changed()
        }
      } catch (error) {
        if (attempt === revision) {
          enabled = false
          render()
          notice.textContent = error instanceof Error ? error.message : 'Không thể tải tài liệu.'
        }
      }
    },
    has(id: string) {
      return !!states.get(id)?.length
    },
    blocked(id: string) {
      return busy.has(id) || !!states.get(id)?.some(item => item.status !== 'ready')
    },
    selection(id: string) {
      const selected = states.get(id) ?? []
      return {
        attachmentIds: selected.filter(item => item.kind === 'attachment').map(item => item.materialId),
        referenceIds: selected.filter(item => item.kind === 'reference').map(item => item.materialId),
      }
    },
    sent(id: string, selected: { attachmentIds: readonly string[]; referenceIds: readonly string[] }) {
      const ids = new Set([...selected.attachmentIds, ...selected.referenceIds])
      states.set(
        id,
        (states.get(id) ?? []).filter(item => !ids.has(item.materialId)),
      )
      save(id)
      if (current === id) render()
      changed()
    },
  }
}

function rejection(code: string): string {
  if (code === 'MATERIAL_REFERENCE_UNAVAILABLE')
    return 'Không tìm thấy hoặc không xác minh được tham chiếu trong project folder của Chat. Kiểm tra workspace, đường dẫn và tên file, rồi gỡ và thêm lại tham chiếu.'
  if (code === 'MATERIAL_FILE_LIMIT') return 'Tệp vượt kích thước cho phép của phiên này. Chọn tệp nhỏ hơn.'
  if (code === 'MATERIAL_PROTECTED' || code === 'MATERIAL_PROTECTED_OR_LEGACY_OFFICE')
    return 'Tệp có bảo vệ hoặc dùng định dạng Office cũ. Lưu một bản không bảo vệ ở định dạng được chấp nhận.'
  if (code === 'MATERIAL_UNSUPPORTED_TYPE') return 'Chỉ nhận TXT, MD, PDF, DOCX, PPTX, PNG và JPEG.'
  if (code.includes('LIMIT') || code.includes('TIMEOUT')) return 'Nội dung vượt giới hạn xử lý. Chọn tài liệu ngắn hơn.'
  if (code === 'MATERIAL_UPLOAD_FAILED' || code === 'MATERIAL_UPLOAD_INTERRUPTED')
    return 'Upload chưa hoàn tất. Gỡ tệp này và chọn lại.'
  return 'Không đọc được tệp. Kiểm tra tệp có bị hỏng rồi chọn lại.'
}
