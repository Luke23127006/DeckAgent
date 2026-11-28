import type { ClientErrorCode } from './api/client.ts'

/** Shell copy of the React app. Every user-visible string of new React code lives here. */
export const appText = {
  appName: 'DeckAgent',
  loadingWorkspace: 'Opening the workspace…',
  missingChat: 'This chat does not exist. The main screen is open now.',
} as const

/** One label for each client error code. A raw Host message never becomes UI copy. */
export const errorText: Readonly<Record<ClientErrorCode, string>> = {
  APPROVAL_CONFLICT: 'This step already has a decision',
  APPROVAL_NOT_FOUND: 'The step that needs permission was not found',
  ATTACHMENT_CONFLICT: 'The file changed',
  ATTACHMENT_COUNT_EXCEEDED: 'Too many files in the draft',
  ATTACHMENT_NOT_FOUND: 'The file is not in this chat',
  ATTACHMENT_NOT_READY: 'The file is not ready yet',
  ATTACHMENT_NOT_SAVED: 'The file was not saved',
  ATTACHMENT_REJECTED: 'The draft has a file that you cannot use',
  ATTACHMENT_TOO_LARGE: 'The file is too large',
  ATTACHMENT_TYPE_UNSUPPORTED: 'This file format is not supported',
  ATTACHMENT_UNREADABLE: 'The file cannot be read',
  AUTH_REQUIRED: 'This connection is no longer valid',
  BRIEF_LOCKED: 'The Brief is locked for the confirmed deck',
  BRIEF_PROPOSAL_REQUIRED: 'The Brief was not saved',
  BRIEF_REPAIR_LIMIT: 'A valid Brief was not prepared',
  BRIEF_STALE: 'The Brief changed',
  CATALOG_UNAVAILABLE: 'The model list cannot be read',
  CHANGES_CONNECTION_LOST: 'The update connection stopped',
  CHANGES_REQUEST_FAILED: 'The update channel did not open',
  CHAT_UNREADABLE: 'This chat cannot be opened',
  CONFIRMATION_CONFLICT: 'The confirmation does not match the current proposal',
  CONNECTION_LOST: 'The connection stopped',
  CONTEXT_LIMIT: 'The conversation is longer than the model context',
  CONTEXT_SUMMARY_FAILED: 'The conversation summary failed',
  CREDENTIAL_NOT_SAVED: 'The key was not saved',
  CREDENTIAL_STORE_UNAVAILABLE: 'The key store did not open',
  DESIGN_LAYOUT_INCOMPATIBLE: 'The content does not fit the layout',
  DRAFT_CONFLICT: 'The draft changed',
  DRAFT_NOT_SAVED: 'The draft was not saved',
  DRAFT_TOO_LARGE: 'The draft is too long',
  GENERATION_FAILED: 'Deck generation failed',
  GENERATION_INCOMPLETE: 'The deck is not complete',
  HOST_BUSY: 'DeckAgent is running too many requests',
  HOST_CLOSED: 'DeckAgent stopped',
  HOST_REQUEST_FAILED: 'The request to the Host failed',
  HOST_RESTARTED: 'DeckAgent stopped before the request was complete',
  HOST_STOPPED: 'DeckAgent stopped before the request was complete',
  IMAGE_INPUT_UNAVAILABLE: 'The model or the connection does not accept images',
  IMAGE_PREPARATION_REQUIRED: 'Not all required images are ready',
  INVALID_PROVIDER: 'The provider configuration is not valid',
  INVALID_REQUEST: 'The request is not valid',
  INVALID_RESPONSE: 'The data from the Host cannot be read',
  MODEL_NOT_SELECTABLE: 'This model is no longer available',
  NEW_ENDPOINT_REQUIRES_KEY: 'A new endpoint needs a key',
  NO_SELECTABLE_MODEL: 'The chat has no model to run',
  OUTLINE_REPAIR_LIMIT: 'A valid Outline was not prepared',
  OUTLINE_STALE: 'The Outline changed',
  OUTLINE_UNAVAILABLE: 'The Outline did not load',
  PARSING_LIMIT_EXCEEDED: 'The file is larger than the safe read limit',
  PREFERENCES_STALE: 'The display settings changed',
  PROTOCOL_IMMUTABLE: 'You cannot change the protocol of a saved provider',
  PROVIDER_AUTH: 'The model provider refused the key or the model',
  PROVIDER_BUSY: 'The provider is busy',
  PROVIDER_CHECK_FAILED: 'The provider check failed',
  PROVIDER_HTTP: 'The model provider sent an error',
  PROVIDER_ID_TAKEN: 'This provider already exists',
  PROVIDER_KEY_REQUIRED: 'The provider needs a key',
  PROVIDER_KEY_REFUSED: 'The provider refused the key',
  PROVIDER_KEY_UNAVAILABLE: 'The saved key cannot be used',
  PROVIDER_MODEL_UNAVAILABLE: 'The provider did not find the model',
  PROVIDER_NAME_EXISTS: 'This provider name is already in use',
  PROVIDER_NO_ANSWER: 'The provider did not answer',
  PROVIDER_NOT_FOUND: 'The provider was not found',
  PROVIDER_RATE_LIMIT: 'The provider usage limit is reached',
  PROVIDER_TIMEOUT: 'The model provider took too long to answer',
  PROVIDER_UNSUPPORTED: 'This provider configuration is not supported',
  PROVIDERS_STALE: 'The provider list changed',
  REQUEST_CLOSED: 'The request is closed',
  REQUEST_EMPTY: 'There is nothing to send',
  REQUEST_FAILED: 'The request did not complete',
  REQUEST_NOT_FOUND: 'The request was not found',
  REQUEST_NOT_SAVED: 'The work of the request was not saved',
  REQUEST_TEXT_TOO_LONG: 'The request is too long',
  REQUEST_TIMEOUT: 'The request ran for too long',
  REQUESTS_UNAVAILABLE: 'You cannot send requests now',
  RESEARCH_FREE_ONLY: 'Research accepts only the free plan',
  RESEARCH_IMAGE_ARGUMENTS_INVALID: 'The image search or selection command is not valid',
  RESEARCH_IMAGE_CONTEXT_REQUIRED: 'The image search state was not restored',
  RESEARCH_IMAGE_SELECTION_STALE: 'The image position or selection changed',
  RESEARCH_KEY_REJECTED: 'Tavily refused the key',
  RESEARCH_KEY_UNAVAILABLE: 'The research key cannot be read',
  RESEARCH_NOT_SAVED: 'The research key was not saved',
  RESEARCH_QUOTA_EXHAUSTED: 'No free quota is left',
  RESEARCH_UNAVAILABLE: 'Research is not available',
  RUNTIME_CONFIG_UNSAFE: 'OpenCode does not run with a safe configuration',
  RUNTIME_FAILED: 'The request did not complete',
  RUNTIME_INCOMPLETE: 'The model did not complete its answer',
  RUNTIME_PROTOCOL: 'The OpenCode result cannot be read',
  RUNTIME_UNAVAILABLE: 'The bundled OpenCode runtime is not ready',
  RUNTIME_VERSION_UNSUPPORTED: 'This OpenCode CLI version is not supported',
  SESSION_BUSY: 'The chat has an active request',
  SESSION_NOT_FOUND: 'The chat was not found',
  SESSION_UNAVAILABLE: 'This chat is not available',
  SETTINGS_REQUEST_FAILED: 'The settings cannot be read',
  SLIDE_CORRECTION_LIMIT: 'The slide has no corrections left in this request',
  SOURCE_CHANGED: 'The source changed',
  SOURCE_UNAVAILABLE: 'The source cannot be read',
  UPLOAD_CANCELLED: 'The file upload stopped',
  WORKSPACES_STALE: 'The workspace list changed',
  WORKSPACE_DEFAULT: 'You cannot remove the default workspace',
  WORKSPACE_FOLDER_IN_USE: 'Another workspace uses this folder',
  WORKSPACE_FOLDER_INVALID: 'The workspace path is not valid',
  WORKSPACE_FOLDER_REFUSED: 'No permission to read the workspace folder',
  WORKSPACE_FOLDER_REQUIRED: 'No workspace folder is selected',
  WORKSPACE_FOLDER_UNREADABLE: 'The workspace folder cannot be read',
  WORKSPACE_NAME_EMPTY: 'The workspace name is empty',
  WORKSPACE_NAME_TOO_LONG: 'The workspace name is too long',
  WORKSPACE_NOT_FOUND: 'The workspace was not found',
  WORKSPACE_REQUEST_ACTIVE: 'The workspace has a running request',
}

