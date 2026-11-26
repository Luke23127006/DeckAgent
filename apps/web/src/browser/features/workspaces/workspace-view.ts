import type { WorkspaceList, WorkspaceView } from '@deckagent/host-contracts'
import { button, element, field } from '../../dom.ts'
import { ManagementError } from '../../transport/index.ts'
import type { ManagementClient } from '../../transport/index.ts'

const refusals: Readonly<Record<string, string>> = {
  'drive-root': 'đây là thư mục gốc của ổ đĩa',
  system: 'đây là thư mục hệ thống của Windows, hoặc chứa thư mục đó',
  'user-folder': 'đây là thư mục người dùng của bạn',
  'key-folder': 'thư mục này chứa khóa hoặc thông tin đăng nhập',
  'deckagent-data': 'thư mục này chứa, hoặc nằm trong, dữ liệu của DeckAgent',
}

/** User-facing text for a refused workspace change: what failed and what to do next. Never a raw message. */
function workspaceFailure(reason: unknown): string {
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
    case 'WORKSPACES_STALE':
      return 'Danh sách workspace vừa thay đổi ở nơi khác. Danh sách đã được làm mới, hãy kiểm tra rồi thử lại.'
    default:
      return 'Không thay đổi được workspace. Kiểm tra kết nối với DeckAgent rồi thử lại.'
  }
}

/** FR-074 and FR-142 notices: name the workspace and say what the user does next; name no unknown cause. */
function folderNotice(workspace: WorkspaceView | undefined): string {
  if (workspace?.folderStatus === 'unreadable')
    return `Workspace “${workspace.name}”: không đọc được các file của thư mục dự án. Hãy đưa thư mục trở lại, cấp lại quyền đọc, hoặc chọn thư mục khác. Các chat vẫn mở được.`
  if (workspace?.folderStatus === 'different-folder')
    return `Workspace “${workspace.name}”: ở vị trí của thư mục dự án giờ là một thư mục khác. DeckAgent không đọc file nào của thư mục đó. Các chat vẫn mở được.`
  return ''
}

const workspaceStyles = `.workspace-controls{display:grid;gap:6px;min-width:0;margin:4px 0 8px}
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
      .requests-unavailable{font-size:12px;margin:0 0 6px;opacity:.85}`

type WorkspaceDialogMode = { kind: 'add' } | { kind: 'relink' | 'rename'; id: string }

interface WorkspaceState {
  list: WorkspaceList
  busy: boolean
  outside: boolean
  mode: WorkspaceDialogMode
}

interface WorkspaceDom {
  readonly container: HTMLElement
  readonly select: HTMLSelectElement
  readonly notice: HTMLElement
  readonly adopt: HTMLButtonElement
  readonly error: HTMLElement
  readonly dialog: HTMLDialogElement
  readonly form: HTMLFormElement
  readonly heading: HTMLElement
  readonly help: HTMLElement
  readonly value: HTMLInputElement
  readonly label: HTMLElement
  readonly dialogError: HTMLElement
  readonly add: HTMLButtonElement
  readonly rename: HTMLButtonElement
  readonly relink: HTMLButtonElement
  readonly remove: HTMLButtonElement
}

type WorkspaceChange = (
  work: () => Promise<WorkspaceList>,
  reloadChats: boolean,
  done?: () => void,
  target?: HTMLElement,
) => void

function actionButton(text: string, action: string, title?: string): HTMLButtonElement {
  const node = element('button', text)
  node.type = 'button'
  node.dataset.action = action
  if (title) node.title = title
  return node
}

function createWorkspaceDom(root: HTMLElement): WorkspaceDom {
  const container = element('section', undefined, 'workspace-controls')
  const select = element('select')
  select.dataset.action = 'select-workspace'
  const notice = element('p', '', 'workspace-notice')
  notice.setAttribute('role', 'status')
  notice.hidden = true
  const adopt = actionButton('Dùng thư mục này', 'adopt-folder')
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
  const add = actionButton('+ Thư mục', 'add-workspace', 'Thêm workspace cho một thư mục')
  const rename = actionButton('Đổi tên', 'rename-workspace')
  const relink = actionButton('Đổi thư mục', 'relink-workspace')
  const remove = actionButton('Gỡ', 'remove-workspace', 'Gỡ workspace')
  const actions = element('div', undefined, 'workspace-actions')
  actions.append(add, rename, relink, remove)
  container.append(field('Workspace', select), actions, notice, adopt, error, element('style', workspaceStyles))
  return {
    container,
    select,
    notice,
    adopt,
    error,
    dialog,
    form,
    heading,
    help,
    value,
    label,
    dialogError,
    add,
    rename,
    relink,
    remove,
  }
}

