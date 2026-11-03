import type { WebSession, RequestSnapshot } from '@deckagent/host-api'
import { element, button } from './dom.ts'
import type { HostClient } from './host-client.ts'

/** Optional capability; an older Host keeps the Composer usable. */
export function contextMeter(
  origin: string,
  token: string,
  client: HostClient,
  compacted: (snapshot: RequestSnapshot) => Promise<void>,
) {
  const node = element('section', undefined, 'context-meter')
  node.setAttribute('aria-label', 'Context usage')
  const label = element('small', 'Context: chưa xác định')
  const details = element('details')
  details.append(element('summary', 'Chi tiết context'))
  const breakdown = element('pre')
  details.append(breakdown)
  const checkpoint = element('small')
  const notice = element('span')
  notice.setAttribute('role', 'status')
  const compact = button('Compact', async () => {
    const id = session?.sessionId
    if (!id || compact.disabled) return
    compact.disabled = true
    lastFailure = undefined
    notice.textContent = 'Đang tóm tắt; giữ nguyên lịch sử. Có thể dùng Stop để dừng.'
    try {
      const value = await post(id, 'compact', {})
      if (!object(value) || typeof value.requestId !== 'string') throw new Error('INVALID_RESPONSE')
      await compacted(await client.snapshot(value.requestId))
      if ((await client.snapshot(value.requestId)).status !== 'completed') throw new Error('CONTEXT_COMPACT_FAILED')
      if (session?.sessionId === id) {
        key = ''
        notice.textContent = ''
      }
    } catch {
      if (session?.sessionId === id) {
        key = ''
        notice.textContent =
          'Không Compact được. Chờ yêu cầu kết thúc, kiểm tra model rồi thử lại. Bản nháp và lịch sử được giữ.'
        lastFailure = { id, text: notice.textContent }
      }
    }
  })
  compact.title = 'Tóm tắt context cho yêu cầu sau; lịch sử đầy đủ vẫn còn. Chỉ chạy khi bạn chọn.'
  compact.disabled = true
  node.append(label, compact, details, checkpoint, notice)
  let session: WebSession | undefined,
    key = '',
    epoch = 0,
    timer: ReturnType<typeof setTimeout> | undefined
  let lastFailure: { readonly id: string; readonly text: string } | undefined
  const post = async (id: string, action: string, body: unknown): Promise<unknown> => {
    const result = await fetch(`${origin}/api/sessions/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!result.ok) throw new Error(`CONTEXT_HTTP_${result.status}`)
    return result.json()
  }
  return {
    node,
    update(
      current: WebSession | undefined,
      input: string,
      materials: { readonly attachmentIds: readonly string[]; readonly referenceIds: readonly string[] },
      busy: boolean,
    ) {
      session = current
      const next = JSON.stringify([
        current?.sessionId,
        current?.selection,
        current?.messageCount,
        input,
        materials,
        busy,
      ])
      if (next === key) return
      key = next
      const attempt = ++epoch
      clearTimeout(timer)
      compact.disabled = true
      if (!current) {
        node.hidden = true
        return
      }
      node.hidden = false
      label.textContent = 'Context: chưa xác định'
      checkpoint.textContent = ''
      breakdown.textContent = ''
      if (busy) notice.textContent = 'Chỉ Compact sau khi yêu cầu kết thúc.'
      else notice.textContent = lastFailure?.id === current.sessionId ? lastFailure.text : ''
      timer = setTimeout(async () => {
        try {
          const value = await post(current.sessionId, 'context', { input, ...materials })
          if (attempt !== epoch) return
          if (
            !object(value) ||
            value.sessionId !== current.sessionId ||
            !['estimate', 'unknown'].includes(String(value.source)) ||
            !Array.isArray(value.unknown) ||
            !object(value.breakdown)
          )
            throw new Error('INVALID_RESPONSE')
          label.textContent =
            value.source === 'estimate' && typeof value.usedTokens === 'number'
              ? `Context: ~${Math.ceil(value.usedTokens)} tokens (DeckAgent ước tính)${typeof value.percentage === 'number' ? ` · ~${value.percentage.toFixed(1)}%` : ' · dung lượng chưa xác định'}`
              : 'Context: chưa xác định tổng; xem phần ước tính trong chi tiết'
          breakdown.textContent = `Ước tính UTF-8 bytes / 4; không phải tokenizer hoặc số provider báo.\nDựa trên prompt/tool schema gần nhất cùng trạng thái; định dạng provider có thể khác.\n${JSON.stringify(value.breakdown, null, 2)}\nChưa xác định: ${value.unknown.map(String).join(', ') || 'không'}${typeof value.contextWindow === 'number' ? `\nContext window: ${value.contextWindow}` : ''}`
          if (
            object(value.checkpoint) &&
            typeof value.checkpoint.coveredMessages === 'number' &&
            typeof value.checkpoint.createdAt === 'string'
          )
            checkpoint.textContent = `Đã Compact ${value.checkpoint.coveredMessages} tin nhắn đầu · ${value.checkpoint.createdAt}. Lịch sử đầy đủ vẫn được giữ.`
          compact.disabled = busy || !current.selectable || value.canCompact !== true
          if (!busy && lastFailure?.id !== current.sessionId && value.suggestCompact === true)
            notice.textContent = 'Context ước tính đạt ít nhất 85%. Bạn có thể chọn Compact; hệ thống không tự chạy.'
        } catch (error) {
          if (attempt !== epoch) return
          if (error instanceof Error && error.message === 'CONTEXT_HTTP_404') node.hidden = true
          else
            notice.textContent =
              'Không đọc được context. Kiểm tra kết nối rồi thử lại khi thay đổi bản nháp hoặc mở lại Chat.'
        }
      }, 250)
    },
  }
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
