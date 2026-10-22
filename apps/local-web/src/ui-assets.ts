export const activityStyle = `
.request-record[data-tool-errors=true]{border-color:#d8bc87;background:#fffaf0}
.request-record[data-status=failed]{border-color:#d8aaa6;background:#fff9f7}
.request-record[data-status=cancelled],.request-record[data-status=unknown]{border-color:#d2c6b4}
.request-record[data-tool-errors=true] .request-state{color:#835b23}
.request-record[data-status=failed] .request-state{color:#9b3e2f}
.request-feedback{line-height:1.6;margin:0 0 10px;color:#52654e}
.request-diagnostic{font-size:11px;color:#788271;margin:0 0 10px}
.activity-output{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;max-height:240px;overflow:auto;font:11px/1.5 ui-monospace,Consolas,monospace;background:#fff;border:1px solid #e0e6d9;border-radius:6px;padding:10px;margin:10px 0 0}
.request-recovery-details{margin:8px 0 12px}
.request-recovery-details summary,.unassigned-tool-output summary{cursor:pointer;font-size:12px;color:#66735d}
.unassigned-tool-output{padding:8px 12px;border:1px solid #e0e6d9;border-radius:8px;background:#f5f7f1}
`

export const presentationStyle = `
.published-deck-sidebar{padding:0;background:#f8f9f7}
.published-deck-sidebar .deck-panel{display:flex;flex-direction:column;overflow:auto;min-height:0}
.published-deck-sidebar .deck-panel>header{padding:14px 18px;min-height:64px;margin:0;border-bottom:1px solid #e1e7de;flex-shrink:0}
.published-deck-sidebar .deck-heading{min-width:0}
.published-deck-sidebar .deck-heading h2{font-size:15px;letter-spacing:0;text-transform:none;color:#294037}
.deck-progress{display:block;color:#69766a;font-size:11px;margin-top:4px}
.deck-stage{flex:1 0 180px;min-height:180px;display:grid;place-items:center;padding:18px;min-width:0}
.published-deck-sidebar .deck-stage iframe{width:100%;max-height:100%;border-radius:4px;background:#fff;border:1px solid #cbd5c9;box-shadow:0 4px 18px #183a3211}
.deck-placeholder{width:100%;aspect-ratio:16/9;display:grid;place-items:center;text-align:center;padding:24px;border:1px dashed #adbaab;border-radius:4px;color:#6c776c;background:#fafbf9;line-height:1.6}
.deck-placeholder[hidden]{display:none}
.published-deck-sidebar .deck-controls{flex-shrink:0;align-items:center;justify-content:space-between;margin:0;padding:0 18px 12px;gap:8px}
.published-deck-sidebar .deck-controls button{font-size:12px;padding:7px 9px}
.published-deck-sidebar .slide-caption{flex:1;min-width:90px;text-align:center;margin:0;font-size:11px}
.published-deck-sidebar .deck-slide-list{display:flex;flex-shrink:0;gap:8px;margin:0;padding:10px 18px 14px;overflow-x:auto;max-height:100px;border-top:1px solid #e1e7de;align-items:stretch;scrollbar-width:thin}
.published-deck-sidebar .deck-slide-list button{flex:0 0 136px;min-width:0;max-width:136px;min-height:56px;padding:8px 10px;font-size:11px;line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow-wrap:anywhere;background:#fff}
.published-deck-sidebar .deck-slide-list button[data-status=pending]{border-style:dashed;color:#788578}
.published-deck-sidebar .deck-slide-list button[aria-current=true]{border-color:#295d46;box-shadow:inset 0 0 0 1px #295d46;background:#edf2e4}
.published-deck-sidebar .deck-footer{padding:10px 18px;border-top:1px solid #e1e7de;color:#788578;font-size:11px;flex-shrink:0}
.deck-footer p{margin:0;line-height:1.5}
.deck-footer .deck-connection{margin-top:4px;font-size:10px}
.published-deck-sidebar .deck-panel:fullscreen{padding:0;display:flex;align-content:normal}
.published-deck-sidebar .deck-panel:fullscreen .deck-stage iframe,.published-deck-sidebar .deck-panel:fullscreen .deck-placeholder{width:min(100%,1100px);max-height:65vh}
@media(max-width:720px){.published-deck-sidebar .deck-panel{min-height:480px}.deck-stage{flex-basis:auto}}
`

