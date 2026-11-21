import { element } from './dom.ts'

let tip: HTMLElement | undefined

function shared(): HTMLElement {
  if (!tip) {
    tip = element('div', undefined, 'app-tooltip')
    tip.setAttribute('role', 'tooltip')
    tip.hidden = true
    document.body.append(tip)
  }
  return tip
}

/**
 * Tooltip for an icon button, with an optional keyboard shortcut. It is fixed to the window, so the
 * scrolling sidebar cannot clip it. The button keeps its own `aria-label`; the tooltip is a visual aid.
 */
export function tooltip(target: HTMLElement, text: string, keys?: string): void {
  const show = (): void => {
    if (target instanceof HTMLButtonElement && target.disabled) return
    const node = shared()
    node.replaceChildren(element('span', text))
    if (keys) node.append(element('kbd', keys))
    node.hidden = false
    const box = target.getBoundingClientRect()
    const width = node.offsetWidth
    const height = node.offsetHeight
    const below = box.bottom + 8 + height <= innerHeight
    node.style.top = `${below ? box.bottom + 8 : Math.max(8, box.top - 8 - height)}px`
    node.style.left = `${Math.max(8, Math.min(box.left + box.width / 2 - width / 2, innerWidth - width - 8))}px`
  }
  const hide = (): void => {
    if (tip) tip.hidden = true
  }
  target.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') show()
  })
  target.addEventListener('pointerleave', hide)
  target.addEventListener('pointerdown', hide)
  target.addEventListener('focus', () => {
    if (target.matches(':focus-visible')) show()
  })
  target.addEventListener('blur', hide)
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hide()
  })
  if (keys) target.setAttribute('aria-keyshortcuts', keys.replace('Ctrl', 'Control'))
}
