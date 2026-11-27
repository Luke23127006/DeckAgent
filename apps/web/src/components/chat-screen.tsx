import type { WebPreferences } from '@deckagent/host-contracts'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { createDeckBridge } from '../browser/deck-bridge.ts'
import type { DeckBridge } from '../browser/deck-bridge.ts'
import { initMotion } from '../browser/motion.ts'
import type { Conversation } from '../hooks/use-conversation.ts'
import { requestLimit, sendBlocked, useConversation } from '../hooks/use-conversation.ts'
import { useHostConnection } from '../hooks/use-host-connection.ts'
import { usePreferences, useThemeMutation } from '../hooks/use-preferences.ts'
import { conversationText, researchText, settingsText, attachmentText } from '../text.ts'
import { AttachmentDraft, AttachmentPicker, AttachmentPreviewDialog } from './attachment-draft.tsx'
import { ChatList } from './chat-list.tsx'
import { ChatSearch } from './chat-search.tsx'
import { ConversationMessages } from './conversation-messages.tsx'
import { LegacyNode } from './legacy-node.tsx'
import { ModelPicker } from './model-picker.tsx'
import { ResearchChoice, ResearchDialog } from './research-controls.tsx'
import type { ResearchDialogHandle } from './research-controls.tsx'
import { WorkspaceControls } from './workspace-controls.tsx'

const themes: readonly (readonly [WebPreferences['theme'], string])[] = [
  ['light', settingsText.light],
  ['dark', settingsText.dark],
  ['system', settingsText.system],
]

const compactLayout = '(max-width:720px)'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem('deckagent-nav') === 'collapsed'
  } catch {
    return false
  }
}

function ThemeControl() {
  const preferences = usePreferences()
  const theme = useThemeMutation()
  const current = theme.isPending ? theme.variables.theme : preferences.data?.theme
  const title = theme.error ? conversationText.themeFailed : undefined
  return (
    <div className="theme-control" role="group" aria-label={conversationText.theme} title={title}>
      {themes.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value ? 'true' : 'false'}
          onClick={() => {
            if (preferences.data) theme.mutate({ theme: value, version: preferences.data.version })
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** The settings menu of the navigation. It closes on Escape and on a press outside it. */
function AccountMenu(props: {
  readonly onModelSettings: () => void
  readonly onResearch: () => void
  readonly onReconnect: () => void
}) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const [side, setSide] = useState('below')
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && !menu.current?.contains(target) && !trigger.current?.contains(target))
        setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const show = () => {
    const box = trigger.current?.getBoundingClientRect()
    if (box) {
      const width = Math.min(280, innerWidth - 16)
      const above = box.top > innerHeight / 2
      setSide(above ? 'above' : 'below')
      setStyle({
        width: `${width}px`,
        left: `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`,
        ...(above ? { bottom: `${innerHeight - box.top + 8}px` } : { top: `${box.bottom + 8}px` }),
      })
    }
    setOpen(true)
  }
  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="account-trigger"
        title={conversationText.settings}
        aria-haspopup="menu"
        aria-controls="account-menu"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => (open ? setOpen(false) : show())}
      >
        <span className="account-avatar" />
        <span className="account-label">{conversationText.settings}</span>
      </button>
      <div
        ref={menu}
        id="account-menu"
        className="account-menu"
        role="menu"
        aria-label={conversationText.menuLabel}
        hidden={!open}
        data-side={side}
        style={style}
      >
        <p className="menu-note">{conversationText.menuNote}</p>
        <button
          type="button"
          className="settings-open"
          title={conversationText.modelSettings}
          onClick={choose(props.onModelSettings)}
        >
          {conversationText.modelSettings}
        </button>
        <div className="menu-section">
          <span>{conversationText.theme}</span>
          <ThemeControl />
        </div>
        <button type="button" onClick={choose(props.onResearch)}>
          {researchText.settings}
        </button>
        <button type="button" id="reconnect" onClick={choose(props.onReconnect)}>
          {conversationText.reconnect}
        </button>
      </div>
    </>
  )
}

