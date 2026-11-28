import { backgroundGradient, backgroundSwatches } from '../background/backdrop.ts'
import { useBackgroundMutation, usePreferences } from '../hooks/use-preferences.ts'
import { conversationText } from '../text.ts'

/** The backdrop picker under the theme switch. The choice shows at once, and the Host keeps it. */
export function BackgroundControl() {
  const preferences = usePreferences()
  const background = useBackgroundMutation()
  const current = preferences.data?.background
  const title = background.error ? conversationText.backgroundFailed : undefined
  return (
    <div className="background-control" role="group" aria-label={conversationText.background} title={title}>
      {backgroundSwatches.map(([value, colors]) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value ? 'true' : 'false'}
          onClick={() => {
            if (preferences.data && value !== current)
              background.mutate({ background: value, version: preferences.data.version })
          }}
        >
          <span className="swatch" style={{ background: backgroundGradient(colors) }} />
          {conversationText.backgrounds[value]}
        </button>
      ))}
    </div>
  )
}