export function formatClientError(code: ClientErrorCode): string {
  return errorText[code]
}

export const settingsText = {
  protocols: {
    'chat-completions': 'OpenAI Chat Completions',
    responses: 'OpenAI Responses',
    'anthropic-messages': 'Anthropic Messages',
    gemini: 'Google Gemini',
  },
  title: 'Model settings',
  back: 'Back to chat',
  loading: 'Reading the settings…',
  retry: 'Try again',
  custom: 'Custom model API',
  savedProviders: 'Saved providers',
  addProvider: 'Add provider',
  providerId: 'Provider ID',
  name: 'Display name',
  protocol: 'API protocol',
  url: 'Base URL',
  key: 'API key',
  removeKey: 'Remove the saved key',
  models: 'Model ID',
  save: 'Save provider',
  remove: 'Delete configuration',
  catalog: 'Get model catalog',
  saved: 'The configuration is saved. Select a model in the chat to use it.',
  keyHelp: 'Leave this empty to keep the saved key. DeckAgent does not show the key again after you save it.',
  keyAvailable: 'Key available',
  keyUnavailable: 'The saved key cannot be used',
  noKey: 'No key',
  noKeyStore: 'This computer has no protected key store. You can use providers that do not need a key.',
  discard: 'Discard the unsaved changes?',
  confirmRemove: 'Delete this provider? DeckAgent keeps the chat history.',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
  catalogHelp: 'The catalog does not guarantee access or compatibility. You can type a model ID manually.',
} as const

/** The count and the noun, with the plural form when the count is not 1. */
const counted = (count: number, singular: string, plural: string) => `${count} ${count === 1 ? singular : plural}`

const workspaceRefusals: Readonly<Record<string, string>> = {
  'drive-root': 'it is the root folder of a drive',
  system: 'it is a Windows system folder, or it contains one',
  'user-folder': 'it is your user folder',
  'key-folder': 'it contains keys or sign-in data',
  'deckagent-data': 'it contains DeckAgent data, or it is inside DeckAgent data',
}

export const workspaceText = {
  label: 'Workspace',
  defaultSuffix: ' · default',
  checkFolderSuffix: ' · check the folder',
  defaultTitle: 'Default workspace, with no project folder',
  add: '+ Folder',
  addTitle: 'Add a workspace for a folder',
  rename: 'Rename',
  relink: 'Change folder',
  remove: 'Remove',
  removeTitle: 'Remove workspace',
  adopt: 'Use this folder',
  save: 'Save',
  cancel: 'Cancel',
  renameHeading: 'Rename workspace',
  renameHelp: 'The name can have a maximum of 100 characters. A new name keeps the project folder and the chats.',
  nameLabel: 'Workspace name',
  addHeading: 'Add a workspace for a folder',
  relinkHeading: 'Select a different folder for the workspace',
  folderHelp:
    'Type the full path of a folder on this computer. During setup, DeckAgent does not read files in the folder, does not send data to the model and does not write to the folder.',
  folderLabel: 'Folder path',
  confirmRemove: (name: string) =>
    `Remove workspace “${name}”? DeckAgent keeps the project folder and all its files. The chats of the workspace move to the “Ungrouped chats” group, with their conversations, decks and selected models.`,
  /** FR-074 and FR-142: name the workspace and say what the user does next; name no unknown cause. */
  unreadableFolder: (name: string) =>
    `Workspace “${name}”: DeckAgent cannot read the files of the project folder. Put the folder back, give read permission again, or select a different folder. You can still open the chats.`,
  differentFolder: (name: string) =>
    `Workspace “${name}”: a different folder is now at the location of the project folder. DeckAgent does not read files in that folder. You can still open the chats.`,
} as const

