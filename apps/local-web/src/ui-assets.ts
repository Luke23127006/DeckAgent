export const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DeckAgent — Agent connection</title><link rel="stylesheet" href="/style.css"></head>
<body><main id="app"><header><h1>DeckAgent</h1><p>Agent connection · Workspace file tools</p></header>
<section data-slot="request" aria-label="Request"></section><section data-slot="status" aria-label="Status"></section>
<section data-slot="history" aria-label="History"></section></main><script type="module" src="/client/boot.js"></script></body></html>`

export const style = `:root{font-family:system-ui,sans-serif;color:#162c30;background:#f3f6f4}body{margin:0}
main{max-width:900px;margin:48px auto;padding:24px}header{border-bottom:1px solid #bdcfca;margin-bottom:24px}
h1{font-size:32px}form{display:grid;gap:14px}input,textarea,button{font:inherit;padding:12px;border:1px solid #94aaa4;border-radius:6px}
textarea{min-height:140px;resize:vertical}button{cursor:pointer;color:white;background:#155e51}button:disabled{opacity:.5}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:18px;border-radius:6px;min-height:100px}
[role=status]{font-weight:600}@media(max-width:600px){main{margin:0;padding:18px}}`
