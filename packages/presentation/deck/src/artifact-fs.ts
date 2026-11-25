import {
  constants,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { decodeContentOrigins } from '@deckagent/presentation-document'
import { DeckError, isRecord, sha256Hex, validId } from './errors.ts'
import type { BriefSourceRef } from './brief-contracts.ts'
import type {
  ArtifactAsset,
  ContentProvenance,
  ImageAttempt,
  ImageCredit,
  ImageSelection,
  ImageSourceCheck,
} from './generation-contracts.ts'

export const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
export const IMAGE_LICENSES: readonly string[] = ['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown']
const managedName =
  /^(?:stage-[a-f0-9-]{36}-\d{1,2}\.part|artifact-[a-f0-9-]{36}\.[a-z0-9]{1,10}|asset-[a-f0-9-]{36}\.png)$/

export function isManagedArtifactName(name: string): boolean {
  return managedName.test(name)
}

export function hashMismatch(expected: string, bytes: Uint8Array): boolean {
  return !/^[a-f0-9]{64}$/.test(expected) || sha256Hex(bytes) !== expected
}

export function isValidPngBytes(bytes: Buffer, maxBytes = 256 * 1024): boolean {
  return bytes.length <= maxBytes && bytes.subarray(0, 8).equals(PNG_MAGIC)
}

export function isValidImageCredit(value: unknown): value is ImageCredit {
  if (!isRecord(value)) return false
  const { url, author, license, licenseUrl, unknownLicense, retrievedAt, evidence, downloadUrl } = value
  return (
    typeof url === 'string' &&
    url.startsWith('https://') &&
    typeof author === 'string' &&
    author.length > 0 &&
    typeof license === 'string' &&
    IMAGE_LICENSES.includes(license) &&
    typeof licenseUrl === 'string' &&
    typeof unknownLicense === 'boolean' &&
    unknownLicense === (license === 'unknown') &&
    typeof retrievedAt === 'string' &&
    (evidence === undefined || evidence === 'image-metadata' || evidence === 'pexels-cdn') &&
    (downloadUrl === undefined || typeof downloadUrl === 'string')
  )
}

export function validateProvenance(value: unknown): readonly ContentProvenance[] {
  try {
    return decodeContentOrigins(value)
  } catch {
    throw new DeckError('PROVENANCE_INVALID')
  }
}

export function parseJsonObject(raw: unknown): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    throw new DeckError('ARTIFACT_CORRUPT')
  }
  if (!isRecord(parsed)) throw new DeckError('ARTIFACT_CORRUPT')
  return parsed
}

export interface PreparedRecord {
  readonly query: string
  readonly needId?: string
  readonly slideIndex?: number
  readonly blockIndex?: number
  readonly slideId?: string
  readonly asset?: ArtifactAsset
  readonly failure?: string
  readonly attempts?: readonly ImageAttempt[]
}

export function parsePreparedRecord(raw: unknown): PreparedRecord {
  const obj = parseJsonObject(raw)
  if (typeof obj.query !== 'string') throw new DeckError('ARTIFACT_CORRUPT')
  const needId = optionalString(obj, 'needId')
  const slideId = optionalString(obj, 'slideId')
  const failure = optionalString(obj, 'failure')
  const slideIndex = optionalNumber(obj, 'slideIndex')
  const blockIndex = optionalNumber(obj, 'blockIndex')
  const asset = parseAsset(obj.asset)
  const attempts = parseAttempts(obj.attempts)
  return {
    query: obj.query,
    ...(needId === undefined ? {} : { needId }),
    ...(slideId === undefined ? {} : { slideId }),
    ...(failure === undefined ? {} : { failure }),
    ...(slideIndex === undefined ? {} : { slideIndex }),
    ...(blockIndex === undefined ? {} : { blockIndex }),
    ...(asset === undefined ? {} : { asset }),
    ...(attempts === undefined ? {} : { attempts }),
  }
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new DeckError('ARTIFACT_CORRUPT')
  return value
}

function optionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key]
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value)) throw new DeckError('ARTIFACT_CORRUPT')
  return Number(value)
}

function isSourceKind(value: unknown): value is BriefSourceRef['kind'] {
  return value === 'attachment' || value === 'project-file' || value === 'approved-file' || value === 'research'
}

function parseSource(value: unknown): BriefSourceRef {
  if (!isRecord(value) || !validId(value.sourceId) || !Number.isSafeInteger(value.version) || !isSourceKind(value.kind))
    throw new DeckError('ARTIFACT_CORRUPT')
  return { sourceId: value.sourceId, version: Number(value.version), kind: value.kind }
}

function parseCredit(value: unknown): ImageCredit {
  if (!isValidImageCredit(value)) throw new DeckError('ARTIFACT_CORRUPT')
  return { ...value }
}

