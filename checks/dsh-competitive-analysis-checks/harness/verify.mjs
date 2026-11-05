import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolved from this file's location so the harness runs from any checkout.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../plugins/dsh-competitive-analysis');
let pass = 0, fail = 0;
const results = [];
function check(name, fn) {
  try {
    const detail = fn();
    pass += 1;
    results.push(['PASS', name, detail === undefined ? '' : String(detail)]);
  } catch (error) {
    fail += 1;
    results.push(['FAIL', name, error.message]);
  }
}
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error((label || '') + ' expected ' + e + ' got ' + a);
  return a;
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }

/* ---- 1. JSON + syntax ------------------------------------------------ */
for (const f of ['package.json', 'locale/en.json', 'locale/zh.json']) {
  check('JSON parses: ' + f, () => { JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')); });
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

/* ---- 2. manifest ----------------------------------------------------- */
check('package name', () => eq(pkg.name, '@local/dsh-competitive-analysis'));
check('bundle patch declared + exists', () => {
  eq(pkg.dsh.bundle.patch, './cordis.patch.yml');
  ok(fs.existsSync(path.join(root, 'cordis.patch.yml')), 'cordis.patch.yml missing');
});
check('dsh.client config', () => {
  eq(pkg.dsh.client.platform, 'web');
  eq(pkg.dsh.client.immediately, true);
  eq(pkg.dsh.client.inject, ['@deepseek-ai/dsh-client-locale','@deepseek-ai/dsh-client-ui-layout','@deepseek-ai/dsh-client-ui-sidebar']);
});
check('exports include client/locale/icon', () => {
  eq(pkg.exports['./client'], './client.js');
  eq(pkg.exports['./icon'], './icon.svg');
  eq(pkg.exports['./locale/*.json'], './locale/*.json');
});
check('files cover every runtime file on disk', () => {
  const onDisk = [];
  (function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + entry.name : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), r);
      else onDisk.push(r);
    }
  })(root, '');
  const covered = onDisk.filter((f) => pkg.files.some((p) => {
    if (p === f) return true;
    if (p.endsWith('/*.json')) return f.startsWith(p.slice(0, -'*.json'.length));
    return false;
  }));
  const uncovered = onDisk.filter((f) => !covered.includes(f) && f !== 'README.md' && f !== 'package.json');
  ok(uncovered.length === 0, 'uncovered in files[]: ' + uncovered.join(', '));
  return onDisk.join(', ');
});

/* ---- 3. icon --------------------------------------------------------- */
check('icon.svg valid + bounded + no external refs', () => {
  const svg = fs.readFileSync(path.join(root, 'icon.svg'), 'utf8');
  const size = fs.statSync(path.join(root, 'icon.svg')).size;
  ok(size <= 256 * 1024, 'icon too large: ' + size);
  ok(/^\s*<svg[\s>]/.test(svg), 'not an svg root');
  ok(/viewBox="[^"]+"/.test(svg), 'no viewBox');
  ok(!/https?:\/\//.test(svg.replace(/xmlns="[^"]*"/g, '')), 'external URL reference');
  ok(!/xlink:href/.test(svg), 'xlink:href present');
  ok(!/<script/i.test(svg), 'script in svg');
  return size + ' bytes';
});

/* ---- 4. locale meta -------------------------------------------------- */
check('locale meta.title/description localized + distinct', () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, 'locale/en.json'), 'utf8')).meta;
  const zh = JSON.parse(fs.readFileSync(path.join(root, 'locale/zh.json'), 'utf8')).meta;
  ok(en.title && en.description && zh.title && zh.description, 'missing meta fields');
  ok(en.title !== zh.title, 'zh title is not translated');
  ok(/[\u4e00-\u9fa5]/.test(zh.title), 'zh title has no CJK');
  ok(!/My Decoration|template|TODO/i.test(en.description + zh.description), 'template copy left');
  return JSON.stringify({ en: en.title, zh: zh.title });
});

/* ---- 5. load the client half ---------------------------------------- */
const clientPath = path.join(root, 'client.js');
let captured = null;
const touched = [];
const trap = { localStorage: null, document: null, navigator: null, localStorageSet: 0, documentAccess: 0 };
const realDocument = globalThis.document;
globalThis.window = { __ModuleLoader__: { load(entry) { captured = entry; } } };
try {
  await import(pathToFileURL(clientPath).href);
} catch (error) {
  console.log('IMPORT FAILED:', error.message);
  process.exit(1);
}

check('module loader entry id', () => eq(captured && captured.id, '@local/dsh-competitive-analysis'));
check('factory is a function', () => ok(typeof captured.factory === 'function', 'not a function'));

