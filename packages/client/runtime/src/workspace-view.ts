import type { WebSession, Workspace } from '@deckagent/host-api'
import { button, element, field } from './dom.ts'
import type { ManagementClient } from './management-client.ts'

const errors: Readonly<Record<string, string>> = {
  WORKSPACE_BUSY: 'Workspace có yêu cầu đang chạy hoặc chờ trả lời. Hãy đợi kết thúc hoặc dừng yêu cầu trước.',
  WORKSPACE_FOLDER_EXISTS: 'Một workspace khác đang dùng thư mục này. Hãy chọn workspace đó.',
  WORKSPACE_FOLDER_IN_USE: 'Một workspace khác đang dùng thư mục này. Hãy chọn workspace đó.',
  WORKSPACE_FOLDER_UNAVAILABLE: 'Không thể đọc thư mục. Kiểm tra đường dẫn và quyền truy cập rồi thử lại.',
  WORKSPACE_STORAGE_OVERLAP: 'Thư mục dự án phải tách biệt với dữ liệu nội bộ của DeckAgent. Hãy chọn thư mục khác.',
  INVALID_WORKSPACE: 'Thư mục chưa hợp lệ. Hãy nhập đường dẫn tuyệt đối tới thư mục dự án.',
  WORKSPACE_NOT_FOUND: 'Workspace không còn được thiết lập. Hãy làm mới danh sách.',
}

