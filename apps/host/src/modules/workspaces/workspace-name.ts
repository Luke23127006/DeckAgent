import { WorkspaceError } from './contracts.ts'

/** BR-020 V-2: at most 100 characters, a character being one Unicode code point after NFC. */
export const nameLimit = 100

function length(value: string): number {
  return [...value].length
}

/**
 * BR-020 for a name taken from a folder (FR-071): NFC, no whitespace dropped, cut to the longest name.
 * The folder keeps its own name; only the stored workspace name is cut.
 */
export function nameFromFolder(folderName: string, fallback: string): string {
  const name = folderName.normalize('NFC')
  if (!name) return fallback
  return length(name) > nameLimit ? [...name].slice(0, nameLimit).join('') : name
}

/** BR-020 for a name the user gives (FR-141): whitespace at both ends dropped, NFC, refused when empty or too long. */
export function nameFromUser(value: unknown): string {
  if (typeof value !== 'string')
    throw new WorkspaceError('WORKSPACE_NAME_EMPTY', 'A workspace name needs at least one character')
  const name = value.trim().normalize('NFC')
  if (!name) throw new WorkspaceError('WORKSPACE_NAME_EMPTY', 'A workspace name needs at least one character')
  if (length(name) > nameLimit)
    throw new WorkspaceError('WORKSPACE_NAME_TOO_LONG', `A workspace name has at most ${nameLimit} characters`)
  return name
}
