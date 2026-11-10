/** Safe facts a user-facing message may name, such as which workspace has a folder. Never a path or file content. */
export type HttpErrorDetail = Readonly<Record<string, string | boolean>>

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, readonly detail?: HttpErrorDetail) { super(code) }
}
