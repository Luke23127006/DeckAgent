export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  if (className) node.className = className
  return node
}

export function button(text: string, action: (event: MouseEvent) => void): HTMLButtonElement {
  const node = element('button', text)
  node.type = 'button'
  node.addEventListener('click', action)
  return node
}

export function field(text: string, input: HTMLElement): HTMLLabelElement {
  const label = element('label')
  label.append(element('span', text), input)
  input.setAttribute('aria-label', text)
  return label
}

const svgNamespace = 'http://www.w3.org/2000/svg'

/** Outline icon from SVG path data on a 24 by 24 grid, drawn in the current text colour. */
export function icon(paths: readonly string[]): SVGSVGElement {
  const svg = document.createElementNS(svgNamespace, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.75')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  for (const data of paths) {
    const path = document.createElementNS(svgNamespace, 'path')
    path.setAttribute('d', data)
    svg.append(path)
  }
  return svg
}

/** Button with an icon and no visible text; `label` is its accessible name. */
export function iconButton(
  label: string,
  paths: readonly string[],
  action: (event: MouseEvent) => void,
): HTMLButtonElement {
  const node = button('', action)
  node.setAttribute('aria-label', label)
  node.append(icon(paths))
  return node
}