function parseSelection(value: unknown): ImageSelection {
  if (
    !isRecord(value) ||
    (value.provider !== 'tavily' && value.provider !== 'commons') ||
    typeof value.query !== 'string' ||
    typeof value.imageUrl !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.reason !== 'string' ||
    value.evidence !== 'metadata' ||
    (value.policy !== 'web-images-v1' && value.policy !== 'web-images-v2')
  )
    throw new DeckError('ARTIFACT_CORRUPT')
  return {
    provider: value.provider,
    query: value.query,
    imageUrl: value.imageUrl,
    description: value.description,
    reason: value.reason,
    evidence: value.evidence,
    policy: value.policy,
  }
}

function parseAsset(value: unknown): ArtifactAsset | undefined {
  if (value === undefined) return undefined
  if (
    !isRecord(value) ||
    !validId(value.assetId) ||
    typeof value.digest !== 'string' ||
    typeof value.parsedDigest !== 'string' ||
    typeof value.originalDigest !== 'string' ||
    !Number.isSafeInteger(value.byteSize)
  )
    throw new DeckError('ARTIFACT_CORRUPT')
  const credit = value.credit === undefined ? undefined : parseCredit(value.credit)
  const selection = value.selection === undefined ? undefined : parseSelection(value.selection)
  const attachmentId = optionalString(value, 'attachmentId')
  const webQuery = optionalString(value, 'webQuery')
  const imageNeedId = optionalString(value, 'imageNeedId')
  return {
    assetId: value.assetId,
    source: parseSource(value.source),
    digest: value.digest,
    originalDigest: value.originalDigest,
    parsedDigest: value.parsedDigest,
    byteSize: Number(value.byteSize),
    ...(credit === undefined ? {} : { credit }),
    ...(selection === undefined ? {} : { selection }),
    ...(attachmentId === undefined ? {} : { attachmentId }),
    ...(webQuery === undefined ? {} : { webQuery }),
    ...(imageNeedId === undefined ? {} : { imageNeedId }),
  }
}

function parseAttemptCheck(value: unknown): ImageSourceCheck {
  if (!isRecord(value) || typeof value.sourceUrl !== 'string' || typeof value.code !== 'string')
    throw new DeckError('ARTIFACT_CORRUPT')
  const httpStatus = value.httpStatus
  if (httpStatus !== undefined && !Number.isSafeInteger(httpStatus)) throw new DeckError('ARTIFACT_CORRUPT')
  return {
    sourceUrl: value.sourceUrl,
    code: value.code,
    ...(httpStatus === undefined ? {} : { httpStatus: Number(httpStatus) }),
  }
}

function parseAttempt(value: unknown): ImageAttempt {
  if (
    !isRecord(value) ||
    typeof value.candidateId !== 'string' ||
    typeof value.imageUrl !== 'string' ||
    typeof value.code !== 'string'
  )
    throw new DeckError('ARTIFACT_CORRUPT')
  const rawChecks = value.checks
  if (!Array.isArray(rawChecks)) throw new DeckError('ARTIFACT_CORRUPT')
  const checks: readonly unknown[] = rawChecks
  return {
    candidateId: value.candidateId,
    imageUrl: value.imageUrl,
    code: value.code,
    checks: checks.map(parseAttemptCheck),
  }
}

function parseAttempts(value: unknown): readonly ImageAttempt[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new DeckError('ARTIFACT_CORRUPT')
  const attempts: readonly unknown[] = value
  return attempts.map(parseAttempt)
}

export class ArtifactFileStore {
  readonly root: string | undefined
  constructor(artifactRoot?: string) {
    if (!artifactRoot) return
    const root = resolve(artifactRoot)
    let existing = root
    while (!existsSync(existing)) {
      const parent = dirname(existing)
      if (parent === existing) throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
      existing = parent
    }
    if (lstatSync(existing).isSymbolicLink() || realpathSync(existing) !== existing)
      throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    mkdirSync(root, { recursive: true })
    if (lstatSync(root).isSymbolicLink() || realpathSync(root) !== root)
      throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    this.root = root
  }
  path(name: string): string {
    if (
      !this.root ||
      lstatSync(this.root).isSymbolicLink() ||
      realpathSync(this.root) !== this.root ||
      !isManagedArtifactName(name)
    )
      throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    return join(this.root, name)
  }
  exists(name: string): boolean {
    if (!this.root) return false
    return existsSync(this.path(name))
  }
  write(name: string, bytes: string | Uint8Array): void {
    const file = openSync(this.path(name), 'wx', 0o600)
    try {
      writeFileSync(file, bytes)
      fsyncSync(file)
    } finally {
      closeSync(file)
    }
  }
  read(name: string, fingerprint: string, limit: number): Buffer {
    const path = this.path(name),
      stat = lstatSync(path)
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > limit) throw new DeckError('ARTIFACT_CORRUPT')
    const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    try {
      const bytes = readFileSync(fd)
      if (bytes.length > limit || sha256Hex(bytes) !== fingerprint) throw new DeckError('ARTIFACT_CORRUPT')
      return bytes
    } finally {
      closeSync(fd)
    }
  }
  remove(name: string): void {
    unlinkSync(this.path(name))
  }
  listFiles(): readonly string[] {
    return this.root ? readdirSync(this.root) : []
  }
}
