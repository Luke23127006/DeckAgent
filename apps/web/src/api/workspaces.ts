import { decodeWorkspaceList } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

export const workspacesKeys = { all: ['workspaces'] as const }

/** One write to the workspace list. Each write sends the list version that the client read. */
export type WorkspaceChange =
  | { readonly kind: 'add'; readonly folder: string; readonly expectedVersion: number }
  | { readonly kind: 'select'; readonly id: string; readonly expectedVersion: number }
  | { readonly kind: 'rename'; readonly id: string; readonly name: string; readonly expectedVersion: number }
  | { readonly kind: 'relink'; readonly id: string; readonly folder: string; readonly expectedVersion: number }
  | { readonly kind: 'remove'; readonly id: string; readonly expectedVersion: number }

function send(path: string, method: string, body: unknown) {
  return apiJson(path, decodeWorkspaceList, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getWorkspaces(signal?: AbortSignal) {
  return apiJson('/api/workspaces', decodeWorkspaceList, { signal: signal ?? null })
}

/** Sends one workspace write. Folder paths go only to the local Host; the Browser reads no folder. */
export function changeWorkspaces(change: WorkspaceChange) {
  const { expectedVersion } = change
  switch (change.kind) {
    case 'add':
      return send('/api/workspaces', 'POST', { folder: change.folder, expectedVersion })
    case 'select':
      return send('/api/workspaces/selected', 'PUT', { id: change.id, expectedVersion })
    case 'rename':
      return send(`/api/workspaces/${encodeURIComponent(change.id)}`, 'PUT', { name: change.name, expectedVersion })
    case 'relink':
      return send(`/api/workspaces/${encodeURIComponent(change.id)}/folder`, 'PUT', {
        folder: change.folder,
        expectedVersion,
      })
    case 'remove':
      return send(`/api/workspaces/${encodeURIComponent(change.id)}`, 'DELETE', { expectedVersion })
  }
  const unreachable: never = change
  return unreachable
}
