export class SourceToolFailure extends Error {
  constructor(
    readonly code: string,
    readonly detail?: Readonly<Record<string, string | boolean>>,
  ) {
    super(code)
    this.name = 'SourceToolFailure'
  }
}
