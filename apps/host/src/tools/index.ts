export { SourceError } from './policy/contracts.ts'
export { createSourceAccess } from './policy/source-access.ts'
export type { SourceAccess, SourceAccessOptions, SourceRead, SourceReadPlan } from './policy/contracts.ts'
export { AttachmentParser, isParsedAttachment } from './sources/attachment-parser.ts'
export { attachmentLimits, attachmentParserVersion } from './sources/attachment-contracts.ts'
export type {
  AttachmentLocation,
  AttachmentPart,
  ParsedAttachment,
  AttachmentParseInput,
} from './sources/attachment-contracts.ts'
export {
  SourceToolFailure,
  createSourceToolsContribution,
  mapSourceToolFailure,
  prepareSourceTools,
} from './executors/source-tools.ts'
export type { SourceToolOptions, SourceToolsContributionOptions } from './executors/source-tools.ts'
export type {
  ToolAttachmentReader,
  ToolAttachmentRecords,
  ToolChats,
  ToolResearchSession,
  ToolRuns,
  ToolWorkspaceLookup,
} from './executors/ports.ts'