/** User-facing text for a refused workspace change: what failed and what to do next. Never a raw message. */
export function workspaceErrorText(code: ClientErrorCode, detail: Readonly<Record<string, string | boolean>>): string {
  switch (code) {
    case 'WORKSPACE_FOLDER_REQUIRED':
      return 'No folder is selected. DeckAgent did not set up a workspace.'
    case 'WORKSPACE_FOLDER_INVALID':
      return 'Type the full path of the folder, for example C:\\Users\\name\\Documents\\project.'
    case 'WORKSPACE_FOLDER_UNREADABLE':
      return 'DeckAgent cannot read this folder. Check the path and the access permission, or select a different folder.'
    case 'WORKSPACE_FOLDER_REFUSED': {
      const why = typeof detail.reason === 'string' ? workspaceRefusals[detail.reason] : undefined
      const inside = detail.allowInside === true ? ' You can select a folder inside it.' : ' Select a different folder.'
      return `This folder cannot be a project folder${why ? `: ${why}` : ''}.${inside}`
    }
    case 'WORKSPACE_FOLDER_IN_USE':
      return typeof detail.workspaceName === 'string'
        ? `Workspace “${detail.workspaceName}” uses this folder. Select that workspace, or select a different folder.`
        : 'A different workspace uses this folder. Select that workspace, or select a different folder.'
    case 'WORKSPACE_DEFAULT':
      return 'The default workspace has no project folder. You cannot remove it.'
    case 'WORKSPACE_NAME_EMPTY':
      return 'The workspace name must have at least one character. DeckAgent keeps the old name.'
    case 'WORKSPACE_NAME_TOO_LONG':
      return 'The workspace name can have a maximum of 100 characters. DeckAgent keeps the old name.'
    case 'WORKSPACE_NOT_FOUND':
      return 'This workspace is no longer set up. DeckAgent refreshed the list.'
    case 'WORKSPACES_STALE':
      return 'The workspace list changed in a different place. DeckAgent refreshed the list. Check it, then try again.'
    default:
      return 'The workspace did not change. Check the connection to DeckAgent, then try again.'
  }
}

export const chatListText = {
  searchPlaceholder: 'Search chats by word…',
  searchLabel: 'Search previous chats by word',
  noMatch: 'No chat matches the words that you typed.',
  empty: 'No previous chats.',
  ungrouped: 'Ungrouped chats',
  unknownTime: 'Update time unknown',
  unreadable: 'This chat cannot be opened',
  slidesUnknown: 'Slides unknown',
  hasSlides: 'Has slides',
  noSlides: 'No slides',
  unreadableName: 'Unreadable chat',
  newChat: 'New chat',
  untitled: 'Untitled chat',
  working: ' · Working…',
} as const

