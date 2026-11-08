import { animate, createTimeline, spring, stagger, utils } from 'animejs'

/**
 * Expressive motion for the moments a user notices: first load, sending, a request changing state, the
 * menu, a new slide. It watches the DOM instead of hooking the views, so the views stay unaware of it.
 * Everything here is skipped under `prefers-reduced-motion`; the CSS fallback in `motionStyle` then
 * applies a plain fade. Motion never changes layout: it only moves, scales, fades and clips.
 */

const message = '.message, .request-record, .request-slides'
const inline = ['transform', 'opacity', 'filter', 'clip-path', 'transform-origin', 'transition', 'box-shadow']

function settle(items: Element | readonly Element[]): void {
  for (const item of 'length' in items ? items : [items])
    if (item instanceof HTMLElement) for (const name of inline) item.style.removeProperty(name)
}

/** Buttons carry a CSS transform transition (press feedback); it must not smooth the frames of a script animation. */
function hold(items: readonly HTMLElement[]): void {
  for (const item of items) item.style.transition = 'none'
}

function tint(color: string, strength: number): string {
  return `color-mix(in srgb, var(${color}) ${Math.round(strength * 100)}%, transparent)`
}

function ring(target: HTMLElement, color: string, loops = 1): void {
  animate(target, {
    boxShadow: [`0 0 0 0 ${tint(color, 0.55)}`, `0 0 0 16px ${tint(color, 0)}`],
    duration: 900,
    ease: 'outCubic',
    loop: loops,
    onComplete: () => settle(target),
  })
}

function fly(root: HTMLElement, node: HTMLElement): void {
  const composer = root.querySelector('.composer')?.getBoundingClientRect()
  const box = node.getBoundingClientRect()
  const distance = composer ? Math.max(0, Math.min(composer.top - box.top, 220)) : 24
  node.style.transformOrigin = '100% 100%'
  utils.set(node, { opacity: 0 })
  animate(node, {
    translateY: [distance, 0],
    scale: [0.86, 1],
    opacity: { from: 0, to: 1, duration: 160, ease: 'outQuad' },
    ease: spring({ bounce: 0.32, duration: 640 }),
    onComplete: () => settle(node),
  })
}

function pop(node: HTMLElement): void {
  utils.set(node, { opacity: 0 })
  animate(node, {
    translateY: [14, 0],
    scale: [0.97, 1],
    opacity: { from: 0, to: 1, duration: 200, ease: 'outQuad' },
    ease: spring({ bounce: 0.2, duration: 520 }),
    onComplete: () => settle(node),
  })
}

function bulk(nodes: readonly HTMLElement[]): void {
  utils.set(nodes, { opacity: 0 })
  animate(nodes, {
    translateY: [10, 0],
    opacity: [0, 1],
    delay: stagger(Math.min(24, 360 / nodes.length)),
    duration: 420,
    ease: 'outCubic',
    onComplete: () => settle(nodes),
  })
}

function menuIn(menu: HTMLElement): void {
  const above = menu.dataset.side !== 'below'
  const rows = [
    ...menu.querySelectorAll<HTMLElement>(
      ':scope > p, :scope > button, :scope > .menu-section, :scope > .developer-tools',
    ),
  ]
  menu.style.transformOrigin = above ? 'left bottom' : 'left top'
  hold(rows)
  utils.set(rows, { opacity: 0 })
  animate(menu, {
    opacity: { from: 0, to: 1, duration: 140, ease: 'outQuad' },
    scale: [0.9, 1],
    translateY: [above ? 12 : -12, 0],
    ease: spring({ bounce: 0.28, duration: 560 }),
    onComplete: () => settle(menu),
  })
  animate(rows, {
    opacity: [0, 1],
    translateX: [-14, 0],
    delay: stagger(38, { start: 70 }),
    duration: 420,
    ease: 'outExpo',
    onComplete: () => settle(rows),
  })
}

/** Wraps each letter so it can move on its own. Words stay whole, so a narrow screen never breaks a word. */
function splitLetters(node: HTMLElement): { letters: HTMLElement[]; restore: () => void } {
  const text = node.textContent ?? ''
  const letters: HTMLElement[] = []
  const parts: (HTMLElement | string)[] = []
  for (const word of text.split(/(\s+)/)) {
    if (!word.trim()) {
      parts.push(word)
      continue
    }
    const wrapper = document.createElement('span')
    wrapper.style.display = 'inline-block'
    wrapper.style.whiteSpace = 'nowrap'
    wrapper.setAttribute('aria-hidden', 'true')
    for (const character of word) {
      const letter = document.createElement('span')
      letter.style.display = 'inline-block'
      letter.textContent = character
      letters.push(letter)
      wrapper.append(letter)
    }
    parts.push(wrapper)
  }
  node.setAttribute('aria-label', text)
  node.replaceChildren(...parts)
  return {
    letters,
    restore: () => {
      node.textContent = text
      node.removeAttribute('aria-label')
    },
  }
}