export const composerStyle = `
.conversation{padding:0;gap:0}
.conversation-header{min-height:64px;padding:12px 22px;border-bottom:1px solid #ebeeea;flex-shrink:0}
.chat-heading{min-width:0;flex:1}
.conversation-header h1{font-size:16px;letter-spacing:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-state{display:block;color:#758074;font-size:11px;margin-top:4px}
.chat-heading-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.chat-heading-actions button{font-size:12px;padding:7px 10px}
.chat-more-actions{position:relative}
.chat-more-actions>summary{cursor:pointer;list-style:none;border-radius:8px;padding:2px 10px;font-size:22px}
.chat-more-actions>summary::-webkit-details-marker{display:none}
.chat-more-actions[open]>button{position:absolute;right:0;top:100%;z-index:4;width:190px;background:#fff;box-shadow:0 6px 18px #163d2520}
.conversation>.request-status{margin:12px 22px 0;flex-shrink:0}
.messages{padding:24px 30px;gap:15px}
.messages[hidden],.welcome[hidden],.composer button[hidden],.chat-heading-actions button[hidden]{display:none}
.welcome{flex:1;min-height:120px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:28px;color:#647067}
.welcome h2{font-family:Georgia,serif;font-size:30px;font-weight:400;letter-spacing:0;text-transform:none;color:#203b31;max-width:560px}
.welcome p{max-width:480px;line-height:1.6;margin-bottom:0}
.conversation>.composer{margin:0 22px 18px;gap:8px;border-radius:18px;box-shadow:0 3px 16px #163d2510}
.composer textarea{min-height:58px;max-height:150px;resize:none;padding:4px;line-height:1.5;overflow-y:auto}
.composer-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px}
.composer-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.composer-model{flex:1 1 120px;max-width:240px;min-width:0}
.composer-model>span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.composer-model select{padding:7px 8px;background:#f0f3ef;border:0;min-width:0;width:100%;font-size:12px;text-overflow:ellipsis}
.composer-controls button{font-size:11px;padding:7px 9px;background:transparent;color:#42634d;border-color:#d6dfd1;white-space:nowrap}
.composer-primary{display:flex;align-items:center;justify-content:flex-end}
.composer-primary button{width:34px;height:34px;border:0;border-radius:50%;padding:0;font-size:20px;background:#285947;color:#fff}
.composer-primary .stop-action{background:#9a514a;font-size:14px}
.developer-tools{font-size:11px;color:#69766a}
.developer-tools summary{cursor:pointer;padding:5px 0}
.developer-tools button{font-size:11px;padding:6px 8px;margin-top:6px}
@media(max-width:1000px){.conversation{padding:0}}
@media(max-width:720px){.conversation{padding:0}.conversation-header{padding:12px 16px}.messages{padding:16px}.conversation>.composer{margin:0 12px 12px}.welcome{padding:22px 16px}.welcome h2{font-size:26px}}
`

export const deckResizeStyle = `
.deck-sidebar{position:relative;overflow:hidden}
.deck-sidebar .deck-panel{height:100%;overflow:auto}
.deck-resizer{position:absolute;inset:0 auto 0 0;width:10px;cursor:col-resize;touch-action:none;z-index:2}
.deck-resizer::after{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:transparent;transition:background .15s}
.deck-resizer:hover::after,.deck-resizer:focus-visible::after{background:#839f78}
.deck-resizer:focus-visible{outline:2px solid #315b3e;outline-offset:-2px}
.deck-resize-overlay{position:fixed;inset:0;z-index:10000;cursor:col-resize;touch-action:none;user-select:none}
@media(max-width:720px){.deck-resizer{display:none}.deck-sidebar .deck-panel{height:auto;overflow:visible}}
`

