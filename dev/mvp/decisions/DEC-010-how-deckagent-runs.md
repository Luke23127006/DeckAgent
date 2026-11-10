---
id: DEC-010
title: "How DeckAgent runs on the user's computer: a local server with a browser, or a desktop app"
date: 08-11-2026
status: decided
research: "RQ-1 in dev/mvp/builds/UC-013-workspaces-new-chat/research/research-checklist.md"
affects: "FR-071, FR-083"
---

## Question

**How does DeckAgent run** on the user's computer, and **how does the user choose a folder** for a workspace (RQ-1, ticket [#49](https://github.com/Luke23127006/DeckAgent/issues/49))? The glossary says **reloading or closing the interface does not stop DeckAgent**, so the **interface is apart from the program**. A **browser does not give a folder path** to a server: it gives only a **handle**. The first build **carries the walking skeleton ticket**, so this choice **shapes every later build**.

**Evidence:** the OpenCode reference at `5bd9c17` is a **Node server with a browser**, where the user **types the folder path** ([workspace-view.ts:137](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/client/runtime/src/workspace-view.ts#L137)). open-design's desktop app **opens the folder dialog of the operating system** in its main process, then **gives a token** to its daemon ([open-design-earlier-work.md](../research/open-design-earlier-work.md) item 8).

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Local server, browser, typed path | A Node server runs on the computer; the user opens the interface in a browser and **types or pastes the folder path**, as in the reference | FR-071, FR-083; the glossary's interface apart from the program | **Simplest**, already done once in the reference. The user **must find and paste a path**; a typo is reported as a folder that cannot be read |
| B · Local server, browser, dialog opened by the server | As A, but the server **opens the Windows folder dialog** when the user asks to choose a folder | As A | **Choosing is easy**. The dialog **comes from a background process** and may **open behind the browser window** `[assumed]`; it works **only when the browser runs on the same computer** |
| C · Desktop app around the interface | A desktop shell (for example Electron or Tauri) shows the interface and **opens the folder dialog**; the server **keeps running when the window closes** | As A, when closing the window does not stop the server | **Standard folder dialog**, like open-design. **One more layer** to package, build and test |

## Choice

**A · Local server, browser, typed path.**

## Why

Like the **DeepSeek harness**: **easy to code and easy to use**. DeckAgent is headed toward an **open-source** product, and a **local server with a browser** fits that direction.

## Rejected options and why

- **B · Dialog opened by the server:** the dialog **may open behind the browser**, and the server needs a **PowerShell call** to open it; it can come later as a **light build** because it gives the server **the same path string**.
- **C · Desktop app:** **one more layer** to package, build and test, which this choice avoids.

## Consequences

- The workspace field **takes a typed or pasted path**; a wrong path is reported as a **folder that cannot be read**, with what the user can do next (FR-071, FR-083).
- The **walking skeleton** is a **Node server opened in a browser**.
- The server receives **a path string** in every option, so a **folder dialog added later** changes **only the input field**.
