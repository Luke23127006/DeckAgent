import type { WorkspaceList, WorkspaceView } from '@deckagent/host-contracts'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useWorkspaceChange, useWorkspaces, workspaceFailure } from '../hooks/use-workspaces.ts'
import type { WorkspaceChange } from '../hooks/use-workspaces.ts'
import { workspaceErrorText, workspaceText } from '../text.ts'

type DialogMode = { readonly kind: 'add' } | { readonly kind: 'relink' | 'rename'; readonly id: string }

const emptyList: WorkspaceList = { workspaces: [], selectedId: 'default', version: 0 }

function selectedWorkspace(list: WorkspaceList): WorkspaceView | undefined {
  return list.workspaces.find(item => item.id === list.selectedId)
}

function optionText(item: WorkspaceView): string {
  if (item.isDefault) return `${item.name}${workspaceText.defaultSuffix}`
  return item.folderStatus === 'available' ? item.name : `${item.name}${workspaceText.checkFolderSuffix}`
}

function folderNotice(workspace: WorkspaceView | undefined): string {
  if (workspace?.folderStatus === 'unreadable') return workspaceText.unreadableFolder(workspace.name)
  if (workspace?.folderStatus === 'different-folder') return workspaceText.differentFolder(workspace.name)
  return ''
}

/**
 * Workspace selector and its changes (UC-013). Folder paths go only to the authenticated local Host; the Browser
 * never reads a folder or a file. Switching keeps the open chat and its draft.
 */
