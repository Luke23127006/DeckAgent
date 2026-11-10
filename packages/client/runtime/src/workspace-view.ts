import type { WorkspaceList, WorkspaceView } from '@deckagent/host-api'
import { button, element, field } from './dom.ts'
import { ManagementError } from './management-client.ts'
import type { ManagementClient } from './management-client.ts'

const refusals: Readonly<Record<string, string>> = {
  'drive-root': 'đây là thư mục gốc của ổ đĩa',
  system: 'đây là thư mục hệ thống của Windows, hoặc chứa thư mục đó',
  'user-folder': 'đây là thư mục người dùng của bạn',
  'key-folder': 'thư mục này chứa khóa hoặc thông tin đăng nhập',
  'deckagent-data': 'thư mục này chứa, hoặc nằm trong, dữ liệu của DeckAgent',
}

/** User-facing text for a refused workspace change: what failed and what to do next. Never a raw message. */
export function workspaceFailure(reason: unknown): string {
  const code = reason instanceof Error ? reason.message : ''
  const detail = reason instanceof ManagementError ? reason.detail : {}
  switch (code) {
    case 'WORKSPACE_FOLDER_REQUIRED':
      return 'Chưa chọn thư mục. Không có workspace nào được thiết lập.'
    case 'WORKSPACE_FOLDER_INVALID':
      return 'Hãy nhập đường dẫn đầy đủ tới thư mục, ví dụ C:\\Users\\ten\\Documents\\du-an.'
    case 'WORKSPACE_FOLDER_UNREADABLE':
      return 'Không đọc được thư mục này. Kiểm tra đường dẫn và quyền truy cập, hoặc chọn thư mục khác.'
    case 'WORKSPACE_FOLDER_REFUSED': {
      const why = typeof detail.reason === 'string' ? refusals[detail.reason] : undefined
      const inside =
        detail.allowInside === true ? ' Bạn có thể chọn một thư mục bên trong nó.' : ' Hãy chọn thư mục khác.'
      return `Thư mục này không thể là thư mục dự án${why ? `: ${why}` : ''}.${inside}`
    }
    case 'WORKSPACE_FOLDER_IN_USE':
      return typeof detail.workspaceName === 'string'
        ? `Workspace “${detail.workspaceName}” đang dùng thư mục này. Hãy chọn workspace đó, hoặc chọn thư mục khác.`
        : 'Một workspace khác đang dùng thư mục này. Hãy chọn workspace đó, hoặc chọn thư mục khác.'
    case 'WORKSPACE_DEFAULT':
      return 'Workspace mặc định không có thư mục dự án và không gỡ được.'
    case 'WORKSPACE_NAME_EMPTY':
      return 'Tên workspace cần ít nhất một ký tự. Tên cũ được giữ nguyên.'
    case 'WORKSPACE_NAME_TOO_LONG':
      return 'Tên workspace dài tối đa 100 ký tự. Tên cũ được giữ nguyên.'
    case 'WORKSPACE_NOT_FOUND':
      return 'Workspace này không còn được thiết lập. Danh sách đã được làm mới.'
    default:
      return 'Không thay đổi được workspace. Kiểm tra kết nối với DeckAgent rồi thử lại.'
  }
}

/** FR-074 and FR-142 notices: name the workspace and say what the user does next; name no unknown cause. */
export function folderNotice(workspace: WorkspaceView | undefined): string {
  if (workspace?.folderStatus === 'unreadable')
    return `Workspace “${workspace.name}”: không đọc được các file của thư mục dự án. Hãy đưa thư mục trở lại, cấp lại quyền đọc, hoặc chọn thư mục khác. Các chat vẫn mở được.`
  if (workspace?.folderStatus === 'different-folder')
    return `Workspace “${workspace.name}”: ở vị trí của thư mục dự án giờ là một thư mục khác. DeckAgent không đọc file nào của thư mục đó. Các chat vẫn mở được.`
  return ''
}

export interface WorkspaceControls {
  readonly node: HTMLElement
  /** Disabled while a chat is opening or created. */
  setBusy(value: boolean): void
}

/**
 * Workspace selector and its changes. Folder paths go only to the authenticated local Host; the browser
 * never reads a folder or a file. Switching keeps the open chat and its draft.
 */
