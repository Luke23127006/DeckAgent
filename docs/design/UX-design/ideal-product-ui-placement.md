# Ideal Product — UI Placement Reference

## Purpose

Locate product controls without putting widget, position or gesture details into the behavior specification. DeepSeek Harness is a reference, not a mandatory layout template. DeckAgent keeps its deck canvas.

## Selected placement

| Feature | Entry point | Main location | Key interaction |
|---|---|---|---|
| Workspace and Chat History | Left navigation | Workspace groups with Chat rows | A new Chat uses the selected Workspace. Running and waiting Chats show their state on their row. |
| Provider and Models | Settings / Models; model selector in request area | Settings for setup; Composer for selection | Reasoning choices follow the selected model. Changing choice does not interrupt the active request. |
| Chat Frame | Conversation Composer | Request area | Request text, attachments and file references remain together until sent. |
| Chat Lifecycle | Chat rows in left navigation | Left navigation and open Conversation | Switching Chat does not cancel a running request in another Chat. |
| Agent Permissions | Permission selector in Composer; default in Settings | Composer and Chat-scoped approval | Pending approval is presented within that Chat's Conversation/Composer. The user sees scope before choosing. |
| Request Lifecycle and Activity Log | Conversation | Inline request activity | Activities remain attached to the correct request; detail opens in context. |
| Sources and Attachments | Composer attachments and references | Request area; right-side preview when needed | File validation states stay visible. Preview does not move or send the original. |
| Web Research configuration | Settings / Tools / Web Research | Settings | Select Search and Fetch providers separately. Credentials stay hidden. |
| Context Usage and Compact | Small context indicator near/below Composer | Composer, with an on-demand detail surface | Show estimate/reported status. Compact is user-triggered and the warning does not start it. |
| Deck Canvas | Open deck in the right-side work area | Dedicated Deck Canvas | A file preview must not replace or destroy the deck state. |

## Interaction states to cover in UI design

- Idle, running, awaiting user answer, awaiting permission approval, completed, failed and cancelled request.
- Attachment preparing, ready, rejected and removed.
- Project folder missing or moved; unreadable file reference.
- Provider/model configuration missing, invalid or unavailable.
- Context percentage known, estimated or unavailable.
- Mobile/narrow layout without losing active Chat and draft data.

## Reference locations

- DeepSeek UI Workspace: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-workspace
- DeepSeek UI Model Selection: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-model-selection
- DeepSeek UI Permission Presets: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-permission-presets
- DeepSeek UI Approval: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-approval
- DeepSeek UI Attachments: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-attachment
- DeepSeek Web Search Settings: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-settings-web-search
- DeepSeek Context Meter: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/src/client/skeleton/ContextMeter.tsx

## Boundary

UI placement explains where a product behavior is reached and presented. UC and FR files remain responsible for the behavior and expected response, not layout.
