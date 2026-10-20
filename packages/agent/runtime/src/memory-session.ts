import { RuntimeError } from './contracts.ts'
import type { Message, SessionStore } from './contracts.ts'

/** Host-lifetime history. Returns copies so callers cannot mutate stored messages. */
export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Message[]>()

  async open(sessionId: string): Promise<void> {
    if (!sessionId.trim()) throw new RuntimeError('INVALID_SESSION', 'Session identity must not be empty')
    if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, [])
  }

  async read(sessionId: string): Promise<readonly Message[]> {
    return structuredClone(this.get(sessionId))
  }

  async append(sessionId: string, messages: readonly Message[]): Promise<void> {
    this.get(sessionId).push(...structuredClone(messages))
  }

  private get(sessionId: string): Message[] {
    const messages = this.sessions.get(sessionId)
    if (!messages) throw new RuntimeError('SESSION_NOT_FOUND', `Session ${sessionId} is not open`)
    return messages
  }
}
