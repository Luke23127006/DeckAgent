import type { Message } from './contracts.ts'

export function buildPrompt(history: readonly Message[], systemPrompt: string): readonly Message[] {
  return [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...structuredClone(history),
  ]
}
