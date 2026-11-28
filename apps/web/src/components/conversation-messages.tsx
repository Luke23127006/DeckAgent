import type {
  AttachmentView,
  HistoryMessage,
  OutlineProposal,
  OutlineSnapshot,
  RequestSnapshot,
  RequestStatus,
  StoredActivity,
  StoredRequest,
} from '@deckagent/host-contracts'
import type { ReactNode } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { conversationText } from '../text.ts'
import { MessageContent } from './message-content.tsx'
import { OutlineCard } from './outline-card.tsx'
import type { OutlineActions } from './outline-card.tsx'
import { activeStatus, LiveReply, RequestRow } from './request-row.tsx'
import type { RequestRowActions } from './request-row.tsx'

export interface ConversationRecords {
  readonly history: readonly HistoryMessage[]
  readonly requests: readonly StoredRequest[]
  readonly activities: readonly StoredActivity[]
  readonly live: ReadonlyMap<string, RequestSnapshot>
  readonly disconnected: ReadonlySet<string>
  readonly summarized: ReadonlySet<string>
  readonly outlines: OutlineSnapshot | undefined
}

/** A terminal status is never regressed by an older response. */
function requestState(live: RequestSnapshot | undefined, stored: StoredRequest | undefined): RequestStatus {
  if (live && !activeStatus(live.status)) return live.status
  if (stored && !activeStatus(stored.status)) return stored.status
  return live?.status ?? stored?.status ?? 'active'
}

function Message(props: {
  readonly value: HistoryMessage
  readonly outline: OutlineProposal | undefined
  readonly outlineActions: OutlineActions
  readonly preview: (item: AttachmentView) => void
}) {
  const { value } = props
  if (value.role === 'tool')
    return (
      <details className="unassigned-tool-output">
        <summary>{conversationText.unassignedTool}</summary>
        <pre className="activity-output">{value.content}</pre>
      </details>
    )
  return (
    <article
      className={`message ${value.role}`}
      aria-label={value.role === 'assistant' ? conversationText.assistant : conversationText.user}
      data-interrupted={value.interrupted ? 'true' : undefined}
    >
      {value.role === 'assistant' ? <MessageContent text={value.content} /> : <p>{value.content}</p>}
      {value.role === 'user' && !!value.attachments?.length && (
        <div className="message-attachments">
          {value.attachments.map(attachment => (
            <button key={attachment.attachmentId} type="button" onClick={() => props.preview(attachment)}>
              {attachment.name}
            </button>
          ))}
        </div>
      )}
      {/* FR-019: a reply of a request that did not finish is kept, and says so. */}
      {value.interrupted && <small className="message-note">{conversationText.interrupted}</small>}
      {props.outline && <OutlineCard proposal={props.outline} actions={props.outlineActions} />}
    </article>
  )
}

/**
 * The scrollable conversation: the saved messages, each request record at the place of its message, the reply of a
 * running request and the boundary of a summary (FR-079). The view follows the bottom when the user is near it.
 */
export function ConversationMessages(props: {
  readonly records: ConversationRecords
  readonly hidden: boolean
  readonly actions: RequestRowActions
  readonly preview: (item: AttachmentView) => void
  readonly outlineActions: OutlineActions
}) {
  const { records, actions } = props
  const ref = useRef<HTMLDivElement>(null)
  const followBottom = useRef(true)

  useLayoutEffect(() => {
    const node = ref.current
    if (node && followBottom.current) node.scrollTop = node.scrollHeight
  })

  const { history } = records
  const stored = new Map(records.requests.map(request => [request.requestId, request]))
  const ids = [...new Set([...stored.keys(), ...records.live.keys()])]
  const positions = new Map<number, ReactNode[]>()
  const boundaries = new Map<number, ReactNode[]>()
  const lastId = ids.at(-1)
  for (const [index, id] of ids.entries()) {
    const request = stored.get(id)
    const live = records.live.get(id)
    const start = request?.historyStart
    // A live request that the list does not hold yet shows after the conversation.
    const position =
      start === undefined ? history.length : Math.min(start + (history[start]?.role === 'user' ? 1 : 0), history.length)
    const items = positions.get(position) ?? []
    const state = requestState(live, request)
    items.push(
      <RequestRow
        key={`request:${id}`}
        id={id}
        number={index + 1}
        state={state}
        live={live}
        stored={request}
        records={records.activities.filter(activity => activity.requestId === id)}
        disconnected={records.disconnected.has(id)}
        original={request === undefined ? undefined : history[request.historyStart]}
        newest={id === lastId}
        actions={actions}
      />,
    )
    const partial = activeStatus(state) ? (live?.text ?? '') : ''
    if (partial) items.push(<LiveReply key={`reply:${id}`} text={partial} />)
    positions.set(position, items)
    // The summary covers everything before this request: the boundary sits right above its user message.
    if (request?.summarized || records.summarized.has(id)) {
      const at = start ?? history.length
      const before = boundaries.get(at) ?? []
      before.push(
        <p key={`boundary:${id}`} className="summary-boundary" role="note" data-request-id={id}>
          {conversationText.summaryBoundary}
        </p>,
      )
      boundaries.set(at, before)
    }
  }
  const nodes: ReactNode[] = []
  for (let index = 0; index <= history.length; index++) {
    nodes.push(...(positions.get(index) ?? []), ...(boundaries.get(index) ?? []))
    const value = history[index]
    if (!value) continue
    if (value.role === 'assistant' && !value.content) continue
    if (
      value.role === 'tool' &&
      value.toolCallId &&
      records.activities.some(entry => entry.id === `tool-${value.toolCallId}` && entry.label === value.name)
    )
      continue
    const proposal =
      value.role === 'assistant' ? records.outlines?.proposals.find(p => p.responseIndex === index) : undefined
    nodes.push(
      <Message
        key={`message:${index}:${value.role}`}
        value={value}
        outline={proposal}
        outlineActions={props.outlineActions}
        preview={props.preview}
      />,
    )
  }
  return (
    <div
      ref={ref}
      className="messages"
      aria-label={conversationText.conversation}
      hidden={props.hidden}
      onScroll={event => {
        const node = event.currentTarget
        followBottom.current = node.scrollHeight - node.clientHeight - node.scrollTop < 48
      }}
    >
      {nodes}
    </div>
  )
}
