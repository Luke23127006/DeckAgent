---
id: CS-01
product: Claude Slide Design
flow: "Generate an initial draft deck from the start screen"
status: Draft          # Draft = planned, nothing recorded yet | Recorded
recorded_on: ""
account_or_plan: ""    # which plan or account type was used, because limits may differ by plan
media: []              # files under docs/research/use-cases/media/, named CS-01-<what>.mp4 or .gif
---

This card is evidence. It does not name any use case, requirement or rule; those cite this card. Anything the product showed goes here as exact wording and values. Do not interpret it as a requirement.

## Goal of the recording

Start from an empty presentation and get a first draft deck. Record the happy path once, then trigger each branch below on purpose.

## Already observed from static screenshots

| Element | Where | What is visible | Image |
|---|---|---|---|
| Headline | Chat panel, empty state | "Paste your ideas and turn them into slides" | [start.png](ui/images/start.png) |
| Design system dropdown | Above the request box | "Choose design system…" with nothing selected | [start.png](ui/images/start.png) |
| Request box | Bottom of the chat panel | "Reply" placeholder and a send control | [start.png](ui/images/start.png) |
| Controls under the box | Bottom left | `+`, microphone, waveform with a chevron | [start.png](ui/images/start.png) |
| Labels under the box | Bottom right | "Sonnet 5.5", "High", "Manual" | [start.png](ui/images/start.png) |
| Canvas empty state | Right panel | "This presentation has no slides yet. Add one, or let Claude add some." and an Add slide button | [start.png](ui/images/start.png) |
| `+` menu | Opens upward from `+` | Add files or photos (with a keyboard shortcut), Skills, Connectors, Design system, Plugins, Research. All but the first and last show a chevron | [add-files-connectors-and-more.png](ui/images/add-files-connectors-and-more.png) |
| Connectors submenu | Opens from Connectors in the `+` menu | "Add connector" (opens "Browse connectors" and "Add custom connector"), "Manage connectors", three connected services each with an on/off toggle (Atlassian Rovo, Google Drive, Claude in Chrome), "Add from Atlassian Rovo", "Add from Google Drive", "Tool access" | [connectors.png](ui/images/connectors.png) |

## Steps observed

Fill the right column while recording. The left column is only a reminder of what to do.

| # | Planned action | What the product showed (exact) | Media and time |
|---|---|---|---|
| 1 | Type or paste a few ideas into the request box | | |
| 2 | Send | | |
| 3 | Wait and watch the canvas | | |
| 4 | Look at the finished draft and the chat | | |

## Branches to trigger

Write "not offered" when a control does not exist. Do not skip a row silently.

| ID | What to do | What the product detected and showed | Media and time |
|---|---|---|---|
| B1 | Paste a very long text | | |
| B2 | Press the microphone, speak a short request, and describe what appears | | |
| B3 | Press the waveform control and describe what it starts | | |
| B4 | Attach one document through Add files or photos, then send | | |
| B5 | Attach a photo, then send | | |
| B6 | Attach several files at once | | |
| B7 | Attach an unsupported file type | | |
| B8 | Attach a very large file | | |
| B9 | Open Connectors and describe its submenu | | |
| B10 | Open Skills, Plugins and Research and describe each submenu | | |
| B11 | Open the design system dropdown, and the Design system entry in the `+` menu. Describe what each offers, and pick one before sending | | |
| B12 | Send with nothing typed | | |
| B13 | Send a vague one-line request | | |
| B14 | Send a request in a non-Latin script, or in a language other than the interface's | | |
| B15 | Press stop, or equivalent, during the wait | | |
| B16 | Reload the page during the wait | | |
| B17 | Go offline during the wait, then come back | | |
| B18 | Send a second message while the first is still running | | |

## Limits and messages shown

Copy every limit, quota, error or warning exactly as shown. These are the evidence a rule is written from later.

| Where it appeared | Exact wording or value | Media and time |
|---|---|---|
| | | |

## Waits and persistence

| Measure | Result |
|---|---|
| Time from send to the first sign that work started | |
| Time from send to the first slide | |
| Time from send to the finished draft | |
| What the user sees while waiting | |
| After a reload mid-wait: what is kept and what is lost | |
| After leaving and returning: what is kept and what is lost | |

## Surprises and questions

Seed questions from the screenshots:

1. Does the microphone dictate into the request box, or does the waveform control start a voice conversation?
2. What do "Manual", "High" and the model name control?
3. Does the product ask clarifying questions before generating, and can the user skip them?
4. Do Skills, Plugins and Research change what the first draft contains?

Add anything the product did that was not expected.
