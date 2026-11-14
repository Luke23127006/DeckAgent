export const attachmentStyle = `
.attachment-draft{display:grid;gap:8px;max-height:220px;overflow:auto;padding:8px 0}
.attachment-draft[hidden]{display:none}.attachment-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:8px}
.attachment-name{font-weight:600;overflow-wrap:anywhere}.attachment-row small{color:var(--mut)}.attachment-row[data-state=rejected]{border-color:#b45309}
.attachment-preview{max-width:min(850px,90vw);max-height:85vh;border:1px solid var(--line);border-radius:12px;background:var(--canvas);color:var(--ink);overflow:auto}
.attachment-preview img{max-width:100%;height:auto}.attachment-preview pre{white-space:pre-wrap;overflow-wrap:anywhere}.message-attachments{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
`
