import { createHash, randomUUID } from 'node:crypto'
import { DeckError } from '@deckagent/deck'
import type { BriefDraft, BriefSourceRef, ContentProvenance, GenerationCapability } from '@deckagent/deck'
import { FormatError, decodeSlideDocument } from '@deckagent/presentation-document'
import type { RunTools, ToolResult, ToolSchema } from '../../../runs/ports.ts'
import type { ResearchSourceRecord } from '../../research/index.ts'
import type { DeckAttachmentRecord, DeckToolRun } from '../ports.ts'
import type { GenerationContext, GenerationSource } from './generation-prompts.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const result = (value: unknown, isError = false): ToolResult => ({
  isError,
  content: [{ type: 'text', text: JSON.stringify(value) }],
})

const onlyKeys = (value: Record<string, unknown>, ...keys: string[]) =>
  Object.keys(value).every(key => keys.includes(key))

function isSourceKind(value: unknown): value is BriefSourceRef['kind'] {
  return value === 'attachment' || value === 'project-file' || value === 'approved-file' || value === 'research'
}

function isProvenanceKind(value: unknown): value is ContentProvenance['kind'] {
  return value === 'fact' || value === 'wording' || value === 'placeholder'
}

interface EvidenceRecord {
  readonly source: BriefSourceRef
  readonly label: string
  readonly location: string
  readonly excerpt: string
}

function createEvidenceLedger(attachments: readonly DeckAttachmentRecord[]) {
  const entries = new Map<string, EvidenceRecord>()
  const remember = (data: Record<string, unknown>): Record<string, unknown> => {
    const ref = object(data.source) ? data.source : data
    if (typeof ref.sourceId !== 'string' || typeof ref.version !== 'number') return data

    const kind = ref.kind
    if (!isSourceKind(kind)) return data

    const excerpt = typeof data.text === 'string' ? data.text : typeof data.content === 'string' ? data.content : ''
    const evidenceId = `evidence-${randomUUID()}`
    const label =
      typeof ref.label === 'string'
        ? ref.label
        : typeof data.title === 'string'
          ? data.title
          : (attachments.find(a => a.source?.sourceId === ref.sourceId)?.name ?? ref.sourceId)

    entries.set(evidenceId, {
      source: { sourceId: ref.sourceId, version: ref.version, kind },
      label,
      excerpt,
      location: JSON.stringify(data.location ?? { kind: 'lines', start: 1, end: excerpt.split('\n').length }),
    })

    return { ...data, evidenceId }
  }
  const get = (id: string): EvidenceRecord | undefined => entries.get(id)
  return { remember, get }
}

type EvidenceLedger = ReturnType<typeof createEvidenceLedger>

function parseProvenanceEntries(rawEntries: readonly unknown[], evidence: EvidenceLedger): ContentProvenance[] {
  const records: ContentProvenance[] = rawEntries.map(entry => {
    if (
      !object(entry) ||
      typeof entry.text !== 'string' ||
      !isProvenanceKind(entry.kind) ||
      Object.keys(entry).some(k => !['text', 'kind', 'evidenceId', 'quote'].includes(k))
    )
      throw new DeckError('PROVENANCE_INVALID')

    const proof = typeof entry.evidenceId === 'string' ? evidence.get(entry.evidenceId) : undefined
    if (entry.evidenceId !== undefined && !proof) throw new DeckError('PROVENANCE_INVALID')
    if (entry.kind === 'fact' && !proof) throw new DeckError('PROVENANCE_REQUIRED')
    if (!proof)
      return {
        text: entry.text,
        kind: entry.kind,
        origin: entry.kind === 'placeholder' ? 'unknown' : 'general-knowledge',
      }

    const quote = entry.quote
    if (typeof quote !== 'string' || !quote.trim() || !proof.excerpt.includes(quote))
      throw new DeckError('PROVENANCE_INVALID')

    return {
      text: entry.text,
      kind: entry.kind,
      origin: proof.source.kind === 'research' ? 'research' : 'material',
      source: proof.source,
      label: proof.label,
      location: proof.location,
      quote,
    }
  })
  if (!records.length) throw new DeckError('PROVENANCE_REQUIRED')
  return records
}

export interface GenerationToolOptions {
  readonly run: DeckToolRun
  readonly capability: GenerationCapability
  readonly context: GenerationContext
  readonly schemas: readonly ToolSchema[]
  readonly files: readonly GenerationSource[]
  readonly attachments: readonly DeckAttachmentRecord[]
  readonly research: readonly ResearchSourceRecord[]
  readonly brief: BriefDraft
  readonly portable: boolean
  readonly selected: (sourceId: string, version: number) => boolean
}

interface DispatchContext {
  readonly capability: GenerationCapability
  readonly context: GenerationContext
  readonly evidence: EvidenceLedger
  readonly annotated: Set<string>
  readonly brief: BriefDraft
}

type DispatchResult = { readonly handled: true; readonly value: unknown } | { readonly handled: false }