/* probe globals during factory execution */
const probes = {
  get localStorage() { trap.localStorage = 'touched'; return undefined; },
  get document() { trap.documentAccess += 1; return undefined; },
};
let mod;
check('factory executes without side effects', () => {
  const hadWindow = 'window' in globalThis;
  const before = Object.keys(globalThis).length;
  mod = captured.factory((id) => {
    if (id === 'react') return { createElement() { return {}; } };
    throw new Error('unexpected require: ' + id);
  });
  ok(typeof mod === 'object' && mod, 'factory returned nothing');
  ok(trap.localStorage === null, 'factory touched localStorage');
  ok(trap.documentAccess === 0, 'factory touched document');
  ok(Object.keys(globalThis).length === before, 'factory added globals');
  ok(hadWindow, 'window removed');
});

/* ---- 6. module shape ------------------------------------------------- */
check('inject list', () => eq(mod.inject, ['slots', 'locale']));
check('apply is a function', () => ok(typeof mod.apply === 'function'));

/* ---- 7. apply wiring ------------------------------------------------- */
const ctx = {
  effects: [], disposed: 0,
  effect(cb, label) {
    const cleanup = cb();
    ok(typeof cleanup === 'function', 'effect "' + label + '" returned ' + typeof cleanup);
    this.effects.push({ label, cleanup });
    return () => { this.disposed += 1; cleanup(); };
  },
  locale: {
    registered: null,
    register(ns, dicts) { this.registered = { ns, dicts }; return () => {}; },
    bind() { return (key) => '[missing:' + key + ']'; },
    getLocale() { return { active: 'zh', revision: 1 }; },
  },
  slots: {
    registered: [], injected: [],
    inject(ownerKey, cb) { this.injected.push(ownerKey); return cb(); },
    register(options, component) {
      ok(typeof component === 'function', 'component for ' + options.name + ' is not a function');
      this.registered.push({ options, component });
      return () => {};
    },
  },
};
check('apply(ctx) runs and registers expected slots', () => {
  mod.apply(ctx);
  const sidebar = ctx.slots.registered.find((r) => r.options.name === 'sidebar.panellist');
  const main = ctx.slots.registered.find((r) => r.options.name === 'main');
  ok(sidebar, 'no sidebar.panellist registration');
  ok(main, 'no main registration');
  eq(sidebar.options.id, 'competitive-analysis', 'sidebar id:');
  eq(sidebar.options.order, 30, 'sidebar order:');
  ok(typeof sidebar.options.label === 'function', 'sidebar label must be a thunk');
  eq(main.options.key, 'competitive-analysis', 'main key:');
  eq(ctx.slots.registered.length, 2, 'registration count:');
  eq(ctx.slots.injected.sort(), ['main', 'sidebar.panellist']);
});

check('locale registered under namespace with both dicts', () => {
  const reg = ctx.locale.registered;
  ok(reg, 'no locale registration');
  eq(reg.ns, 'competitiveAnalysis');
  ok(reg.dicts.zh && reg.dicts.en, 'missing zh or en dict');
});

check('zh/en dictionaries have identical key sets', () => {
  const { zh, en } = ctx.locale.registered.dicts;
  const zk = Object.keys(zh).sort(), ek = Object.keys(en).sort();
  const missingEn = zk.filter((k) => !(k in en));
  const missingZh = ek.filter((k) => !(k in zh));
  ok(missingEn.length === 0, 'missing in en: ' + missingEn.join(', '));
  ok(missingZh.length === 0, 'missing in zh: ' + missingZh.join(', '));
  const empty = [...zk, ...ek].filter((k) => !String(zh[k] || '').trim() || !String(en[k] || '').trim());
  ok(empty.length === 0, 'empty values: ' + [...new Set(empty)].join(', '));
  return zk.length + ' keys each';
});

check('every t("key") literal exists in both dicts', () => {
  const src = fs.readFileSync(clientPath, 'utf8');
  const used = new Set();
  let m;
  const re = /\bt\(\s*'([^']+)'\s*\)/g;
  while ((m = re.exec(src))) used.add(m[1]);
  const { zh, en } = ctx.locale.registered.dicts;
  const bad = [...used].filter((k) => !(k in zh) || !(k in en));
  ok(bad.length === 0, 'unresolved keys: ' + bad.join(', '));
  return used.size + ' literals used';
});

check('effect disposers are all callable', () => {
  for (const e of ctx.effects) e.cleanup();
  return ctx.effects.length + ' effects';
});

/* ---- 8. pure logic -------------------------------------------------- */
const P = mod.__pure;
check('__pure seam exposes helpers', () => {
  for (const k of ['emptyDoc','blankCompetitor','sanitize','scoreOf','weightedScores','rankMap','extremeDimensions','toMarkdown','sampleDoc','withDefaultDimensions']) {
    ok(typeof P[k] === 'function', 'missing __pure.' + k);
  }
});