/** The composer: the draft text, its files, the research choice, the model and Send or Stop. */
function Composer(props: {
  readonly conversation: Conversation<DeckBridge>
  readonly deck: DeckBridge
  readonly onResearchInfo: () => void
  readonly onResearchSources: () => void
}) {
  const { conversation, deck } = props
  const input = useRef<HTMLTextAreaElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const current = conversation.current
  const settings = conversation.settings
  const blocked = sendBlocked(current, settings)
  const draft = conversation.draft()
  const activeId = conversation.activeRequestId
  const disabled = conversation.submitDisabled()
  const text = conversation.text
  const ariaDisabled = disabled || (!text.trim() && !draft?.attachments?.length) || [...text].length > requestLimit
  const pickerId = 'composer-files'

  // A native listener also gets an `input` event that does not bubble, as a script sends it.
  useEffect(() => {
    const node = input.current
    if (!node) return
    conversation.attachInput(node)
    const fit = () => {
      node.style.height = 'auto'
      node.style.height = `${Math.min(180, Math.max(44, node.scrollHeight))}px`
    }
    const onInput = () => {
      conversation.saveDraft()
      conversation.changed()
      fit()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
      event.preventDefault()
      if (!conversation.submitDisabled() && (node.value.trim() || conversation.draft()?.attachments?.length))
        form.current?.requestSubmit()
    }
    node.addEventListener('input', onInput)
    node.addEventListener('keydown', onKey)
    fit()
    return () => {
      node.removeEventListener('input', onInput)
      node.removeEventListener('keydown', onKey)
      conversation.detachInput(node)
    }
  }, [conversation])

  const researchDisabled =
    !current || !!activeId || (settings.research?.configured !== true && !conversation.researchEnabled())
  return (
    <form
      ref={form}
      className="composer"
      noValidate
      data-slot="request"
      onSubmit={event => {
        event.preventDefault()
        conversation.run(conversation.submit(conversation.text))
      }}
    >
      <p className="requests-unavailable" role="note" hidden={!blocked || !!activeId}>
        {blocked ?? ''}
      </p>
      <AttachmentDraft
        draft={draft}
        busy={conversation.attachmentsBusy()}
        onPreview={item => conversation.run(conversation.previewAttachment(item))}
        onRemove={id => conversation.run(conversation.removeAttachment(id))}
      />
      <AttachmentPicker id={pickerId} onFiles={files => conversation.run(conversation.uploadAttachments(files))} />
      <textarea
        ref={input}
        name="input"
        required
        placeholder={deck.inputHint}
        aria-label={conversationText.inputLabel}
      />
      <div className="composer-actions">
        <div className="composer-controls">
          <button
            type="button"
            className="attachment-action"
            title={attachmentText.addTitle}
            aria-label={attachmentText.add}
            disabled={!draft || conversation.attachmentsBusy()}
            onClick={() => document.getElementById(pickerId)?.click()}
          >
            +
          </button>
          <ResearchChoice
            settings={settings}
            checked={conversation.researchEnabled()}
            disabled={researchDisabled}
            hidden={deck.preparingDeck}
            onChange={checked => conversation.setResearch(checked)}
            onInfo={props.onResearchInfo}
          />
          <button type="button" disabled={!current} onClick={props.onResearchSources}>
            {researchText.sources}
          </button>
        </div>
        <div className="composer-primary">
          <ModelPicker
            settings={settings}
            selection={current?.selectable ? current.selection : undefined}
            disabled={
              !current ||
              conversation.selecting.has(current.sessionId) ||
              conversation.opening !== undefined ||
              conversation.creating
            }
            running={!!activeId}
            chatId={current?.sessionId}
            onChoose={selection => conversation.run(conversation.chooseModel(selection))}
            onManage={() => conversation.run(conversation.openSettings())}
          />
          <button
            type="submit"
            className="send-action"
            aria-label={conversationText.send}
            title={conversationText.sendTitle}
            disabled={disabled}
            aria-disabled={ariaDisabled ? 'true' : 'false'}
            hidden={!!activeId}
          />
          <button
            type="button"
            className="stop-action"
            aria-label={conversationText.stopLabel}
            title={conversationText.stopLabel}
            hidden={!activeId}
            disabled={!!activeId && conversation.stopping.has(activeId)}
            onClick={() => conversation.stop()}
          >
            {conversationText.stop}
          </button>
        </div>
      </div>
    </form>
  )
}