function selectedSourceNames(options: GenerationToolOptions): ReadonlySet<string> {
  const { files, attachments, research, brief } = options
  return new Set([
    ...(files.some(s => s.kind === 'project-file') ? ['read_source'] : []),
    ...(files.some(s => s.kind === 'approved-file') ? ['read_external'] : []),
    ...(attachments.length ? ['read_attachment'] : []),
    ...(research.length ? ['read_research'] : []),
    ...(brief.sources.publicResearch ? ['research_public'] : []),
  ])
}

async function callAuthorizedSourceTool(
  options: GenerationToolOptions,
  evidence: EvidenceLedger,
  tools: RunTools,
  name: string,
  args: unknown,
): Promise<ToolResult> {
  const { files, attachments, research, selected } = options
  if (!object(args)) return result('SOURCE_ARGUMENTS_INVALID', true)
  if (
    (name === 'read_source' || name === 'read_external') &&
    !files.some(s => s.label === args.path && s.kind === (name === 'read_source' ? 'project-file' : 'approved-file'))
  )
    return result('SOURCE_ACCESS_DENIED', true)
  if (name === 'read_attachment' && !attachments.some(a => a.attachmentId === args.attachmentId))
    return result('SOURCE_ACCESS_DENIED', true)
  if (name === 'read_research' && !research.some(s => s.sourceId === args.sourceId))
    return result('SOURCE_ACCESS_DENIED', true)

  const read = await tools.call(name, args)
  if (!read.isError && (name === 'read_source' || name === 'read_external' || name === 'read_attachment')) {
    const text = read.content.find(c => c.type === 'text')
    const data: unknown = text?.type === 'text' ? JSON.parse(text.text) : null
    if (
      !object(data) ||
      !object(data.source) ||
      typeof data.source.sourceId !== 'string' ||
      typeof data.source.version !== 'number' ||
      !selected(data.source.sourceId, data.source.version)
    )
      return result('SOURCE_CHANGED', true)
  }

  if (!read.isError) {
    const first = read.content.find(c => c.type === 'text')
    if (first?.type === 'text') {
      try {
        const data: unknown = JSON.parse(first.text)
        if (object(data)) {
          const enriched = Array.isArray(data.sources)
            ? { ...data, sources: data.sources.map(s => (object(s) ? evidence.remember(s) : s)) }
            : evidence.remember(data)
          return {
            ...read,
            content: read.content.map(c => (c === first ? { type: 'text', text: JSON.stringify(enriched) } : c)),
          }
        }
      } catch {
        /* Non-source text remains literal and cannot be cited as evidence. */
      }
    }
  }

  return read
}

function recordProvenance(
  dispatch: DispatchContext,
  stageId: string,
  entries: readonly unknown[],
  notes: unknown,
): { readonly recorded: number; readonly note: string } {
  const records = parseProvenanceEntries(entries, dispatch.evidence)
  if (notes !== undefined && typeof notes !== 'string') throw new DeckError('GENERATION_ARGUMENTS_INVALID')
  if (dispatch.brief.presenterNotes && (typeof notes !== 'string' || !notes.trim()))
    throw new DeckError('PRESENTER_NOTES_REQUIRED')
  dispatch.capability.provenance(stageId, records, typeof notes === 'string' ? notes : undefined)
  dispatch.annotated.add(stageId)
  return { recorded: records.length, note: 'A citation records its origin; it is not verification of the claim.' }
}

async function dispatchStageTool(
  dispatch: DispatchContext,
  name: string,
  v: Record<string, unknown>,
): Promise<DispatchResult> {
  const { capability } = dispatch
  if (name === 'read_slide_draft' && onlyKeys(v, 'stageId') && typeof v.stageId === 'string')
    return { handled: true, value: capability.draft(v.stageId) }

  if (name === 'record_slide_content' && onlyKeys(v, 'stageId', 'document') && typeof v.stageId === 'string') {
    capability.document(v.stageId, decodeSlideDocument(v.document))
    return { handled: true, value: { recorded: true } }
  }

  if (
    name === 'validate_slide' &&
    onlyKeys(v, 'stageId', 'slideId') &&
    typeof v.stageId === 'string' &&
    typeof v.slideId === 'string'
  ) {
    const issues = await capability.validate({
      stageId: v.stageId,
      slideId: v.slideId,
      expectedRevision: 0,
      publicationId: 'validation-only',
    })
    return { handled: true, value: { valid: !issues.length, issues } }
  }

  if (
    name === 'record_slide_provenance' &&
    onlyKeys(v, 'stageId', 'entries', 'notes') &&
    typeof v.stageId === 'string' &&
    Array.isArray(v.entries)
  )
    return { handled: true, value: recordProvenance(dispatch, v.stageId, v.entries, v.notes) }
  if (
    name === 'find_slide_image' &&
    onlyKeys(v, 'stageId', 'slideId', 'query') &&
    typeof v.stageId === 'string' &&
    typeof v.slideId === 'string' &&
    typeof v.query === 'string'
  )
    return { handled: true, value: await capability.researchImage(v.stageId, v.slideId, v.query) }

  return { handled: false }
}

