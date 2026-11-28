import type {
  ApprovalView,
  HistoryMessage,
  RequestSnapshot,
  RequestStatus,
  StoredActivity,
  StoredRequest,
} from '@deckagent/host-contracts'
import { useEffect, useRef, useState } from 'react'
import { activityText, failureFeedback, failureOffersSettings, requestText } from '../text.ts'
import { MessageContent } from './message-content.tsx'

/** Whether a request still holds the one active slot of its chat. */
export function activeStatus(status: RequestStatus): boolean {
  return status === 'active' || status === 'waiting_approval'
}

/** What the request row says. Stopped is not failure (FR-018); not finished says why when it is known (FR-019). */
export function requestFeedback(
  state: RequestStatus,
  errorCode: string | undefined,
  records: readonly StoredActivity[],
  disconnected: boolean,
): { readonly label: string; readonly detail: string; readonly toolErrors: boolean } {
  const toolErrors = records.some(entry => entry.type === 'tool' && entry.status === 'failed')

  if (state === 'active' || state === 'waiting_approval') {
    const current = records.findLast(entry => entry.status === 'running')
    const label = disconnected
      ? requestText.disconnected
      : state === 'waiting_approval'
        ? requestText.waitingApproval
        : current?.type === 'model'
          ? requestText.waitingModel
          : requestText.working
    return {
      label,
      detail: disconnected ? requestText.disconnectedDetail : requestText.activeDetail,
      toolErrors,
    }
  }

  if (state === 'completed')
    return {
      label: `${requestText.done}${toolErrors ? requestText.doneWithToolErrors : ''}`,
      detail: toolErrors ? requestText.doneToolErrorsDetail : requestText.doneDetail,
      toolErrors,
    }
  if (state === 'stopped') return { label: requestText.stopped, detail: requestText.stoppedDetail, toolErrors }

  const failure = failureFeedback(errorCode)
  return {
    label: `${requestText.notFinished}${failure.label}`,
    detail: `${failure.detail}${requestText.notFinishedSuffix}`,
    toolErrors,
  }
}

export interface RequestRowActions {
  readonly retry: (text: string) => void
  readonly settings: () => void
  readonly draft: () => string
  readonly approve: (requestId: string, approvalId: string, decision: 'allow-once' | 'refuse') => Promise<void>
}

function ApprovalCard(props: { readonly pending: ApprovalView; readonly actions: RequestRowActions }) {
  const { pending, actions } = props
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const decide = async (decision: 'allow-once' | 'refuse') => {
    setBusy(true)
    setFeedback(requestText.approvalSaving)
    try {
      await actions.approve(pending.requestId, pending.approvalId, decision)
    } catch {
      setFeedback(requestText.approvalFailed)
      setBusy(false)
    }
  }
  return (
    <section className="step-approval" aria-label={requestText.approvalLabel} data-approval-id={pending.approvalId}>
      <strong>{requestText.approvalTitle}</strong>
      <p>{requestText.approvalStep}</p>
      <p className="approval-target">{pending.target}</p>
      <p>{pending.reason}</p>
      <button type="button" disabled={busy} onClick={() => void decide('allow-once')}>
        {requestText.allowOnce}
      </button>
      <button type="button" disabled={busy} onClick={() => void decide('refuse')}>
        {requestText.refuse}
      </button>
      <p role="status">{feedback}</p>
    </section>
  )
}

function RetryActions(props: {
  readonly state: RequestStatus
  readonly errorCode: string | undefined
  readonly original: HistoryMessage | undefined
  readonly actions: RequestRowActions
}) {
  const { state, errorCode, original, actions } = props
  const [note, setNote] = useState('')
  const asked = useRef<string | undefined>(undefined)

  const failed = state === 'failed' || state === 'interrupted'
  const settings = failed && failureOffersSettings(errorCode)
  const text = failed && original?.role === 'user' && original.content ? original.content : undefined
  if (!settings && text === undefined) return <div className="request-actions" hidden />

  return (
    <div className="request-actions">
      {settings && (
        <button type="button" onClick={() => actions.settings()}>
          {requestText.openSettings}
        </button>
      )}
      {text !== undefined && (
        <button
          type="button"
          onClick={() => {
            // A draft in the composer is never replaced by one click: the first click asks, the second replaces.
            const draft = actions.draft().trim()
            if (draft && draft !== text.trim() && asked.current !== draft) {
              asked.current = draft
              setNote(requestText.retryAsk)
              return
            }
            asked.current = undefined
            actions.retry(text)
            setNote(requestText.retryDone)
          }}
        >
          {requestText.retry}
        </button>
      )}
      <p className="request-action-note" role="status">
        {note}
      </p>
    </div>
  )
}

