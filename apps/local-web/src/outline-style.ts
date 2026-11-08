export const outlineStyle = `
.outline-proposal{border-top:1px solid var(--line);margin-top:10px;padding-top:10px}
.outline-proposal h3{margin:0 0 6px;font-size:var(--t-sm);font-weight:600;color:var(--ink)}
.outline-status{color:var(--ink)!important;font-weight:600;margin-bottom:8px!important}
.outline-overview{margin-bottom:12px!important}
.outline-viewing{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.outline-proposal button{padding:4px 12px}
.outline-actions[hidden]{display:none}
.planned-slide{padding:5px 0;border-top:1px solid var(--line)}
.planned-slide summary{cursor:pointer;font-weight:500}
.planned-slide p{white-space:pre-wrap;margin-top:10px!important}
.outline-proposal[data-status=superseded],.outline-proposal[data-status=cancelled]{color:var(--mut);border-top-style:dashed}
.clarification-question{max-height:min(35dvh,240px);overflow:auto;overflow-wrap:anywhere;padding:12px 14px;border:1px solid var(--edge);border-radius:var(--r-lg);margin-bottom:8px;background:var(--card);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);box-shadow:0 0 0 .5px var(--line),var(--lift)}.clarification-question[hidden]{display:none}.clarification-question small{display:block;color:var(--mut);font-size:var(--t-xs);margin-top:8px}.clarification-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.clarification-options button{padding:5px 12px}
`
