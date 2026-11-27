function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function nonempty(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}
function keys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key))
}
function json(value: unknown, parents = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || parents.has(value) || Object.getOwnPropertySymbols(value).length) return false
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false
  parents.add(value)
  const result = Array.isArray(value)
    ? Object.keys(value).length === value.length && Array.from(value).every(item => json(item, parents))
    : Object.values(value).every(item => json(item, parents))
  parents.delete(value)
  return result
}

function isPreparation(value: unknown): boolean {
  if (!record(value) || typeof value.parserVersion !== 'string' || !/^[a-zA-Z0-9_.-]{1,80}$/.test(value.parserVersion))
    return false
  if (
    !Array.isArray(value.capabilities) ||
    value.capabilities.length > 32 ||
    !value.capabilities.every(item => typeof item === 'string' && /^[a-z0-9-]{1,80}$/.test(item))
  )
    return false
  if (!['complete', 'partial'].includes(String(value.completeness))) return false
  return (
    Array.isArray(value.omitted) &&
    value.omitted.length <= 1000 &&
    value.omitted.every(
      item =>
        record(item) &&
        typeof item.code === 'string' &&
        /^[A-Z_]{1,64}$/.test(item.code) &&
        (item.entry === undefined || (typeof item.entry === 'string' && item.entry.length <= 512)),
    )
  )
}

/** Validate before JSON encoding so unsupported values cannot silently disappear. */
export function isValidMessage(value: unknown): boolean {
  let valid = false
  if (record(value) && typeof value.content === 'string' && json(value)) {
    if (value.role === 'system') valid = keys(value, ['role', 'content'])
    if (value.role === 'user')
      valid =
        keys(value, ['role', 'content', 'attachments']) &&
        (value.attachments === undefined ||
          (Array.isArray(value.attachments) && value.attachments.length > 0 && value.attachments.every(attachment)))
    if (value.role === 'tool')
      valid =
        keys(value, ['role', 'content', 'toolCallId', 'name', 'isError']) &&
        nonempty(value.toolCallId) &&
        nonempty(value.name) &&
        typeof value.isError === 'boolean'
    if (value.role === 'assistant') {
      valid =
        keys(value, ['role', 'content', 'toolCalls', 'interrupted', 'providerState']) &&
        (!('interrupted' in value) || value.interrupted === true) &&
        (!('toolCalls' in value) ||
          (Array.isArray(value.toolCalls) &&
            value.toolCalls.every(
              call =>
                record(call) &&
                keys(call, ['id', 'name', 'arguments']) &&
                nonempty(call.id) &&
                nonempty(call.name) &&
                record(call.arguments),
            )))
      if ('providerState' in value) {
        const state = value.providerState
        valid =
          valid &&
          record(state) &&
          keys(state, ['provider', 'model', 'data']) &&
          nonempty(state.provider) &&
          nonempty(state.model) &&
          'data' in state
      }
    }
  }
  return valid
}

function attachment(value: unknown): boolean {
  if (
    !record(value) ||
    !keys(value, [
      'attachmentId',
      'name',
      'state',
      'byteSize',
      'detectedType',
      'fingerprint',
      'source',
      'preparation',
      'parsedFingerprint',
    ])
  )
    return false
  const source = value.source
  return (
    typeof value.attachmentId === 'string' &&
    /^att-[a-f0-9-]{36}$/.test(value.attachmentId) &&
    nonempty(value.name) &&
    value.state === 'ready' &&
    Number.isSafeInteger(value.byteSize) &&
    Number(value.byteSize) >= 0 &&
    nonempty(value.detectedType) &&
    typeof value.fingerprint === 'string' &&
    /^[a-f0-9]{64}$/.test(value.fingerprint) &&
    (value.preparation === undefined || isPreparation(value.preparation)) &&
    (value.parsedFingerprint === undefined ||
      (typeof value.parsedFingerprint === 'string' && /^[a-f0-9]{64}$/.test(value.parsedFingerprint))) &&
    record(source) &&
    keys(source, ['sourceId', 'version', 'kind', 'label']) &&
    nonempty(source.sourceId) &&
    source.version === 1 &&
    source.kind === 'attachment' &&
    nonempty(source.label)
  )
}

interface TextMessage {
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
