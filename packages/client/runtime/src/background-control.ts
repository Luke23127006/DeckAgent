import { type Backdrop, backgroundChoices, backgroundGradient } from './background.ts'
import { button, element } from './dom.ts'
import type { ManagementClient } from './management-client.ts'
import type { BackgroundId } from '@deckagent/host-api'

/**
 * Backdrop picker, shown under the theme switch. The choice applies at once and the Host keeps it,
 * so it survives a change of local port. If the Host cannot save it, the previous choice returns.
 */
export function backgroundControl(
  management: ManagementClient,
  backdrop: Backdrop,
  initial: BackgroundId,
): HTMLElement {
  const group = element('div', undefined, 'background-control')
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', 'Nền')
  let current = initial
  const buttons = backgroundChoices.map(([value, label, colors]) => {
    const choice = button('', () => {
      if (value === current) return
      const previous = current
      current = value
      backdrop.set(value)
      sync()
      group.removeAttribute('title')
      management.saveBackground(value).catch(() => {
        // Keep what the user sees equal to what the Host has saved.
        current = previous
        backdrop.set(previous)
        sync()
        group.title = 'Không lưu được lựa chọn nền. Hãy thử lại.'
      })
    })
    const swatch = element('span', undefined, 'swatch')
    swatch.style.background = backgroundGradient(colors)
    choice.append(swatch, label)
    return [value, choice] as const
  })
  function sync(): void {
    for (const [value, choice] of buttons) choice.setAttribute('aria-pressed', String(value === current))
  }
  sync()
  group.append(...buttons.map(([, choice]) => choice))
  return group
}
