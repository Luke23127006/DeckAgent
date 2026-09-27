const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSession } = require('../state.js');

test('validation makes a draft reviewable but only user acceptance makes it exportable', () => {
  const session = createSession();
  const draft = { id: 'v1', slides: [{ title: '120 lượt mượn' }], constraints: { language: 'Tiếng Việt' } };
  session.propose(draft);
  assert.equal(session.view().working, null);
  assert.equal(session.view().accepted, null);
  assert.throws(() => session.exportAccepted('PDF'), /accepted/i);
  session.validate();
  assert.equal(session.view().working.id, 'v1');
  assert.equal(session.view().candidate, null);
  assert.equal(session.view().accepted, null);
  session.accept();
  assert.equal(session.exportAccepted('PDF').deck.slides[0].title, '120 lượt mượn');
});

test('prototype assumption: reject before first acceptance restores one preceding usable draft', () => {
  const session = createSession();
  session.propose({ id: 'v1', slides: [] }); session.validate();
  session.propose({ id: 'v2', slides: [] }); session.validate();
  session.reject();
  assert.equal(session.view().working.id, 'v1');
  assert.equal(session.view().accepted, null);
  assert.throws(() => session.exportAccepted('PDF'), /accepted/i);
  assert.throws(() => session.reject(), /earlier usable/i);
});

test('reviewing and rejecting a refinement preserves the accepted export and its constraints', () => {
  const session = createSession();
  session.propose({ id: 'v1', slides: [{ title: '120 lượt mượn' }], constraints: { tone: 'Gần gũi' } });
  session.validate(); session.accept();
  session.propose({ id: 'v2', slides: [{ title: 'Kết quả: 120 lượt mượn' }], constraints: { tone: 'Trang trọng' } });
  session.validate();
  assert.equal(session.exportAccepted('PPTX').deck.id, 'v1');
  session.reject();
  assert.equal(session.view().working.id, 'v1');
  assert.equal(session.view().working.constraints.tone, 'Gần gũi');
  const exported = session.exportAccepted('PDF');
  exported.deck.slides[0].title = 'modified outside session';
  assert.equal(session.exportAccepted('PDF').deck.slides[0].title, '120 lượt mượn');
});

test('failed candidate preserves working, accepted, constraints and the previous reject destination', () => {
  const session = createSession();
  session.propose({ id: 'v1', constraints: { length: '6 slide' } }); session.validate();
  session.propose({ id: 'v2', constraints: { length: '4 slide' } }); session.validate();
  session.propose({ id: 'v3', constraints: { length: '99 slide' } });
  assert.throws(() => session.accept(), /validated/i);
  session.fail();
  assert.equal(session.view().candidate, null);
  assert.equal(session.view().working.id, 'v2');
  assert.equal(session.view().working.constraints.length, '4 slide');
  assert.equal(session.view().accepted, null);
  session.reject();
  assert.equal(session.view().working.id, 'v1');
  session.accept();
  session.propose({ id: 'v4', constraints: { length: '99 slide' } }); session.fail();
  assert.equal(session.exportAccepted('PDF').deck.id, 'v1');
});
