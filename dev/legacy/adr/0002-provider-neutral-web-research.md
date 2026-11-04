---
status: proposed
---

# Separate web research tools from Search and Fetch providers

DeckAgent will expose Search and Fetch as model-callable capabilities while keeping the selected provider behind a separate service boundary. This follows the DeepSeek Harness web capability pattern and avoids binding Agent Runtime to one vendor. The Product Owner approved the direction; package reuse and external service selection still need compatibility and security review.

## Consequences

- `web_search` and `web_fetch` have distinct operations and can use different providers.
- A provider adapter returns normalized sources and structured errors; replacing it does not change the Agent's tool names.
- A missing or invalid provider does not cause silent fallback to another provider.
- A public research provider is not enabled until approved for external connections.
- Search must not send private content from requests, conversations, attachments, project files or decks.
- The DeepSeek reference's option to send the original question must be disabled for DeckAgent public research.
- HTTP Fetch needs network destination restrictions, including loopback and private-network addresses.
- Direct import of DeepSeek packages remains a technical proposal until dependency and integration tests are completed.

## Reference

https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web.md
