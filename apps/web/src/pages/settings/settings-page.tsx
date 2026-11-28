import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useSettings, settingsError } from '../../hooks/use-settings.ts'
import { usePreferences, useThemeMutation } from '../../hooks/use-preferences.ts'
import { useSettingsNavigation } from '../../hooks/use-settings-navigation.ts'
import { settingsText as text, errorText } from '../../text.ts'
import { ProviderForm } from './components/provider-form.tsx'

export function SettingsPage() {
  const settings = useSettings()
  const preferences = usePreferences()
  const theme = useThemeMutation()
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState('new:custom')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  useSettingsNavigation(dirty, busy)

  function canLeave() {
    return !busy && (!dirty || window.confirm(text.discard))
  }
  const state: unknown = location.state
  const returnTo =
    state && typeof state === 'object' && 'returnTo' in state && typeof state.returnTo === 'string'
      ? state.returnTo
      : undefined
  const back = returnTo && /^\/chats\/[^/?#]+$/.test(returnTo) ? returnTo : '/'
  if (settings.isPending) return <p role="status">{text.loading}</p>
  if (!settings.data)
    return (
      <main>
        <p role="alert">{errorText[settingsError(settings.error)]}</p>
        <button onClick={() => void settings.refetch()}>{text.retry}</button>
      </main>
    )

  const saved = settings.data.providers.find(provider => provider.id === selected)
  const template = settings.data.builtIns.find(provider => provider.id === (saved?.id ?? selected.slice(4)))
  function choose(id: string) {
    if (id === selected) return
    if (canLeave()) {
      setSelected(id)
      setDirty(false)
    }
  }

  return (
    <main className="h-dvh overflow-y-auto bg-background p-6 text-foreground">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{text.title}</h1>
        <button
          onClick={() => {
            if (canLeave()) navigate({ pathname: back, hash: location.hash })
          }}
        >
          {text.back}
        </button>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[16rem_1fr]">
        <nav className="flex flex-col gap-3" aria-label={text.savedProviders}>
          <h2 className="font-semibold">{text.savedProviders}</h2>
          {settings.data.providers.map(provider => (
            <button
              className="rounded border p-3 text-left"
              key={provider.id}
              aria-pressed={selected === provider.id}
              disabled={busy}
              onClick={() => choose(provider.id)}
            >
              {provider.displayName}
              <small className="block">
                {provider.keyAvailable ? text.keyAvailable : provider.hasKey ? text.keyUnavailable : text.noKey}
              </small>
            </button>
          ))}
          <h2 className="font-semibold">{text.addProvider}</h2>
          {settings.data.builtIns
            .filter(item => !settings.data?.providers.some(provider => provider.id === item.id))
            .map(item => (
              <button key={item.id} disabled={busy} onClick={() => choose(`new:${item.id}`)}>
                {item.displayName}
              </button>
            ))}
          <button disabled={busy} onClick={() => choose('new:custom')}>
            {text.custom}
          </button>
        </nav>
        <section className="space-y-6">
          {!settings.data.persistentKeys && <p role="note">{text.noKeyStore}</p>}
          {notice && <p role="status">{notice}</p>}
          <ProviderForm
            key={`${selected}:${revision}`}
            saved={saved}
            template={template}
            version={settings.data.providersVersion}
            onSaved={id => {
              setSelected(id)
              setRevision(value => value + 1)
              setDirty(false)
              setNotice(text.saved)
            }}
            onStale={() => {
              setRevision(value => value + 1)
              setDirty(false)
              setNotice(errorText.PROVIDERS_STALE)
            }}
            onDirty={setDirty}
            onBusy={setBusy}
            onRemoved={() => {
              setSelected('new:custom')
              setDirty(false)
            }}
          />
          <section className="space-y-3" aria-label={text.theme}>
            <h2 className="font-semibold">{text.theme}</h2>
            {preferences.data &&
              (['light', 'dark', 'system'] as const).map(value => (
                <button
                  key={value}
                  className="mr-3 rounded border px-4 py-2"
                  aria-pressed={preferences.data.theme === value}
                  disabled={theme.isPending}
                  onClick={() => {
                    if (preferences.data) theme.mutate({ theme: value, version: preferences.data.version })
                  }}
                >
                  {text[value]}
                </button>
              ))}
            {(preferences.error || theme.error) && (
              <p role="alert">{errorText[settingsError(theme.error ?? preferences.error)]}</p>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
