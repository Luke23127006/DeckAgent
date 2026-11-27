export interface TextMessage {
  readonly role: string
  readonly content: string
  readonly attachments?: readonly { readonly name: string }[]
}

const titleLength = 64

/** A chat is named from its content: the first user message, on one line, cut to 64 characters. */
export function chatTitle(messages: readonly TextMessage[]): string {
  const message = messages.find(message => message.role === 'user')
  const first = (message?.content.trim() || (message?.role === 'user' ? message.attachments?.[0]?.name : '') || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!first) return ''
  const characters = [...first]
  return characters.length > titleLength ? `${characters.slice(0, titleLength).join('')}…` : first
}

/** Words are compared after NFC normalization, without case. */
export function searchWords(value: string): readonly string[] {
  return value.normalize('NFC').toLocaleLowerCase().split(/\s+/).filter(Boolean)
}

/** A chat matches when every word appears in its name or in the text of its conversation. */
export function chatMatches(title: string, messages: readonly TextMessage[], words: readonly string[]): boolean {
  if (!words.length) return false
  const text = [
    title,
    ...messages
      .filter(message => message.role === 'user' || message.role === 'assistant')
      .map(message => message.content),
  ]
    .join('\n')
    .normalize('NFC')
    .toLocaleLowerCase()
  return words.every(word => text.includes(word))
}
