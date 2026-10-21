import { DeckError } from './contracts.ts'

export const MAX_SLIDE_BYTES = 256 * 1024

/** Static HTML/CSS only. This rejection policy is not a sanitizer: iframe sandbox
 * and document CSP remain the rendering security boundary. No navigation or embeds.
 */
export function validateSlideHtml(html: unknown): asserts html is string {
  if (
    typeof html !== 'string' ||
    !html.trim() ||
    Buffer.byteLength(html) > MAX_SLIDE_BYTES ||
    html.includes(String.fromCharCode(0)) ||
    /<\s*\/?\s*(?:script|iframe|frame|frameset|object|embed|base|meta|link|form|a|area)\b/i.test(html) ||
    /\b(?:src|href|action|formaction|srcdoc|on[a-z]+)\s*=/i.test(html)
  ) {
    throw new DeckError('DECK_UNSAFE_HTML')
  }
}