/** Label, detail and whether the text sends the user to model settings, for each failure code of a request. */
export const requestFailureText: Readonly<Record<string, readonly [string, string, boolean?]>> = {
  OUTLINE_REPAIR_LIMIT: [
    'A valid Outline was not prepared',
    'The two automatic corrections are used. See the remaining errors in the response. DeckAgent keeps the Outline and the images that it saved before.',
  ],
  DESIGN_LAYOUT_INCOMPATIBLE: [
    'The content does not fit the layout',
    'Before you confirm, change the Outline so that the content fits a layout in the catalog. DeckAgent keeps the saved content and progress.',
  ],
  BRIEF_REPAIR_LIMIT: [
    'A valid Brief was not prepared',
    'The two automatic corrections for this request are used. See the remaining field errors in the response. DeckAgent keeps the saved Brief and Outline.',
  ],
  BRIEF_PROPOSAL_REQUIRED: [
    'The Brief was not saved',
    'The model did not send a valid Brief. The request is closed. DeckAgent keeps the data that it saved before.',
  ],
  IMAGE_PREPARATION_REQUIRED: [
    'Not all required images are ready',
    'Change the Outline to change the image query, select a different image or mark the image as optional. Then review it before you confirm.',
  ],
  RESEARCH_IMAGE_CONTEXT_REQUIRED: [
    'The image search state was not restored',
    'Read the current Outline again, then send a request to continue. DeckAgent keeps the saved progress. This turn did not search for images.',
  ],
  RESEARCH_IMAGE_SELECTION_STALE: [
    'The image position or selection changed',
    'Read the current Outline again, then ask DeckAgent to continue the missing images. DeckAgent keeps the saved results.',
  ],
  RESEARCH_IMAGE_ARGUMENTS_INVALID: [
    'The image search or selection command is not valid',
    'This turn did not complete. DeckAgent keeps the saved progress. Send a new request to continue.',
  ],
  SLIDE_CORRECTION_LIMIT: [
    'The slide has no corrections left in this request',
    'See the check errors and the saved slides. DeckAgent stopped to prevent an endless correction loop.',
  ],
  BRIEF_STALE: [
    'The Brief changed',
    'Open the chat again to read the current Brief before you send again. DeckAgent keeps the draft.',
  ],
  OUTLINE_STALE: ['The Outline changed', 'Read the current proposal before you change or confirm it again.'],
  CONFIRMATION_CONFLICT: [
    'The confirmation does not match the current proposal',
    'Open the chat again to read the Outline and the saved results before you try again.',
  ],
  BRIEF_LOCKED: [
    'The Brief is locked for the confirmed deck',
    'See the saved slides. Make a new chat if you need a different deck.',
  ],
  GENERATION_INCOMPLETE: [
    'The deck is not complete',
    'See the saved slides in Preview and the errors of the request. DeckAgent does not continue automatically.',
  ],
  GENERATION_FAILED: [
    'Deck generation failed',
    'Check the tool activity and the saved slides. DeckAgent does not continue automatically.',
  ],
  RESEARCH_UNAVAILABLE: [
    'Research is not available',
    'Check the Tavily configuration, or clear the public source option, then send again. DeckAgent keeps the draft.',
  ],
  RESEARCH_KEY_UNAVAILABLE: ['The research key cannot be read', 'Set up Tavily in Search settings, then try again.'],
  RESEARCH_KEY_REJECTED: ['Tavily refused the key', 'Check the key in Search settings, then try again.'],
  RESEARCH_FREE_ONLY: [
    'Research accepts only the free plan',
    'Keep Tavily on the Researcher plan and turn off PAYG. DeckAgent does not upgrade the plan.',
  ],
  RESEARCH_QUOTA_EXHAUSTED: [
    'No free quota is left',
    'Wait for new quota or clear the research option. DeckAgent does not change to a paid service.',
  ],
  IMAGE_INPUT_UNAVAILABLE: [
    'The model or the connection does not accept images',
    'DeckAgent keeps the file that you sent. Select a model that accepts images, or give a version with text, then send a new request. DeckAgent does not run OCR or change the model automatically.',
  ],
  DRAFT_CONFLICT: [
    'The draft changed',
    'Keep the text that you are writing. Open the chat again to compare it with the latest version, then send again.',
  ],
  DRAFT_NOT_SAVED: [
    'The draft was not saved',
    'Check the connection. DeckAgent keeps the text that you are writing so that you can try again.',
  ],
  ATTACHMENT_NOT_FOUND: [
    'The file is not in this chat',
    'Open the chat again to read the latest status. Add the file again if necessary.',
  ],
  ATTACHMENT_NOT_READY: [
    'The file is not ready yet',
    'Wait until the file is ready, or remove the file from the draft.',
  ],
  ATTACHMENT_REJECTED: [
    'The draft has a file that you cannot use',
    'See the reason at the file, then remove or replace the file before you send.',
  ],
  ATTACHMENT_COUNT_EXCEEDED: [
    'Too many files in the draft',
    'Each request accepts a maximum of 10 new files. Remove some files, then try again.',
  ],
  ATTACHMENT_TOO_LARGE: [
    'The file is too large',
    'Each file can have a maximum of 20 MiB. Make the file smaller, then add it again.',
  ],
  ATTACHMENT_UNREADABLE: [
    'The file cannot be read',
    'Check the document, or give a version with a text layer. This version does not run OCR.',
  ],
  ATTACHMENT_TYPE_UNSUPPORTED: ['This file format is not supported', 'Use TXT, MD, PDF, DOCX, PNG, JPEG, PPTX or ZIP.'],
  ATTACHMENT_NOT_SAVED: [
    'The file was not saved',
    'Check the data folder and the connection. DeckAgent keeps the other parts of the draft.',
  ],
  PARSING_LIMIT_EXCEEDED: [
    'The file is larger than the safe read limit',
    'Divide the document into smaller parts, then add them again.',
  ],
  UPLOAD_CANCELLED: ['The file upload stopped', 'Remove the incomplete file, then add it again if necessary.'],
  REQUEST_EMPTY: ['There is nothing to send', 'Type a request or add at least one ready file.'],
  APPROVAL_NOT_FOUND: [
    'The step that needs permission was not found',
    'Open the chat again to read the latest status. DeckAgent did not give a new permission.',
  ],
  APPROVAL_CONFLICT: [
    'This step already has a decision',
    'A different screen possibly answered. Read the request status again before you continue.',
  ],
  REQUEST_CLOSED: [
    'The request is closed',
    'You cannot give more permissions to this request. Send a new request if you still need that work.',
  ],
  SOURCE_CHANGED: [
    'The source changed',
    'The path or the file no longer matches the current permission. Check the source, then send a new request.',
  ],
  SOURCE_UNAVAILABLE: [
    'The source cannot be read',
    'Check the file or the project folder of the workspace. DeckAgent does not use a different file.',
  ],
  CHAT_UNREADABLE: [
    'This chat cannot be opened',
    'The saved data of the chat cannot be read. The chat stays in the list. The chat that you have open does not change.',
  ],
  SESSION_NOT_FOUND: [
    'The chat was not found',
    'This chat is no longer in the DeckAgent data. DeckAgent refreshed the chat list.',
  ],
  REQUESTS_UNAVAILABLE: [
    'You cannot send requests now',
    'DeckAgent is not connected to the runtime. DeckAgent keeps the draft.',
  ],
  RUNTIME_UNAVAILABLE: [
    'The bundled OpenCode runtime is not ready',
    'Install the dependencies again or repair the DeckAgent installation, then start DeckAgent again. If you set a custom runtime, check its path. DeckAgent keeps the draft.',
  ],
  RUNTIME_VERSION_UNSUPPORTED: [
    'This OpenCode CLI version is not supported',
    'Restore the runtime that comes with DeckAgent, then start DeckAgent again. If you set a custom runtime, check its version and make sure that it runs. DeckAgent keeps the draft.',
  ],
  RUNTIME_CONFIG_UNSAFE: [
    'OpenCode does not run with a safe configuration',
    'DeckAgent stopped before it called the model, because a tool or a plugin was not blocked. Check the OpenCode CLI version.',
  ],
  RUNTIME_PROTOCOL: [
    'The OpenCode result cannot be read',
    'DeckAgent keeps the saved part. Check the OpenCode CLI version, then send a new request.',
  ],
  RUNTIME_INCOMPLETE: [
    'The model did not complete its answer',
    'DeckAgent keeps the saved part. Send a new request when you are ready. DeckAgent does not try again automatically.',
  ],
  RUNTIME_FAILED: [
    'The request did not complete',
    'OpenCode stopped before it completed. Check the connection and the model settings, then send a new request.',
    true,
  ],
  REQUEST_TIMEOUT: [
    'The request ran for too long',
    'DeckAgent keeps the saved part. Check the connection, then send a new request.',
  ],
  REQUEST_NOT_SAVED: [
    'The work of the request was not saved',
    'DeckAgent stopped the request to prevent data loss. DeckAgent keeps the last saved state.',
  ],
  HOST_RESTARTED: [
    'DeckAgent stopped before the request was complete',
    'DeckAgent keeps the saved part. DeckAgent does not run the request again. Send a new request.',
  ],
  HOST_STOPPED: [
    'DeckAgent stopped before the request was complete',
    'DeckAgent keeps the saved part. DeckAgent does not run the request again. Send a new request.',
  ],
  CONTEXT_LIMIT: [
    'The conversation is longer than the model context',
    'DeckAgent keeps the full conversation. Open a new chat, or select a model with a larger context.',
  ],
  // FR-079: the summary could not be written; the request does not finish and the conversation stays as it was.
  CONTEXT_SUMMARY_FAILED: [
    'The conversation summary failed',
    'The conversation is longer than the model context, and DeckAgent cannot summarize it. The conversation does not change. Select a model with a larger context for this chat, or open a new chat.',
  ],
  NO_SELECTABLE_MODEL: [
    'The chat has no model to run',
    'Select a model in this chat, or add a provider and a model in Model settings. DeckAgent keeps the draft.',
    true,
  ],
  PROVIDER_KEY_UNAVAILABLE: [
    'The saved key cannot be used',
    'Type the key again in Model settings. DeckAgent keeps the draft.',
    true,
  ],
  PROVIDER_UNSUPPORTED: [
    'This provider configuration is not supported',
    'Check the API protocol and the key in Model settings. DeckAgent does not change the model automatically.',
    true,
  ],
  PROVIDER_MODEL_UNAVAILABLE: [
    'The provider did not find the model',
    'Check the model ID in Model settings. DeckAgent does not change the model automatically.',
    true,
  ],
  REQUEST_TEXT_TOO_LONG: [
    'The request is too long',
    'Make the text shorter before you send it. DeckAgent keeps the draft.',
  ],
  HOST_BUSY: ['DeckAgent is running too many requests', 'Wait until one request is complete, then send again.'],
  REQUEST_FAILED: [
    'The request did not complete',
    'Check the saved part, the connection and the model settings before you send a new request.',
    true,
  ],
  INVALID_RESPONSE: [
    'The data from the Host cannot be read',
    'Reload the screen or connect again to read the saved part. Check the request status before you send again.',
  ],
  OUTLINE_UNAVAILABLE: [
    'The Outline did not load',
    'Connect again to read the saved Outline. Check the request status before you send again.',
  ],
  PROVIDER_HTTP: [
    'The model provider sent an error',
    'Check the connection and the configuration in Model settings, then send again. DeckAgent does not try again automatically.',
    true,
  ],
  PROVIDER_TIMEOUT: [
    'The model provider took too long to answer',
    'Check the connection, then send a new request when you are ready.',
  ],
  PROVIDER_AUTH: [
    'The model provider refused the key or the model',
    'Check the API key and the model permission in Model settings.',
    true,
  ],
  PROVIDER_RATE_LIMIT: [
    'The provider usage limit is reached',
    'Wait, or check the account limit, before you send a new request. DeckAgent does not change the model.',
  ],
  MODEL_NOT_SELECTABLE: [
    'This model is no longer available',
    'Select a different model in this chat. DeckAgent did not send the request.',
  ],
  AUTH_REQUIRED: ['This connection is no longer valid', 'Open the browser again from the running Host.'],
  SESSION_BUSY: [
    'The chat has an active request',
    'Wait until it is complete, or stop the request, before you send a different request.',
  ],
  WORKSPACE_REQUEST_ACTIVE: [
    'The workspace has a running request',
    'Wait until the request is complete, or stop it first. DeckAgent did not stop a request.',
  ],
}

