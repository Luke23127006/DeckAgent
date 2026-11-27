import { useEffect, useLayoutEffect, useState } from 'react'
import type { ProviderSettings, ProviderTemplate } from '@deckagent/host-contracts'
import { providerProtocols } from '@deckagent/host-contracts'
import { useProviderCatalog, useProviderMutation, settingsError } from '../../../hooks/use-settings.ts'
import { settingsText as text, errorText } from '../../../text.ts'

export function ProviderForm({
  saved,
  template,
  version,
  onDirty,
  onBusy,
  onRemoved,
  onSaved,
  onStale,
}: {
  saved: ProviderSettings | undefined
  template: ProviderTemplate | undefined
  version: number
  onDirty: (value: boolean) => void
  onBusy: (value: boolean) => void
  onRemoved: () => void
  onSaved: (id: string) => void
  onStale: () => void
}) {
  const [id, setId] = useState(saved?.id ?? template?.id ?? '')
  const [name, setName] = useState(saved?.displayName ?? template?.displayName ?? '')
  const [protocol, setProtocol] = useState(saved?.protocol ?? template?.protocol ?? 'chat-completions')
  const [url, setUrl] = useState(saved?.baseUrl ?? template?.baseUrl ?? '')
  const [key, setKey] = useState('')
  const [removeKey, setRemoveKey] = useState(false)
  const [models, setModels] = useState(saved?.models.join('\n') ?? '')
  const [baselineVersion] = useState(version)
  const [failure, setFailure] = useState<unknown>(null)
  const mutation = useProviderMutation()
  const catalog = useProviderCatalog()
  const busy = mutation.isPending || catalog.isPending
  useEffect(() => {
    onBusy(busy)
    return () => onBusy(false)
  }, [busy, onBusy])
  useLayoutEffect(() => {
    const changed =
      name !== (saved?.displayName ?? template?.displayName ?? '') ||
      url !== (saved?.baseUrl ?? template?.baseUrl ?? '') ||
      id !== (saved?.id ?? template?.id ?? '') ||
      protocol !== (saved?.protocol ?? template?.protocol ?? 'chat-completions') ||
      models !== (saved?.models.join('\n') ?? '') ||
      key !== '' ||
      removeKey
    onDirty(changed)
  }, [id, name, protocol, url, models, key, removeKey, saved, template, onDirty])
  const inputClass = 'block w-full rounded border border-input bg-background p-2'
  const error = failure ?? catalog.error
  return (
    <form
      className="space-y-4"
      onChange={() => onDirty(true)}
      onSubmit={event => {
        event.preventDefault()
        if (busy) return
        const credential = key
        setKey('')
        setFailure(null)
        mutation.mutate(
          {
            id,
            expectedVersion: baselineVersion,
            provider: {
              displayName: name,
              protocol,
              baseUrl: url,
              models: [
                ...new Set(
                  models
                    .split(/\r?\n/)
                    .map(model => model.trim())
                    .filter(Boolean),
                ),
              ],
              ...(removeKey ? { key: '' } : credential ? { key: credential } : {}),
              ...(saved ? {} : { new: true }),
            },
          },
          {
            onSuccess: () => onSaved(id),
            onError: error => {
              setFailure(error)
              if (settingsError(error) === 'PROVIDERS_STALE') onStale()
            },
            onSettled: () => mutation.reset(),
          },
        )
      }}
    >
      <fieldset disabled={busy} className="space-y-4">
        <label className="block">
          {text.providerId}
          <input
            aria-label={text.providerId}
            className={inputClass}
            required
            maxLength={100}
            pattern="[A-Za-z0-9_.\-]+"
            disabled={!!saved || !!template}
            value={id}
            onChange={event => setId(event.target.value)}
          />
        </label>
        <label className="block">
          {text.name}
          <input
            aria-label={text.name}
            className={inputClass}
            required
            maxLength={100}
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </label>
        <label className="block">
          {text.protocol}
          <select
            className={inputClass}
            disabled={!!saved || !!template}
            value={protocol}
            onChange={event => {
              const next = providerProtocols.find(item => item === event.target.value)
              if (next) setProtocol(next)
            }}
          >
            {providerProtocols.map(value => (
              <option key={value} value={value}>
                {text.protocols[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          {text.url}
          <input
            aria-label={text.url}
            className={inputClass}
            type="url"
            required
            disabled={!!template}
            value={url}
            onChange={event => setUrl(event.target.value)}
          />
        </label>
        <p>{text.keyHelp}</p>
        <label className="block">
          {text.key}
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            maxLength={4096}
            required={!!template?.needs.includes('key') && !saved?.keyAvailable}
            value={key}
            onChange={event => setKey(event.target.value)}
          />
        </label>
        {!template && saved?.hasKey && (
          <label className="block">
            <input type="checkbox" checked={removeKey} onChange={event => setRemoveKey(event.target.checked)} />
            {text.removeKey}
          </label>
        )}
        <label className="block">
          {text.models}
          <textarea
            aria-label={text.models}
            className={inputClass}
            rows={5}
            value={models}
            onChange={event => setModels(event.target.value)}
          />
        </label>
        <button type="button" disabled={!saved} onClick={() => catalog.mutate(id)}>
          {text.catalog}
        </button>
        {catalog.data && (
          <div>
            <p>{text.catalogHelp}</p>
            {catalog.data.map(model => (
              <button
                type="button"
                className="mr-2 rounded border p-2"
                key={model}
                onClick={() =>
                  setModels(current => [...new Set([...current.split('\n').filter(Boolean), model])].join('\n'))
                }
              >
                {model}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-4">
          <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-foreground">
            {text.save}
          </button>
          {saved && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(text.confirmRemove))
                  mutation.mutate(
                    { id: saved.id, expectedVersion: baselineVersion },
                    {
                      onSuccess: onRemoved,
                      onError: error => {
                        setFailure(error)
                        if (settingsError(error) === 'PROVIDERS_STALE') onStale()
                      },
                      onSettled: () => mutation.reset(),
                    },
                  )
              }}
            >
              {text.remove}
            </button>
          )}
        </div>
      </fieldset>
      {error && <p role="alert">{errorText[settingsError(error)]}</p>}
    </form>
  )
}
