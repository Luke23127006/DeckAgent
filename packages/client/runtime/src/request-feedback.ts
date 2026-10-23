import type { HistoryMessage, StoredActivity, StoredRequest } from '@deckagent/host-api'

const errors: Readonly<Record<string, readonly [string, string]>> = {
  REQUEST_FAILED: ['Work did not finish', 'Review the saved work and connection or model settings before sending a new request.'],
  TURN_FAILED: ['Work did not finish', 'Review the saved work and connection or model settings before sending a new request.'],
  MODEL_PROTOCOL: ['The model response could not be used', 'Review the saved work before sending another request.'],
  TOOL_FAILED: ['This tool attempt did not finish', 'Review its saved output below. Do not assume its requested change succeeded.'],
  CLEANUP_FAILED: ['The request could not close cleanly', 'Review saved work and restart the Host before continuing.'],
  REQUEST_FINALIZATION_FAILED: ['The request result could not be saved', 'Reconnect to inspect saved work. Do not assume the last operation succeeded.'],
  PROVIDER_HTTP: ['Provider request failed', 'Check the connection and provider settings, then send a new request. No automatic retry was started.'],
  PROVIDER_NETWORK: ['Could not connect to the provider', 'Check your connection and provider URL, then send a new request.'],
  PROVIDER_TIMEOUT: ['The provider took too long', 'Check your connection and try a new request when ready.'],
  PROVIDER_TLS: ['Could not establish a secure provider connection', 'Check the provider URL and your system certificate configuration.'],
  PROVIDER_AUTH: ['Provider access was rejected', 'Check the API key and access to the selected model in Models & settings.'],
  PROVIDER_CREDENTIALS: ['An API key is needed', 'Set a valid API key for this provider in Models & settings.'],
  PROVIDER_RATE_LIMIT: ['Provider usage limit reached', 'Wait or review your provider limits before sending a new request. The model was not changed automatically.'],
  MODEL_NOT_SELECTABLE: ['The selected model is unavailable', 'Choose another model in this chat. No request was sent.'],
  AUTH_REQUIRED: ['This connection expired', 'Reopen the browser from the running Host.'],
  SESSION_BUSY: ['This chat is already working', 'Wait for the active request to finish, or stop it before sending another.'],
  OUTLINE_STALE: ['The outline changed', 'Review the current proposal before confirming.'],
  OUTLINE_ALREADY_CONFIRMED: ['The outline is already confirmed', 'Open the saved deck. Confirmation was not replayed.'],
  DECK_INCOMPLETE: ['The draft is not ready', 'Some planned slides remain unpublished. Saved slides were kept; send a new request to continue.'],
  EDIT_INCOMPLETE: ['The requested edit did not finish', 'Some requested slides were not published. Saved revisions were kept; send a clearly scoped request to continue.'],
  SLIDE_SCOPE_DENIED: ['Slide publication was blocked', 'Restate the slide number or exact title in a new request. There is no separate Host permission approval step.'],
  SLIDE_UNSAFE_HTML: ['The slide draft needs correction', 'The draft did not meet static HTML/CSS rules. A corrected draft must be published before it appears in the deck.'],
  SLIDE_REVISION_CONFLICT: ['The saved slide changed', 'Read the latest revision before trying the edit again.'],
  SLIDE_IDENTITY_INVALID: ['The slide could not be matched', 'Use a slide from the confirmed deck in this chat.'],
  STEP_LIMIT: ['The turn reached its step limit', 'Review the saved work and send a new request for the unfinished part.'],
}

/** Raw provider/error messages never become UI copy. Unknown codes use a fixed fallback. */
export function failureFeedback(code?: string) {
  const known = typeof code === 'string' && Object.hasOwn(errors, code) ? errors[code] : undefined
  return { label: known?.[0] ?? 'Work did not finish',
    detail: known?.[1] ?? 'Review the saved work and connection or model settings before sending a new request.',
    code: known ? code : undefined }
}

export function requestFeedback(state: StoredRequest['status'], errorCode: string | undefined,
  records: readonly StoredActivity[], tools: readonly HistoryMessage[], disconnected: boolean) {
  const saved = new Set<string>()
  for (const tool of tools) {
    if (tool.name !== 'publish_slide' || tool.isError !== false) continue
    try {
      const receipt = JSON.parse(tool.content)
      if (receipt && typeof receipt.slideId === 'string' && typeof receipt.sessionId === 'string' && receipt.deckId === receipt.sessionId &&
        Number.isSafeInteger(receipt.revision) && receipt.revision > 0 && Number.isSafeInteger(receipt.version) && receipt.version > 0)
        saved.add(receipt.slideId)
    } catch { /* A publication count requires a valid receipt, never model prose. */ }
  }
  const toolErrors = records.some(entry => entry.kind === 'tool' && entry.status === 'failed') || tools.some(tool => tool.isError === true)
  const savedText = saved.size ? `${saved.size} slide update${saved.size === 1 ? '' : 's'} saved` : ''
  let label: string
  let detail = savedText ? `${savedText}. ` : ''
  if (state === 'running') {
    const current = records.findLast(entry => entry.status === 'running')
    const phases: Readonly<Record<string, string>> = { propose_outline: 'Preparing outline', publish_slide: 'Publishing slide',
      read_slide: 'Reading published slide', write_file: 'Writing workspace draft', read_file: 'Reading workspace material' }
    label = disconnected ? 'Connection interrupted' : current?.kind === 'model' ? 'Waiting for model'
      : current && Object.hasOwn(phases, current.label) ? phases[current.label]! : 'Working…'
    detail += disconnected ? 'Progress is not updating live. Reconnect to read the saved state; work is not replayed.' : 'The request is still active.'
  } else if (state === 'completed') {
    label = `Turn finished${toolErrors ? ' · review tool errors' : savedText ? ` · ${savedText}` : ''}`
    detail += toolErrors ? 'One or more tool attempts failed. Review the reply and activity results; ending the turn does not prove that every requested change succeeded.'
      : 'The turn has ended. Only saved publication receipts confirm slide updates; drafts are not published results.'
  } else if (state === 'cancelled') {
    label = 'Stopped'
    detail += 'Finished work was kept; unfinished edits keep their last published revision. Nothing resumes automatically.'
  } else if (state === 'unknown') {
    label = 'Work interrupted · outcome unconfirmed'
    detail += 'Saved work was kept. Nothing resumes automatically; send a new request to continue.'
  } else {
    const failure = failureFeedback(errorCode)
    label = failure.label
    detail += `${failure.detail} Finished work was kept; nothing resumes automatically.`
  }
  return { label, detail, toolErrors }
}
