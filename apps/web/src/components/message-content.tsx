import type { ReactNode } from 'react'

const inlineTokens = /`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^\s)]+\)/g

function safeUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href
  } catch {
    // An incomplete or unsupported reference stays readable text.
  }
  return undefined
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let offset = 0
  for (const match of text.matchAll(inlineTokens)) {
    nodes.push(text.slice(offset, match.index))
    const value = match[0]
    const key = `${match.index}`
    if (value.startsWith('[') && text[match.index - 1] === '!') nodes.push(value)
    else if (value.startsWith('`')) nodes.push(<code key={key}>{value.slice(1, -1)}</code>)
    else if (value.startsWith('**')) nodes.push(<strong key={key}>{value.slice(2, -2)}</strong>)
    else {
      const end = value.indexOf('](')
      const href = safeUrl(value.slice(end + 2, -1))
      nodes.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {value.slice(1, end)}
          </a>
        ) : (
          value
        ),
      )
    }
    offset = match.index + value.length
  }
  nodes.push(text.slice(offset))
  return nodes
}

function parseFence(line: string): string | undefined {
  return /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
}

function parseHeading(line: string): { readonly level: number; readonly text: string } | undefined {
  const match = /^ {0,3}(#{1,6})\s+(.+)$/.exec(line)
  const marker = match?.[1]
  const text = match?.[2]
  return marker === undefined || text === undefined ? undefined : { level: marker.length, text }
}

function parseListItem(
  line: string,
): { readonly ordered: boolean; readonly start?: string; readonly text: string } | undefined {
  const match = /^ {0,3}(?:([-*+])|([0-9]{1,9})[.)])\s+(.+)$/.exec(line)
  const text = match?.[3]
  if (text === undefined) return undefined
  const start = match?.[2]
  return start === undefined ? { ordered: false, text } : { ordered: true, start, text }
}

/** A small text-only subset of Markdown. Raw HTML and images never become application DOM. */
export function MessageContent(props: { readonly text: string }) {
  const lines = props.text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const key = String(index)
    const line = lines[index++]
    if (line === undefined) break
    if (!line.trim()) continue
    const fence = parseFence(line)
    if (fence) {
      const body: string[] = []
      while (index < lines.length) {
        const next = lines[index++]
        if (next === undefined) break
        const closing = parseFence(next)
        if (closing && closing[0] === fence[0] && closing.length >= fence.length && next.trim() === closing) break
        body.push(next)
      }
      blocks.push(
        <pre key={key}>
          <code>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }
    const title = parseHeading(line)
    if (title) {
      blocks.push(title.level <= 2 ? <h2 key={key}>{inline(title.text)}</h2> : <h3 key={key}>{inline(title.text)}</h3>)
      continue
    }
    const item = parseListItem(line)
    if (item) {
      const items: ReactNode[] = []
      let current = item
      for (;;) {
        items.push(<li key={items.length}>{inline(current.text)}</li>)
        const peek = lines[index]
        const next = peek === undefined ? undefined : parseListItem(peek)
        if (!next || next.ordered !== item.ordered) break
        current = next
        index++
      }
      blocks.push(
        item.ordered ? (
          <ol key={key} start={item.start === undefined ? undefined : Number(item.start)}>
            {items}
          </ol>
        ) : (
          <ul key={key}>{items}</ul>
        ),
      )
      continue
    }
    const paragraph = [line]
    while (index < lines.length) {
      const next = lines[index]
      if (next === undefined || !next.trim() || parseHeading(next) || parseFence(next) || parseListItem(next)) break
      paragraph.push(next)
      index++
    }
    blocks.push(<p key={key}>{inline(paragraph.join('\n'))}</p>)
  }
  return <div className="message-content">{blocks}</div>
}
