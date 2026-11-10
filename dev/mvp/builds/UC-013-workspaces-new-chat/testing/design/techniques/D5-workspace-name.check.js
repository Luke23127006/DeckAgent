// D5 · workspace name. Run: node D5-workspace-name.check.js
// Recomputes, for every D5 test input, the measured length per name source and the outcome the spec rules give.
// Every special character is written as a code point number, so the file holds no invisible character.
// This is design evidence (computed): it checks the arithmetic of the expected results, not DeckAgent's behavior.

const ch = (...cps) => String.fromCodePoint(...cps);
const cp = s => [...s].length;
const rep = (s, n) => s.repeat(n);

const SP = ch(0x20), TAB = ch(0x09), LF = ch(0x0A), VT = ch(0x0B), NBSP = ch(0xA0), OGHAM = ch(0x1680);
const ZWSP = ch(0x200B), LS = ch(0x2028), PS = ch(0x2029), MMSP = ch(0x205F), IDEO = ch(0x3000), BOM = ch(0xFEFF);
const ACU = ch(0x0301), QA = ch(0x0958), ANGSTROM = ch(0x212B), EMOJI = ch(0x1F600);
const TOAN = 'To' + ch(0xE1) + 'n';            // Toán in NFC
const TOAN_NFD = 'Toa' + ACU + 'n';            // Toán in NFD
const TOAN_HOC = TOAN + SP + 'h' + ch(0x1ECD) + 'c';

// User source: NFC, trim, then the empty and longest-name rules (BR-020.R, V-1, V-2, V-3).
const user = s => { const m = s.normalize('NFC').trim(); const L = cp(m); return { L, out: L === 0 ? 'refuse V-1' : L > 100 ? 'refuse V-2' : 'set', stored: L === 0 || L > 100 ? null : m }; };
// Folder source: NFC, no trim, cut to 100 code points (FR-071, BR-020.V2). Which 100 are kept is gap Z-28; "first 100" is only the proposal.
const folder = s => { const n = s.normalize('NFC'); const L = cp(n); const first = L > 100 ? [...n].slice(0, 100).join('') : n; const last = L > 100 ? [...n].slice(-100).join('') : n; return { L, out: L > 100 ? 'cut+set' : 'set', storedLen: cp(first), contentDependsOnZ28: first !== last, units: s.length }; };

const U = {
  TC1: TOAN, TC2: '', TC3: SP + VT + PS + MMSP, TC4: rep('a', 150), TC5: TOAN_NFD, TC6: ANGSTROM + 'x', TC7: QA + 'a',
  TC8: TOAN + EMOJI, TC9: 'Tx' + ACU, TC10: BOM + LS + TAB + TOAN + IDEO + OGHAM + LF, TC11: ZWSP + TOAN + ZWSP, TC12: TOAN_HOC, TC13: TOAN,
  TC14: 'T', TC15: 'To', TC16: rep('a', 99), TC17: rep('a', 100), TC18: rep('a', 101),
  TC19: SP + rep('a', 99) + SP, TC20: SP + rep('a', 100) + SP, TC21: SP + rep('a', 101) + SP,
  TC22: rep('a' + ACU, 99), TC23: rep('a' + ACU, 100), TC24: rep('a' + ACU, 101),
  TC25: rep(QA, 49) + 'a', TC26: rep(QA, 50), TC27: rep(QA, 50) + 'a',
  TC28: rep(EMOJI, 99), TC29: rep(EMOJI, 100), TC30: rep(EMOJI, 101),
  TC31: rep('x' + ACU, 49) + 'a', TC32: rep('x' + ACU, 50), TC33: rep('x' + ACU, 50) + 'a',
  TC67: SP + 'T' + SP, TC68: SP + 'To' + SP,
};
const F = {
  TC34: TOAN, TC35: rep('a', 100) + rep('b', 50), TC36: TOAN_NFD, TC37: ANGSTROM + 'x', TC38: QA + 'a', TC39: TOAN + EMOJI, TC40: 'Tx' + ACU,
  TC41: NBSP + BOM + TOAN + LS + SP, TC42: NBSP, TC43: TOAN_HOC, TC44: TOAN,
  TC45: rep('a', 99), TC46: rep('a', 100), TC47: rep('a', 101),
  TC48: rep('a' + ACU, 99), TC49: rep('a' + ACU, 100), TC50: rep('a' + ACU, 101),
  TC51: rep(QA, 49) + 'a', TC52: rep(QA, 50), TC53: rep(QA, 50) + 'a',
  TC54: rep(EMOJI, 99), TC55: rep(EMOJI, 100), TC56: rep(EMOJI, 101),
  TC57: rep('x' + ACU, 49) + 'a', TC58: rep('x' + ACU, 50), TC59: rep('x' + ACU, 50) + 'a',
  TC60: rep('a', 98) + EMOJI + 'aa', TC61: rep('a', 99) + EMOJI + 'a', TC62: rep('a', 100) + EMOJI,
  TC63: 'T', TC64: 'To', TC65: rep('a', 254), TC66: rep('a', 255),
};

for (const [k, s] of Object.entries(U)) { const r = user(s); console.log(k, 'user', 'raw', cp(s), 'utf16', s.length, 'L', r.L, r.out, r.stored === null ? '' : 'storedLen ' + cp(r.stored)); }
for (const [k, s] of Object.entries(F)) { const r = folder(s); console.log(k, 'folder', 'raw', cp(s), 'utf16', r.units, 'L', r.L, r.out, 'storedLen', r.storedLen, r.contentDependsOnZ28 ? 'CONTENT DEPENDS ON Z-28' : ''); }

// What a cut by UTF-16 units would leave (BD4).
for (const k of ['TC60', 'TC61', 'TC62']) { const s16 = F[k].slice(0, 100); console.log(k, 'utf16 cut: code points', cp(s16), 'ends with lone high surrogate', /[\uD800-\uDBFF]$/.test(s16)); }

// RL5: the order of trim and NFC never changes the result (probe every BMP character in five positions).
const diff = new Set();
for (let c = 0; c < 0x10000; c++) { if (c >= 0xD800 && c <= 0xDFFF) continue; const x0 = ch(c);
  for (const x of [x0 + 'a' + x0, SP + x0, x0 + SP, x0 + ACU, SP + ACU + x0]) if (x.trim().normalize('NFC') !== x.normalize('NFC').trim()) diff.add(c); }
console.log('RL5 trim/NFC order differences:', diff.size);

// Z-27: the trim() set of this runtime, and the whitespace representatives (EC2, EC14, EC33) are unchanged by NFC.
const trimSet = []; for (let c = 0; c <= 0x10FFFF; c++) { if (c >= 0xD800 && c <= 0xDFFF) continue; const x = ch(c); if ((x + 'a' + x).trim() === 'a') trimSet.push(c); }
console.log('trim() set size', trimSet.length, 'Unicode', process.versions.unicode, trimSet.map(c => c.toString(16)).join(' '));
for (const [k, s] of [['TC3', U.TC3], ['TC10', U.TC10], ['TC41', F.TC41]]) console.log(k, 'NFC unchanged', s === s.normalize('NFC'));
console.log('TC10 stored is Toan', user(U.TC10).stored === TOAN, '; TC41 stored length', cp(folder(F.TC41).storedLen ? F.TC41 : ''));
