import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { decodeDesignSnapshot, resolveDesign, DesignError } from '@deckagent/design'
import { DeckError, validId } from './errors.ts'
import type { BriefDraft, BriefRecord, BriefSnapshot } from './brief-contracts.ts'
import { decodeBriefDraft } from './brief.ts'
import type { ValidationIssue } from '@deckagent/presentation-document'

/** Shared structural contract; catalog availability remains a Host policy check. */
export function validateBriefDraft(value: unknown): BriefDraft {
  let draft: BriefDraft | undefined
  const issues: ValidationIssue[] = []

  try {
    draft = decodeBriefDraft(value)
  } catch (error) {
    if (!(error instanceof DeckError)) throw error
    issues.push(...error.issues)
  }

  const rejected = (path: string) =>
    issues.some(i => i.path === path || i.path.startsWith(path + '.') || i.path.startsWith(path + '['))
  const check = (selection: unknown, path: string) => {
    if (rejected(path)) return
    try {
      resolveDesign(selection)
    } catch (error) {
      if (!(error instanceof DesignError)) throw error
      issues.push({
        code: error.code,
        path,
        message: 'The visual selection is not available in the supplied catalog.',
        expected:
          'Use a supplied catalog reference or available theme role value. Preserve user choices; do not substitute another selection to repair JSON.',
      })
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value) && issues.length < 64) {
    if ('template' in value && value.template !== undefined) check({ template: value.template }, 'template')
    if ('designSystem' in value && value.designSystem !== undefined)
      check({ designSystem: value.designSystem }, 'designSystem')
    if (
      'themeOverrides' in value &&
      value.themeOverrides &&
      typeof value.themeOverrides === 'object' &&
      !Array.isArray(value.themeOverrides)
    ) {
      for (const [role, token] of Object.entries(value.themeOverrides))
        if (!rejected('themeOverrides.' + role))
          check({ overrides: { [role]: token } }, 'themeOverrides[' + JSON.stringify(role) + ']')
    }
  }

  if (issues.length || !draft)
    throw new DeckError(
      issues.some(i => i.code === 'BRIEF_INVALID') ? 'BRIEF_INVALID' : (issues[0]?.code ?? 'BRIEF_INVALID'),
      issues.slice(0, 65),
    )

  return draft
}

/** Internal implementation; DeckStore owns all transactions. */
export class BriefStorage {
  constructor(private readonly db: DatabaseSync) {}

  snapshot(sessionId: string): BriefSnapshot {
    const row = this.db
      .prepare(
        'SELECT v.* FROM brief_heads h JOIN brief_versions v ON v.brief_id=h.brief_id AND v.version=h.version WHERE h.session_id=?',
      )
      .get(sessionId)
    return {
      sessionId,
      version: row ? Number(row.version) : 0,
      current: row ? this.decode(row) : null,
      locked: !!this.db.prepare('SELECT 1 FROM decks WHERE session_id=?').get(sessionId),
    }
  }

  version(sessionId: string, briefId: string, version: number): BriefRecord {
    const row = this.db
      .prepare('SELECT * FROM brief_versions WHERE session_id=? AND brief_id=? AND version=?')
      .get(sessionId, briefId, version)
    if (!row) throw new DeckError('BRIEF_NOT_FOUND')
    return this.decode(row)
  }

  save(sessionId: string, input: { readonly expectedVersion: number; readonly draft: unknown }): BriefRecord {
    if (!validId(sessionId) || !input || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0)
      throw new DeckError('BRIEF_INVALID')

    const previous = this.snapshot(sessionId)
    if (previous.locked) throw new DeckError('BRIEF_LOCKED')
    if (previous.version !== input.expectedVersion) throw new DeckError('BRIEF_STALE')

    const draft = validateBriefDraft(input.draft)
    const briefId = previous.current?.briefId ?? `brief-${randomUUID()}`
    const version = previous.version + 1
    const createdAt = new Date().toISOString()
    const design =
      draft.generationFormat === 'html'
        ? resolveDesign({
            format: 'html',
            ...(draft.template ? { template: draft.template } : {}),
            ...(draft.designSystem ? { designSystem: draft.designSystem } : {}),
            ...(draft.themeOverrides ? { overrides: draft.themeOverrides } : {}),
          })
        : null

    this.db
      .prepare(
        'INSERT INTO brief_heads(session_id,brief_id,version) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET version=excluded.version',
      )
      .run(sessionId, briefId, version)

    this.db
      .prepare('INSERT INTO brief_versions(brief_id,version,session_id,payload,design,created_at) VALUES(?,?,?,?,?,?)')
      .run(briefId, version, sessionId, JSON.stringify(draft), design ? JSON.stringify(design) : null, createdAt)

    return { sessionId, briefId, version, createdAt, draft, design }
  }

  private decode(row: Record<string, unknown>): BriefRecord {
    try {
      const draft = validateBriefDraft(JSON.parse(String(row.payload)))
      const design = row.design === null ? null : decodeDesignSnapshot(JSON.parse(String(row.design)))
      if ((draft.generationFormat === 'html') !== (design !== null)) throw new DeckError('DECK_CORRUPT')
      return {
        sessionId: String(row.session_id),
        briefId: String(row.brief_id),
        version: Number(row.version),
        createdAt: String(row.created_at),
        draft,
        design,
      }
    } catch {
      throw new DeckError('DECK_CORRUPT')
    }
  }
}
