import { SessionDatabase, SessionError, SqliteRunStore } from '../../lib/types/db/index.js'
import { SqliteChatStore } from '../../lib/types/modules/chats/index.js'
import { SqliteAttachmentLog } from '../../lib/types/modules/attachments/index.js'

export { SessionDatabase, SessionError, SqliteRunStore, SqliteChatStore, SqliteAttachmentLog }

export function openSessionStorage(path, options) {
  const db = new SessionDatabase(path)
  const chats = new SqliteChatStore(db, options)
  const attachments = new SqliteAttachmentLog(db)
  const runs = new SqliteRunStore(db, {
    beforeAdmit: input => {
      chats.requireSessionInTx(input.owner.id)
      const ready = attachments.validateReadyInTx(input.owner.id, input.attachmentIds ?? [])
      return chats.admitUserMessageInTx(input.owner.id, input.input, ready)
    },
    afterAdmit: (input, messageSequence) => {
      if (input.attachmentIds?.length)
        attachments.linkToRequestInTx(input.requestId, messageSequence, input.attachmentIds)
    },
    onSettle: (owner, status, text) => {
      chats.appendAssistantMessageInTx(owner.id, text, status !== 'completed')
    },
  })
  return { db, chats, attachments, runs, close: () => db.close() }
}

const asOwner = ownerOrId => (typeof ownerOrId === 'string' ? { kind: 'chat', id: ownerOrId } : ownerOrId)
const asOwnerKey = keyOrId => (keyOrId.includes(':') ? keyOrId : `chat:${keyOrId}`)
const withSessionId = record => (record ? { ...record, sessionId: record.owner.id } : undefined)

export function openSessionStore(path, options) {
  const { db, chats, attachments, runs, close } = openSessionStorage(path, options)
  const requests = {
    approvals: runs.approvals,
    admit(input) {
      const { sessionId, owner, ...rest } = input
      return withSessionId(runs.admit({ ...rest, owner: owner ?? { kind: 'chat', id: sessionId } }))
    },
    append: (requestId, event) => runs.append(requestId, event),
    finish: (requestId, status, errorCode) => runs.finish(requestId, status, errorCode),
    interruptActive: () => runs.interruptActive(),
    get: requestId => withSessionId(runs.get(requestId)),
    list: ownerOrId => runs.list(asOwner(ownerOrId)).map(withSessionId),
    activeFor: ownerOrId => runs.activeFor(asOwner(ownerOrId)),
    events: (requestId, after) => runs.events(requestId, after),
    activities: ownerOrId => runs.activities(asOwner(ownerOrId)),
    text: requestId => runs.text(requestId),
    binding: keyOrId => runs.binding(asOwnerKey(keyOrId)),
    bind(binding) {
      const { sessionId, ownerKey, ...rest } = binding
      runs.bind({ ...rest, ownerKey: ownerKey ?? `chat:${sessionId}` })
    },
    unbind: keyOrId => runs.unbind(asOwnerKey(keyOrId)),
    lastCompletedRequestId: (ownerKey, currentRequestId) =>
      runs.lastCompletedRequestId(asOwnerKey(ownerKey), currentRequestId),
    sourceCatalogue: sessionId => runs.sourceCatalogue(sessionId),
    recordSourceRead: (requestId, value) => runs.recordSourceRead(requestId, value),
    reserveResearch: (requestId, sessionId) => runs.reserveResearch(requestId, sessionId),
    recordResearch: (requestId, sessionId, query, result) => runs.recordResearch(requestId, sessionId, query, result),
    researchSources: sessionId => runs.researchSources(sessionId),
  }
  return {
    db,
    chatStore: chats,
    runs,
    attachments,
    requests,
    open: sessionId => chats.open(sessionId),
    chatsVersion: () => chats.chatsVersion(),
    create: (workspaceId, selection) => chats.create(workspaceId, selection),
    bind: (sessionId, selection) => chats.bind(sessionId, selection),
    getInfo: sessionId => chats.getInfo(sessionId),
    select: (sessionId, selection) => chats.select(sessionId, selection),
    list: () => chats.list(),
    chats: () => chats.chats(),
    search: (words, chatIds) => chats.search(words, chatIds),
    ungroup: workspaceId => chats.ungroup(workspaceId),
    ungroupExcept: workspaceIds => chats.ungroupExcept(workspaceIds),
    read: sessionId => chats.read(sessionId),
    append: (sessionId, messages) => chats.append(sessionId, messages),
    clearSelections: (provider, models) => chats.clearSelections(provider, models),
    close,
  }
}
