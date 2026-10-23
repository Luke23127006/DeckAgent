import type { DeckSnapshot } from '@deckagent/deck'

/** Fail closed: only explicit whole-deck, numbered lists/ranges or exact titles authorize edits. */
export function editingScope(input: string, deck: DeckSnapshot): readonly string[] {
  const text = input.normalize('NFC').toLocaleLowerCase().trim()
  // Complex exclusions/additions need clarification rather than a guessed grant.
  if (/\b(?:except|excluding|not|don't|do not|add|insert|remove|delete|or)\b|ngoại trừ|trừ slide|không|thêm|chèn|xóa|hoặc/u.test(text)) return []
  const command = text.replace(/^(?:(?:please|hãy|chỉ)\s+)*/u, '').trim()
  const ids = new Set<string>()
  const target = /^(?:edit|change|update|revise|publish|generate|sửa|chỉnh sửa|cập nhật|đổi|tạo|hoàn thành)\s+(.+)$/u.exec(command)?.[1]
  if (target && /^(?:all slides|every slide|(?:the )?whole deck|toàn bộ (?:deck|slides?)|tất cả (?:các )?slides?)(?:\b|\s)/u.test(target)) {
    if (/\bslides?\s*\d/u.test(command)) return []
    return deck.slides.map(slide => slide.slideId)
  }
  if (/^(?:continue|resume|retry the unfinished slides|tiếp tục)(?:\b|\s)/u.test(command) && !/\bslides?\s*(?:\d|["“])/u.test(text))
    return deck.slides.filter(slide => slide.status === 'pending').map(slide => slide.slideId)
  if (!target) return []
  // Only the leading target clause grants writes. Later slide references can be read-only context.
  const reference = /^slides?\s+(\d+(?:\s*(?:,|and|và|-|đến|to)\s*\d+)*)(?![\p{L}\p{N}]|\.\d)/u.exec(target)
  const references = reference ? [reference] : []
  for (const reference of references) {
    const list = reference[1]!
    const numbers = list.match(/\d+/g)!.map(Number)
    const range = /-|đến|\bto\b/u.test(list)
    if (numbers.some(number => !Number.isSafeInteger(number) || number < 1 || number > deck.slides.length)) return []
    if (range && (numbers.length !== 2 || numbers[0]! > numbers[1]!)) return []
    const positions = range ? Array.from({ length: numbers[1]! - numbers[0]! + 1 }, (_, i) => numbers[0]! + i) : numbers
    if (positions.some(position => position < 1 || position > deck.slides.length)) return []
    for (const position of positions) ids.add(deck.slides[position - 1]!.slideId)
  }
  // Quoted titles avoid treating incidental words as authorization.
  const title = /^slide\s*(?:\d+\s*)?["“]([^"”]+)["”]/u.exec(target)
  for (const reference of title ? [title] : []) {
    const matches = deck.slides.filter(slide => slide.title.toLocaleLowerCase() === reference[1])
    if (matches.length !== 1) return []
    if (ids.size && !ids.has(matches[0]!.slideId)) return []
    ids.add(matches[0]!.slideId)
  }
  return [...ids]
}

export function editingInstructions(deck: DeckSnapshot, scope: readonly string[], requestId: string): string {
  return `Host-confirmed slide plan: ${JSON.stringify(deck)}\nHost-assigned draft paths: ${JSON.stringify(Object.fromEntries(deck.slides.map(slide => [slide.slideId, `draft-${requestId}-${slide.slideId}.html`])))}\nThis is a follow-up edit, never a new outline or deck.
Host-authorized slide IDs: ${JSON.stringify(scope)}. Change only these slides as requested, preserving everything else. Read published slides with read_slide before editing; pending slides use the confirmed content plan. Do not create a new outline or change slide count/order. Use write_file to create draft-${requestId}-<slideId>.html, then publish_slide with the current expectedRevision and a unique publicationId. Never reuse an old draft after a write failure. Publish each finished slide immediately. Only static safe HTML/CSS; no scripts, external resources or images. Final response names actual changed slides and what changed, says other slides were untouched, and states unfinished work/assumptions without claiming unperformed checks. No automatic continuation.`
}