/** The text of a failure code. Raw provider or error messages never become UI copy; an unknown code uses a fixed text. */
export function failureFeedback(code?: string): {
  readonly label: string
  readonly detail: string
  readonly code: string | undefined
} {
  const known =
    typeof code === 'string' && Object.hasOwn(requestFailureText, code) ? requestFailureText[code] : undefined
  return {
    label: known?.[0] ?? 'The request did not complete',
    detail: known?.[1] ?? 'Check the saved part, the connection and the model settings before you send a new request.',
    code: known ? code : undefined,
  }
}

/** Whether the failure text of `code` sends the user to model settings. An unknown code does. */
export function failureOffersSettings(code?: string): boolean {
  if (typeof code === 'string' && Object.hasOwn(requestFailureText, code)) return requestFailureText[code]?.[2] === true
  return true
}

export const activityText = {
  outcomes: {
    running: 'running',
    completed: 'completed',
    failed: 'failed',
    stopped: 'stopped',
  } as Readonly<Record<string, string>>,
  names: {
    'Model response': 'Model response',
    'Conversation summary': 'Conversation summary',
    list_sources: 'List project sources',
    read_source: 'Read a project source',
    read_external: 'Read a file outside the scope',
    read_attachment: 'Read an attachment',
    research_public: 'Search public sources',
    stage_brief: 'Propose a Brief',
    stage_outline: 'Propose an Outline',
    read_generation_plan: 'Read the confirmed plan',
    begin_slide: 'Prepare a slide',
    read_slide_draft: 'Read the slide draft',
    record_slide_content: 'Record the slide content',
    record_slide_provenance: 'Record the content sources',
    find_slide_image: 'Find an illustration',
    prepare_slide_images: 'Prepare images for the Outline',
    search_slide_images: 'Search images for the slide content',
    select_slide_image: 'Select and check an image',
    recover_slide_images: 'Find and prepare the missing images',
    validate_slide: 'Check the slide draft',
    append_slide: 'Write the slide content',
    attach_slide_image: 'Add the selected image',
    publish_slide: 'Check and save the slide',
    discard_slide: 'Discard the incomplete slide',
  } as Readonly<Record<string, string>>,
  toolSkipped: ' This step did not run. The request continues.',
} as const

export const requestText = {
  waitingApproval: 'Waiting for your permission',
  disconnected: 'The connection stopped',
  waitingModel: 'Waiting for the model to answer',
  working: 'Working…',
  disconnectedDetail:
    'The progress does not update live. The request still runs in DeckAgent. DeckAgent is connecting again to read the saved part.',
  activeDetail: 'The request is still active. You can stop the request.',
  done: 'Done',
  doneWithToolErrors: ' · some steps did not run',
  doneDetail: 'The request is done. You can send a new request.',
  doneToolErrorsDetail: 'A tool step failed, but the request is closed. Check the response below.',
  stopped: 'Stopped',
  stoppedDetail: 'You stopped the request. DeckAgent keeps the completed part and does not continue automatically.',
  notFinished: 'Not complete · ',
  notFinishedSuffix: ' DeckAgent keeps the completed part and does not run the request again.',
  number: (value: string) => `Request ${value}`,
  publicResearch: 'The request lets DeckAgent search public sources through Tavily',
  model: (provider: string, model: string) => `Model: ${provider} / ${model}`,
  activities: (count: number) => counted(count, 'activity', 'activities'),
  noActivity: 'No activity recorded.',
  diagnostic: 'Technical details',
  errorCode: (code: string) => `Error code: ${code}`,
  openSettings: 'Open Model settings',
  retry: 'Put the request back in the input box',
  retryAsk: 'The input box has a draft. Click again to replace it with this request.',
  retryDone: 'The request is in the input box. Press Enter to send it.',
  approvalLabel: 'Give permission for a step',
  approvalTitle: 'Waiting for your permission',
  approvalStep: 'Step: read a file',
  allowOnce: 'Allow once',
  refuse: 'Refuse',
  approvalSaving: 'Saving the decision…',
  approvalFailed:
    'The result is not confirmed. Check the connection or the request status, then try again. You can still stop the request.',
} as const

