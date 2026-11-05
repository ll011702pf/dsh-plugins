import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolved from this file's location so the harness runs from any checkout.
const here = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.resolve(here, '../../../plugins/dsh-competitive-analysis/client.js');

let captured = null;
globalThis.window = { __ModuleLoader__: { load(e) { captured = e; } } };
await import(pathToFileURL(clientPath).href);
const P = captured.factory(() => ({ createElement() { return {}; } })).__pure;

const L = { heading: 'R', untitled: 'U', none: 'N', market: 'M', goal: 'G', updated: 'T', competitor: 'C',
  positioning: 'P', audience: 'A', price: 'Pr', strengths: 'S', weaknesses: 'W', unnamed: 'X', dimension: 'D',
  weight: 'Wt', weighted: 'Ws', rank: 'Rk', unrated: 'Ur', overviewTitle: 'O', matrixTitle: 'Mt',
  profileTitle: 'Pp', conclusionTitle: 'Cc', findings: 'F', opportunities: 'Op', risks: 'Ri', verdict: 'V' };

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('PASS ' + name); } catch (e) { fail++; console.log('FAIL ' + name + ' → ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }

for (const bad of [1e21, 8.64e15 + 1, -5, Infinity, NaN, '1700000000000', null, undefined]) {
  t('toMarkdown survives updatedAt=' + String(bad), () => {
    const doc = P.emptyDoc();
    doc.updatedAt = bad;
    const md = P.toMarkdown(doc, L);
    ok(md.includes('## O'), 'missing overview section');
    ok(!md.includes('undefined') && !md.includes('NaN') && !md.includes('Invalid'), 'bad render: ' + md);
    ok(/- \*\*T\*\*: /.test(md), 'updated line missing');
  });
}

t('toMarkdown renders a real date', () => {
  const doc = P.emptyDoc();
  doc.updatedAt = 1700000000000;
  const md = P.toMarkdown(doc, L);
  ok(md.includes('2023-11-14'), 'expected ISO date, got: ' + md.split('\n').find((l) => l.includes('T**')));
});

t('sanitize keeps a valid timestamp and rejects absurd ones', () => {
  ok(P.sanitize({ updatedAt: 1700000000000 }).updatedAt === 1700000000000, 'valid ts dropped');
  ok(P.sanitize({ updatedAt: -1 }).updatedAt === 0, 'negative ts kept');
  ok(P.sanitize({ updatedAt: 'x' }).updatedAt === 0, 'non-numeric ts kept');
});

// filename sanitiser mirrors the component's reportFileName()
function fileName(subject) {
  const base = ((subject || '').trim() || 'untitled')
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 48);
  return (base || 'report') + '-competitive-analysis.md';
}
t('report filename strips path separators', () => {
  for (const s of ['../../etc/passwd', 'a/b\\c:d*e?f"g<h>i|j', '   ', '', '云雀 笔记']) {
    const f = fileName(s);
    ok(!/[\\/:*?"<>|]/.test(f), 'unsafe char in ' + f);
    ok(!f.startsWith('.'), 'leading dot in ' + f);
    ok(f.endsWith('.md'), 'no .md in ' + f);
  }
  ok(fileName('云雀 笔记') === '云雀-笔记-competitive-analysis.md', 'unexpected: ' + fileName('云雀 笔记'));
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
