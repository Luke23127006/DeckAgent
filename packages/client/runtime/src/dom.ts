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

export function button(text: string, action: () => void): HTMLButtonElement {
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
