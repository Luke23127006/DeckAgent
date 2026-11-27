import type { ResearchSource, WebSettings } from '@deckagent/host-contracts'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { researchErrorCode, useResearchActions } from '../hooks/use-research.ts'
import { researchText } from '../text.ts'

/** The commands that open the research dialog. */
export interface ResearchDialogHandle {
  openSettings(): void
  openSources(): void
}

/** The research choice of the composer. Choosing never sends a request. */
export function ResearchChoice(props: {
  readonly settings: WebSettings
  readonly checked: boolean
  readonly disabled: boolean
  readonly hidden: boolean
  readonly onChange: (checked: boolean) => void
  readonly onInfo: () => void
}) {
  const configured = props.settings.research?.configured === true
  return (
    <div className="research-control" hidden={props.hidden}>
      <label className="research-choice-label" title={researchText.choiceTitle}>
        <input
          type="checkbox"
          className="public-research-choice"
          aria-label={researchText.choice}
          checked={props.checked}
          disabled={props.disabled}
          onChange={event => props.onChange(event.target.checked)}
        />
        <span>{researchText.choice}</span>
      </label>
      <button
        type="button"
        className="research-info"
        aria-label={researchText.info}
        title={configured ? researchText.choiceTitle : researchText.notConfiguredTitle}
        onClick={props.onInfo}
      >
        {configured ? 'ⓘ' : researchText.notConfigured}
      </button>
    </div>
  )
}

/**
 * The Tavily dialog: it checks and saves the key and shows the saved excerpts of the chat. It never shows a saved key;
 * an excerpt enters a text node only.
 */
export function ResearchDialog(props: {
  readonly ref: Ref<ResearchDialogHandle>
  readonly chatId: string | undefined
  readonly preferencesVersion: number
}) {
  const { ref: handle } = props
  const dialog = useRef<HTMLDialogElement>(null)
  const key = useRef<HTMLInputElement>(null)
  const version = useRef(0)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [sources, setSources] = useState<readonly ResearchSource[]>([])
  const actions = useResearchActions()

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    const onCancel = (event: Event) => {
      if (busy) event.preventDefault()
    }
    const onClose = () => {
      if (key.current) key.current.value = ''
      setSources([])
    }
    node.addEventListener('cancel', onCancel)
    node.addEventListener('close', onClose)
    return () => {
      node.removeEventListener('cancel', onCancel)
      node.removeEventListener('close', onClose)
    }
  }, [busy])

  const perform = async (work: () => Promise<string | undefined>) => {
    if (busy) return
    setBusy(true)
    try {
      const done = await work()
      if (key.current) key.current.value = ''
      await actions.refresh()
      version.current = actions.preferencesVersion()
      if (done !== undefined) setStatus(done)
    } catch (error) {
      const code = researchErrorCode(error)
      if (code === 'PREFERENCES_STALE') {
        await actions.refresh().catch(() => {})
        version.current = actions.preferencesVersion()
      }
      setStatus(researchText.errors[code] ?? researchText.failed)
    } finally {
      setBusy(false)
    }
  }

  useImperativeHandle(handle, () => ({
    openSettings: () => {
      version.current = props.preferencesVersion
      setStatus(researchText.openNote)
      setSources([])
      if (!dialog.current?.open) dialog.current?.showModal()
    },
    openSources: () => {
      const id = props.chatId
      if (!id || dialog.current?.open) return
      dialog.current?.showModal()
      setSources([])
      setStatus(researchText.reading)
      void perform(async () => {
        const values = await actions.sources(id)
        setSources(values)
        return values.length ? researchText.found : researchText.none
      })
    },
  }))

  return (
    <dialog ref={dialog} className="research-dialog">
      <h2>{researchText.heading}</h2>
      <p>{researchText.intro}</p>
      <label>
        <span>{researchText.key}</span>
        <input ref={key} type="password" autoComplete="new-password" maxLength={4096} aria-label={researchText.key} />
      </label>
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void perform(async () => {
              await actions.save({ key: key.current?.value ?? '' }, version.current)
              return researchText.saved
            })
          }
        >
          {researchText.save}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void perform(async () => {
              await actions.save({ useEnvironment: true }, version.current)
              return researchText.environmentSaved
            })
          }
        >
          {researchText.environment}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void perform(async () => {
              await actions.remove(version.current)
              return researchText.removed
            })
          }
        >
          {researchText.remove}
        </button>
      </div>
      <p role="status">{status}</p>
      <section>
        {sources.map(item => (
          <section key={`${item.sourceId}/${item.url}`}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title || item.url}
            </a>
            <small>{` ${item.sourceId} · ${item.retrievedAt}`}</small>
            <pre>{item.content}</pre>
          </section>
        ))}
      </section>
      <button
        type="button"
        onClick={() => {
          if (!busy) dialog.current?.close()
        }}
      >
        {researchText.close}
      </button>
    </dialog>
  )
}
