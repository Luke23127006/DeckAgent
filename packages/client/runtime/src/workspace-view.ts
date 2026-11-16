import type { WorkspaceList, WorkspaceView } from '@deckagent/host-api'
import { button, element, icon, iconButton } from './dom.ts'
import { ManagementError } from './management-client.ts'
import type { ManagementClient } from './management-client.ts'
import { tooltip } from './tooltip.ts'

const folderIcon = [
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
]

const composeIcon = [
  'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
  'M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z',
]
const ellipsisIcon = [
  'M5 12m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0',
  'M12 12m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0',
  'M19 12m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0',
]
const pencilIcon = [
  'M12 20h9',
  'M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z',
]
const trashIcon = [
  'M3 6h18',
  'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
  'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  'M10 11v6',
  'M14 11v6',
]

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
 * Workspace list and its changes: a header with an add button, then one row per workspace. A row shows, on hover
 * or focus, a "new chat" button and a menu to rename, change the folder of, or delete that workspace (right-click and the context-menu
 * key open the same menu).
 * Folder paths go only to the authenticated local Host; the browser
 * never reads a folder or a file. Switching keeps the open chat and its draft.
 */
export function workspaceView(
  management: ManagementClient,
  root: HTMLElement,
  changed: (list: WorkspaceList, reloadChats: boolean) => Promise<void>,
  newChatIn: (workspaceId: string) => void,
): WorkspaceControls & { update(list: WorkspaceList): void } {
  const container = element('section', undefined, 'workspace-controls')
  const rows = element('ul', undefined, 'workspace-list')
  const more = button('Hiển thị thêm', () => {
    showAll = !showAll
    renderRows()
  })
  more.className = 'workspace-more'
  more.hidden = true
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
  let showAll = false
  /** The workspace the open menu acts on. */
  let subject: WorkspaceView | undefined
  /** The row whose menu is open, kept visible while the pointer is elsewhere. */
  let menuRow: HTMLElement | undefined
  /** Rows shown before "Hiển thị thêm"; the workspace in use always shows. */
  const visibleLimit = 5

  function current(): WorkspaceView | undefined {
    return list.workspaces.find(item => item.id === list.selectedId)
  }
  function renderRows() {
    const items = list.workspaces
    const shown = showAll ? items : items.filter((item, index) => index < visibleLimit || item.id === list.selectedId)
    rows.replaceChildren(
      ...shown.map(item => {
        const row = element('li')
        const choice = element('button', undefined, 'workspace-row')
        choice.type = 'button'
        choice.dataset.workspaceId = item.id
        choice.title = item.folder ?? 'Workspace mặc định, không có thư mục dự án'
        // Not `aria-current`: the chat list uses that for the open chat, and other code looks for it.
        choice.setAttribute('aria-pressed', String(item.id === list.selectedId))
        const needsCheck = !item.isDefault && item.folderStatus !== 'available'
        choice.append(icon(folderIcon), element('span', item.name, 'workspace-name'))
        if (needsCheck) choice.append(element('span', 'cần kiểm tra', 'workspace-flag'))
        choice.disabled = busy || outside
        choice.addEventListener('click', () => {
          if (item.id !== list.selectedId) change(() => management.selectWorkspace(item.id), false)
        })
        choice.addEventListener('contextmenu', event => {
          event.preventDefault()
          const box = choice.getBoundingClientRect()
          // The context-menu key reports no pointer position: open under the row instead.
          const fromKeyboard = event.clientX === 0 && event.clientY === 0
          openMenu(item, row, fromKeyboard ? box.left + 24 : event.clientX, fromKeyboard ? box.bottom : event.clientY)
        })
        // Shown only while the row is hovered, focused or has its menu open.
        const more = iconButton(`Tùy chọn của workspace ${item.name}`, ellipsisIcon, () => {
          const box = more.getBoundingClientRect()
          openMenu(item, row, box.left, box.bottom + 6)
        })
        more.className = 'nav-icon workspace-options'
        more.setAttribute('aria-haspopup', 'menu')
        const fresh = iconButton(`Chat mới trong workspace ${item.name}`, composeIcon, () => newChatIn(item.id))
        fresh.className = 'nav-icon workspace-new-chat'
        tooltip(fresh, 'Chat mới')
        const tools = element('span', undefined, 'workspace-tools')
        tools.append(more, fresh)
        row.className = 'workspace-item'
        row.append(choice, tools)
        return row
      }),
    )
    more.hidden = items.length <= visibleLimit
    more.textContent = showAll ? 'Thu gọn' : 'Hiển thị thêm'
  }
  function render() {
    closeMenu()
    const selected = current()
    renderRows()
    notice.textContent = folderNotice(selected)
    notice.hidden = !notice.textContent
    adopt.hidden = selected?.folderStatus !== 'different-folder'
    controls()
  }
  function controls() {
    const locked = busy || outside
    const target = subject
    for (const choice of rows.querySelectorAll('button')) choice.disabled = locked
    add.disabled = locked
    rename.disabled = locked || !target
    relink.disabled = locked || !target || target.isDefault
    remove.disabled = locked || !target || target.isDefault
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
    const selected = next.kind === 'add' ? undefined : list.workspaces.find(item => item.id === next.id)
    dialogError.textContent = ''
    if (next.kind === 'rename') {
      heading.textContent = 'Đổi tên workspace'
      help.textContent = 'Tên dài tối đa 100 ký tự. Đổi tên giữ nguyên thư mục dự án và các chat.'
      label.textContent = 'Tên workspace'
      value.value = selected?.name ?? ''
    } else {
      heading.textContent = next.kind === 'add' ? 'Thêm workspace cho một thư mục' : 'Chọn thư mục khác cho workspace'
      help.textContent = ''
      label.textContent = 'Đường dẫn thư mục'
      value.value = next.kind === 'relink' ? (selected?.folder ?? '') : ''
    }
    help.hidden = !help.textContent
    value.setAttribute('aria-label', label.textContent ?? '')
    dialog.showModal()
    value.focus()
  }
  const add = iconButton('Thêm workspace', ['M5 12h14', 'M12 5v14'], () => begin({ kind: 'add' }))
  add.dataset.action = 'add-workspace'
  add.className = 'nav-icon'
  tooltip(add, 'Thêm workspace cho một thư mục')
  const rename = button('Đặt lại tên workspace', () => {
    const id = subject?.id
    closeMenu()
    if (id) begin({ kind: 'rename', id })
  })
  rename.dataset.action = 'rename-workspace'
  const relink = button('Đổi thư mục', () => {
    const id = subject?.id
    closeMenu()
    if (id) begin({ kind: 'relink', id })
  })
  relink.dataset.action = 'relink-workspace'
  const remove = button('Xóa workspace', () => {
    const selected = subject
    closeMenu()
    if (!selected || selected.isDefault || busy) return
    if (
      !confirm(
        `Xóa workspace “${selected.name}”? Thư mục dự án và mọi file trong đó được giữ nguyên. Các chat của workspace được giữ lại trong nhóm “Chat chưa nhóm”, cùng hội thoại, deck và model đã chọn.`,
      )
    )
      return
    change(() => management.removeWorkspace(selected.id), true)
  })
  remove.dataset.action = 'remove-workspace'
  remove.className = 'danger'
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
  // The menu acts on the workspace whose row opened it.
  const menu = element('div', undefined, 'workspace-menu')
  menu.setAttribute('role', 'menu')
  menu.hidden = true
  rename.prepend(icon(pencilIcon))
  relink.prepend(icon(folderIcon))
  remove.prepend(icon(trashIcon))
  for (const item of [rename, relink, remove]) item.setAttribute('role', 'menuitem')
  menu.append(rename, relink, remove)
  function openMenu(target: WorkspaceView, row: HTMLElement, x: number, y: number) {
    if (busy || outside) return
    closeMenu()
    subject = target
    menuRow = row
    row.dataset.menu = 'open'
    controls()
    menu.hidden = false
    const { offsetWidth: width, offsetHeight: height } = menu
    menu.style.left = `${Math.max(8, Math.min(x, innerWidth - width - 8))}px`
    menu.style.top = `${Math.max(8, Math.min(y, innerHeight - height - 8))}px`
    menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }
  function closeMenu(restoreFocus = false) {
    if (menu.hidden) return
    menu.hidden = true
    if (menuRow) delete menuRow.dataset.menu
    menuRow = undefined
    if (restoreFocus)
      for (const choice of rows.querySelectorAll<HTMLElement>('.workspace-row'))
        if (choice.dataset.workspaceId === subject?.id) choice.focus()
  }
  document.addEventListener('pointerdown', event => {
    if (!menu.hidden && !menu.contains(event.target as Node)) closeMenu()
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) closeMenu(true)
  })
  root.append(menu)
  const toggle = button('Workspace', () => {
    const open = rows.hidden
    rows.hidden = !open
    more.hidden = !open || list.workspaces.length <= visibleLimit
    toggle.setAttribute('aria-expanded', String(open))
  })
  toggle.className = 'workspace-toggle'
  toggle.setAttribute('aria-expanded', 'true')
  toggle.append(icon(['m6 9 6 6 6-6']))
  const head = element('div', undefined, 'workspace-head')
  head.append(toggle, add)
  container.append(head, rows, more, notice, adopt, error)
  container.append(
    element(
      'style',
      `.workspace-controls{display:grid;gap:2px;min-width:0;margin:4px 0 8px}
      .workspace-controls>button{font-size:12px;padding:4px 8px}
      .workspace-notice,.workspace-error{font-size:12px;overflow-wrap:anywhere;margin:0}.workspace-error{color:var(--danger,#b42318)}
      .chat-group-heading{font-size:12px;margin:10px 0 4px;opacity:.8}
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
