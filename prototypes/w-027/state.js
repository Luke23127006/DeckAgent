/* Disposable W-027 simulation state. Not a DeckAgent architecture contract. */
(function (root) {
  'use strict';
  const copy = value => value == null ? null : JSON.parse(JSON.stringify(value));
  function createSession() {
    let working = null;
    let candidate = null;
    let accepted = null;
    let previous = null;
    return {
      view: () => copy({ working, candidate, accepted }),
      propose(deck) { candidate = copy(deck); },
      validate() {
        if (!candidate) throw new Error('No candidate to validate');
        previous = copy(working);
        working = candidate;
        candidate = null;
      },
      fail() { candidate = null; },
      accept() {
        if (!working || candidate) throw new Error('No validated working state');
        accepted = copy(working);
        previous = null;
      },
      reject() {
        if (candidate) throw new Error('Candidate still validating');
        if (!accepted && !previous) throw new Error('No earlier usable state');
        // Prototype assumption: before first acceptance, restore the preceding valid draft.
        working = copy(accepted || previous);
        previous = null;
      },
      exportAccepted(format) {
        if (!accepted) throw new Error('No accepted presentation');
        if (!['PPTX', 'PDF'].includes(format)) throw new Error('Unsupported format');
        return { format, simulated: true, deck: copy(accepted) };
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createSession };
  else root.DeckDemo = { createSession };
})(typeof window === 'undefined' ? globalThis : window);
