import { decodeContentOrigins } from '@deckagent/presentation-document'
import { DeckError } from './errors.ts'
import type { ContentProvenance } from './generation-contracts.ts'

export function validateProvenance(value: unknown): readonly ContentProvenance[] {
  try {
    return decodeContentOrigins(value)
  } catch {
    throw new DeckError('PROVENANCE_INVALID')
  }
}