/** Folder paths are sent only to the authenticated Host; the browser never reads files. */
export function workspaceView(
  management: ManagementClient,
  root: HTMLElement,
  actions: {
    readonly select: (id: string) => Promise<void>
    readonly changed: (selectedId: string) => Promise<void>
  },
) {
  const container = element('section', undefined, 'workspace-controls')
  const select = element('select')
  select.setAttribute('aria-label', 'Workspace')
  const notice = element('p', '', 'workspace-notice')
  notice.setAttribute('role', 'status')
  notice.hidden = true
  const error = element('p', '', 'workspace-error')
  error.setAttribute('role', 'alert')
  error.hidden = true
  let records: readonly Workspace[] = []
  let selectedId = 'default'
  let busy = false
  let blocked = false
  let available = false
  let optionsSignature = ''
  const dialog = element('dialog', undefined, 'workspace-dialog')
  const form = element('form')
  const heading = element('h2')
  const path = element('input')
  path.required = true
  path.name = 'projectFolder'
  path.autocomplete = 'off'
  const help = element(
    'p',
    'Nhập đường dẫn tuyệt đối tới thư mục trên máy đang chạy DeckAgent. Việc chọn thư mục không gửi tài liệu đến model.',
  )
  const dialogError = element('p')
  dialogError.setAttribute('role', 'alert')
  const submit = element('button', 'Lưu workspace')
  submit.type = 'submit'
  form.append(
    heading,
    help,
    field('Project folder path', path),
    dialogError,
    submit,
    button('Hủy', () => dialog.close()),
  )
  dialog.append(form)
  root.append(dialog)
  let editingId: string | undefined

  function updateControls() {
    select.disabled = busy || blocked
    add.disabled = busy || blocked
    const selected = records.find(item => item.id === selectedId)
    const locked = busy || !selected || selected.id === 'default'
    remove.disabled = locked
    repoint.disabled = locked
  }
  function fail(reason: unknown, target: HTMLElement = error) {
    target.hidden = false
    const code = reason instanceof Error ? reason.message : ''
    target.textContent = errors[code] ?? 'Không thể thay đổi workspace. Kiểm tra thư mục, kết nối với Host rồi thử lại.'
  }
  function begin(id?: string) {
    if (busy || blocked) return
    editingId = id
    heading.textContent = id ? 'Đổi thư mục dự án' : 'Thêm workspace'
    path.value = id ? (records.find(item => item.id === id)?.projectFolder ?? '') : ''
    dialogError.textContent = ''
    dialog.showModal()
    path.focus()
  }
  const add = button('+ Workspace', () => begin())
  add.dataset.action = 'add-workspace'
  const repoint = button('Đổi thư mục', () => begin(selectedId))
  repoint.dataset.action = 'repoint-workspace'
  const remove = button('Gỡ workspace', () => {
    if (busy) return
    const selected = records.find(item => item.id === selectedId)
    if (!selected || selected.id === 'default') return
    if (
      !confirm(
        `Gỡ workspace “${selected.name}”? Thư mục và mọi file được giữ nguyên. Các chat, conversation và deck được giữ trong nhóm Ungrouped.`,
      )
    )
      return
    busy = true
    updateControls()
    error.hidden = true
    management
      .removeWorkspace(selected.id)
      .then(() => actions.changed('default'))
      .catch(reason => fail(reason))
      .finally(() => {
        busy = false
        updateControls()
      })
  })
  remove.dataset.action = 'remove-workspace'
  select.addEventListener('change', () => {
    const id = select.value
    select.value = selectedId
    busy = true
    updateControls()
    error.hidden = true
    actions
      .select(id)
      .catch(reason => fail(reason))
      .finally(() => {
        busy = false
        updateControls()
      })
  })
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (busy || !path.reportValidity()) return
    busy = true
    submit.disabled = true
    updateControls()
    const change = editingId
      ? management.repointWorkspace(editingId, path.value.trim())
      : management.addWorkspace(path.value.trim())
    change
      .then(async result => {
        await actions.changed(result.id)
        dialog.close()
      })
      .catch(reason => fail(reason, dialogError))
      .finally(() => {
        busy = false
        submit.disabled = false
        updateControls()
      })
  })
  const controls = element('div', undefined, 'workspace-actions')
  controls.append(add, repoint, remove)
  container.append(field('Workspace', select), controls, notice, error)
  container.hidden = true
  const style = element(
    'style',
    `
    .workspace-controls{display:grid;gap:8px;min-width:0}
    .workspace-controls label{display:grid;gap:4px}.workspace-controls select{max-width:100%;width:100%;padding:7px}
    .workspace-actions{display:flex;gap:5px;flex-wrap:wrap}.workspace-actions button{font-size:12px;padding:6px}
    .workspace-notice,.workspace-error{font-size:12px;overflow-wrap:anywhere;margin:0}
    .workspace-group h3{font-size:12px;margin:12px 0 6px;overflow-wrap:anywhere}
    .workspace-dialog{max-width:min(520px,calc(100vw - 32px));box-sizing:border-box;border:1px solid #ccc;border-radius:12px;padding:20px}
    .workspace-dialog::backdrop{background:#0005}.workspace-dialog form{display:grid;gap:12px}
    .workspace-dialog h2,.workspace-dialog p{margin:0}.workspace-dialog label{display:grid;gap:6px}
    .workspace-dialog input{box-sizing:border-box;width:100%;min-width:0;padding:10px}
  `,
  )
  container.append(style)
  return {
    element: container,
    update(
      workspaces: readonly Workspace[] | undefined,
      id: string,
      sessions: readonly WebSession[],
      switchingBlocked: boolean,
    ) {
      available = workspaces !== undefined
      records = workspaces ?? []
      selectedId = id
      blocked = switchingBlocked
      container.hidden = !available
      const ungrouped = sessions.some(item => item.workspaceId === undefined)
      const signature = JSON.stringify([records, ungrouped])
      if (optionsSignature !== signature) {
        optionsSignature = signature
        select.replaceChildren()
        for (const item of records)
          select.append(
            new Option(`${item.name}${item.state === 'missing' ? ' · Không thể đọc thư mục' : ''}`, item.id),
          )
        if (ungrouped) select.append(new Option('Ungrouped', 'ungrouped'))
      }
      select.value = selectedId
      const selected = records.find(item => item.id === selectedId)
      notice.hidden = selected?.state !== 'missing'
      notice.textContent =
        selected?.state === 'missing'
          ? `Workspace ${selected.name}: không thể đọc thư mục dự án. Đưa thư mục trở lại, cấp quyền đọc hoặc chọn thư mục khác. Chat và deck vẫn mở được.`
          : ''
      updateControls()
    },
  }
}