export const conversationText = {
  newChat: 'New chat',
  wordmark: 'DeckAgent',
  welcomeChat: 'What do you want to discuss?',
  welcomeChatDetail: 'Send a message or add documents. Select Make deck above when you want to make a presentation.',
  welcomeDeck: 'Describe the deck that you want',
  welcomeDeckDetail:
    'Paste your notes or ideas. DeckAgent first proposes an Outline and a Brief. DeckAgent makes slides only after you confirm.',
  conversation: 'Conversation',
  working: 'Working',
  sendingState: 'Sending…',
  sending: 'Sending',
  navigationHint: 'The request continues when you open a different chat. Come back to this chat to see the progress.',
  recents: 'Recent',
  chatHistory: 'Chat history',
  hideList: 'Hide the chat list',
  showList: 'Show the chat list',
  settings: 'Settings',
  menuLabel: 'Settings and tools',
  menuNote: 'Runs on your computer',
  modelSettings: 'Model settings',
  theme: 'Theme',
  themeStale: 'The theme changed in a different place. DeckAgent applied the latest setting.',
  themeFailed: 'The theme selection was not saved. Try again.',
  reconnect: 'Connect again / read history',
  openDeck: 'Open deck',
  startGeneration: 'Try to start the deck',
  continueGeneration: 'Continue the deck',
  startGenerationTitle: 'Try to start with the confirmed Outline. This does not make a new confirmation.',
  continueInput: 'Continue and complete the missing slides.',
  skipInput: 'Skip the remaining questions. Keep the selected source limits.',
  inputPlaceholder: 'Type or paste your request…',
  inputLabel: 'Request text',
  send: 'Send request',
  sendTitle: 'Send request (Enter)',
  stop: 'Stop',
  stopLabel: 'Stop the request',
  summaryBoundary:
    'DeckAgent summarized the conversation above because it is longer than the model context. From here, the model reads the summary instead of the messages above. You can still read all of them.',
  unassignedTool: 'Tool result · request unknown',
  assistant: 'DeckAgent',
  user: 'You',
  interrupted: 'The answer is not complete',
  errorCode: (code: string) => `Error code: ${code}`,
  tooLong: 'The request is too long. Make the text shorter before you send it. DeckAgent keeps the draft.',
  sendOrRemoveFiles:
    'Send or remove the draft files before you continue the confirmed deck. DeckAgent keeps the draft.',
  sendBeforeSkip: 'Send your answer or the draft files before you skip the remaining questions.',
  unsentBeforeConfirm:
    'You have text or files that you did not send. Send a change request or delete the draft before you confirm the Outline on the screen.',
  confirmFailed:
    'The deck generation result is not confirmed. Check the connection and the current Outline before you try again. DeckAgent keeps the saved slides.',
  draftChanged:
    'The draft changed on a different screen. Keep the text that you are writing, and open the chat again to compare before you save or send.',
  draftNotSaved: 'DeckAgent did not save the draft. Check the connection. The text is still in the input box.',
  noProviders:
    'There are no providers. Add a provider and a model in Model settings to send requests. DeckAgent keeps the draft.',
  noModels: 'There are no models. Add a model in Model settings to send requests. DeckAgent keeps the draft.',
  removedModel: (model: string) =>
    `Model ${model} was removed, and this chat has no model now. Select a different model to send. DeckAgent does not select a model automatically.`,
  noModel: 'This chat has no selected model. Select a model to send requests. DeckAgent keeps the draft.',
} as const

export const modelPickerText = {
  choose: 'Select model',
  none: 'No model',
  selected: 'Selected model',
  manageOption: 'Add or manage models…',
  panel: 'Providers and models',
  providers: 'Providers',
  manage: 'Model settings',
  add: 'Add provider',
  running: 'The running request keeps the old model. The new selection applies to the next request.',
  noModelForProvider: 'This provider has no models. Open Settings to add a model ID.',
  noProvider: 'There are no providers. Click + to add a configuration.',
} as const

export const attachmentText = {
  reasons: {
    ATTACHMENT_UNREADABLE: 'The file cannot be read. Check the file, or give a version with text.',
    ATTACHMENT_TYPE_UNSUPPORTED: 'This file format is not supported.',
    ATTACHMENT_TOO_LARGE: 'The file is larger than 20 MiB. Make it smaller.',
    PARSING_LIMIT_EXCEEDED: 'The file is larger than the safe read limit. Divide the document into smaller parts.',
    UPLOAD_CANCELLED: 'The preparation stopped. Remove the file, then add it again if necessary.',
    ATTACHMENT_NOT_SAVED: 'The file was not saved. Check the local data, then try again.',
    HOST_BUSY: 'DeckAgent is preparing too many files. Try again later.',
  } as Readonly<Record<string, string>>,
  unusable: 'You cannot use this file. Remove the file, then try again.',
  preparing: 'Preparing',
  ready: 'Ready',
  partial: 'Ready · partly read',
  partialNote:
    'DeckAgent made a part smaller or could not read a part. The model uses only the part that the tool returns.',
  preview: 'Preview',
  remove: 'Remove file',
  saving: 'Saving the file to the draft…',
  picker: 'Select attachments',
  add: 'Attach files',
  addTitle: 'Add files · maximum 10 files, 20 MiB for each file',
  draftFiles: 'Draft files',
  previewNote: 'The preview has a limit. The file status shows the parts that DeckAgent did not read or made smaller.',
  closePreview: 'Close preview',
} as const

export const researchText = {
  choice: 'Search public sources',
  choiceTitle:
    'DeckAgent sends the search query to Tavily. The query can contain data from documents. Maximum 3 searches for each request, free plan only.',
  info: 'Source search details',
  notConfigured: 'Not set up',
  notConfiguredTitle: 'Public source search is not set up. Open the settings to connect Tavily.',
  settings: 'Search settings',
  sources: 'Found sources',
  heading: 'Public sources · Tavily',
  intro:
    'DeckAgent uses only the free plan. When the quota is used, research stops. DeckAgent sends the query to Tavily. DeckAgent does not send full files or the history. Keep the account on the Free plan, and turn off PAYG in the Tavily dashboard.',
  key: 'Tavily API key',
  save: 'Check and save the key',
  saved: 'DeckAgent checked and saved the key for the free account.',
  environment: 'Check the key from .env',
  environmentSaved:
    'The environment key is valid, and the account is free. DeckAgent does not copy the key to the database.',
  remove: 'Remove the research configuration',
  removed: 'Research is off. A request that started keeps the configuration that it had when you sent it.',
  close: 'Close',
  openNote: 'DeckAgent never shows a saved key again. To use .env, click Check the key from .env.',
  reading: 'Reading the sources of the chat…',
  found:
    'These are the actual passages that DeckAgent received. They are not full pages and do not confirm that the source is correct.',
  none: 'This chat has no saved research sources.',
  failed:
    'DeckAgent cannot connect to Tavily. Check the network, then try again. DeckAgent keeps the old configuration.',
  errors: {
    PREFERENCES_STALE:
      'The search settings changed in a different place. DeckAgent loaded the latest status. Check it, then try again.',
    RESEARCH_FREE_ONLY:
      'DeckAgent accepts only a free Tavily Researcher account, with no PAYG. Check the plan at Tavily.',
    RESEARCH_QUOTA_EXHAUSTED:
      'The free quota is used, or DeckAgent cannot verify the limit. Wait for new quota. DeckAgent does not upgrade automatically.',
    RESEARCH_KEY_REJECTED: 'Tavily refused the key. Check the key, then try again.',
    RESEARCH_KEY_UNAVAILABLE:
      'The key cannot be read. Add TAVILY_API_KEY to .env and start DeckAgent again, or save the key here.',
    RESEARCH_NOT_SAVED: 'The key was not saved. Check the credential store, or use an environment variable.',
  } as Readonly<Record<string, string>>,
} as const

