export class RequestFailure extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'RequestFailure'
  }
}
