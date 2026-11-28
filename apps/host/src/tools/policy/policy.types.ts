/** Host-only read plans. The model sees tool results, never an executable grant. */
export interface SourceRead {
  readonly text: string
  readonly fingerprint: string
  readonly lineCount: number
}

export interface SourceReadPlan {
  readonly origin: string
  readonly decision: 'allow' | 'ask'
  readonly key: string
  readonly target: string
  readonly identity: string
  readonly read: (signal: AbortSignal) => Promise<SourceRead>
}

export interface SourceAccess {
  readonly context: string
  planRead(path: string, external: boolean, signal: AbortSignal): Promise<SourceReadPlan>
  list(
    path: string,
    signal: AbortSignal,
  ): Promise<{
    readonly entries: readonly { readonly name: string; readonly kind: 'file' | 'directory' }[]
    readonly truncated: boolean
  }>
}

export interface SourceAccessOptions {
  readonly root?: string
  readonly deniedRoots: readonly string[] | (() => readonly string[])
  /** Rechecked before and after every operation, including after an approval wait. */
  readonly validate?: () => Promise<void>
}

export class SourceError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'SourceError'
  }
}
