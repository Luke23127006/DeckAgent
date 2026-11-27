import { element } from './dom.ts'

/** The places in the navigation where React renders the workspace controls, the chat search and the chat list. */
export interface ShellSlots {
  readonly workspaces: HTMLElement
  readonly search: HTMLElement
  readonly chats: HTMLElement
}

export class ShellDom {
  readonly navigation = element('aside', undefined, 'chat-navigation')
  readonly chats: HTMLElement
  readonly conversation = element('section', undefined, 'conversation')
  readonly heading = element('header', undefined, 'conversation-header')
  readonly title = element('h1', 'Chat mới')
  readonly headerState = element('small', '', 'chat-state')
  readonly welcome = element('section', undefined, 'welcome')
  readonly welcomeTitle = element('h2', 'Bạn muốn trao đổi điều gì?')
  readonly welcomeDetail = element(
    'p',
    'Gửi tin nhắn hoặc thêm tài liệu. Chọn Tạo deck ở trên khi bạn muốn làm bài trình bày.',
  )
  readonly model = element('select')
  readonly status = element('p', '', 'request-status')
  readonly messages = element('div', undefined, 'messages')
  readonly outlineDock = element('section', undefined, 'outline-dock')
  readonly form = element('form', undefined, 'composer')
  readonly input = element('textarea')
  readonly submit = element('button', '', 'send-action')
  readonly stopRequest = element('button', 'Dừng', 'stop-action')
  readonly deck = element('aside', undefined, 'deck-sidebar')
  readonly publishedDeck = element('aside', undefined, 'deck-sidebar published-deck-sidebar')
  readonly unavailable = element('p', '', 'requests-unavailable')
  readonly newChatButton = element('button', 'Chat mới')
  readonly navigationHint = element(
    'p',
    'Yêu cầu vẫn chạy khi bạn mở chat khác; quay lại chat này để xem tiến độ.',
    'navigation-hint',
  )
  readonly recents = element('button', 'Gần đây', 'recents-toggle')
  readonly navTop = element('div', undefined, 'nav-top')
  readonly navToggle = element('button', '', 'nav-toggle')
  readonly accountMenu = element('div', undefined, 'account-menu')
  readonly accountTrigger = element('button', '', 'account-trigger')
  readonly openDeck = element('button', 'Mở deck')
  readonly retryGeneration = element('button', 'Thử bắt đầu tạo deck')
  readonly reconnect = element('button', 'Kết nối lại / đọc lịch sử')
  readonly composerActions = element('div', undefined, 'composer-actions')
  readonly composerControls = element('div', undefined, 'composer-controls')
  readonly primaryAction = element('div', undefined, 'composer-primary')
  private readonly compactNavigation = matchMedia('(max-width:720px)')
  private navigationSize: ResizeObserver | undefined
  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.closeAccountMenu(true)
  }
  private readonly onDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target
    if (!(target instanceof Node)) return
    if (!this.accountMenu.hidden && !this.accountMenu.contains(target) && !this.accountTrigger.contains(target))
      this.closeAccountMenu()
  }
  private readonly onCompactNavigationChange = (): void => {
    this.foldRecents()
    this.changed()
  }

  constructor(
    readonly root: HTMLElement,
    private readonly slots: ShellSlots,
    private readonly changed: () => void,
  ) {
    this.chats = slots.chats
    root.replaceChildren()
    this.recents.addEventListener('click', () => {
      this.chats.hidden = !this.chats.hidden
      this.recents.setAttribute('aria-expanded', String(!this.chats.hidden))
      changed()
    })
    this.compactNavigation.addEventListener('change', this.onCompactNavigationChange)
    this.navToggle.addEventListener('click', () => this.setNavigation(this.root.dataset.nav !== 'collapsed'))
    this.accountTrigger.addEventListener('click', () =>
      this.accountMenu.hidden ? this.openAccountMenu() : this.closeAccountMenu(),
    )
    this.openDeck.addEventListener('click', () => {
      this.deck.hidden = true
      this.publishedDeck.hidden = false
      this.openDeck.hidden = true
    })
    this.configure()
    this.foldRecents()
  }

  private configure(): void {
    this.chats.setAttribute('aria-label', 'Lịch sử chat')
    this.chats.id = 'recent-chats'
    this.headerState.setAttribute('aria-live', 'polite')
    this.welcome.hidden = true
    this.welcome.append(this.welcomeTitle, this.welcomeDetail)
    this.model.disabled = true
    this.model.setAttribute('aria-label', 'Model đã chọn')
    this.status.setAttribute('role', 'status')
    this.status.hidden = true
    this.messages.setAttribute('aria-label', 'Hội thoại')
    this.outlineDock.hidden = true
    this.form.noValidate = true
    this.form.dataset.slot = 'request'
    this.input.name = 'input'
    this.input.required = true
    this.input.placeholder = 'Nhập hoặc dán yêu cầu của bạn…'
    this.input.setAttribute('aria-label', 'Nội dung yêu cầu')
    this.submit.setAttribute('aria-label', 'Gửi yêu cầu')
    this.submit.title = 'Gửi yêu cầu (Enter)'
    this.submit.type = 'submit'
    this.submit.disabled = true
    this.stopRequest.type = 'button'
    this.stopRequest.setAttribute('aria-label', 'Dừng yêu cầu')
    this.stopRequest.title = 'Dừng yêu cầu'
    this.stopRequest.hidden = true
    this.deck.hidden = true
    this.publishedDeck.hidden = true
    this.unavailable.setAttribute('role', 'note')
    this.newChatButton.type = 'button'
    this.newChatButton.dataset.action = 'new-chat'
    this.newChatButton.title = 'Chat mới'
    this.navigationHint.hidden = true
    this.recents.setAttribute('aria-expanded', 'true')
    this.recents.setAttribute('aria-controls', 'recent-chats')
    this.navTop.append(element('div', 'DeckAgent', 'wordmark'), this.navToggle)
    this.configureAccountMenu()
    this.configureComposer()
    this.mount()
  }

  private configureAccountMenu(): void {
    this.accountMenu.id = 'account-menu'
    this.accountMenu.setAttribute('role', 'menu')
    this.accountMenu.setAttribute('aria-label', 'Cài đặt và công cụ')
    this.accountMenu.hidden = true
    this.accountTrigger.title = 'Cài đặt'
    this.accountTrigger.setAttribute('aria-haspopup', 'menu')
    this.accountTrigger.setAttribute('aria-controls', 'account-menu')
    this.accountTrigger.setAttribute('aria-expanded', 'false')
    this.accountTrigger.append(
      element('span', undefined, 'account-avatar'),
      element('span', 'Cài đặt', 'account-label'),
    )
    // The menu closes on Escape and on any press outside it, like the model popover.
    document.addEventListener('keydown', this.onDocumentKeydown)
    document.addEventListener('pointerdown', this.onDocumentPointerDown)
  }

  private configureComposer(): void {
    const headingText = element('div', undefined, 'chat-heading')
    headingText.append(this.title, this.headerState)
    this.retryGeneration.type = 'button'
    this.retryGeneration.title = 'Thử bắt đầu với Outline đã xác nhận; không tạo một lần xác nhận mới.'
    this.retryGeneration.hidden = true
    this.openDeck.hidden = true
    const headingActions = element('div', undefined, 'chat-heading-actions')
    headingActions.append(this.openDeck, this.retryGeneration)
    this.heading.append(headingText, headingActions)
    this.reconnect.type = 'button'
    this.reconnect.id = 'reconnect'
    this.primaryAction.append(this.submit, this.stopRequest)
    this.composerActions.append(this.composerControls, this.primaryAction)
    this.form.append(this.unavailable, this.input, this.composerActions)
    const dock = element('div', undefined, 'composer-dock')
    dock.append(this.outlineDock, this.form)
    this.conversation.append(this.heading, this.status, this.welcome, this.messages, dock)
    // The slots of React take no box of their own, so the navigation layout sees their content.
    this.slots.workspaces.style.display = 'contents'
    this.slots.search.style.display = 'contents'
    this.navigation.append(
      this.navTop,
      this.slots.workspaces,
      this.newChatButton,
      this.navigationHint,
      this.recents,
      this.slots.search,
      this.chats,
      this.accountTrigger,
      this.accountMenu,
    )
    this.root.prepend(this.navigation, this.conversation, this.deck, this.publishedDeck)
  }

  private mount(): void {
    let stored: string | null = null
    try {
      stored = localStorage.getItem('deckagent-nav')
    } catch {
      /* Optional layout preference. */
    }
    this.setNavigation(stored === 'collapsed', false)
    // Mobile navigation wraps as history/status changes; reserve its actual height for the chat.
    this.navigationSize = new ResizeObserver(() =>
      this.root.style.setProperty('--navigation-height', `${this.navigation.getBoundingClientRect().height}px`),
    )
    this.navigationSize.observe(this.navigation)
  }

  setNavigation(collapse: boolean, remember = true): void {
    if (collapse) this.root.dataset.nav = 'collapsed'
    else delete this.root.dataset.nav
    const label = collapse ? 'Hiện danh sách chat' : 'Ẩn danh sách chat'
    this.navToggle.setAttribute('aria-expanded', String(!collapse))
    this.navToggle.setAttribute('aria-label', label)
    this.navToggle.title = label
    if (remember)
      try {
        localStorage.setItem('deckagent-nav', collapse ? 'collapsed' : 'open')
      } catch {
        /* Optional layout preference. */
      }
  }

  private foldRecents(): void {
    this.chats.hidden = this.compactNavigation.matches
    this.recents.setAttribute('aria-expanded', String(!this.chats.hidden))
  }

  private openAccountMenu(): void {
    this.accountMenu.hidden = false
    this.accountTrigger.setAttribute('aria-expanded', 'true')
    const box = this.accountTrigger.getBoundingClientRect()
    const width = Math.min(280, innerWidth - 16)
    this.accountMenu.style.width = `${width}px`
    this.accountMenu.style.left = `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`
    this.accountMenu.dataset.side = box.top > innerHeight / 2 ? 'above' : 'below'
    if (this.accountMenu.dataset.side === 'above') {
      this.accountMenu.style.top = ''
      this.accountMenu.style.bottom = `${innerHeight - box.top + 8}px`
    } else {
      this.accountMenu.style.bottom = ''
      this.accountMenu.style.top = `${box.bottom + 8}px`
    }
  }

  closeAccountMenu(restoreFocus = false): void {
    if (this.accountMenu.hidden) return
    this.accountMenu.hidden = true
    this.accountTrigger.setAttribute('aria-expanded', 'false')
    if (restoreFocus) this.accountTrigger.focus()
  }

  fitInput(): void {
    this.input.style.height = 'auto'
    this.input.style.height = `${Math.min(180, Math.max(44, this.input.scrollHeight))}px`
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onDocumentKeydown)
    document.removeEventListener('pointerdown', this.onDocumentPointerDown)
    this.compactNavigation.removeEventListener('change', this.onCompactNavigationChange)
    this.navigationSize?.disconnect()
  }
}

export function createShellDom(root: HTMLElement, slots: ShellSlots, changed: () => void): ShellDom {
  return new ShellDom(root, slots, changed)
}
