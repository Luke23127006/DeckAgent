import type { WebSettings } from '@deckagent/host-api'
import { button, element, field } from './dom.ts'
import type { ManagementClient } from './management-client.ts'

const messages: Readonly<Record<string, string>> = {
  RESEARCH_FREE_ONLY: 'Chỉ nhận tài khoản Tavily Researcher miễn phí, không có PAYG. Kiểm tra gói tại Tavily.',
  RESEARCH_QUOTA_EXHAUSTED:
    'Đã hết quota miễn phí hoặc không xác minh được hạn mức. Chờ quota mới; không nâng cấp tự động.',
  RESEARCH_KEY_REJECTED: 'Tavily từ chối key. Kiểm tra key rồi thử lại.',
  RESEARCH_KEY_UNAVAILABLE: 'Chưa đọc được key. Thêm TAVILY_API_KEY vào .env rồi khởi động lại, hoặc lưu key tại đây.',
  RESEARCH_NOT_SAVED: 'Chưa lưu được key. Kiểm tra nơi lưu credentials hoặc dùng biến môi trường.',
}

/** Controls never reveal a saved key; source excerpts enter text nodes only. */
export function researchView(
  client: ManagementClient,
  root: HTMLElement,
  changed: () => Promise<void>,
  chat: () => string | undefined,
) {
  const selected = new Map<string, boolean>()
  const choice = element('input')
  choice.type = 'checkbox'
  choice.className = 'public-research-choice'
  const label = field('Tìm nguồn công khai', choice)
  label.append(element('small', 'Query gửi tới Tavily · chỉ miễn phí'))
  label.title =
    'Query tìm kiếm được gửi tới Tavily và có thể chứa thông tin từ tài liệu. Tối đa 3 lượt/yêu cầu, chỉ dùng miễn phí.'
  choice.addEventListener('change', () => {
    const id = chat()
    if (id) selected.set(id, choice.checked)
  })
  const dialog = element('dialog', undefined, 'research-dialog')
  const status = element('p')
  status.setAttribute('role', 'status')
  const key = element('input')
  key.type = 'password'
  key.autocomplete = 'new-password'
  key.maxLength = 4096
  const content = element('section')
  const actions = element('div')
  let busy = false
  async function perform(work: () => Promise<void>) {
    if (busy) return
    busy = true
    actions.querySelectorAll('button').forEach(item => {
      item.disabled = true
    })
    try {
      await work()
      key.value = ''
      await changed()
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
      status.textContent =
        messages[code] ?? 'Không kết nối được Tavily. Kiểm tra mạng rồi thử lại; cấu hình cũ được giữ.'
    } finally {
      busy = false
      actions.querySelectorAll('button').forEach(item => {
        item.disabled = false
      })
    }
  }
  const save = button('Kiểm tra và lưu key', () => {
    void perform(async () => {
      await client.saveResearch({ key: key.value })
      status.textContent = 'Đã kiểm tra và lưu key cho tài khoản miễn phí.'
    })
  })
  const environment = button('Kiểm tra key từ .env', () => {
    void perform(async () => {
      await client.saveResearch({ useEnvironment: true })
      status.textContent = 'Key môi trường hợp lệ, tài khoản miễn phí; không sao chép key vào database.'
    })
  })
  const remove = button('Gỡ cấu hình research', () => {
    void perform(async () => {
      await client.removeResearch()
      status.textContent = 'Đã tắt research. Request đã bắt đầu giữ cấu hình lúc gửi.'
    })
  })
  actions.append(save, environment, remove)
  dialog.append(
    element('h2', 'Nguồn công khai · Tavily'),
    element(
      'p',
      'Chỉ dùng gói miễn phí. Khi hết quota, research dừng. Query được gửi tới Tavily; không tự gửi toàn bộ file hoặc lịch sử. Giữ tài khoản ở gói Free và tắt PAYG trong dashboard Tavily.',
    ),
    field('Tavily API key', key),
    actions,
    status,
    content,
    button('Đóng', () => {
      if (!busy) dialog.close()
    }),
  )
  dialog.addEventListener('cancel', event => {
    if (busy) event.preventDefault()
  })
  dialog.addEventListener('close', () => {
    key.value = ''
    content.replaceChildren()
  })
  root.append(dialog)
  const settings = button('Cài đặt tìm kiếm', () => {
    status.textContent = 'Key đã lưu không bao giờ được hiện lại. Để dùng .env, bấm kiểm tra key môi trường.'
    content.replaceChildren()
    dialog.showModal()
  })
  const sources = button('Nguồn đã tìm', () => {
    const id = chat()
    if (!id || dialog.open) return
    dialog.showModal()
    content.replaceChildren()
    status.textContent = 'Đang đọc nguồn của Chat…'
    void perform(async () => {
      const values = await client.researchSources(id)
      status.textContent = values.length
        ? 'Các đoạn thực tế đã nhận; không phải toàn trang hay xác nhận tính đúng của nguồn.'
        : 'Chat này chưa có nguồn research đã lưu.'
      for (const item of values) {
        const link = element('a', item.title || item.url)
        link.href = item.url
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        const section = element('section')
        section.append(link, element('small', ` ${item.sourceId} · ${item.retrievedAt}`), element('pre', item.content))
        content.append(section)
      }
    })
  })
  return {
    label,
    settings,
    sources,
    enabled(id: string) {
      return selected.get(id) === true
    },
    update(settings: WebSettings, active: boolean) {
      const id = chat()
      choice.checked = !!id && selected.get(id) === true
      choice.disabled = !id || active || (!settings.research?.configured && !choice.checked)
      sources.disabled = !id
    },
  }
}