async function dispatchPublishOrContentTool(
  dispatch: DispatchContext,
  name: string,
  v: Record<string, unknown>,
): Promise<DispatchResult> {
  const { capability, context, annotated } = dispatch
  if (name === 'read_generation_plan' && onlyKeys(v)) return { handled: true, value: context }
  if (
    name === 'begin_slide' &&
    onlyKeys(v, 'slideId', 'layoutId') &&
    typeof v.slideId === 'string' &&
    typeof v.layoutId === 'string'
  )
    return { handled: true, value: capability.begin(v.slideId, v.layoutId) }
  if (
    name === 'append_slide' &&
    onlyKeys(v, 'stageId', 'sequence', 'text', 'final') &&
    typeof v.stageId === 'string' &&
    typeof v.sequence === 'number' &&
    Number.isSafeInteger(v.sequence) &&
    typeof v.text === 'string' &&
    typeof v.final === 'boolean'
  )
    return {
      handled: true,
      value: capability.append(v.stageId, { sequence: v.sequence, text: v.text, final: v.final }),
    }
  if (
    name === 'attach_slide_image' &&
    onlyKeys(v, 'stageId', 'slideId', 'attachmentId') &&
    typeof v.stageId === 'string' &&
    typeof v.slideId === 'string' &&
    typeof v.attachmentId === 'string'
  )
    return { handled: true, value: await capability.image(v.stageId, v.slideId, v.attachmentId) }

  if (name === 'discard_slide' && onlyKeys(v, 'stageId') && typeof v.stageId === 'string') {
    capability.discard(v.stageId)
    return { handled: true, value: { discarded: true } }
  }

  if (
    name === 'publish_slide' &&
    onlyKeys(v, 'stageId', 'slideId', 'expectedRevision', 'publicationId') &&
    typeof v.stageId === 'string' &&
    typeof v.slideId === 'string' &&
    typeof v.publicationId === 'string' &&
    typeof v.expectedRevision === 'number' &&
    Number.isSafeInteger(v.expectedRevision)
  ) {
    if (!annotated.has(v.stageId)) throw new DeckError('PROVENANCE_REQUIRED')
    return {
      handled: true,
      value: await capability.publish({
        stageId: v.stageId,
        slideId: v.slideId,
        publicationId: v.publicationId,
        expectedRevision: v.expectedRevision,
      }),
    }
  }

  return { handled: false }
}

async function dispatchGenerationTool(
  dispatch: DispatchContext,
  name: string,
  v: Record<string, unknown>,
): Promise<unknown> {
  const staged = await dispatchStageTool(dispatch, name, v)
  if (staged.handled) return staged.value
  const published = await dispatchPublishOrContentTool(dispatch, name, v)
  if (published.handled) return published.value
  throw new Error('arguments')
}

/** Adds only the tools of the confirmed plan; the Host owns source authority and evidence identity. */
export function createGenerationTools(options: GenerationToolOptions): RunTools {
  const { run, capability, context, brief, portable, schemas } = options
  const sourceNames = selectedSourceNames(options)
  const evidence = createEvidenceLedger(options.attachments)
  const dispatch: DispatchContext = {
    capability,
    context,
    evidence,
    annotated: new Set<string>(),
    brief,
  }
  return {
    context: createHash('sha256')
      .update(`${run.tools?.context}|${JSON.stringify(context)}`)
      .digest('hex'),
    manifest: JSON.stringify(context),
    schemas: [
      ...(run.tools?.schemas.filter(s => sourceNames.has(s.name)) ?? []),
      ...schemas.filter(s => s.name !== 'find_slide_image' || (!portable && brief.images.mode === 'public-research')),
    ],
    call: async (name, args) => {
      if (run.signal.aborted) return result('REQUEST_CLOSED', true)
      try {
        if (sourceNames.has(name) && run.tools)
          return await callAuthorizedSourceTool(options, evidence, run.tools, name, args)
        if (!schemas.some(s => s.name === name) || (portable && name === 'find_slide_image'))
          return result('TOOL_NOT_ALLOWED', true)
        if (
          !object(args) ||
          Object.keys(args).join() !== 'json' ||
          typeof args.json !== 'string' ||
          Buffer.byteLength(args.json) > 60 * 1024
        )
          return result('GENERATION_ARGUMENTS_INVALID', true)
        const v: unknown = JSON.parse(args.json)
        if (!object(v)) return result('GENERATION_ARGUMENTS_INVALID', true)
        const value = await dispatchGenerationTool(dispatch, name, v)
        return result(value)
      } catch (error) {
        return result(
          error instanceof FormatError
            ? { code: error.code, message: error.message, issues: error.issues }
            : 'GENERATION_TOOL_FAILED: Check the tool arguments and retry the unfinished slide.',
          true,
        )
      }
    },
  }
}