export function WorkspaceControls(props: { readonly busy: boolean }) {
  const workspaces = useWorkspaces()
  const change = useWorkspaceChange()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const [mode, setMode] = useState<DialogMode>({ kind: 'add' })
  const [errorPlace, setErrorPlace] = useState<'controls' | 'dialog'>('controls')
  const list = workspaces.data ?? emptyList
  const selected = selectedWorkspace(list)
  const locked = props.busy || change.isPending
  const notice = folderNotice(selected)
  const failure = change.error ? workspaceFailure(change.error) : undefined
  const failureText = failure ? workspaceErrorText(failure.code, failure.detail) : ''

  function send(next: WorkspaceChange, place: 'controls' | 'dialog', done?: () => void): void {
    if (change.isPending) return
    setErrorPlace(place)
    change.mutate(next, { onSuccess: () => done?.() })
  }

  // A native listener also gets a `change` event that does not bubble, as a script sends it. The select shows the
  // workspace in use until the Host accepts the switch.
  useEffect(() => {
    const select = selectRef.current
    if (!select) return
    select.value = list.selectedId
    const onChange = () => {
      const id = select.value
      select.value = list.selectedId
      if (id !== list.selectedId) send({ kind: 'select', id, expectedVersion: list.version }, 'controls')
    }
    select.addEventListener('change', onChange)
    return () => select.removeEventListener('change', onChange)
  })

  function openDialog(next: DialogMode): void {
    const dialog = dialogRef.current
    const input = inputRef.current
    if (locked || !dialog || !input) return
    change.reset()
    setMode(next)
    input.value =
      next.kind === 'rename' ? (selected?.name ?? '') : next.kind === 'relink' ? (selected?.folder ?? '') : ''
    dialog.showModal()
    input.focus()
  }

  function submitDialog(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const text = inputRef.current?.value ?? ''
    const close = () => dialogRef.current?.close()
    // UC-013 A9: no folder chosen, no workspace set up.
    if (mode.kind === 'add' && !text.trim()) return close()
    const expectedVersion = list.version
    if (mode.kind === 'rename') send({ kind: 'rename', id: mode.id, name: text, expectedVersion }, 'dialog', close)
    else if (mode.kind === 'relink')
      send({ kind: 'relink', id: mode.id, folder: text.trim(), expectedVersion }, 'dialog', close)
    else send({ kind: 'add', folder: text.trim(), expectedVersion }, 'dialog', close)
  }

  function removeSelected(): void {
    if (!selected || selected.isDefault || locked) return
    if (!window.confirm(workspaceText.confirmRemove(selected.name))) return
    send({ kind: 'remove', id: selected.id, expectedVersion: list.version }, 'controls')
  }

  const rename = mode.kind === 'rename'
  const heading = rename
    ? workspaceText.renameHeading
    : mode.kind === 'add'
      ? workspaceText.addHeading
      : workspaceText.relinkHeading
  const fieldLabel = rename ? workspaceText.nameLabel : workspaceText.folderLabel
  const actionClass = 'px-2! py-1! text-xs!'
  return (
    <section className="workspace-controls mt-1 mb-2 grid min-w-0 gap-1.5">
      <label className="grid gap-1 text-xs">
        <span>{workspaceText.label}</span>
        <select
          className="w-full max-w-full p-1.5!"
          data-action="select-workspace"
          disabled={locked}
          title={selected?.folder ?? workspaceText.defaultTitle}
          ref={selectRef}
        >
          {list.workspaces.map(item => (
            <option key={item.id} value={item.id} title={item.folder ?? undefined}>
              {optionText(item)}
            </option>
          ))}
        </select>
      </label>
      <div className="workspace-actions flex flex-wrap gap-1">
        <button
          type="button"
          className={actionClass}
          data-action="add-workspace"
          title={workspaceText.addTitle}
          disabled={locked}
          onClick={() => openDialog({ kind: 'add' })}
        >
          {workspaceText.add}
        </button>
        <button
          type="button"
          className={actionClass}
          data-action="rename-workspace"
          disabled={locked || !selected}
          onClick={() => selected && openDialog({ kind: 'rename', id: selected.id })}
        >
          {workspaceText.rename}
        </button>
        <button
          type="button"
          className={actionClass}
          data-action="relink-workspace"
          disabled={locked || !selected || selected.isDefault}
          onClick={() => selected && openDialog({ kind: 'relink', id: selected.id })}
        >
          {workspaceText.relink}
        </button>
        <button
          type="button"
          className={actionClass}
          data-action="remove-workspace"
          title={workspaceText.removeTitle}
          disabled={locked || !selected || selected.isDefault}
          onClick={removeSelected}
        >
          {workspaceText.remove}
        </button>
      </div>
      <p className="workspace-notice m-0 text-xs" role="status" hidden={!notice}>
        {notice}
      </p>
      <button
        type="button"
        className={actionClass}
        data-action="adopt-folder"
        hidden={selected?.folderStatus !== 'different-folder'}
        disabled={locked}
        onClick={() => {
          if (selected?.folder)
            send(
              { kind: 'relink', id: selected.id, folder: selected.folder, expectedVersion: list.version },
              'controls',
            )
        }}
      >
        {workspaceText.adopt}
      </button>
      <p
        className="workspace-error m-0 text-xs text-destructive"
        role="alert"
        hidden={!failureText || errorPlace !== 'controls'}
      >
        {errorPlace === 'controls' ? failureText : ''}
      </p>
      <dialog
        ref={dialogRef}
        className="workspace-dialog m-auto box-border max-w-[min(520px,calc(100vw-32px))] rounded-xl p-5 backdrop:bg-black/30"
      >
        <form className="grid gap-3" onSubmit={submitDialog}>
          <h2 className="m-0">{heading}</h2>
          <p className="m-0">{rename ? workspaceText.renameHelp : workspaceText.folderHelp}</p>
          <label className="grid gap-1.5">
            <span>{fieldLabel}</span>
            <input
              ref={inputRef}
              className="box-border w-full min-w-0 p-2.5!"
              name="workspace-value"
              autoComplete="off"
              aria-label={fieldLabel}
            />
          </label>
          <p className="workspace-error m-0 text-xs text-destructive" role="alert">
            {errorPlace === 'dialog' ? failureText : ''}
          </p>
          <div className="workspace-dialog-actions flex justify-end gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()}>
              {workspaceText.cancel}
            </button>
            <button type="submit">{workspaceText.save}</button>
          </div>
        </form>
      </dialog>
    </section>
  )
}
