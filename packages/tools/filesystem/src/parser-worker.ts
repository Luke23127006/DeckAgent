import { attachmentLimits } from './attachment-contracts.ts'
import { extractAttachment } from './attachment-extraction.ts'
import { SourceError } from './contracts.ts'

process.once('message', async (message: unknown) => {
  try {
    if (
      !message ||
      typeof message !== 'object' ||
      !('name' in message) ||
      typeof message.name !== 'string' ||
      !('bytes' in message) ||
      !(message.bytes instanceof Uint8Array) ||
      message.bytes.length > attachmentLimits.bytes
    )
      throw new SourceError('INVALID_REQUEST')
    const result = await extractAttachment(message.name, message.bytes)
    process.send?.(result)
  } catch (error) {
    process.send?.({ error: error instanceof SourceError ? error.code : 'ATTACHMENT_UNREADABLE' })
  }
})