/**
 * The chat screen: the navigation with the workspace controls and the chat list, the conversation with its composer,
 * and the deck screens that stay legacy until Phase 6.
 */
export function ChatScreen(props: { readonly initialSessionId?: string; readonly onMissingChat?: () => void }) {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const connection = useHostConnection()
  const root = useRef<HTMLElement>(null)
  const navigation = useRef<HTMLElement>(null)
  const research = useRef<ResearchDialogHandle>(null)
  const [words, setWords] = useState('')
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [recentsOpen, setRecentsOpen] = useState(() => !matchMedia(compactLayout).matches)
  const conversation = useConversation<DeckBridge>(
    owner =>
      createDeckBridge({
        origin: connection.origin,
        token: connection.token,
        choose: text => owner.appendAnswer(text),
        skip: () => owner.skipQuestions(),
        confirmOutline: proposal => owner.run(owner.confirmOutline(proposal)),
        revise: text => owner.revise(text),
        changed: () => owner.changed(),
      }),
    {
    ...(props.initialSessionId === undefined ? {} : { initialSessionId: props.initialSessionId }),
    openSettings: sessionId =>
      navigate({ pathname: '/settings', hash }, { state: { returnTo: sessionId ? `/chats/${sessionId}` : '/' } }),
      missingChat: () => props.onMissingChat?.(),
    },
  )
  const deck = conversation.deck

  useEffect(() => () => deck.dispose(), [deck])

  useEffect(() => {
    const node = root.current
    if (node) initMotion(node)
  }, [])

  // The narrow layout folds the chat list; the navigation height stays free for the chat.
  useEffect(() => {
    const media = matchMedia(compactLayout)
    const onChange = () => setRecentsOpen(!media.matches)
    media.addEventListener('change', onChange)
    const size = new ResizeObserver(() => {
      const box = navigation.current?.getBoundingClientRect()
      if (box) root.current?.style.setProperty('--navigation-height', `${box.height}px`)
    })
    if (navigation.current) size.observe(navigation.current)
    return () => {
      media.removeEventListener('change', onChange)
      size.disconnect()
    }
  }, [])

  const setNavigation = (value: boolean) => {
    setCollapsed(value)
    try {
      localStorage.setItem('deckagent-nav', value ? 'collapsed' : 'open')
    } catch {
      /* Optional layout preference. */
    }
  }

  const current = conversation.current
  const activeId = conversation.activeRequestId
  const working = conversation.working()
  const preparing = deck.preparingDeck
  const opening = conversation.opening !== undefined
  const welcomeHidden = conversation.historyPresent || working || !current || opening
  const saved = deck.deck
  const ownDeck = saved?.sessionId === current?.sessionId
  const openDeckHidden =
    (!conversation.outlines?.confirmedId && !(ownDeck && saved?.outlineId)) || !deck.publishedDeck.hidden
  const generation = ownDeck ? saved?.generation : undefined
  const continueHidden = !generation || !['pending', 'incomplete'].includes(generation.state)
  const status = conversation.status
  const label = collapsed ? conversationText.showList : conversationText.hideList
  return (
    <main id="app" ref={root} data-nav={collapsed ? 'collapsed' : undefined}>
      <aside ref={navigation} className="chat-navigation">
        <div className="nav-top">
          <div className="wordmark">{conversationText.wordmark}</div>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={collapsed ? 'false' : 'true'}
            aria-label={label}
            title={label}
            onClick={() => setNavigation(!collapsed)}
          />
        </div>
        <WorkspaceControls busy={conversation.busy} />
        <button
          type="button"
          data-action="new-chat"
          title={conversationText.newChat}
          disabled={conversation.locked}
          onClick={() => conversation.run(conversation.newChat())}
        >
          {conversationText.newChat}
        </button>
        <p className="navigation-hint" hidden={!activeId || !recentsOpen}>
          {conversationText.navigationHint}
        </p>
        <button
          type="button"
          className="recents-toggle"
          aria-expanded={recentsOpen ? 'true' : 'false'}
          aria-controls="recent-chats"
          onClick={() => setRecentsOpen(!recentsOpen)}
        >
          {conversationText.recents}
        </button>
        <ChatSearch onWords={setWords} />
        <nav id="recent-chats" aria-label={conversationText.chatHistory} hidden={!recentsOpen}>
          <ChatList
            words={words}
            open={{
              currentSessionId: conversation.currentId,
              locked: conversation.locked,
              draftIds: conversation.draftIds(),
            }}
            onOpen={chat => conversation.run(conversation.open(chat))}
          />
        </nav>
        <AccountMenu
          onModelSettings={() => conversation.run(conversation.openSettings())}
          onResearch={() => research.current?.openSettings()}
          onReconnect={() => conversation.run(conversation.reconnect())}
        />
      </aside>
      <section className="conversation">
        <header className="conversation-header">
          <div className="chat-heading">
            <h1 title={conversation.chatTitle}>{conversation.chatTitle}</h1>
            <small className="chat-state" aria-live="polite" data-waiting="false">
              {activeId ? conversationText.working : working ? conversationText.sendingState : ''}
            </small>
          </div>
          <div className="chat-heading-actions">
            <button type="button" hidden={openDeckHidden}               onClick={() => {
                deck.showPublishedDeck()
                conversation.changed()
              }}
            >
              {conversationText.openDeck}
            </button>
            <button
              type="button"
              title={conversationText.startGenerationTitle}
              hidden={continueHidden}
              disabled={working}
              onClick={() => conversation.continueDeck()}
            >
              {generation?.state === 'incomplete'
                ? conversationText.continueGeneration
                : conversationText.startGeneration}
            </button>
          </div>
        </header>
        <p
          className="request-status"
          role="status"
          hidden={!status}
          data-kind={status?.kind}
          title={status?.title ?? ''}
        >
          {status?.text ?? ''}
        </p>
        <LegacyNode node={deck.workflow} />
        <section className="welcome" hidden={welcomeHidden}>
          <h2>{preparing ? conversationText.welcomeDeck : conversationText.welcomeChat}</h2>
          <p>{preparing ? conversationText.welcomeDeckDetail : conversationText.welcomeChatDetail}</p>
        </section>
        <ConversationMessages
          records={conversation}
          hidden={!welcomeHidden}
          preview={item => conversation.run(conversation.previewAttachment(item))}
          outlineCard={proposal => deck.outlineCard(proposal)}
          actions={{
            retry: text => conversation.retry(text),
            settings: () => conversation.run(conversation.openSettings()),
            draft: () => conversation.text,
            approve: (requestId, approvalId, decision) => conversation.approve(requestId, approvalId, decision),
          }}
        />
        <div className="composer-dock">
          <LegacyNode node={deck.outlineDock} />
          <Composer
            conversation={conversation}
            deck={deck}
            onResearchInfo={() => research.current?.openSettings()}
            onResearchSources={() => research.current?.openSources()}
          />
        </div>
      </section>
      <LegacyNode node={deck.sampleDeck} />
      <LegacyNode node={deck.publishedDeck} />
      <ResearchDialog
        ref={research}
        chatId={conversation.currentId}
        preferencesVersion={conversation.settings.preferencesVersion}
      />
      {conversation.preview && (
        <AttachmentPreviewDialog
          key={conversation.preview.name}
          preview={conversation.preview}
          onClose={() => conversation.closePreview()}
        />
      )}
    </main>
  )
}
