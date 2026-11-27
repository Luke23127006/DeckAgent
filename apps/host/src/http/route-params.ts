import type { NextFunction, Request, Response } from 'express'

export const WORD_ID = /^[\w-]{1,100}$/

type Handler = (req: Request, res: Response) => Promise<void> | void

export function params(patterns: Readonly<Record<string, RegExp>>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const [name, pattern] of Object.entries(patterns)) {
      if (!pattern.test(param(req, name))) {
        next('route')
        return
      }
    }
    next()
  }
}

export function param(req: Request, name: string): string {
  const value = req.params[name]
  return typeof value === 'string' ? value : ''
}

export function route(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(next)
  }
}
