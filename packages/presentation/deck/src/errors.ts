import { createHash } from 'node:crypto'
import { FormatError } from '@deckagent/presentation-document'
import type { ValidationIssue } from '@deckagent/presentation-document'
import type { ImageAttempt } from './generation-contracts.ts'

export class DeckError extends FormatError {
  constructor(code: string, issues: readonly ValidationIssue[] = []) {
    super(code, issues)
    this.message = deckFailureMessage(code) ? `${code}: ${deckFailureMessage(code)}` : code
    this.name = 'DeckError'
  }
}

export class ImagePreparationError extends DeckError {
  constructor(
    code: string,
    readonly attempts: readonly ImageAttempt[],
  ) {
    super(code)
  }
}

const failureMessages: Readonly<Record<string, string>> = {
  BRIEF_REPAIR_LIMIT:
    'The request exhausted two Brief repairs. Inspect the field issues before starting a new request; saved Brief and Outline versions remain unchanged.',
  IMAGE_PREPARATION_REQUIRED:
    'Required images are not prepared. Revise the Outline query, select an alternative or explicitly mark the image optional before confirming again.',
  SLIDE_CORRECTION_LIMIT:
    'The correction budget for this slide is exhausted. Review the validation issues and retained publications before starting a new request.',
  CONFIRMATION_INVALID: 'Confirm exactly the displayed Outline and Brief. Refresh the proposal and try again.',
  CONFIRMATION_CONFLICT:
    'This confirmation targets different saved content. Reload the current proposal before confirming.',
  BRIEF_STALE: 'The Brief changed. Reload it and review the current Outline before confirming.',
  GENERATION_UNAVAILABLE:
    'Generation is not connected. Keep the saved proposal and retry when generation is available.',
  GENERATION_MODEL_CHANGED: 'Select the model used by this confirmation before retrying admission.',
  GENERATION_REQUEST_INACTIVE: 'This generation request has ended. Read the saved Deck; no further writes are allowed.',
  STAGE_LIMIT: 'Two stages are open. Publish or discard one before opening another.',
  STAGE_CHUNK_INVALID:
    'Send a nonempty, well-formed UTF-8 chunk of at most 8 KiB with its expected sequence and final flag.',
  STAGE_SOURCE_TOO_LARGE:
    'The slide source exceeds 256 KiB. Revise it explicitly and resubmit; no content was truncated.',
  STAGE_CHUNK_CONFLICT:
    'This sequence already has different bytes. Retry identical content or start a corrected stage.',
  STAGE_INCOMPLETE: 'Complete the staged source before publication.',
  ARTIFACT_UNSAFE_HTML:
    'Use supported static HTML. Remove active content, embeds and non-managed references, then resubmit.',
  ARTIFACT_UNSAFE_CSS:
    'Use supported layout declarations and named theme roles. Remove imports, URLs and unsupported declarations.',
  ARTIFACT_THEME_MISMATCH: 'Use the supplied effective theme variables instead of adding colours, fonts or type sizes.',
  ARTIFACT_RENDERER_UNAVAILABLE:
    'Install a supported local Chrome or Edge browser before publishing. The current revision was kept.',
  ARTIFACT_OVERFLOW: 'Content exceeds the 1280 by 720 slide. Revise the layout and resubmit.',
  ARTIFACT_REQUIRED_CONTENT_MISSING: 'Include all planned headings and content visibly before publishing.',
  ARTIFACT_UNREADABLE: 'Some content is invisible or unreadable. Revise its layout or theme use and resubmit.',
  ARTIFACT_CORRUPT:
    'Published bytes are missing or changed. Keep a backup of the data folder and restore a known-good copy.',
}

export function deckFailureMessage(code: string): string | undefined {
  return failureMessages[code]
}

export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
