import { element } from './dom.ts'

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

const listItem = (line: string) => /^ {0,3}(?:([-*+])|([0-9]{1,9})[.)])\s+(.+)$/.exec(line)
const heading = (line: string) => /^ {0,3}(#{1,6})\s+(.+)$/.exec(line)
const fence = (line: string) => /^ {0,3}(`{3,}|~{3,})/.exec(line)

export function messageContent(text: string): HTMLElement {
  const content = element('div', undefined, 'message-content')
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let index = 0
  while (index < lines.length) {
    const line = lines[index++]!
    if (!line.trim()) continue
    const code = fence(line)
    if (code) {
      const body: string[] = []
      while (index < lines.length) {
        const next = lines[index++]!
        const closing = fence(next)
        if (
          closing &&
          closing[1]![0] === code[1]![0] &&
          closing[1]!.length >= code[1]!.length &&
          next.trim() === closing[1]
        )
          break
        body.push(next)
      }
      const pre = element('pre')
      pre.append(element('code', body.join('\n')))
      content.append(pre)
      continue
    }
    const title = heading(line)
    if (title) {
      const node = element(title[1]!.length <= 2 ? 'h2' : 'h3')
      inline(node, title[2]!)
      content.append(node)
      continue
    }
    const item = listItem(line)
    if (item) {
      const ordered = !!item[2]
      const list = ordered ? element('ol') : element('ul')
      if (ordered) list.setAttribute('start', item[2]!)
      let current = item
      for (;;) {
        const node = element('li')
        inline(node, current[3]!)
        list.append(node)
        const next = index < lines.length ? listItem(lines[index]!) : null
        if (!next || !!next[2] !== ordered) break
        current = next
        index++
      }
      content.append(list)
      continue
    }
    const paragraph = [line]
    while (index < lines.length) {
      const next = lines[index]!
      if (!next.trim() || heading(next) || fence(next) || listItem(next)) break
      paragraph.push(next)
      index++
    }
    const node = element('p')
    inline(node, paragraph.join('\n'))
    content.append(node)
  }
  return content
}