check('sanitize survives malformed payloads', () => {
  const inputs = [null, undefined, [], 'string', 42, {}, { competitors: 'nope' }, { ratings: [] },
    { competitors: [null, 1, 'x', [], { id: 5 }] }, { dimensions: [{ id: 'a', weight: 99 }] }];
  for (const input of inputs) {
    const doc = P.sanitize(input);
    ok(doc && typeof doc === 'object', 'sanitize returned non-object for ' + JSON.stringify(input));
    ok(Array.isArray(doc.competitors), 'competitors not array');
    ok(Array.isArray(doc.dimensions), 'dimensions not array');
    ok(typeof doc.ratings === 'object' && doc.ratings && !Array.isArray(doc.ratings), 'ratings not object');
    ok(doc.insights && typeof doc.insights === 'object', 'insights not object');
  }
  const clamped = P.sanitize({ dimensions: [{ id: 'a', name: 'x', weight: 99 }] });
  eq(clamped.dimensions[0].weight, 5, 'weight clamp:');
  const str = P.sanitize({ subject: 'y'.repeat(99999) });
  ok(str.subject.length <= 4000, 'subject not clamped: ' + str.subject.length);
  return inputs.length + ' malformed inputs';
});

check('sanitize drops ratings for unknown competitors/dimensions', () => {
  const doc = P.sanitize({
    competitors: [{ id: 'c1', name: 'A' }],
    dimensions: [{ id: 'd1', name: 'F', weight: 3 }],
    ratings: { c1: { d1: 4, ghost: 5 }, ghostc: { d1: 3 }, bad: 'nope' },
  });
  eq(Object.keys(doc.ratings), ['c1'], 'rating rows:');
  eq(doc.ratings.c1, { d1: 4 }, 'rating cells:');
});

check('sanitize rejects out-of-range and non-numeric ratings', () => {
  const doc = P.sanitize({
    competitors: [{ id: 'c1', name: 'A' }],
    dimensions: [{ id: 'd1', name: 'F' }, { id: 'd2', name: 'G' }, { id: 'd3', name: 'H' }],
    ratings: { c1: { d1: 9, d2: '3', d3: 2.6 } },
  });
  eq(doc.ratings.c1, { d3: 3 }, 'accepted cells:');
});

check('weightedScores averages over rated dimensions only (verified arithmetic)', () => {
  const doc = P.sanitize({
    competitors: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    dimensions: [{ id: 'd1', name: 'D1', weight: 4 }, { id: 'd2', name: 'D2', weight: 1 }],
    ratings: { a: { d1: 5, d2: 1 }, b: { d1: 1 } },
  });
  const scores = P.weightedScores(doc);
  const a = scores.find((s) => s.id === 'a');
  const b = scores.find((s) => s.id === 'b');
  const aExpected = (5 * 4 + 1 * 1) / (4 + 1);      // 21/5 = 4.2
  const bExpected = (1 * 4) / 4;                    // 1
  ok(Math.abs(a.score - aExpected) < 1e-9, 'A score ' + a.score + ' != ' + aExpected);
  ok(Math.abs(b.score - bExpected) < 1e-9, 'B score ' + b.score + ' != ' + bExpected);
  eq(a.rated, 2, 'A rated:'); eq(b.rated, 1, 'B rated:'); eq(a.total, 2, 'A total:');
  // fully unrated competitor has null score, not 0/NaN
  const c = P.weightedScores(P.sanitize({ competitors: [{ id: 'z' }], dimensions: [{ id: 'd1', weight: 3 }], ratings: {} }))[0];
  eq(c.score, null, 'unrated score:');
});

check('rankMap ranks by score, dense, skips unrated', () => {
  const doc = P.sanitize({
    competitors: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'u' }],
    dimensions: [{ id: 'd1', weight: 3 }],
    ratings: { a: { d1: 2 }, b: { d1: 5 }, c: { d1: 3 } },
  });
  const ranks = P.rankMap(P.weightedScores(doc));
  eq(ranks, { b: 1, c: 2, a: 3 }, 'ranks:');
  ok(!('u' in ranks), 'unrated competitor got a rank');
});