function ActivityDetail(props: { readonly entry: StoredActivity }) {
  const { entry } = props
  const outcome = activityText.outcomes[entry.status] ?? entry.status
  const name = activityText.names[entry.label] ?? entry.label
  const failedTool = entry.type === 'tool' && entry.status === 'failed'
  return (
    <details className="activity-detail" data-activity-id={entry.id} data-status={entry.status}>
      <summary>{`${name} · ${outcome}`}</summary>
      <p>{`${name} · ${outcome}.${failedTool ? activityText.toolSkipped : ''}`}</p>
    </details>
  )
}

/**
 * One request record: its state, its activities, its approval step and its next step. The `details` element keeps
 * the expansion of the user between updates.
 */
export function RequestRow(props: {
  readonly id: string
  readonly number: number
  readonly state: RequestStatus
  readonly live: RequestSnapshot | undefined
  readonly stored: StoredRequest | undefined
  readonly records: readonly StoredActivity[]
  readonly disconnected: boolean
  readonly original: HistoryMessage | undefined
  readonly newest: boolean
  readonly actions: RequestRowActions
}) {
  const { id, state, live, stored, records, actions } = props
  const ref = useRef<HTMLDetailsElement>(null)
  const wasLive = useRef(false)
  const opened = useRef('')
  const active = activeStatus(state)
  const errorCode = live && !activeStatus(live.status) ? live.errorCode : (stored?.errorCode ?? live?.errorCode)
  const feedback = requestFeedback(state, errorCode, records, props.disconnected)
  const diagnostic = state === 'stopped' || state === 'completed' ? undefined : failureFeedback(errorCode).code
  const pending = active && live?.pendingApproval?.state === 'pending' ? live.pendingApproval : undefined

  useEffect(() => {
    const node = ref.current
    if (!node) return
    // Live steps: open while the request runs, closed again as soon as it ends.
    if (active && !wasLive.current) {
      wasLive.current = true
      node.open = true
    } else if (!active && wasLive.current) {
      wasLive.current = false
      node.open = false
    }
    // The newest request that did not finish opens once so its explanation and next step are visible.
    if (props.newest && (state === 'failed' || state === 'interrupted') && opened.current !== state) {
      opened.current = state
      node.open = true
    }
  }, [active, state, props.newest])

  const number = String(props.number)
  return (
    <details
      ref={ref}
      className="request-record"
      data-request-id={id}
      data-status={state}
      data-tool-errors={String(feedback.toolErrors)}
      data-public-research={String(stored?.publicResearch === true)}
      title={stored?.publicResearch ? requestText.publicResearch : ''}
    >
      <summary>
        <span className="request-rev" role="img" aria-label={requestText.number(number)}>
          {number}
        </span>
        <span className="request-state" role="status">
          {feedback.label}
        </span>
        <span className="activity-count">{requestText.activities(records.length)}</span>
      </summary>
      <p className="request-feedback">{feedback.detail}</p>
      {pending ? (
        <ApprovalCard key={pending.approvalId} pending={pending} actions={actions} />
      ) : (
        <section className="step-approval" aria-label={requestText.approvalLabel} hidden />
      )}
      <RetryActions
        key={`${state}|${errorCode ?? ''}|${stored?.historyStart ?? ''}`}
        state={state}
        errorCode={errorCode}
        original={props.original}
        actions={actions}
      />
      <p className="request-model" hidden={!stored}>
        {stored ? requestText.model(stored.selection.provider, stored.selection.model) : ''}
      </p>
      <details className="request-diagnostic" hidden={!diagnostic}>
        <summary>{requestText.diagnostic}</summary>
        <p>{diagnostic ? requestText.errorCode(diagnostic) : ''}</p>
      </details>
      <p hidden={records.length > 0}>{requestText.noActivity}</p>
      <div className="activity-list">
        {records.map(entry => (
          <ActivityDetail key={entry.id} entry={entry} />
        ))}
      </div>
    </details>
  )
}

/** The reply of a running request as it arrives. Once the request ends, the saved conversation shows it. */
export function LiveReply(props: { readonly text: string }) {
  return (
    <div className="request-live-reply" aria-live="polite">
      <MessageContent text={props.text} />
    </div>
  )
}
