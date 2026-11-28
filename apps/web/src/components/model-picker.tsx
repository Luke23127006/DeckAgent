import type { ModelSelection, WebSettings } from '@deckagent/host-contracts'
import type { CSSProperties, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { modelPickerText } from '../text.ts'

function optionValue(provider: string, model: string): string {
  return JSON.stringify({ provider, model })
}

/**
 * The provider and model popover of the composer. The hidden `select` keeps the saved choice of the chat. A choice
 * saves the model of the chat and never sends a request.
 */
export function ModelPicker(props: {
  readonly settings: WebSettings
  readonly selection: ModelSelection | undefined
  readonly disabled: boolean
  readonly running: boolean
  readonly chatId: string | undefined
  readonly onChoose: (selection: ModelSelection) => void
  readonly onManage: () => void
}) {
  const { settings, selection, disabled } = props
  const providers = settings.providers
  const value = selection ? optionValue(selection.provider, selection.model) : ''
  // The popover belongs to the chat that was open when it opened; another chat closes it.
  const [openFor, setOpenFor] = useState<string | false>(false)
  const chatKey = props.chatId ?? ''
  const open = openFor === chatKey
  const [tab, setTab] = useState('')
  const [position, setPosition] = useState<CSSProperties>({})
  const node = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const options = useRef<HTMLDivElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const selectedProvider = providers.find(provider =>
    provider.models.some(model => optionValue(provider.id, model) === value),
  )
  const active = providers.some(provider => provider.id === tab)
    ? tab
    : (selectedProvider?.id ?? providers[0]?.id ?? '')
  const selectedModel = selectedProvider ? selection?.model : undefined

  const close = (focus: boolean) => {
    setOpenFor(false)
    if (focus) trigger.current?.focus()
  }

  useEffect(() => {
    if (!open) return

    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !node.current?.contains(event.target)) setOpenFor(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpenFor(false)
        trigger.current?.focus()
      }
    }
    const onResize = () => setOpenFor(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    options.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus()

    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const show = () => {
    const box = trigger.current?.getBoundingClientRect()
    if (box) {
      const width = Math.min(310, innerWidth - 24)
      setPosition({
        width: `${width}px`,
        left: `${Math.max(12, Math.min(box.right - width, innerWidth - 322))}px`,
        bottom: `${innerHeight - box.top + 8}px`,
      })
    }
    setOpenFor(chatKey)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' && event.target === trigger.current && !open) {
      event.preventDefault()
      show()
      return
    }

    if (!open || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

    const inTabs = !!tabs.current?.contains(document.activeElement)
    const list = (inTabs ? tabs.current : options.current)?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    const items = [...(list ?? [])]
    const current = document.activeElement
    if (!(current instanceof HTMLButtonElement)) return

    const index = items.indexOf(current)
    if (index < 0) return

    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1) + items.length) % items.length
    if (inTabs) items[next]?.click()
    else items[next]?.focus()
  }

  const models = providers.find(provider => provider.id === active)?.models ?? []
  return (
    <div className="model-picker" ref={node} onKeyDown={onKeyDown}>
      <select
        hidden
        aria-label={modelPickerText.selected}
        value={value}
        disabled={disabled}
        onChange={event => {
          if (event.target.value === '__settings') props.onManage()
        }}
      >
        <option value="">{modelPickerText.choose}</option>
        {/* The options show with the choice of an open chat, never before it. */}
        {(props.chatId ? providers : []).map(provider => (
          <optgroup key={provider.id} label={provider.displayName}>
            {provider.models.map(model => (
              <option key={model} value={optionValue(provider.id, model)}>
                {model}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__settings">{modelPickerText.manageOption}</option>
      </select>
      <button
        ref={trigger}
        type="button"
        aria-label={modelPickerText.choose}
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="model-popover"
        disabled={disabled}
        onClick={() => (open ? close(true) : show())}
      >
        {selectedModel ??
          (providers.some(provider => provider.models.length) ? modelPickerText.choose : modelPickerText.none)}
      </button>
      <div
        id="model-popover"
        className="model-popover"
        role="dialog"
        aria-label={modelPickerText.panel}
        hidden={!open}
        style={position}
      >
        <header>
          <div ref={tabs} className="model-tabs" role="tablist" aria-label={modelPickerText.providers}>
            {providers.map(provider => (
              <button
                key={provider.id}
                id={`model-tab-${provider.id}`}
                type="button"
                role="tab"
                aria-controls="model-options"
                aria-selected={provider.id === active ? 'true' : 'false'}
                tabIndex={provider.id === active ? 0 : -1}
                onClick={() => setTab(provider.id)}
              >
                {provider.displayName}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={modelPickerText.add}
            title={modelPickerText.add}
            onClick={() => {
              close(false)
              props.onManage()
            }}
          >
            +
          </button>
          <button
            type="button"
            className="model-manage"
            aria-label={modelPickerText.manage}
            title={modelPickerText.manage}
            onClick={() => {
              close(false)
              props.onManage()
            }}
          />
        </header>
        <p className="model-note" hidden={!props.running}>
          {modelPickerText.running}
        </p>
        <div
          ref={options}
          id="model-options"
          className="model-options"
          role="tabpanel"
          aria-labelledby={`model-tab-${active}`}
        >
          {models.map(model => (
            <button
              key={model}
              type="button"
              disabled={disabled}
              aria-pressed={optionValue(active, model) === value ? 'true' : 'false'}
              title={model}
              onClick={() => {
                if (disabled) return
                close(true)
                props.onChoose({ provider: active, model })
              }}
            >
              {model}
            </button>
          ))}
          {!models.length && (
            <p>{providers.length ? modelPickerText.noModelForProvider : modelPickerText.noProvider}</p>
          )}
        </div>
      </div>
    </div>
  )
}
