import { button, element } from './dom.ts'
import { ManagementError, type ManagementClient } from './transport/index.ts'

type Theme = 'light' | 'dark' | 'system'

const choices: readonly (readonly [Theme, string])[] = [
  ['light', 'Sáng'],
  ['dark', 'Tối'],
  ['system', 'Hệ thống'],
]

function transition(paint: () => void, origin?: { x: number; y: number }): void {
  // The new theme opens as a circle from the pressed control; skipped when the browser lacks view transitions or the user asks for less motion.
  if (
    origin &&
    typeof document.startViewTransition === 'function' &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const { x, y } = origin
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document
      .startViewTransition(paint)
      .ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.23,1,.32,1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  } else paint()
}

/** Where the theme reveal starts: the pointer for a click, the middle of the control for the keyboard. */
function pressPoint(event: MouseEvent, target: HTMLElement): { x: number; y: number } {
  if (event.detail > 0) return { x: event.clientX, y: event.clientY }
  const box = target.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/**
 * Light, dark or follow-the-system switch. The Host keeps the choice and `/theme.js` applies the `.dark`
 * class before first paint, so nothing is read from browser storage. `mountLegacyBrowser` syncs the saved
 * choice from `management.preferences()`.
 */
export function themeControl(
  management: ManagementClient,
  getPreferencesVersion: () => number,
  onPreferencesVersion: (version: number) => void,
): { readonly node: HTMLElement; update(theme: Theme): void; dispose(): void } {
  const group = element('div', undefined, 'theme-control')
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', 'Giao diện')
  const system = matchMedia('(prefers-color-scheme: dark)')
  let current: Theme = 'system'

  function paint(): void {
    document.documentElement.classList.toggle('dark', current === 'dark' || (current === 'system' && system.matches))
  }

  function onSystemChange(): void {
    if (current === 'system') paint()
  }

  function listen(): void {
    if (current === 'system') system.addEventListener('change', onSystemChange)
    else system.removeEventListener('change', onSystemChange)
  }

  function show(theme: Theme, origin?: { x: number; y: number }): void {
    current = theme
    transition(paint, origin)
    listen()
    sync()
  }

  const buttons = choices.map(([value, label]) => {
    const choice = button(label, event => {
      const previous = current
      show(value, pressPoint(event, choice))
      group.removeAttribute('title')
      management
        .saveTheme(value, getPreferencesVersion())
        .then(saved => onPreferencesVersion(saved.version))
        .catch(async error => {
          if (error instanceof ManagementError && error.message === 'PREFERENCES_STALE') {
            const saved = await management.preferences().catch(() => undefined)
            show(saved?.theme ?? previous)
            if (saved) onPreferencesVersion(saved.version)
            group.title = 'Giao diện vừa thay đổi ở nơi khác. Đã cập nhật theo cài đặt mới nhất.'
            return
          }
          // Keep what the user sees equal to what the Host has saved.
          show(previous)
          group.title = 'Không lưu được lựa chọn giao diện. Hãy thử lại.'
        })
    })
    return [value, choice] as const
  })
  function sync(): void {
    for (const [value, choice] of buttons) choice.setAttribute('aria-pressed', String(value === current))
  }
  sync()
  listen()
  group.append(...buttons.map(([, choice]) => choice))
  return {
    node: group,
    update(theme) {
      show(theme)
    },
    dispose() {
      system.removeEventListener('change', onSystemChange)
    },
  }
}
