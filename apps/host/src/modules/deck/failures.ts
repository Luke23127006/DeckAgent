export type OutlineNotFoundReason = 'current-outline-required' | 'restore-outline-missing'

export class DeckWorkflowFailure extends Error {
  constructor(
    readonly code: string,
    readonly detail?: Readonly<Record<string, string | boolean>>,
    readonly reason?: OutlineNotFoundReason,
  ) {
    super(code)
    this.name = 'DeckWorkflowFailure'
  }
}
