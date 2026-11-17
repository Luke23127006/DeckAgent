import type { WorkspaceView } from '@deckagent/host-api'
import { element, icon, iconButton } from './dom.ts'
import { ellipsisIcon, folderIcon } from './workspace-view.ts'

export interface WorkspaceHome {
  readonly node: HTMLElement
  /** Where the composer sits while the page shows, under the name of the workspace. */
  readonly slot: HTMLElement
  /** Draws the page of `workspace` with `chats`, its chat rows, newest first. */
  update(workspace: WorkspaceView, chats: readonly HTMLElement[]): void
}

/**
 * The page of a workspace, like the project page of ChatGPT: the name of the workspace and its folder, a composer for
 * a new chat of it, and the chats of the workspace. `menu` opens the workspace menu (rename, folder, delete) at a point.
 */
export function workspaceHome(menu: (workspaceId: string, x: number, y: number) => void): WorkspaceHome {
  const node = element('section', undefined, 'workspace-home')
  node.hidden = true
  node.setAttribute('aria-labelledby', 'workspace-home-title')
  const name = element('span', '', 'workspace-home-name')
  const title = element('h1')
  title.id = 'workspace-home-title'
  title.append(icon(folderIcon), name)
  let shown: WorkspaceView | undefined
  const options = iconButton('Tùy chọn của workspace', ellipsisIcon, () => {
    if (!shown) return
    const box = options.getBoundingClientRect()
    menu(shown.id, box.left, box.bottom + 6)
  })
  options.className = 'nav-icon workspace-home-options'
  options.setAttribute('aria-haspopup', 'menu')
  const head = element('header', undefined, 'workspace-home-head')
  head.append(title, options)
  const folder = element('p', '', 'workspace-home-folder')
  const slot = element('div', undefined, 'workspace-home-composer')
  const heading = element('h2', 'Chat', 'workspace-home-heading')
  const list = element('ul', undefined, 'workspace-home-chats')
  const empty = element(
    'p',
    'Chưa có chat nào trong workspace này. Gõ vào ô ở trên để bắt đầu.',
    'workspace-home-empty',
  )
  const inner = element('div', undefined, 'workspace-home-inner')
  inner.append(head, folder, slot, heading, list, empty)
  node.append(inner)
  return {
    node,
    slot,
    update(workspace, chats) {
      shown = workspace
      name.textContent = workspace.name
      options.setAttribute('aria-label', `Tùy chọn của workspace ${workspace.name}`)
      folder.textContent =
        workspace.folder ??
        (workspace.isDefault ? 'Workspace mặc định, không có thư mục dự án' : 'Chưa gắn thư mục dự án')
      list.replaceChildren(
        ...chats.map(chat => {
          const item = element('li')
          item.append(chat)
          return item
        }),
      )
      list.hidden = chats.length === 0
      empty.hidden = chats.length > 0
    },
  }
}
