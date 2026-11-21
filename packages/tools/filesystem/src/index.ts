export { createSourceAccess } from './source-access.ts'
export { AttachmentParser, isParsedAttachment } from './attachment-parser.ts'
export { attachmentLimits, attachmentParserVersion } from './attachment-contracts.ts'
export type {
  AttachmentLocation,
  AttachmentPart,
  ParsedAttachment,
  AttachmentParseInput,
} from './attachment-contracts.ts'
export { SourceError } from './contracts.ts'
export type { SourceAccess, SourceAccessOptions, SourceRead, SourceReadPlan } from './contracts.ts'