export const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DeckAgent</title><link rel="stylesheet" href="/style.css"></head>
<body><main id="app"><section data-slot="request"><h1>DeckAgent</h1><p>Opening your workspace…</p></section></main>
<script type="module" src="/client/boot.js"></script></body></html>`

export const style = `:root{font-family:system-ui,-apple-system,sans-serif;color:#213a34;background:#fafbf8;font-size:14px}*{box-sizing:border-box}body{margin:0}button,input,textarea,select{font:inherit}button{cursor:pointer;border:1px solid #d1dbd3;border-radius:8px;background:#fff;color:#24473a;padding:10px 14px}button:hover{background:#edf2e8}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #8bac68;outline-offset:2px}input,textarea,select{border:1px solid #c8d4c8;border-radius:8px;padding:10px;background:#fff;color:inherit;max-width:100%}label{display:grid;gap:7px;font-size:12px;color:#607369}h1,h2,p{margin-top:0}h1{font-size:25px;font-weight:550;letter-spacing:-.6px}h2{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#738275}#app{display:flex;min-height:100vh}.chat-navigation{width:230px;flex-shrink:0;padding:28px 18px;background:#f0f3eb;border-right:1px solid #dfe5d9;display:flex;flex-direction:column;gap:20px;height:100dvh}.wordmark{font-size:23px;font-weight:650;letter-spacing:-1px}.chat-navigation nav{display:grid;align-content:start;gap:6px;flex:1;overflow:auto}.chat-navigation nav button{text-align:left;font-size:12px;overflow-wrap:anywhere;border-color:transparent;background:transparent}.chat-navigation nav button[aria-current=true]{background:#dfe9d3;color:#1e4932}.conversation{flex:1;min-width:320px;max-width:1000px;padding:34px clamp(18px,4vw,64px);margin:0 auto;display:flex;flex-direction:column;gap:18px;height:100dvh;overflow:hidden}.conversation-header{display:flex;align-items:center;justify-content:space-between;gap:16px}.conversation-header h1{margin:0}.conversation>label{max-width:400px}.request-status{font-size:12px;margin:0;color:#637764;min-height:18px}#reconnect{align-self:flex-start;font-size:11px;padding:5px 9px;background:transparent}.messages{flex:1;display:flex;flex-direction:column;gap:22px;min-height:80px;overflow:auto}.message{max-width:95%;padding:18px 20px;line-height:1.65;border-radius:12px;background:#fff;border:1px solid #e3e8dd}.message small{display:block;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#6d7d6a;margin-bottom:7px}.message p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.message.user{align-self:flex-end;background:#edf2e4;border-color:#e0e8d4}.message.tool{font-size:12px;color:#6a7568}.request-record{flex-shrink:0;max-width:100%;padding:8px 12px;border:1px solid #e0e6d9;border-radius:8px;color:#60705e;background:#f5f7f1;font-size:12px}.request-record>summary{cursor:pointer;line-height:20px;list-style-position:inside;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.request-record[open]>summary{margin-bottom:12px}.request-record[data-status=running] .request-state{color:#315b3e}.request-record[data-status=failed] .request-state{color:#9b3e2f}.activity-count,.request-model{color:#788271}.request-model{font-size:11px;margin-bottom:12px;overflow-wrap:anywhere}.activity-list{padding-left:12px;border-left:1px solid #dbe2d4}.activity-detail{padding:6px 0}.activity-detail summary{cursor:pointer}.activity-detail p{margin:10px 0 0;overflow-wrap:anywhere}.composer{display:grid;gap:10px;padding:12px;background:#fff;border:1px solid #c9d5c2;border-radius:14px;box-shadow:0 5px 20px #243c1b08;flex-shrink:0}.composer textarea{border:0;min-height:95px;resize:vertical;width:100%}.composer button{justify-self:end;background:#274d39;color:#fff;border-color:#274d39}.deck-sidebar{flex-shrink:0;max-width:70vw;background:#e9eee3;border-left:1px solid #d2ddc7;padding:20px;overflow:auto;height:100dvh}.deck-sidebar[hidden]{display:none}.deck-panel header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}.deck-panel h2{margin:0}.deck-slide-list{display:grid;gap:6px;margin-bottom:12px}.deck-slide-list button{text-align:left;white-space:normal}.deck-slide-list button[aria-current=true]{background:#dfe9d5;border-color:#839f78}.deck-panel iframe[hidden]{display:none}.deck-panel iframe{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#132e2a}.slide-caption{font-size:11px;color:#6b7c60;margin:12px 0}.deck-controls{display:flex;gap:7px;margin-bottom:24px;flex-wrap:wrap}.deck-panel:fullscreen{background:#e9eee3;padding:3vw;display:grid;align-content:center}.deck-panel:fullscreen iframe{max-height:78vh;aspect-ratio:16/9}.settings-dialog{width:540px;max-width:94vw;max-height:90vh;overflow:auto;border:1px solid #c8d3c0;border-radius:16px;padding:28px;color:inherit;background:#fafbf8}.settings-dialog::backdrop{background:#19312260;backdrop-filter:blur(3px)}.settings-dialog h2{font-size:20px;letter-spacing:-.4px;text-transform:none;color:#264431}.settings-dialog form{margin:20px 0}.settings-dialog fieldset{border:0;padding:0;margin:0;display:grid;gap:16px;min-width:0}.settings-dialog [role=status]{font-size:12px;line-height:1.5;margin-top:14px}.settings-dialog input[type=checkbox]{justify-self:start}.settings-dialog textarea{resize:vertical}@media(max-width:1000px){.chat-navigation{width:175px}.conversation{padding:24px}.deck-sidebar{max-width:55vw}}@media(max-width:720px){#app{flex-wrap:wrap}.chat-navigation{width:100%;height:auto;padding:16px;flex-direction:row;flex-wrap:wrap;align-items:center;gap:12px}.chat-navigation h2{display:none}.chat-navigation nav{width:100%;max-height:100px;overflow:auto;order:5;display:flex}.chat-navigation nav button{min-width:150px}.conversation{min-width:0;width:100%;height:85dvh;padding:22px 16px}.conversation-header{flex-wrap:wrap}.deck-sidebar{width:100%!important;max-width:100%;height:auto;border:0;border-top:1px solid #d2ddc7}.settings-dialog{padding:22px}}`
