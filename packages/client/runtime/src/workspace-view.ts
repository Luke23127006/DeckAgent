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

const folderPlusIcon = [
  'M12 10v6',
  'M9 13h6',
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
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
    case 'FOLDER_PICKER_BUSY':
      return 'Hộp chọn thư mục đang mở. Hãy chọn thư mục trong hộp đó, hoặc đóng nó.'
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

/** The chats that the tree shows under each workspace. `null` is the group of ungrouped chats. */
export interface ChatTree {
  /** The chat rows of one group, newest first, already narrowed by the chat search. */
  rows(workspaceId: string | null): HTMLElement[]
  /** True while the chat search has words: every group unfolds and a group without a match is left out. */
  searching(): boolean
}

const closedKey = 'deckagent-workspaces-closed'
/** Chats a group shows before `Hiển thị thêm`. */
const chatLimit = 5

function storedClosed(): Set<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(closedKey) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set() // Optional layout preference.
  }
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
  chats: ChatTree,
): WorkspaceControls & { update(list: WorkspaceList): void; refresh(): void } {
  const container = element('section', undefined, 'workspace-controls')
  const rows = element('ul', undefined, 'workspace-list')
  const emptyNote = element('p', 'Không có chat nào khớp với các từ đã nhập.', 'workspace-empty')
  emptyNote.hidden = true
  const body = element('div', undefined, 'workspace-body')
  body.append(rows, emptyNote)
  // Folded workspaces, kept per browser like the width of the sidebar. A workspace is open unless it is listed here.
  const closed = storedClosed()
  /** Groups whose chats show in full: a workspace id, or `ungrouped`. */
  const unfolded = new Set<string>()
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
  let mode: { kind: 'add' | 'create' } | { kind: 'relink' | 'rename'; id: string } = { kind: 'add' }
  let showAll = false
  /** True while the folder dialog of the system is open. */
  let picking = false
  /** Moves that are not saved yet, and the chain that saves them in order. */
  let pendingMoves = 0
  let saving: Promise<void> = Promise.resolve()
  /** The workspace being dragged. */
  let dragging: string | undefined
  /** The workspace the open menu acts on. */
  let subject: WorkspaceView | undefined
  /** The row whose menu is open, kept visible while the pointer is elsewhere. */
  let menuRow: HTMLElement | undefined
  /** Rows shown before "Hiển thị thêm"; the workspace in use always shows. */
  const visibleLimit = 5

  function current(): WorkspaceView | undefined {
    return list.workspaces.find(item => item.id === list.selectedId)
  }
  function saveClosed(): void {
    try {
      localStorage.setItem(closedKey, JSON.stringify([...closed]))
    } catch {
      /* Optional layout preference. */
    }
  }
  /** The chats of one group: five, or all of them when the group is unfolded or a search is on. */
  function chatGroup(key: string, all: HTMLElement[]): HTMLElement | undefined {
    if (all.length === 0) return undefined
    const folded = !chats.searching() && !unfolded.has(key) && all.length > chatLimit
    // The open chat stays in view even when it is past the fifth.
    const shown = folded
      ? all.filter((chat, index) => index < chatLimit || chat.getAttribute('aria-current') === 'true')
      : all
    const group = element('div', undefined, 'workspace-chat-group')
    const items = element('ul', undefined, 'workspace-chats')
    for (const chat of shown) {
      const item = element('li')
      item.append(chat)
      items.append(item)
    }
    group.append(items)
    if (!chats.searching() && all.length > chatLimit) {
      const toggleMore = button(folded ? 'Hiển thị thêm' : 'Thu gọn', () => {
        if (unfolded.has(key)) unfolded.delete(key)
        else unfolded.add(key)
        renderRows()
      })
      toggleMore.className = 'workspace-more workspace-more-chats'
      group.append(toggleMore)
    }
    return group
  }
  function renderRows() {
    const searching = chats.searching()
    const cache = new Map<string | null, HTMLElement[]>()
    const chatsOf = (id: string | null): HTMLElement[] => {
      let found = cache.get(id)
      if (!found) {
        found = chats.rows(id)
        cache.set(id, found)
      }
      return found
    }
    const items = list.workspaces
    const base =
      searching || showAll ? items : items.filter((item, index) => index < visibleLimit || item.id === list.selectedId)
    const shown = base.filter(item => !searching || chatsOf(item.id).length > 0)
    const ungrouped = chatsOf(null)
    const groups: HTMLElement[] = shown.map(item => {
      const row = element('li')
      const choice = element('button', undefined, 'workspace-row')
      choice.type = 'button'
      choice.dataset.workspaceId = item.id
      choice.title =
        item.folder ?? (item.isDefault ? 'Workspace mặc định, không có thư mục dự án' : 'Chưa gắn thư mục dự án')
      // Not `aria-current`: the chat list uses that for the open chat, and other code looks for it.
      choice.setAttribute('aria-pressed', String(item.id === list.selectedId))
      const needsCheck = item.folderStatus === 'unreadable' || item.folderStatus === 'different-folder'
      choice.append(icon(folderIcon), element('span', item.name, 'workspace-name'))
      if (needsCheck) choice.append(element('span', 'cần kiểm tra', 'workspace-flag'))
      choice.disabled = busy || outside
      const open = searching || !closed.has(item.id)
      choice.setAttribute('aria-expanded', String(open))
      // A workspace that is not in use becomes the one in use, and opens. The one in use folds or unfolds.
      choice.addEventListener('click', () => {
        if (item.id !== list.selectedId) {
          closed.delete(item.id)
          saveClosed()
          change(() => management.selectWorkspace(item.id), false)
          return
        }
        if (closed.has(item.id)) closed.delete(item.id)
        else closed.add(item.id)
        saveClosed()
        renderRows()
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
      row.dataset.workspaceId = item.id
      // Order: drag the row, or press Alt with the up or down arrow on it.
      row.draggable = !(busy || outside)
      row.addEventListener('dragstart', event => {
        closeMenu()
        dragging = item.id
        row.classList.add('dragging')
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', item.id)
        }
      })
      row.addEventListener('dragend', endDrag)
      choice.setAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown')
      choice.addEventListener('keydown', event => {
        if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
        event.preventDefault()
        const ids = list.workspaces.map(workspace => workspace.id)
        const index = ids.indexOf(item.id)
        if (event.key === 'ArrowUp') {
          const above = ids[index - 1]
          if (above !== undefined) reorder(item.id, above)
        } else if (index >= 0 && index < ids.length - 1) reorder(item.id, ids[index + 2] ?? null)
      })
      // The row and its buttons are one line: the buttons and the gray belong to that line, not to the chats below it.
      const line = element('div', undefined, 'workspace-line')
      line.append(choice, tools)
      row.append(line)
      const group = open ? chatGroup(item.id, chatsOf(item.id)) : undefined
      if (group) row.append(group)
      return row
    })
    // Chats that belong to no workspace: the ones that the `Chat mới` button starts, and those of a deleted workspace.
    if (ungrouped.length) {
      const row = element('li', undefined, 'chat-group')
      row.append(element('h3', 'Chat chưa nhóm', 'chat-group-heading'))
      const group = chatGroup('ungrouped', ungrouped)
      if (group) row.append(group)
      groups.push(row)
    }
    rows.replaceChildren(...groups)
    emptyNote.hidden = !(searching && groups.length === 0)
    more.hidden = searching || items.length <= visibleLimit
    more.textContent = showAll ? 'Thu gọn' : 'Hiển thị thêm'
  }
  function focusRow(id: string): void {
    for (const choice of rows.querySelectorAll<HTMLElement>('.workspace-row'))
      if (choice.dataset.workspaceId === id) choice.focus()
  }
  /** Where a drop at height `y` goes: before the first row whose middle is below it, otherwise last. */
  function dropTarget(y: number): { before: string | null; mark: HTMLElement | undefined; side: 'before' | 'after' } {
    const items = [...rows.querySelectorAll<HTMLElement>('.workspace-item')]
    for (const item of items) {
      const box = item.getBoundingClientRect()
      if (y < box.top + box.height / 2) return { before: item.dataset.workspaceId ?? null, mark: item, side: 'before' }
    }
    // Rows folded away come after the last one that shows.
    const shown = new Set(items.map(item => item.dataset.workspaceId))
    const hidden = list.workspaces.find(workspace => !shown.has(workspace.id))
    return { before: hidden?.id ?? null, mark: items[items.length - 1], side: 'after' }
  }
  function clearMarks(): void {
    for (const item of rows.querySelectorAll<HTMLElement>('.workspace-item')) {
      delete item.dataset.drop
      item.classList.remove('dragging')
    }
  }
  function endDrag(): void {
    dragging = undefined
    clearMarks()
  }
  rows.addEventListener('dragover', event => {
    if (!dragging) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    const target = dropTarget(event.clientY)
    for (const item of rows.querySelectorAll<HTMLElement>('.workspace-item')) delete item.dataset.drop
    if (target.mark) target.mark.dataset.drop = target.side
  })
  rows.addEventListener('drop', event => {
    if (!dragging) return
    event.preventDefault()
    const id = dragging
    const target = dropTarget(event.clientY)
    endDrag()
    reorder(id, target.before)
  })
  /**
   * Places a workspace before another one, or last. The new order shows at once and the moves are saved one
   * after the other. If a move cannot be saved, the list is read again from the Host.
   */
  function reorder(id: string, before: string | null): void {
    if (busy || outside || before === id) return
    const ids = list.workspaces.map(workspace => workspace.id)
    const rest = ids.filter(item => item !== id)
    const at = before === null ? rest.length : rest.indexOf(before)
    if (at < 0 || !ids.includes(id)) return
    const next = [...rest.slice(0, at), id, ...rest.slice(at)]
    if (next.every((item, index) => item === ids[index])) return
    const byId = new Map(list.workspaces.map(workspace => [workspace.id, workspace]))
    list = { ...list, workspaces: next.flatMap(item => byId.get(item) ?? []) }
    error.hidden = true
    show(id)
    pendingMoves++
    saving = saving.then(async () => {
      try {
        const saved = await management.moveWorkspace(id, before)
        pendingMoves--
        // A newer move that is still on its way owns the order on screen.
        if (pendingMoves === 0) {
          list = saved
          show(id)
          await changed(saved, false)
        }
      } catch (reason) {
        pendingMoves--
        error.hidden = false
        error.textContent = workspaceFailure(reason)
        try {
          list = await management.workspaces()
        } catch {
          // The list stays as shown; the error says the order was not saved.
        }
        show(id)
      }
    })
  }
  /** Draws the rows again and keeps the keyboard focus on a row that had it. */
  function show(id: string): void {
    const focused = rows.contains(document.activeElement)
    renderRows()
    if (focused) focusRow(id)
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
    const locked = busy || outside || picking
    const target = subject
    for (const choice of rows.querySelectorAll<HTMLButtonElement>('.workspace-row, .workspace-tools button'))
      choice.disabled = locked
    for (const item of rows.querySelectorAll<HTMLElement>('.workspace-item')) item.draggable = !locked
    add.disabled = locked
    rename.disabled = locked || !target
    relink.disabled = locked || !target || target.isDefault
    remove.disabled = locked || !target || target.isDefault
    adopt.disabled = locked
    confirmCancel.disabled = busy
    confirmDelete.disabled = busy
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
    const targetId = 'id' in next ? next.id : undefined
    const selected = targetId === undefined ? undefined : list.workspaces.find(item => item.id === targetId)
    dialogError.textContent = ''
    if (next.kind === 'rename') {
      heading.textContent = 'Đổi tên workspace'
      help.textContent = 'Tên dài tối đa 100 ký tự. Đổi tên giữ nguyên thư mục dự án và các chat.'
      label.textContent = 'Tên workspace'
      value.value = selected?.name ?? ''
    } else if (next.kind === 'create') {
      heading.textContent = 'Tạo workspace mới'
      help.textContent = 'Workspace chưa có thư mục. Bạn có thể chọn thư mục cho nó sau.'
      label.textContent = 'Tên workspace'
      value.value = ''
    } else {
      heading.textContent =
        next.kind === 'add'
          ? 'Thêm workspace cho một thư mục'
          : selected?.folder
            ? 'Chọn thư mục khác cho workspace'
            : 'Chọn thư mục cho workspace'
      help.textContent = ''
      label.textContent = 'Đường dẫn thư mục'
      value.value = next.kind === 'relink' ? (selected?.folder ?? '') : ''
    }
    help.hidden = !help.textContent
    value.setAttribute('aria-label', label.textContent ?? '')
    dialog.showModal()
    value.focus()
  }
  /**
   * Adding a workspace, or choosing another folder for one, starts in the folder dialog of the system. Closing the
   * dialog sets nothing up (UC-013 A9). If no dialog opens, the user types the full path of the folder instead.
   */
  async function chooseFolder(next: { kind: 'add' } | { kind: 'relink'; id: string }): Promise<void> {
    if (busy || outside || picking) return
    picking = true
    error.hidden = true
    controls()
    let folder: string | null
    try {
      folder = await management.pickWorkspaceFolder()
    } catch (reason) {
      picking = false
      controls()
      const code = reason instanceof Error ? reason.message : ''
      if (code === 'FOLDER_PICKER_UNAVAILABLE' || code === 'FOLDER_PICKER_FAILED') {
        begin(next)
        if (code === 'FOLDER_PICKER_FAILED')
          dialogError.textContent = 'Không mở được hộp chọn thư mục. Hãy nhập đường dẫn đầy đủ của thư mục.'
      } else if (code !== 'FOLDER_PICKER_CANCELLED') {
        error.hidden = false
        error.textContent = workspaceFailure(reason)
      }
      return
    }
    picking = false
    controls()
    if (folder === null) return
    const chosen = folder
    change(
      () => (next.kind === 'add' ? management.addWorkspace(chosen) : management.relinkWorkspace(next.id, chosen)),
      false,
    )
  }
  // The plus button offers two ways: a workspace with a name only, or a folder that exists.
  const addMenu = element('div', undefined, 'workspace-menu')
  addMenu.setAttribute('role', 'menu')
  addMenu.hidden = true
  const newWorkspace = button('Workspace mới…', () => {
    closeAddMenu()
    begin({ kind: 'create' })
  })
  newWorkspace.dataset.action = 'new-workspace'
  newWorkspace.prepend(icon(folderPlusIcon))
  const addFolder = button('Thêm thư mục có sẵn…', () => {
    closeAddMenu()
    chooseFolder({ kind: 'add' })
  })
  addFolder.dataset.action = 'add-folder-workspace'
  addFolder.prepend(icon(folderIcon))
  for (const item of [newWorkspace, addFolder]) item.setAttribute('role', 'menuitem')
  addMenu.append(newWorkspace, addFolder)
  const add = iconButton('Thêm workspace', ['M5 12h14', 'M12 5v14'], () =>
    addMenu.hidden ? openAddMenu() : closeAddMenu(true),
  )
  add.dataset.action = 'add-workspace'
  add.className = 'nav-icon'
  add.setAttribute('aria-haspopup', 'menu')
  add.setAttribute('aria-expanded', 'false')
  tooltip(add, 'Thêm workspace')
  function openAddMenu() {
    if (busy || outside || picking) return
    closeMenu()
    addMenu.hidden = false
    add.setAttribute('aria-expanded', 'true')
    const box = add.getBoundingClientRect()
    const width = addMenu.offsetWidth
    addMenu.style.top = `${box.bottom + 6}px`
    addMenu.style.left = `${Math.max(8, Math.min(box.right - width, innerWidth - width - 8))}px`
    newWorkspace.focus()
  }
  function closeAddMenu(restoreFocus = false) {
    if (addMenu.hidden) return
    addMenu.hidden = true
    add.setAttribute('aria-expanded', 'false')
    if (restoreFocus) add.focus()
  }
  document.addEventListener('pointerdown', event => {
    if (!addMenu.hidden && !addMenu.contains(event.target as Node) && !add.contains(event.target as Node))
      closeAddMenu()
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !addMenu.hidden) closeAddMenu(true)
  })
  root.append(addMenu)
  const rename = button('Đặt lại tên workspace', () => {
    const id = subject?.id
    closeMenu()
    if (id) begin({ kind: 'rename', id })
  })
  rename.dataset.action = 'rename-workspace'
  const relink = button('', () => {
    const id = subject?.id
    closeMenu()
    if (id) chooseFolder({ kind: 'relink', id })
  })
  const relinkText = element('span', 'Đổi thư mục')
  relink.append(relinkText)
  relink.dataset.action = 'relink-workspace'
  // Deleting asks first, in a dialog that states what stays. It cannot be dismissed while the request runs.
  let removing: WorkspaceView | undefined
  const confirmDialog = element('dialog', undefined, 'workspace-dialog workspace-confirm')
  const confirmHeading = element('h2')
  const confirmList = element('ul', undefined, 'workspace-consequences')
  for (const text of [
    'Workspace rời khỏi danh sách.',
    'Thư mục dự án và mọi file trong đó được giữ nguyên.',
    'Các chat của workspace được giữ lại trong nhóm “Chat chưa nhóm”, cùng hội thoại, deck và model đã chọn.',
  ])
    confirmList.append(element('li', text))
  const confirmError = element('p', '', 'workspace-error')
  confirmError.setAttribute('role', 'alert')
  const confirmCancel = button('Hủy', () => confirmDialog.close())
  const confirmDelete = button('Xóa workspace', () => {
    const target = removing
    if (!target || busy) return
    change(
      () => management.removeWorkspace(target.id),
      true,
      () => confirmDialog.close(),
      confirmError,
    )
  })
  confirmDelete.className = 'danger'
  confirmDelete.dataset.action = 'confirm-remove-workspace'
  const confirmActions = element('div', undefined, 'workspace-dialog-actions')
  confirmActions.append(confirmCancel, confirmDelete)
  const confirmForm = element('form')
  confirmForm.append(confirmHeading, confirmList, confirmError, confirmActions)
  confirmForm.addEventListener('submit', event => event.preventDefault())
  confirmDialog.append(confirmForm)
  confirmDialog.addEventListener('cancel', event => {
    if (busy) event.preventDefault()
  })
  // `close` arrives after the dialog closed, possibly after it opened again for another workspace.
  confirmDialog.addEventListener('close', () => {
    if (!confirmDialog.open) confirmError.textContent = ''
  })
  root.append(confirmDialog)
  const remove = button('Xóa workspace', () => {
    const selected = subject
    closeMenu()
    if (!selected || selected.isDefault || busy) return
    removing = selected
    confirmHeading.textContent = `Xóa workspace “${selected.name}”?`
    confirmError.textContent = ''
    confirmDialog.showModal()
    confirmCancel.focus()
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
            : target.kind === 'create'
              ? management.createWorkspace(text)
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
    // A workspace that has no folder yet is given one; another one changes its folder.
    relinkText.textContent = target.folder === null && !target.isDefault ? 'Chọn thư mục' : 'Đổi thư mục'
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
    const open = body.hidden
    body.hidden = !open
    more.hidden = !open || chats.searching() || list.workspaces.length <= visibleLimit
    toggle.setAttribute('aria-expanded', String(open))
  })
  toggle.className = 'workspace-toggle'
  toggle.setAttribute('aria-expanded', 'true')
  toggle.append(icon(['m6 9 6 6 6-6']))
  const head = element('div', undefined, 'workspace-head')
  head.append(toggle, add)
  container.append(head, body, more, notice, adopt, error)
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
      .workspace-consequences{margin:0;padding-left:20px;display:grid;gap:6px}.workspace-dialog button.danger{color:var(--danger,#b42318)}
      .requests-unavailable{font-size:12px;margin:0 0 6px;opacity:.85}`,
    ),
  )
  return {
    node: container,
    update(next) {
      list = next
      render()
    },
    /** The chats changed: draw the groups again. */
    refresh() {
      renderRows()
      controls()
    },
    setBusy(value) {
      outside = value
      controls()
    },
  }
}
