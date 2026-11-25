import { z } from 'zod'
import { invalidResponse, nonNegativeInt } from './validation-primitives.ts'

export type ChangeTopic = 'deck' | 'brief' | 'outline' | 'draft' | 'chats' | 'workspaces' | 'providers' | 'preferences'

export interface ChangeNotice {
  readonly topic: ChangeTopic
  readonly key: string
  readonly version: number
}

export type PublishChange = (notice: ChangeNotice) => void

const changeTopicSchema = z.enum([
  'deck',
  'brief',
  'outline',
  'draft',
  'chats',
  'workspaces',
  'providers',
  'preferences',
])

const changeNoticeSchema = z.strictObject({
  topic: changeTopicSchema,
  key: z.string().min(1).max(200),
  version: nonNegativeInt,
})

export function decodeChangeNotice(value: unknown): ChangeNotice {
  const parsed = changeNoticeSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  return parsed.data
}
