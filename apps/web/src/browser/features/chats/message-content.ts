import { element } from '../../dom.ts'

/** A small text-only formatting subset. Raw HTML and images never become application DOM. */
function inline(parent: HTMLElement, text: string): void {
  const tokens = /`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^\s)]+\)/g
  let offset = 0
  for (const match of text.matchAll(tokens)) {
    parent.append(document.createTextNode(text.slice(offset, match.index)))
    const value = match[0]
    if (value.startsWith('[') && text[match.index - 1] === '!') parent.append(document.createTextNode(value))
    else if (value.startsWith('`')) parent.append(element('code', value.slice(1, -1)))
    else if (value.startsWith('**')) parent.append(element('strong', value.slice(2, -2)))
    else {
      const end = value.indexOf('](')
      let url: URL | undefined
      try {
        const candidate = new URL(value.slice(end + 2, -1))
        if (['http:', 'https:'].includes(candidate.protocol) && !candidate.username && !candidate.password)
          url = candidate
      } catch {
        // Incomplete or unsupported references stay readable text.
      }
      if (url) {
        const link = element('a', value.slice(1, end))
        link.href = url.href
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        parent.append(link)
      } else parent.append(document.createTextNode(value))
    }
    offset = match.index + value.length
  }
  parent.append(document.createTextNode(text.slice(offset)))
}

function parseFence(line: string): { readonly marker: string } | null {
  const match = /^ {0,3}(`{3,}|~{3,})/.exec(line)
  const marker = match?.[1]
  return marker === undefined ? null : { marker }
}

function parseHeading(line: string): { readonly level: number; readonly text: string } | null {
  const match = /^ {0,3}(#{1,6})\s+(.+)$/.exec(line)
  const marker = match?.[1]
  const text = match?.[2]
  return marker === undefined || text === undefined ? null : { level: marker.length, text }
}

function parseListItem(
  line: string,
): { readonly ordered: boolean; readonly start?: string; readonly text: string } | null {
  const match = /^ {0,3}(?:([-*+])|([0-9]{1,9})[.)])\s+(.+)$/.exec(line)
  const text = match?.[3]
  if (text === undefined) return null
  const start = match?.[2]
  return start === undefined ? { ordered: false, text } : { ordered: true, start, text }
}

export function messageContent(text: string): HTMLElement {
  const content = element('div', undefined, 'message-content')
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let index = 0
  while (index < lines.length) {
    const line = lines[index++]
    if (line === undefined) break
    if (!line.trim()) continue
    const code = parseFence(line)
    if (code) {
      const body: string[] = []
      while (index < lines.length) {
        const next = lines[index++]
        if (next === undefined) break
        const closing = parseFence(next)
        if (
          closing &&
          closing.marker[0] === code.marker[0] &&
          closing.marker.length >= code.marker.length &&
          next.trim() === closing.marker
        )
          break
        body.push(next)
      }
      const pre = element('pre')
      pre.append(element('code', body.join('\n')))
      content.append(pre)
      continue
    }
    const title = parseHeading(line)
    if (title) {
      const node = element(title.level <= 2 ? 'h2' : 'h3')
      inline(node, title.text)
      content.append(node)
      continue
    }
    const item = parseListItem(line)
    if (item) {
      const list = item.ordered ? element('ol') : element('ul')
      if (item.start !== undefined) list.setAttribute('start', item.start)
      let current = item
      for (;;) {
        const node = element('li')
        inline(node, current.text)
        list.append(node)
        const peek = lines[index]
        const next = peek !== undefined ? parseListItem(peek) : null
        if (!next || next.ordered !== item.ordered) break
        current = next
        index++
      }
      content.append(list)
      continue
    }
    const paragraph = [line]
    while (index < lines.length) {
      const next = lines[index]
      if (next === undefined || !next.trim() || parseHeading(next) || parseFence(next) || parseListItem(next)) break
      paragraph.push(next)
      index++
    }
    const node = element('p')
    inline(node, paragraph.join('\n'))
    content.append(node)
  }
  return content
}
