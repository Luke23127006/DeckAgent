import { FormatError } from '@deckagent/presentation-document'

export const MAX_SLIDE_BYTES = 256 * 1024

/** Static HTML/CSS only. This rejection policy is not a sanitizer: iframe sandbox
 * and document CSP remain the rendering security boundary. No navigation or embeds.
 */
export function validateLegacySlideHtml(source: unknown): asserts source is string {
  if (
    typeof source !== 'string' ||
    !source.trim() ||
    Buffer.byteLength(source) > MAX_SLIDE_BYTES ||
    source.includes(String.fromCharCode(0)) ||
    /<\s*\/?\s*(?:script|iframe|frame|frameset|object|embed|base|meta|link|form|a|area)\b/i.test(source) ||
    /\b(?:src|href|action|formaction|srcdoc|on[a-z]+)\s*=/i.test(source)
  ) {
    throw new FormatError('DECK_UNSAFE_HTML')
  }
}