function currentWorkspace(list: WorkspaceList): WorkspaceView | undefined {
  return list.workspaces.find(item => item.id === list.selectedId)
}

function updateWorkspaceControls(dom: WorkspaceDom, state: WorkspaceState): void {
  const locked = state.busy || state.outside
  const selected = currentWorkspace(state.list)
  dom.select.disabled = locked
  dom.add.disabled = locked
  dom.rename.disabled = locked || !selected
  dom.relink.disabled = locked || !selected || selected.isDefault
  dom.remove.disabled = locked || !selected || selected.isDefault
  dom.adopt.disabled = locked
}

function renderWorkspaceList(dom: WorkspaceDom, state: WorkspaceState): void {
  const selected = currentWorkspace(state.list)
  dom.select.replaceChildren(
    ...state.list.workspaces.map(item => {
      const suffix = item.isDefault ? ' · mặc định' : item.folderStatus === 'available' ? '' : ' · cần kiểm tra thư mục'
      const option = new Option(`${item.name}${suffix}`, item.id)
      if (item.folder) option.title = item.folder
      return option
    }),
  )
  dom.select.value = state.list.selectedId
  dom.select.title = selected?.folder ?? 'Workspace mặc định, không có thư mục dự án'
  dom.notice.textContent = folderNotice(selected)
  dom.notice.hidden = !dom.notice.textContent
  dom.adopt.hidden = selected?.folderStatus !== 'different-folder'
  updateWorkspaceControls(dom, state)
}

function runWorkspaceChange(
  management: ManagementClient,
  changed: (list: WorkspaceList, reloadChats: boolean) => Promise<void>,
  dom: WorkspaceDom,
  state: WorkspaceState,
  work: () => Promise<WorkspaceList>,
  reloadChats: boolean,
  done: (() => void) | undefined,
  target: HTMLElement,
): void {
  if (state.busy) return
  state.busy = true
  dom.error.hidden = true
  dom.dialogError.textContent = ''
  updateWorkspaceControls(dom, state)
  work()
    .then(async next => {
      state.list = next
      renderWorkspaceList(dom, state)
      await changed(next, reloadChats)
      done?.()
    })
    .catch(reason => {
      target.hidden = false
      target.textContent = workspaceFailure(reason)
      if (
        reason instanceof Error &&
        (reason.message === 'WORKSPACE_NOT_FOUND' || reason.message === 'WORKSPACES_STALE')
      )
        management.workspaces().then(
          async next => {
            state.list = next
            renderWorkspaceList(dom, state)
            await changed(next, false)
          },
          () => {},
        )
    })
    .finally(() => {
      state.busy = false
      updateWorkspaceControls(dom, state)
    })
}

function openWorkspaceDialog(dom: WorkspaceDom, state: WorkspaceState, next: WorkspaceDialogMode): void {
  if (state.busy || state.outside) return
  state.mode = next
  const selected = currentWorkspace(state.list)
  dom.dialogError.textContent = ''
  if (next.kind === 'rename') {
    dom.heading.textContent = 'Đổi tên workspace'
    dom.help.textContent = 'Tên dài tối đa 100 ký tự. Đổi tên giữ nguyên thư mục dự án và các chat.'
    dom.label.textContent = 'Tên workspace'
    dom.value.value = selected?.name ?? ''
  } else {
    dom.heading.textContent = next.kind === 'add' ? 'Thêm workspace cho một thư mục' : 'Chọn thư mục khác cho workspace'
    dom.help.textContent =
      'Nhập đường dẫn đầy đủ của thư mục trên máy này. DeckAgent không đọc file nào của thư mục khi thiết lập, không gửi gì tới model và không ghi gì vào thư mục.'
    dom.label.textContent = 'Đường dẫn thư mục'
    dom.value.value = next.kind === 'relink' ? (selected?.folder ?? '') : ''
  }
  dom.value.setAttribute('aria-label', dom.label.textContent ?? '')
  dom.dialog.showModal()
  dom.value.focus()
}

