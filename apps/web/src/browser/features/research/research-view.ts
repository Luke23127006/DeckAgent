import type { WebSettings } from '@deckagent/host-contracts'
import { button, element, field } from '../../dom.ts'
import type { ManagementClient } from '../../transport/index.ts'

const messages: Readonly<Record<string, string>> = {
  RESEARCH_FREE_ONLY: 'Chỉ nhận tài khoản Tavily Researcher miễn phí, không có PAYG. Kiểm tra gói tại Tavily.',
  RESEARCH_QUOTA_EXHAUSTED:
    'Đã hết quota miễn phí hoặc không xác minh được hạn mức. Chờ quota mới; không nâng cấp tự động.',
  RESEARCH_KEY_REJECTED: 'Tavily từ chối key. Kiểm tra key rồi thử lại.',
  RESEARCH_KEY_UNAVAILABLE: 'Chưa đọc được key. Thêm TAVILY_API_KEY vào .env rồi khởi động lại, hoặc lưu key tại đây.',
  RESEARCH_NOT_SAVED: 'Chưa lưu được key. Kiểm tra nơi lưu credentials hoặc dùng biến môi trường.',
}

type ResearchSource = Awaited<ReturnType<ManagementClient['researchSources']>>[number]

interface ResearchDialogContext {
  readonly client: ManagementClient
  readonly changed: () => Promise<void>
  readonly chat: () => string | undefined
}

interface ResearchDialogState {
  busy: boolean
  readonly dialog: HTMLDialogElement
  readonly status: HTMLElement
  readonly key: HTMLInputElement
  readonly content: HTMLElement
  readonly actions: HTMLElement
  readonly changed: () => Promise<void>
}

function performResearch(state: ResearchDialogState, work: () => Promise<void>): Promise<void> {
  if (state.busy) return Promise.resolve()
  state.busy = true
  state.actions.querySelectorAll('button').forEach(item => {
    item.disabled = true
  })
  return (async () => {
    try {
      await work()
      state.key.value = ''
      await state.changed()
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
      state.status.textContent =
        messages[code] ?? 'Không kết nối được Tavily. Kiểm tra mạng rồi thử lại; cấu hình cũ được giữ.'
    } finally {
      state.busy = false
      state.actions.querySelectorAll('button').forEach(item => {
        item.disabled = false
      })
    }
  })()
}

function renderResearchSources(content: HTMLElement, status: HTMLElement, values: readonly ResearchSource[]): void {
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
}

function createResearchControls(onOpen: () => void) {
  const choice = element('input')
  choice.type = 'checkbox'
  choice.className = 'public-research-choice'
  const label = field('Tìm nguồn công khai', choice)
  label.className = 'research-choice-label'
  label.prepend(choice)
  const control = element('div', undefined, 'research-control')
  control.append(label)
  label.title =
    'Query tìm kiếm được gửi tới Tavily và có thể chứa thông tin từ tài liệu. Tối đa 3 lượt/yêu cầu, chỉ dùng miễn phí.'
  const info = button('ⓘ', onOpen)
  info.className = 'research-info'
  info.setAttribute('aria-label', 'Thông tin tìm nguồn')
  control.append(info)
  const settings = button('Cài đặt tìm kiếm', onOpen)
  return { control, choice, label, info, settings }
}

function createResearchActions(
  context: ResearchDialogContext,
  state: ResearchDialogState,
): { readonly sources: HTMLButtonElement } {
  const perform = (work: () => Promise<void>) => performResearch(state, work)
  const save = button('Kiểm tra và lưu key', () => {
    void perform(async () => {
      await context.client.saveResearch({ key: state.key.value })
      state.status.textContent = 'Đã kiểm tra và lưu key cho tài khoản miễn phí.'
    })
  })
  const environment = button('Kiểm tra key từ .env', () => {
    void perform(async () => {
      await context.client.saveResearch({ useEnvironment: true })
      state.status.textContent = 'Key môi trường hợp lệ, tài khoản miễn phí; không sao chép key vào database.'
    })
  })
  const remove = button('Gỡ cấu hình research', () => {
    void perform(async () => {
      await context.client.removeResearch()
      state.status.textContent = 'Đã tắt research. Request đã bắt đầu giữ cấu hình lúc gửi.'
    })
  })
  state.actions.append(save, environment, remove)
  const sources = button('Nguồn đã tìm', () => {
    const id = context.chat()
    if (!id || state.dialog.open) return
    state.dialog.showModal()
    state.content.replaceChildren()
    state.status.textContent = 'Đang đọc nguồn của Chat…'
    void perform(async () => {
      const values = await context.client.researchSources(id)
      renderResearchSources(state.content, state.status, values)
    })
  })
  return { sources }
}

function createResearchDialog(context: ResearchDialogContext) {
  const dialog = element('dialog', undefined, 'research-dialog')
  const status = element('p')
  status.setAttribute('role', 'status')
  const key = element('input')
  key.type = 'password'
  key.autocomplete = 'new-password'
  key.maxLength = 4096
  const content = element('section')
  const actions = element('div')
  const state: ResearchDialogState = { busy: false, dialog, status, key, content, actions, changed: context.changed }
  const { sources } = createResearchActions(context, state)
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
      if (!state.busy) dialog.close()
    }),
  )
  dialog.addEventListener('cancel', event => {
    if (state.busy) event.preventDefault()
  })
  dialog.addEventListener('close', () => {
    key.value = ''
    content.replaceChildren()
  })
  const openSettings = () => {
    status.textContent = 'Key đã lưu không bao giờ được hiện lại. Để dùng .env, bấm kiểm tra key môi trường.'
    content.replaceChildren()
    dialog.showModal()
  }
  return { node: dialog, sources, openSettings }
}

/** Controls never reveal a saved key; source excerpts enter text nodes only. */
export function researchView(
  client: ManagementClient,
  root: HTMLElement,
  changed: () => Promise<void>,
  chat: () => string | undefined,
) {
  const selected = new Map<string, boolean>()
  const dialog = createResearchDialog({ client, changed, chat })
  const controls = createResearchControls(dialog.openSettings)
  controls.choice.addEventListener('change', () => {
    const id = chat()
    if (id) selected.set(id, controls.choice.checked)
  })
  root.append(dialog.node)
  return {
    control: controls.control,
    settings: controls.settings,
    sources: dialog.sources,
    enabled(id: string) {
      return selected.get(id) === true
    },
    update(settings: WebSettings, active: boolean) {
      const id = chat()
      controls.choice.checked = !!id && selected.get(id) === true
      controls.choice.disabled = !id || active || (!settings.research?.configured && !controls.choice.checked)
      controls.info.textContent = settings.research?.configured ? 'ⓘ' : 'Chưa cấu hình'
      controls.info.title = settings.research?.configured
        ? controls.label.title
        : 'Chưa cấu hình tìm nguồn công khai. Mở cài đặt để kết nối Tavily.'
      dialog.sources.disabled = !id
    },
  }
}
