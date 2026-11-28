/**
 * Tests the attachment HTTP error contract through the module public API.
 * Environment: Node test runner with real errors and MemoryDraftStore. No doubles.
 * Fault: changing INVALID_REQUEST from 400 to 401 made this test fail.
 * Run: node --test apps/host/tests/attachment-errors.test.mjs
 * Expected values: the attachment status table before Phase 5, including REQUEST_EMPTY at 500.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { AttachmentError, MemoryDraftStore, mapAttachmentError } from '../lib/types/modules/attachments/index.js'

test('attachment errors keep HTTP statuses and hide internal messages', () => {
  const statuses = {
    INVALID_REQUEST: 400,
    SESSION_NOT_FOUND: 404,
    ATTACHMENT_NOT_FOUND: 404,
    DRAFT_CONFLICT: 409,
    ATTACHMENT_CONFLICT: 409,
    ATTACHMENT_NOT_READY: 409,
    ATTACHMENT_REJECTED: 409,
    UPLOAD_CANCELLED: 409,
    DRAFT_TOO_LARGE: 413,
    ATTACHMENT_TOO_LARGE: 413,
    ATTACHMENT_COUNT_EXCEEDED: 413,
    PARSING_LIMIT_EXCEEDED: 413,
    ATTACHMENT_TYPE_UNSUPPORTED: 415,
    ATTACHMENT_UNREADABLE: 422,
    HOST_BUSY: 429,
    HOST_CLOSED: 503,
    ATTACHMENT_NOT_SAVED: 500,
    REQUEST_EMPTY: 500,
  }
  for (const [code, status] of Object.entries(statuses)) {
    assert.deepEqual(mapAttachmentError(new AttachmentError(code, 'Private storage path')), { code, status })
  }
  assert.deepEqual(mapAttachmentError(new AttachmentError('HOST_BUSY', { retryable: true })), {
    code: 'HOST_BUSY',
    status: 429,
    detail: { retryable: true },
  })
  assert.equal(mapAttachmentError({ code: 'DRAFT_CONFLICT' }), undefined)
  const drafts = new MemoryDraftStore()
  assert.throws(
    () => drafts.set('chat-a', 'x'.repeat(16001)),
    error => {
      assert.ok(error instanceof AttachmentError)
      assert.deepEqual(mapAttachmentError(error), { code: 'DRAFT_TOO_LARGE', status: 413 })
      return true
    },
  )
})