function welcomeIn(welcome: HTMLElement): void {
  const heading = welcome.querySelector<HTMLElement>('h2')
  const text = welcome.querySelector<HTMLElement>('p')
  if (heading) {
    // The letters are split only while moving; the plain heading is restored afterwards.
    const split = splitLetters(heading)
    utils.set(split.letters, { opacity: 0 })
    animate(split.letters, {
      translateY: ['0.7em', 0],
      opacity: [0, 1],
      delay: stagger(22),
      duration: 640,
      ease: 'outExpo',
      onComplete: () => split.restore(),
    })
  }
  if (text) {
    utils.set(text, { opacity: 0 })
    animate(text, {
      translateY: [14, 0],
      opacity: [0, 1],
      delay: 380,
      duration: 700,
      ease: 'outExpo',
      onComplete: () => settle(text),
    })
  }
}

function deckIn(deck: HTMLElement): void {
  // Clipped from the right, never moved: the resize divider on the left edge has to stay where the pointer expects it.
  animate(deck, {
    clipPath: ['inset(0 14% 0 0)', 'inset(0 0% 0 0)'],
    opacity: { from: 0, to: 1, duration: 260, ease: 'outQuad' },
    duration: 640,
    ease: 'outExpo',
    onComplete: () => settle(deck),
  })
}

function slideIn(frame: HTMLElement): void {
  animate(frame, {
    opacity: [0.3, 1],
    scale: [0.972, 1],
    duration: 560,
    ease: 'outExpo',
    onComplete: () => settle(frame),
  })
}

function thumbnailIn(item: HTMLElement): void {
  utils.set(item, { opacity: 0 })
  animate(item, {
    scale: [0.5, 1],
    rotate: [-8, 0],
    opacity: { from: 0, to: 1, duration: 160 },
    ease: spring({ bounce: 0.45, duration: 640 }),
    onComplete: () => settle(item),
  })
}

function recordChanged(record: HTMLElement): void {
  const status = record.dataset.status
  if (status === 'completed') {
    ring(record, '--ok')
    animate(record, { scale: [1, 1.018, 1], duration: 520, ease: 'outExpo', onComplete: () => settle(record) })
  } else if (status === 'awaiting_user') {
    ring(record, '--accent', 3)
  } else if (status === 'failed') {
    ring(record, '--err')
    animate(record, {
      translateX: [0, -9, 8, -6, 4, -2, 0],
      duration: 520,
      ease: 'outQuad',
      onComplete: () => settle(record),
    })
  }
}

function intro(root: HTMLElement): void {
  const near = (selector: string) => [...root.querySelectorAll<HTMLElement>(selector)]
  const rail = near('.nav-top, .chat-navigation > button, .recents-toggle')
  const header = near('.conversation-header')
  const dock = near('.composer-dock')
  const all = [...rail, ...header, ...dock]
  hold(all)
  utils.set(all, { opacity: 0 })
  createTimeline({ defaults: { ease: 'outExpo', duration: 820 }, onComplete: () => settle(all) })
    .add(rail, { opacity: [0, 1], translateX: [-22, 0], delay: stagger(60) }, 0)
    .add(header, { opacity: [0, 1], translateY: [-14, 0] }, 180)
    .add(dock, { opacity: [0, 1], translateY: [20, 0], scale: [0.97, 1] }, 320)
  const sheen = document.createElement('div')
  sheen.className = 'motion-sheen'
  sheen.setAttribute('aria-hidden', 'true')
  root.append(sheen)
  animate(sheen, {
    translateX: ['-100%', '100%'],
    opacity: [0, 1, 0],
    delay: 260,
    duration: 1300,
    ease: 'inOutQuad',
    onComplete: () => sheen.remove(),
  })
}

export function initMotion(root: HTMLElement): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  root.dataset.motion = 'on'
  intro(root)
  new MutationObserver(records => {
    const fresh: HTMLElement[] = []
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (record.target instanceof HTMLElement && record.target.matches('.messages') && node.matches(message))
            fresh.push(node)
          else if (
            record.target instanceof HTMLElement &&
            record.target.matches('.deck-slide-list') &&
            node.matches('button')
          )
            thumbnailIn(node)
        }
        continue
      }
      const target = record.target
      if (!(target instanceof HTMLElement) || record.oldValue === null) continue
      if (record.attributeName === 'data-status') {
        if (target.matches('.request-record') && record.oldValue !== target.dataset.status) recordChanged(target)
        else if (
          target.matches('.deck-slide-list button') &&
          record.oldValue === 'pending' &&
          target.dataset.status !== 'pending'
        )
          ring(target.querySelector<HTMLElement>('.thumbnail') ?? target, '--accent')
      } else if (record.attributeName === 'hidden' && !target.hidden) {
        if (target.matches('.account-menu')) menuIn(target)
        else if (target.matches('.welcome')) welcomeIn(target)
        else if (target.matches('.published-deck-sidebar')) deckIn(target)
      } else if (record.attributeName === 'srcdoc' && target.matches('.deck-stage iframe')) slideIn(target)
    }
    if (fresh.length > 3) bulk(fresh)
    else for (const node of fresh) node.matches('.message.user') ? fly(root, node) : pop(node)
  }).observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['data-status', 'hidden', 'srcdoc'],
  })
}
