import { button, element } from './dom.ts'
import type { ManagementClient } from './management-client.ts'

type Theme = 'light' | 'dark' | 'system'

const choices: readonly (readonly [Theme, string])[] = [
  ['light', 'Sáng'],
  ['dark', 'Tối'],
  ['system', 'Hệ thống'],
]

function apply(theme: Theme, origin?: { x: number; y: number }): void {
  const update = () => {
    if (theme === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
  }
  // The new theme opens as a circle from the pressed control; skipped when the browser lacks view transitions or the user asks for less motion.
  if (
    origin &&
    typeof document.startViewTransition === 'function' &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const { x, y } = origin
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document
      .startViewTransition(update)
      .ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.23,1,.32,1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  } else update()
}

/** Where the theme reveal starts: the pointer for a click, the middle of the control for the keyboard. */
function pressPoint(event: MouseEvent, target: HTMLElement): { x: number; y: number } {
  if (event.detail > 0) return { x: event.clientX, y: event.clientY }
  const box = target.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/**
 * Light, dark or follow-the-system switch. The Host keeps the choice and `/theme.js` applies it
 * before first paint, so the page starts in `data-theme` already; nothing is read from browser storage.
 */
export function themeControl(management: ManagementClient): HTMLElement {
  const group = element('div', undefined, 'theme-control')
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', 'Giao diện')
  const initial = document.documentElement.dataset.theme
  let current: Theme = initial === 'light' || initial === 'dark' ? initial : 'system'
  const buttons = choices.map(([value, label]) => {
    const choice = button(label, event => {
      const previous = current
      current = value
      apply(value, pressPoint(event, choice))
      sync()
      group.removeAttribute('title')
      management.saveTheme(value).catch(() => {
        // Keep what the user sees equal to what the Host has saved.
        current = previous
        apply(previous)
        sync()
        group.title = 'Không lưu được lựa chọn giao diện. Hãy thử lại.'
      })
    })
    return [value, choice] as const
  })
  function sync(): void {
    for (const [value, choice] of buttons) choice.setAttribute('aria-pressed', String(value === current))
  }
  sync()
  group.append(...buttons.map(([, choice]) => choice))
  return group
}