function removeSelectedWorkspace(management: ManagementClient, state: WorkspaceState, change: WorkspaceChange): void {
  const selected = currentWorkspace(state.list)
  if (!selected || selected.isDefault || state.busy) return
  if (
    !confirm(
      `Gỡ workspace “${selected.name}”? Thư mục dự án và mọi file trong đó được giữ nguyên. Các chat của workspace được giữ lại trong nhóm “Chat chưa nhóm”, cùng hội thoại, deck và model đã chọn.`,
    )
  )
    return
  change(() => management.removeWorkspace(selected.id, state.list.version), true)
}

function submitWorkspaceDialog(
  event: SubmitEvent,
  management: ManagementClient,
  dom: WorkspaceDom,
  state: WorkspaceState,
  change: WorkspaceChange,
): void {
  event.preventDefault()
  const text = dom.value.value
  const target = state.mode
  if (target.kind === 'add' && !text.trim()) {
    // UC-013 A9: no folder chosen, no workspace set up.
    dom.dialog.close()
    return
  }
  change(
    () =>
      target.kind === 'rename'
        ? management.renameWorkspace(target.id, text, state.list.version)
        : target.kind === 'relink'
          ? management.relinkWorkspace(target.id, text.trim(), state.list.version)
          : management.addWorkspace(text.trim(), state.list.version),
    false,
    () => dom.dialog.close(),
    dom.dialogError,
  )
}

function mountWorkspaceActions(input: {
  readonly management: ManagementClient
  readonly dom: WorkspaceDom
  readonly state: WorkspaceState
  readonly change: WorkspaceChange
}): void {
  const { management, dom, state, change } = input
  dom.adopt.addEventListener('click', () => {
    const selected = currentWorkspace(state.list)
    const folder = selected?.folder
    if (selected && folder) change(() => management.relinkWorkspace(selected.id, folder, state.list.version), false)
  })
  dom.add.addEventListener('click', () => openWorkspaceDialog(dom, state, { kind: 'add' }))
  dom.rename.addEventListener('click', () => {
    const id = currentWorkspace(state.list)?.id
    if (id) openWorkspaceDialog(dom, state, { kind: 'rename', id })
  })
  dom.relink.addEventListener('click', () => {
    const id = currentWorkspace(state.list)?.id
    if (id) openWorkspaceDialog(dom, state, { kind: 'relink', id })
  })
  dom.remove.addEventListener('click', () => removeSelectedWorkspace(management, state, change))
  dom.select.addEventListener('change', () => {
    const id = dom.select.value
    dom.select.value = state.list.selectedId
    if (id !== state.list.selectedId) change(() => management.selectWorkspace(id, state.list.version), false)
  })
  dom.form.addEventListener('submit', event => submitWorkspaceDialog(event, management, dom, state, change))
}

/**
 * Workspace selector and its changes. Folder paths go only to the authenticated local Host; the browser
 * never reads a folder or a file. Switching keeps the open chat and its draft.
 */
export function workspaceView(
  management: ManagementClient,
  root: HTMLElement,
  changed: (list: WorkspaceList, reloadChats: boolean) => Promise<void>,
): { readonly node: HTMLElement; setBusy(value: boolean): void; update(list: WorkspaceList): void } {
  const dom = createWorkspaceDom(root)
  const state: WorkspaceState = {
    list: { workspaces: [], selectedId: 'default', version: 0 },
    busy: false,
    outside: false,
    mode: { kind: 'add' },
  }
  const change: WorkspaceChange = (work, reloadChats, done, target = dom.error) =>
    runWorkspaceChange(management, changed, dom, state, work, reloadChats, done, target)
  mountWorkspaceActions({ management, dom, state, change })
  return {
    node: dom.container,
    update(next) {
      state.list = next
      renderWorkspaceList(dom, state)
    },
    setBusy(value) {
      state.outside = value
      updateWorkspaceControls(dom, state)
    },
  }
}
