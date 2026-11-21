import { decodeContentOrigins } from '@deckagent/presentation-document'
import { DeckError } from './contracts.ts'
import type { ContentProvenance } from './contracts.ts'

export function validateProvenance(value: unknown): readonly ContentProvenance[] {
  try {
    return decodeContentOrigins(value)
  } catch {
    throw new DeckError('PROVENANCE_INVALID')
  }
}