/** The text of the deck screens: the Brief workflow, the Outline proposals, the published deck and the sample deck. */
export const deckText = {
  workflow: {
    label: 'Prepare the deck',
    mode: 'Conversation mode',
    chatMode: 'Normal chat',
    deckMode: 'Make deck',
    material: 'Use the chat documents',
    knowledge: 'Use the general knowledge of the model',
    research: 'Search public sources (free only)',
    researchTitle:
      'DeckAgent sends the query to Tavily. The query can contain data from documents. DeckAgent uses only free quota.',
    images: 'Image options',
    imagesTitle:
      'DeckAgent sends the image query to the source that you select. Tavily uses the key and the free quota. This option does not turn on text source search.',
    imageOptions: [
      ['', 'Keep the current image request'],
      ['none', 'No images'],
      ['attachments', 'Use the attached images'],
      ['public-research', 'Search web images · Tavily · free only'],
      ['commons', 'Search web images · Wikimedia Commons'],
    ],
    format: 'Deck format',
    formatOptions: [
      ['', 'Keep the current format request'],
      ['html', 'HTML · HTML Basic · DeckAgent Neutral'],
    ],
    action: 'Outline request type',
    actionOptions: [
      ['revise', 'Answer / ask for Outline changes'],
      ['question', 'Only ask about the Outline'],
      ['clarify', 'Clarify the request'],
    ],
    questions: 'Open questions',
    blockers: 'Items to resolve',
    skip: 'Skip the remaining questions',
    lockedSummary: 'The Brief is locked for this deck',
    summary: 'Current Brief and assumptions',
    currentSummary: (version: number) => `Current Brief · v${version} and assumptions`,
  },
  inputHints: {
    chat: 'Type your message…',
    collect: 'Describe the deck or answer the questions above…',
    question: 'Type a question about the Outline. The Outline does not change…',
    clarify: 'Clarify the request before you change the Outline…',
    revise: 'Describe the changes that you want for the current Outline…',
  },
  brief: {
    fields: {
      topic: 'Topic',
      audience: 'Audience',
      duration: 'Duration',
      durationMinutes: 'Duration (minutes)',
      purpose: 'Purpose',
      language: 'Language',
      images: 'Images',
      format: 'Format',
      requestedFormat: 'Requested format',
      generationFormat: 'Slide generation format',
      template: 'Template',
      'design-system': 'Design System',
      designSystem: 'Design System',
      proposedSlideCount: 'Planned slide count',
      sources: 'Sources',
      requirements: 'Requirements',
      assumptions: 'Assumptions',
      answers: 'Answers',
      themeOverrides: 'Theme changes',
    } as Readonly<Record<string, string>>,
    sourceKinds: {
      attachment: 'Attachment',
      'project-file': 'Project file',
      'approved-file': 'Approved file',
      research: 'Public source',
    },
    sourceReferences: (count: number) => `Saved source references (${count})`,
    sourceReference: (kind: string, sourceId: string, version: number) => `${kind} · ${sourceId} · v${version}`,
    boundTitle: (version: number) => `Brief of proposal v${version}`,
    presenterNotes: 'Presenter notes: requested.',
    field: (label: string, value: string | number) => `${label}: ${value}`,
    requirement: (value: string) => `Requirement: ${value}`,
    assumption: (value: string) => `Assumption: ${value}`,
    material: 'chat documents',
    modelKnowledge: 'general knowledge of the model',
    publicResearch: 'public source search',
    allowedSources: (sources: string) => `Allowed sources: ${sources || 'None selected'}.`,
    imageModes: {
      none: 'No images',
      attachments: 'Use attached images',
      unavailable: 'Image request not met',
    },
    webImages: (provider: 'commons' | 'tavily') =>
      `Web images from ${provider === 'commons' ? 'Wikimedia Commons' : 'Tavily · free only'}. DeckAgent sends the image query to this service.`,
    webImagesUnknown:
      'Web images. See the source that DeckAgent saved with each image. This Brief version does not record the image search service.',
    images: (text: string) => `Images: ${text}`,
    design: (template: string, designSystem: string) => `Template: ${template} · Design System: ${designSystem}`,
    templateNames: { 'html-basic': 'HTML Basic' } as Readonly<Record<string, string>>,
    designSystemNames: { 'deckagent-neutral': 'DeckAgent Neutral' } as Readonly<Record<string, string>>,
    technical: 'Theme and version details',
    versions: (template: string, templateVersion: string, system: string, systemVersion: string) =>
      `${template}@${templateVersion} · ${system}@${systemVersion}`,
    unmetImage: (need: string) => `Image not met: ${need}`,
  },
  outline: {
    label: 'Proposed Outline',
    heading: 'Outline proposal',
    content: 'Planned content',
    expand: 'Show details',
    collapse: 'Collapse',
    confirm: 'Confirm the outline and make slides',
    revise: 'Ask for outline changes',
    view: 'See the Outline to confirm',
    cancel: 'Cancel the outline',
    target: (version: number, slides: number, briefVersion?: number) =>
      `Outline v${version} · ${counted(slides, 'slide', 'slides')}${briefVersion === undefined ? '' : ` · Brief v${briefVersion}`}`,
    noSlidesYet: 'DeckAgent makes no slides until you confirm.',
    orType: 'Or type the changes that you want in the box below.',
    confirmed: 'Confirmed · read-only',
    layoutBlocked: 'You cannot confirm yet · change the content to fit the layout',
    imagesBlocked: (count: number) => `You cannot confirm yet · required images not ready: ${count}`,
    waiting: 'Current · waiting for your confirmation',
    cancelled: 'Cancelled',
    superseded: 'Old proposal · no longer current',
    layoutFields: { title: 'Title', caption: 'Image caption', content: 'Content' },
    layoutLimit: (slide: number, field: string, actual: number, limit: number) =>
      `Slide ${slide} · ${field}: ${actual} characters, maximum ${limit}. Ask for outline changes to make the text shorter and keep the main points.`,
    layoutMismatch: (slide: number) =>
      `Slide ${slide} · The content does not fit the layout. Ask for outline changes to arrange the content again and keep the selected requirements.`,
    slideTitle: (index: number, title: string) => `${index}. ${title}`,
    attachedImage: (caption?: string) => `Attached image${caption ? `: ${caption}` : ''}`,
    webImage: (query: string, required: boolean) => `Web image: ${query}${required ? ' (required)' : ' (optional)'}`,
    metric: (value: string, label: string) => `${value}: ${label}`,
    summary: (slides: number, briefVersion: number) => `${counted(slides, 'slide', 'slides')} · Brief v${briefVersion}`,
    suggestion: (text: string) => `Suggested change: ${text}`,
    changes: (added: number, removed: number, changed: number, reordered: boolean, fields: string) =>
      `Changes: ${added} new slides, ${removed} removed slides, ${changed} changed slides. ${reordered ? 'New order.' : ''} Brief: ${fields || 'no change'}.`,
    allChanges: 'All changes of the proposal',
    changeKinds: { added: 'Added', removed: 'Removed', changed: 'Changed' },
    change: (kind: string, title: string) => `${kind}: ${title}`,
    overviewChanges: (overview: boolean, suggestions: boolean) =>
      `Overview: ${overview ? 'changed' : 'no change'} · Suggested changes: ${suggestions ? 'changed' : 'no change'}`,
  },
  images: {
    prepared: 'Prepared images · review them before DeckAgent makes slides',
    requiredNote: ' The image is necessary before you confirm.',
    optionalNote: ' The slide will not show this image.',
    reason: (text: string) => `Reason for selection: ${text}`,
    unverified: 'This check uses the source description. The model did not do a visual check.',
    credit: (author: string, license: string) => `${author} · ${license}`,
    source: 'See the source page',
    license: 'Image usage conditions',
    audit: (count: number) => `Image check history (${counted(count, 'check', 'checks')})`,
    check: (host: string, text: string, status?: number) => `${host}: ${text}${status ? ` (HTTP ${status})` : ''}`,
    unreadable: 'The saved image cannot be read. Change the Outline to select the image again.',
    replace: 'Find a different image',
    replaceRequest: (slide: number, title: string, position: number) =>
      `Replace the image on slide ${slide} “${title}”, image position ${position}. Keep the content and the other positions. Set replace:true for this position and find a different image that fits the role.`,
    failures: {
      RESEARCH_IMAGE_LICENSE_REQUIRED: 'DeckAgent cannot verify a license that permits use of the image.',
      RESEARCH_IMAGE_LICENSE_UNSUPPORTED: 'The image license is not supported for this deck.',
      RESEARCH_IMAGE_AUTHOR_REQUIRED: 'The image requires credit, but the author is unknown.',
      IMAGE_PREPARED: 'The image is ready.',
      RESEARCH_IMAGE_SOURCE_UNRESOLVED: 'DeckAgent did not find the source page of the image.',
      RESEARCH_IMAGE_SOURCE_BLOCKED: 'The website blocked access to the image source check.',
      RESEARCH_IMAGE_SOURCE_HTTP: 'The image source page returned an HTTP error.',
      RESEARCH_IMAGE_NETWORK: 'DeckAgent cannot connect to the image source.',
      RESEARCH_IMAGE_RESPONSE_TOO_LARGE: 'The image source data is larger than the download limit.',
      RESEARCH_IMAGE_CONTENT_TYPE: 'The source returned an unsupported format.',
      RESEARCH_IMAGE_TIMEOUT: 'The image check or download took too long.',
      RESEARCH_IMAGE_NORMALIZATION_LIMIT:
        'The image is larger than the processing limit. Select a smaller version or a different image.',
      RESEARCH_IMAGE_DECODE_FAILED: 'The downloaded image data cannot be read. Select a different image.',
      RESEARCH_IMAGE_SELECTION_BUSY:
        'DeckAgent is selecting an image for this position. Wait until the current turn is complete.',
      RESEARCH_IMAGE_SELECTION_STALE: 'The image request changed. Select from the new search results.',
      RESEARCH_IMAGE_DUPLICATE: 'The image is the same as the image at a different position. Select a different image.',
      RESEARCH_IMAGE_NO_MATCH: 'DeckAgent did not find an image that matches the request.',
      RESEARCH_IMAGE_SELECTION_REQUIRED: 'DeckAgent did not select a suitable image.',
      RESEARCH_IMAGE_BUDGET: 'This request reached its image search or selection limit.',
      RESEARCH_KEY_UNAVAILABLE: 'There is no Tavily API key. Add a key in Settings, or select the Commons source.',
      RESEARCH_QUOTA_EXHAUSTED:
        'The Tavily free quota is used. Change the source, or try again when quota is available.',
      RESEARCH_FREE_ONLY: 'The Tavily configuration does not meet the free-only mode.',
      RESEARCH_KEY_REJECTED: 'Tavily refused the API key. Check the key in Settings.',
      RESEARCH_UNAVAILABLE:
        'DeckAgent cannot connect to Tavily. Check the configuration and the connection, or select the Commons source.',
    } as Readonly<Record<string, string>>,
    failure: 'The image is not ready. Change the query, or give an attached image.',
  },
  canvas: {
    label: 'Slide deck',
    title: 'Slide deck',
    present: 'Present',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    restart: 'Go to start',
    restartTitle: 'Go to the first slide (R)',
    restartKey: 'R',
    exit: 'Exit',
    slides: 'Slide list',
    navigation: 'Slide navigation',
    frame: 'Saved slide',
    noDeck: 'This chat has no confirmed deck',
    loading: 'Loading the deck',
    progress: (published: number, total: number, generation: string) =>
      `${published}/${total} slides saved${generation}`,
    generation: {
      pending: ' · Confirmed, not scheduled',
      admitted: ' · Making',
      generating: ' · Making',
      generated: ' · Complete',
      incomplete: ' · Not complete, does not continue automatically',
    },
    design: (template: string, designSystem: string, locked: boolean) =>
      `HTML · ${template} · ${designSystem}${locked ? ' · Locked' : ''}`,
    connection: {
      connecting: 'Connecting',
      live: 'Connected',
      reconnecting: 'Connecting again — showing the last saved version',
      error: 'The deck did not load. Connect again.',
    },
    slideState: (pending: boolean, revision: number) => (pending ? 'Not complete' : `Version ${revision}`),
    slideLabel: (number: number, title: string, state: string) => `${number}. ${title} · ${state}`,
    slideShort: (number: number, pending: boolean) => `${number} · ${pending ? 'pending' : 'done'}`,
    position: (index: number, total: number) => `${index} / ${total}`,
    caption: (number: number, total: number, state: string) => `Slide ${number}/${total} · ${state}`,
    pendingSlide: 'This slide is not complete. The completed content will show here after DeckAgent saves it.',
    loadFailed: 'The saved slide did not load. Connect again.',
    loadingSlide: 'Loading the saved slide…',
    noFullscreen: 'The browser does not support full-screen presentation',
  },
  sample: {
    label: 'Sample deck',
    close: 'Close deck',
    frame: 'Sample slide',
    caption: (number: number) => `Slide ${number}/3 · Sample content`,
    fullscreen: 'Full screen',
    noFullscreen: 'The browser does not support full screen',
  },
  resizer: {
    label: 'Resize the slide deck',
    title: 'Drag to resize presentation; use Left and Right arrow keys',
    value: (width: number) => `${width} pixels`,
  },
} as const
