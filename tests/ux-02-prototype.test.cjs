const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'design', 'UX-design', 'DeckAgent V1 UX Prototype.html'), 'utf8');
const start = html.indexOf('<script>') + '<script>'.length;
const end = html.indexOf("    $('fileInput').addEventListener", start);
assert(start > 0 && end > start, 'prototype script seam exists');
const elements = new Map();
const document = { getElementById(id) {
  if (!elements.has(id)) elements.set(id, {
    value: '', hidden: false, innerHTML: '', addEventListener() {},
    querySelectorAll() { return []; }
  });
  return elements.get(id);
} };
const context = vm.createContext({ document, Date });
vm.runInContext(html.slice(start, end) + `
  globalThis.ux = { setState, newChat, openChat, renderDeck, renderRail,
    rememberModelSelection, forgetModelSelections, stateGroups, variants,
    get demo() { return demo; }, get currentChat() { return currentChat; } };
`, context);
const ux = context.ux;
function slideFiveTitle() {
  ux.demo.slideIndex = 4;
  ux.renderDeck();
  return document.getElementById('deck').innerHTML.match(/<h2>(.*?)<\/h2>/)?.[1];
}

ux.setState('R6', 'complete');
const originalSlideFive = slideFiveTitle();
for (const variant of ['kept', 'invalid-number', 'invalid-title']) {
  ux.setState('R6', variant);
  assert.equal(slideFiveTitle(), originalSlideFive, `${variant}: deck unchanged`);
}
for (const variant of ['scope', 'scope-new']) {
  ux.setState('R3', variant);
  assert.equal(slideFiveTitle(), originalSlideFive, `${variant}: no slide changed before answer`);
}

ux.setState('R6', 'complete');
ux.demo.model = '[model ID C]';
ux.demo.modelMode = 'ready';
ux.rememberModelSelection();
ux.demo.draft = 'Draft riêng của sales';
ux.demo.attachments.push({ name: 'unsent.png', status: 'ready' });
ux.demo.messages.push({ role: 'user', text: 'Tin nhắn cần giữ' });
const oldMessages = JSON.stringify(ux.demo.messages);
ux.newChat();
assert.equal(ux.demo.model, '[model ID C]', 'new chat inherits latest selectable model');
assert.equal(ux.demo.draft, '', 'new chat starts with empty draft');
ux.demo.draft = 'Draft chat mới';
ux.demo.messages.push({ role: 'user', text: 'Request trong chat mới' });
ux.demo.chatTitle = 'Deck mới từ request';
ux.renderRail();
assert.match(document.getElementById('rail').innerHTML, /Deck mới từ request/, 'new chat appears in history after a sent request');
ux.openChat('sales');
assert.equal(JSON.stringify(ux.demo.messages), oldMessages, 'earlier conversation restored');
assert.equal(ux.demo.draft, 'Draft riêng của sales', 'earlier draft restored');
assert.equal(ux.demo.attachments.length, 0, 'unsent attachments dropped after changing chat');
assert.equal(ux.demo.model, '[model ID C]', 'earlier chat model restored');
assert.equal(slideFiveTitle(), originalSlideFive, 'earlier deck restored');
ux.openChat('thesis');
ux.openChat('sales');
assert.equal(JSON.stringify(ux.demo.messages), oldMessages, 'multiple switches preserve earlier chat');
ux.openChat('new-1');
assert.equal(ux.demo.draft, 'Draft chat mới', 'new chat draft stays with its chat');
assert.equal(ux.demo.messages.at(-1).text, 'Request trong chat mới', 'new chat conversation restored');

ux.setState('R6', 'complete');
ux.demo.model = '[model ID C]';
ux.rememberModelSelection();
ux.demo.model = '[model ID B]';
ux.rememberModelSelection();
ux.demo.providers[0].models = ux.demo.providers[0].models.filter(x => x !== '[model ID B]');
ux.forgetModelSelections('anthropic', '[model ID B]');
ux.newChat();
assert.equal(ux.demo.model, '[model ID C]', 'new chat falls back to latest still selectable model');
ux.openChat('sales');
assert.equal(ux.demo.model, '', 'earlier chat does not keep removed selected model');
assert.equal(ux.demo.modelMode, 'removed', 'earlier chat reports removed model');

let rendered = 0;
for (const items of Object.values(ux.stateGroups)) for (const [id] of items) {
  const options = ux.variants[id] || [['', '']];
  for (const [variant] of options) { ux.setState(id, variant); rendered++; }
}
console.log('Rendered presets:', rendered);
console.log('UX-02 regression checks passed');
