export const outlineStyle = `
.outline-proposal{border-top:1px solid #d5d5cf;margin-top:10px;padding-top:10px}
.outline-proposal h3{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a5a54}
.outline-status{font-size:12px;color:#44443f!important;margin-bottom:8px!important}
.outline-overview{margin-bottom:12px!important}
.outline-viewing{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.outline-proposal button{font-size:12px;padding:7px 10px}
.outline-actions[hidden]{display:none}
.planned-slide{padding:5px 0;border-top:1px solid #d5d5cf}
.planned-slide summary{cursor:pointer;font-weight:550}
.planned-slide p{white-space:pre-wrap;margin-top:10px!important;font-size:13px}
.outline-proposal[data-status=superseded],.outline-proposal[data-status=cancelled]{color:#5a5a54;border-top-style:dashed}
.clarification-question{max-height:min(35dvh,240px);overflow:auto;overflow-wrap:anywhere;padding:12px;border:1px solid #d5d5cf;border-radius:8px;margin-bottom:8px;font-size:13px;background:#fafaf8}.clarification-question[hidden]{display:none}.clarification-question small{display:block;color:#5a5a54;margin-top:8px}.clarification-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.clarification-options button{font-size:12px;padding:6px 10px}
`