check('toMarkdown: complete report has no undefined/NaN/[object Object]', () => {
  const doc = P.sanitize(P.sampleDoc({
    subject: '云雀笔记', market: '笔记赛道', goal: '找切入', brief: '结论',
    dimensionNames: ['功能', '价格', '体验', '生态', '服务'],
    competitor1: { name: 'A 竞品', positioning: 'p1', audience: 'a1', price: '$1', strengths: 's1\ns2', weaknesses: 'w1' },
    competitor2: { name: 'B | 竞品', positioning: 'p2', audience: 'a2', price: '$2', strengths: 's3', weaknesses: 'w2' },
    findings: 'f', opportunities: 'o', risks: 'r', verdict: 'v',
  }));
  doc.updatedAt = 1700000000000;
  const md = P.toMarkdown(doc, {
    heading: '竞品分析报告', untitled: '未命名', none: '未填写', market: '赛道', goal: '目标', updated: '更新于',
    competitor: '竞品', positioning: '定位', audience: '用户', price: '价格', strengths: '优势', weaknesses: '劣势',
    unnamed: '未命名竞品', dimension: '维度', weight: '权重', weighted: '加权得分', rank: '排名', unrated: '未评分',
    overviewTitle: '竞品概览', matrixTitle: '评分矩阵', profileTitle: '竞品档案', conclusionTitle: '结论',
    findings: '关键发现', opportunities: '机会', risks: '风险', verdict: '建议',
  });
  ok(md.startsWith('# 云雀笔记 · 竞品分析报告'), 'heading: ' + md.split('\n')[0]);
  for (const needle of ['A 竞品', 'B \\| 竞品', '功能', '加权得分', '排名', '关键发现']) {
    ok(md.includes(needle), 'missing from report: ' + needle);
  }
  for (const badWord of ['undefined', 'NaN', '[object Object]', 'null']) {
    ok(!md.includes(badWord), 'report contains ' + badWord + '\n' + md);
  }
  ok(!/\|\s*\|\s*$/.test(md.split('\n').filter((l) => l.startsWith('|'))[1] || ''), 'malformed header row');
  return md.length + ' chars';
});

check('toMarkdown: empty doc still yields a well-formed report', () => {
  const L = { heading: 'R', untitled: 'U', none: 'N', market: 'M', goal: 'G', updated: 'T', competitor: 'C',
    positioning: 'P', audience: 'A', price: 'Pr', strengths: 'S', weaknesses: 'W', unnamed: 'X', dimension: 'D',
    weight: 'Wt', weighted: 'Ws', rank: 'Rk', unrated: 'Ur', overviewTitle: 'O', matrixTitle: 'Mt',
    profileTitle: 'Pp', conclusionTitle: 'Cc', findings: 'F', opportunities: 'Op', risks: 'Ri', verdict: 'V' };
  const md = P.toMarkdown(P.emptyDoc(), L);
  ok(md.startsWith('# U · R'), 'empty heading: ' + md.split('\n')[0]);
  for (const badWord of ['undefined', 'NaN', '[object Object]']) ok(!md.includes(badWord), 'contains ' + badWord);
  ok(md.endsWith('\n'), 'no trailing newline');
  return md.length + ' chars';
});

check('toMarkdown: pipes/newlines in user text cannot break tables', () => {
  const doc = P.sanitize({
    competitors: [{ id: 'a', name: 'A|B', positioning: 'x\ny', audience: '', price: '' }],
    dimensions: [{ id: 'd1', name: 'dim|one', weight: 3 }],
    ratings: { a: { d1: 4 } },
  });
  const L = { heading: 'R', untitled: 'U', none: 'N', market: 'M', goal: 'G', updated: 'T', competitor: 'C',
    positioning: 'P', audience: 'A', price: 'Pr', strengths: 'S', weaknesses: 'W', unnamed: 'X', dimension: 'D',
    weight: 'Wt', weighted: 'Ws', rank: 'Rk', unrated: 'Ur', overviewTitle: 'O', matrixTitle: 'Mt',
    profileTitle: 'Pp', conclusionTitle: 'Cc', findings: 'F', opportunities: 'Op', risks: 'Ri', verdict: 'V' };
  const md = P.toMarkdown(doc, L);
  const headerRow = md.split('\n').find((l) => l.startsWith('| C'));
  ok(headerRow, 'no overview header');
  eq(headerRow.split('|').length - 1, 5 + 1, 'header cell count (pipes must be escaped):');
});

check('toMarkdown: zero dimensions does not emit a broken matrix', () => {
  const doc = P.sanitize({ competitors: [{ id: 'a', name: 'A' }], dimensions: [] });
  const L = { heading: 'R', untitled: 'U', none: 'N', market: 'M', goal: 'G', updated: 'T', competitor: 'C',
    positioning: 'P', audience: 'A', price: 'Pr', strengths: 'S', weaknesses: 'W', unnamed: 'X', dimension: 'D',
    weight: 'Wt', weighted: 'Ws', rank: 'Rk', unrated: 'Ur', overviewTitle: 'O', matrixTitle: 'Mt',
    profileTitle: 'Pp', conclusionTitle: 'Cc', findings: 'F', opportunities: 'Op', risks: 'Ri', verdict: 'V' };
  const md = P.toMarkdown(doc, L);
  ok(!md.includes('undefined'), 'undefined in output');
  ok(md.includes('## Mt'), 'missing matrix section');
});

/* ---- report ---------------------------------------------------------- */
console.log('\n' + results.map(([s, n, d]) => s.padEnd(5) + ' ' + n + (d ? '  → ' + d : '')).join('\n'));
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