export function workspaceView(
  management: ManagementClient,
  root: HTMLElement,
  changed: (list: WorkspaceList, reloadChats: boolean) => Promise<void>,
): WorkspaceControls & { update(list: WorkspaceList): void } {
  const container = element('section', undefined, 'workspace-controls')
  const select = element('select')
  select.dataset.action = 'select-workspace'
  const notice = element('p', '', 'workspace-notice')
  notice.setAttribute('role', 'status')
  notice.hidden = true
  const adopt = button('Dùng thư mục này', () => {
    const selected = current()
    if (selected?.folder) change(() => management.relinkWorkspace(selected.id, selected.folder!), false)
  })
  adopt.dataset.action = 'adopt-folder'
  adopt.hidden = true
  const error = element('p', '', 'workspace-error')
  error.setAttribute('role', 'alert')
  error.hidden = true
  const dialog = element('dialog', undefined, 'workspace-dialog')
  const form = element('form')
  const heading = element('h2')
  const help = element('p')
  const value = element('input')
  value.autocomplete = 'off'
  value.name = 'workspace-value'
  const label = element('span')
  const valueField = element('label')
  valueField.append(label, value)
  const dialogError = element('p', '', 'workspace-error')
  dialogError.setAttribute('role', 'alert')
  const save = element('button', 'Lưu')
  save.type = 'submit'
  const cancel = button('Hủy', () => dialog.close())
  const dialogActions = element('div', undefined, 'workspace-dialog-actions')
  dialogActions.append(cancel, save)
  form.append(heading, help, valueField, dialogError, dialogActions)
  dialog.append(form)
  root.append(dialog)
  let list: WorkspaceList = { workspaces: [], selectedId: 'default' }
  let busy = false
  let outside = false
  let mode: { kind: 'add' } | { kind: 'relink' | 'rename'; id: string } = { kind: 'add' }

  function current(): WorkspaceView | undefined {
    return list.workspaces.find(item => item.id === list.selectedId)
  }
  function render() {
    const selected = current()
    select.replaceChildren(
      ...list.workspaces.map(item => {
        const suffix = item.isDefault
          ? ' · mặc định'
          : item.folderStatus === 'available'
            ? ''
            : ' · cần kiểm tra thư mục'
        const option = new Option(`${item.name}${suffix}`, item.id)
        if (item.folder) option.title = item.folder
        return option
      }),
    )
    select.value = list.selectedId
    select.title = selected?.folder ?? 'Workspace mặc định, không có thư mục dự án'
    notice.textContent = folderNotice(selected)
    notice.hidden = !notice.textContent
    adopt.hidden = selected?.folderStatus !== 'different-folder'
    controls()
  }
  function controls() {
    const locked = busy || outside
    const selected = current()
    select.disabled = locked
    add.disabled = locked
    rename.disabled = locked || !selected
    relink.disabled = locked || !selected || selected.isDefault
    remove.disabled = locked || !selected || selected.isDefault
    adopt.disabled = locked
  }
  function change(
    work: () => Promise<WorkspaceList>,
    reloadChats: boolean,
    done?: () => void,
    target: HTMLElement = error,
  ) {
    if (busy) return
    busy = true
    error.hidden = true
    dialogError.textContent = ''
    controls()
    work()
      .then(async next => {
        list = next
        render()
        await changed(next, reloadChats)
        done?.()
      })
      .catch(reason => {
        target.hidden = false
        target.textContent = workspaceFailure(reason)
        if (reason instanceof Error && reason.message === 'WORKSPACE_NOT_FOUND')
          management.workspaces().then(
            next => {
              list = next
              render()
            },
            () => {},
          )
      })
      .finally(() => {
        busy = false
        controls()
      })
  }
  function begin(next: typeof mode) {
    if (busy || outside) return
    mode = next
    const selected = current()
    dialogError.textContent = ''
    if (next.kind === 'rename') {
      heading.textContent = 'Đổi tên workspace'
      help.textContent = 'Tên dài tối đa 100 ký tự. Đổi tên giữ nguyên thư mục dự án và các chat.'
      label.textContent = 'Tên workspace'
      value.value = selected?.name ?? ''
    } else {
      heading.textContent = next.kind === 'add' ? 'Thêm workspace cho một thư mục' : 'Chọn thư mục khác cho workspace'
      help.textContent =
        'Nhập đường dẫn đầy đủ của thư mục trên máy này. DeckAgent không đọc file nào của thư mục khi thiết lập, không gửi gì tới model và không ghi gì vào thư mục.'
      label.textContent = 'Đường dẫn thư mục'
      value.value = next.kind === 'relink' ? (selected?.folder ?? '') : ''
    }
    value.setAttribute('aria-label', label.textContent ?? '')
    dialog.showModal()
    value.focus()
  }
  const add = button('+ Thư mục', () => begin({ kind: 'add' }))
  add.dataset.action = 'add-workspace'
  add.title = 'Thêm workspace cho một thư mục'
  const rename = button('Đổi tên', () => {
    const id = current()?.id
    if (id) begin({ kind: 'rename', id })
  })
  rename.dataset.action = 'rename-workspace'
  const relink = button('Đổi thư mục', () => {
    const id = current()?.id
    if (id) begin({ kind: 'relink', id })
  })
  relink.dataset.action = 'relink-workspace'
  const remove = button('Gỡ', () => {
    const selected = current()
    if (!selected || selected.isDefault || busy) return
    if (
      !confirm(
        `Gỡ workspace “${selected.name}”? Thư mục dự án và mọi file trong đó được giữ nguyên. Các chat của workspace được giữ lại trong nhóm “Chat chưa nhóm”, cùng hội thoại, deck và model đã chọn.`,
      )
    )
      return
    change(() => management.removeWorkspace(selected.id), true)
  })
  remove.dataset.action = 'remove-workspace'
  remove.title = 'Gỡ workspace'
  select.addEventListener('change', () => {
    const id = select.value
    select.value = list.selectedId
    if (id !== list.selectedId) change(() => management.selectWorkspace(id), false)
  })
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = value.value
    const target = mode
    if (target.kind === 'add' && !text.trim()) {
      // UC-013 A9: no folder chosen, no workspace set up.
      dialog.close()
      return
    }
    change(
      () =>
        target.kind === 'rename'
          ? management.renameWorkspace(target.id, text)
          : target.kind === 'relink'
            ? management.relinkWorkspace(target.id, text.trim())
            : management.addWorkspace(text.trim()),
      false,
      () => dialog.close(),
      dialogError,
    )
  })
  const actions = element('div', undefined, 'workspace-actions')
  actions.append(add, rename, relink, remove)
  container.append(field('Workspace', select), actions, notice, adopt, error)
  container.append(
    element(
      'style',
      `.workspace-controls{display:grid;gap:6px;min-width:0;margin:4px 0 8px}
      .workspace-controls label{display:grid;gap:4px;font-size:12px}.workspace-controls select{max-width:100%;width:100%;padding:6px}
      .workspace-actions{display:flex;gap:4px;flex-wrap:wrap}.workspace-actions button,.workspace-controls>button{font-size:12px;padding:4px 8px}
      .workspace-notice,.workspace-error{font-size:12px;overflow-wrap:anywhere;margin:0}.workspace-error{color:var(--danger,#b42318)}
      .chat-group-heading{font-size:12px;margin:10px 0 4px;opacity:.8}
      .chat-search{display:flex;gap:4px;margin:4px 0}.chat-search input{flex:1;min-width:0;padding:6px}
      .workspace-dialog{max-width:min(520px,calc(100vw - 32px));box-sizing:border-box;border-radius:12px;padding:20px}
      .workspace-dialog::backdrop{background:#0005}.workspace-dialog form{display:grid;gap:12px}
      .workspace-dialog h2,.workspace-dialog p{margin:0}.workspace-dialog label{display:grid;gap:6px}
      .workspace-dialog input{box-sizing:border-box;width:100%;min-width:0;padding:10px}
      .workspace-dialog-actions{display:flex;gap:8px;justify-content:flex-end}
      .requests-unavailable{font-size:12px;margin:0 0 6px;opacity:.85}`,
    ),
  )
  return {
    node: container,
    update(next) {
      list = next
      render()
    },
    setBusy(value) {
      outside = value
      controls()
    },
  }
}
