/**
 * Client half of the Competitive Analysis bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `competitive-analysis`. The analysis document is browser-owned and persists in
 * localStorage; the Host half registers nothing.
 *
 * The workbench keeps a competitor portfolio (positioning, audience, pricing,
 * strengths, weaknesses), a weighted 1-5 scoring matrix over configurable
 * dimensions, four conclusion fields, and a Markdown report it can copy or
 * download.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-competitive-analysis',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'competitiveAnalysis';
    const PANEL_ID = 'competitive-analysis';
    const STORAGE_KEY = 'dsh.competitive-analysis.doc.v1';
    const DOC_VERSION = 1;
    const SCORE_MAX = 5;
    const WEIGHTS = [1, 2, 3, 4, 5];
    const MAX_COMPETITORS = 40;
    const MAX_DIMENSIONS = 20;
    const MAX_TEXT = 4000;

    /* ------------------------------------------------------------ schema */

    /** Editable competitor fields beyond the name; the keys are the document keys. */
    const PROFILE_FIELDS = [
      { key: 'positioning', label: 'field.positioning', placeholder: 'field.positioning.ph', rows: 2 },
      { key: 'audience', label: 'field.audience', placeholder: 'field.audience.ph', rows: 2 },
      { key: 'price', label: 'field.price', placeholder: 'field.price.ph', rows: 1 },
      { key: 'strengths', label: 'field.strengths', placeholder: 'field.strengths.ph', rows: 3 },
      { key: 'weaknesses', label: 'field.weaknesses', placeholder: 'field.weaknesses.ph', rows: 3 },
    ];

    /** The four conclusion fields; `key` doubles as the Markdown label key. */
    const INSIGHT_FIELDS = [
      { key: 'findings', label: 'insights.findings', placeholder: 'insights.findings.ph' },
      { key: 'opportunities', label: 'insights.opportunities', placeholder: 'insights.opportunities.ph' },
      { key: 'risks', label: 'insights.risks', placeholder: 'insights.risks.ph' },
      { key: 'verdict', label: 'insights.verdict', placeholder: 'insights.verdict.ph' },
    ];

    /** Seeded on first run only, so the matrix is usable before any dimension is authored. */
    const DEFAULT_DIMENSIONS = [
      { key: 'dim.features', weight: 4 },
      { key: 'dim.pricing', weight: 3 },
      { key: 'dim.experience', weight: 4 },
      { key: 'dim.ecosystem', weight: 3 },
      { key: 'dim.support', weight: 2 },
    ];

    /* ------------------------------------------------------------- data */

    function clampText(value, limit) {
      if (typeof value !== 'string') return '';
      const max = typeof limit === 'number' ? limit : MAX_TEXT;
      return value.length > max ? value.slice(0, max) : value;
    }

    function clampWeight(value) {
      const rounded = typeof value === 'number' && isFinite(value) ? Math.round(value) : 3;
      if (rounded < 1) return 1;
      if (rounded > SCORE_MAX) return SCORE_MAX;
      return rounded;
    }

    function newId(prefix) {
      return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function emptyDoc() {
      return {
        version: DOC_VERSION,
        subject: '',
        market: '',
        goal: '',
        brief: '',
        competitors: [],
        dimensions: [],
        ratings: {},
        insights: { findings: '', opportunities: '', risks: '', verdict: '' },
        updatedAt: 0,
      };
    }

    function blankCompetitor() {
      return { id: newId('c'), name: '', positioning: '', audience: '', price: '', strengths: '', weaknesses: '' };
    }

    function withDefaultDimensions(doc, entries) {
      if (doc.dimensions.length > 0 || entries.length === 0) return doc;
      return Object.assign({}, doc, { dimensions: entries });
    }

    /**
     * Keep only well-formed data, so a stale, hand-edited or foreign payload
     * cannot break the view. Ratings are rebuilt only for ids that survived.
     */
    function sanitize(raw) {
      const doc = emptyDoc();
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return doc;

      doc.subject = clampText(raw.subject);
      doc.market = clampText(raw.market);
      doc.goal = clampText(raw.goal);
      doc.brief = clampText(raw.brief);

      const usedCompetitorIds = {};
      const rawCompetitors = Array.isArray(raw.competitors) ? raw.competitors : [];
      for (let i = 0; i < rawCompetitors.length && doc.competitors.length < MAX_COMPETITORS; i += 1) {
        const item = rawCompetitors[i];
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        let id = typeof item.id === 'string' && item.id ? item.id.slice(0, 64) : '';
        if (!id || usedCompetitorIds[id]) id = newId('c');
        usedCompetitorIds[id] = true;
        const competitor = { id: id, name: clampText(item.name) };
        for (let f = 0; f < PROFILE_FIELDS.length; f += 1) {
          competitor[PROFILE_FIELDS[f].key] = clampText(item[PROFILE_FIELDS[f].key]);
        }
        doc.competitors.push(competitor);
      }

      const usedDimensionIds = {};
      const rawDimensions = Array.isArray(raw.dimensions) ? raw.dimensions : [];
      for (let i = 0; i < rawDimensions.length && doc.dimensions.length < MAX_DIMENSIONS; i += 1) {
        const item = rawDimensions[i];
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        let id = typeof item.id === 'string' && item.id ? item.id.slice(0, 64) : '';
        if (!id || usedDimensionIds[id]) id = newId('d');
        usedDimensionIds[id] = true;
        doc.dimensions.push({ id: id, name: clampText(item.name), weight: clampWeight(item.weight) });
      }

      const rawRatings = raw.ratings && typeof raw.ratings === 'object' && !Array.isArray(raw.ratings) ? raw.ratings : {};
      for (let c = 0; c < doc.competitors.length; c += 1) {
        const competitorId = doc.competitors[c].id;
        const rawRow = rawRatings[competitorId];
        const row = {};
        if (rawRow && typeof rawRow === 'object' && !Array.isArray(rawRow)) {
          for (let d = 0; d < doc.dimensions.length; d += 1) {
            const dimensionId = doc.dimensions[d].id;
            const value = rawRow[dimensionId];
            if (typeof value !== 'number' || !isFinite(value)) continue;
            const rounded = Math.round(value);
            if (rounded >= 1 && rounded <= SCORE_MAX) row[dimensionId] = rounded;
          }
        }
        doc.ratings[competitorId] = row;
      }

      const rawInsights = raw.insights && typeof raw.insights === 'object' && !Array.isArray(raw.insights) ? raw.insights : {};
      for (let i = 0; i < INSIGHT_FIELDS.length; i += 1) {
        doc.insights[INSIGHT_FIELDS[i].key] = clampText(rawInsights[INSIGHT_FIELDS[i].key]);
      }

      doc.updatedAt =
        typeof raw.updatedAt === 'number' && isFinite(raw.updatedAt) && raw.updatedAt > 0 ? raw.updatedAt : 0;
      return doc;
    }

    function scoreOf(doc, competitorId, dimensionId) {
      const row = doc.ratings ? doc.ratings[competitorId] : null;
      if (!row) return 0;
      const value = row[dimensionId];
      if (typeof value !== 'number' || !isFinite(value)) return 0;
      const rounded = Math.round(value);
      return rounded >= 1 && rounded <= SCORE_MAX ? rounded : 0;
    }

    /** Weighted average over the scored dimensions only, so partial data still ranks fairly. */
    function weightedScores(doc) {
      const result = [];
      for (let c = 0; c < doc.competitors.length; c += 1) {
        const competitor = doc.competitors[c];
        let sum = 0;
        let weightSum = 0;
        let rated = 0;
        for (let d = 0; d < doc.dimensions.length; d += 1) {
          const dimension = doc.dimensions[d];
          const score = scoreOf(doc, competitor.id, dimension.id);
          if (score === 0) continue;
          const weight = clampWeight(dimension.weight);
          sum += score * weight;
          weightSum += weight;
          rated += 1;
        }
        result.push({
          id: competitor.id,
          score: weightSum > 0 ? sum / weightSum : null,
          rated: rated,
          total: doc.dimensions.length,
        });
      }
      return result;
    }

    function scoreFor(scores, id) {
      for (let i = 0; i < scores.length; i += 1) {
        if (scores[i].id === id) return scores[i];
      }
      return null;
    }

    /** Dense ranking by weighted score; unranked ids are absent. */
    function rankMap(scores) {
      const ranked = [];
      for (let i = 0; i < scores.length; i += 1) {
        if (scores[i].score !== null) ranked.push(scores[i]);
      }
      ranked.sort((a, b) => b.score - a.score);
      const map = {};
      for (let i = 0; i < ranked.length; i += 1) map[ranked[i].id] = i + 1;
      return map;
    }

    function extremeDimensions(doc, competitorId) {
      let best = null;
      let worst = null;
      for (let i = 0; i < doc.dimensions.length; i += 1) {
        const dimension = doc.dimensions[i];
        const score = scoreOf(doc, competitorId, dimension.id);
        if (score === 0) continue;
        if (!best || score > best.score) best = { name: dimension.name, score: score };
        if (!worst || score < worst.score) worst = { name: dimension.name, score: score };
      }
      return { best: best, worst: worst };
    }

    function formatScore(value) {
      return value === null || typeof value !== 'number' || !isFinite(value) ? '—' : (Math.round(value * 10) / 10).toFixed(1);
    }

    /**
     * An ISO calendar date for a stored timestamp, or `fallback` when the value
     * is not a representable instant. `sanitize` bounds timestamps loosely, so a
     * hand-edited payload can still hold a value `toISOString` rejects.
     */
    function isoDate(timestamp, fallback) {
      if (typeof timestamp !== 'number' || !isFinite(timestamp) || timestamp <= 0) return fallback;
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return fallback;
      try {
        return date.toISOString().slice(0, 10);
      } catch (error) {
        return fallback;
      }
    }

    /* --------------------------------------------------------- markdown */

    function mdInline(text, fallback) {
      const value = (typeof text === 'string' ? text : '').replace(/\s*\r?\n\s*/g, ' ').trim();
      return value || fallback;
    }

    function mdCell(text, fallback) {
      const value = mdInline(text, '').replace(/\|/g, '\\|');
      return value || fallback;
    }

    function mdBullets(text, fallback) {
      const lines = (typeof text === 'string' ? text : '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length === 0) return fallback;
      const bullets = [];
      for (let i = 0; i < lines.length; i += 1) bullets.push('- ' + lines[i]);
      return bullets.join('\n');
    }

    /**
     * Render the whole analysis as a Markdown report. `L` is a plain map of
     * already-translated labels, so this stays a pure function of its inputs.
     */
    function toMarkdown(doc, L) {
      const lines = [];
      const subject = (doc.subject || '').trim() || L.untitled;
      lines.push('# ' + subject + ' · ' + L.heading);
      lines.push('');
      lines.push('- **' + L.market + '**: ' + ((doc.market || '').trim() || L.none));
      lines.push('- **' + L.goal + '**: ' + ((doc.goal || '').trim() || L.none));
      lines.push('- **' + L.updated + '**: ' + isoDate(doc.updatedAt, L.none));
      lines.push('');

      const scores = weightedScores(doc);
      const ranks = rankMap(scores);

      lines.push('## ' + L.overviewTitle);
      lines.push('');
      if ((doc.brief || '').trim()) {
        lines.push(doc.brief.trim());
        lines.push('');
      }
      if (doc.competitors.length === 0) {
        lines.push(L.none);
        lines.push('');
      } else {
        lines.push(
          '| ' + L.competitor + ' | ' + L.positioning + ' | ' + L.audience + ' | ' + L.price + ' | ' + L.weighted + ' |',
        );
        lines.push('| --- | --- | --- | --- | --- |');
        for (let c = 0; c < doc.competitors.length; c += 1) {
          const competitor = doc.competitors[c];
          const entry = scoreFor(scores, competitor.id);
          lines.push(
            '| ' +
              mdCell(competitor.name, L.unnamed) +
              ' | ' +
              mdCell(competitor.positioning, L.none) +
              ' | ' +
              mdCell(competitor.audience, L.none) +
              ' | ' +
              mdCell(competitor.price, L.none) +
              ' | ' +
              formatScore(entry ? entry.score : null) +
              ' |',
          );
        }
        lines.push('');
      }

      lines.push('## ' + L.matrixTitle);
      lines.push('');
      if (doc.competitors.length === 0 || doc.dimensions.length === 0) {
        lines.push(L.none);
        lines.push('');
      } else {
        const header = ['| ' + L.dimension + ' | ' + L.weight];
        for (let c = 0; c < doc.competitors.length; c += 1) header.push(mdCell(doc.competitors[c].name, L.unnamed));
        lines.push(header.join(' | ') + ' |');

        const separators = ['---', '---'];
        for (let c = 0; c < doc.competitors.length; c += 1) separators.push('---');
        lines.push('| ' + separators.join(' | ') + ' |');

        for (let d = 0; d < doc.dimensions.length; d += 1) {
          const dimension = doc.dimensions[d];
          const cells = ['| ' + mdCell(dimension.name, L.dimension) + ' | ' + clampWeight(dimension.weight)];
          for (let c = 0; c < doc.competitors.length; c += 1) {
            const score = scoreOf(doc, doc.competitors[c].id, dimension.id);
            cells.push(score > 0 ? String(score) : L.unrated);
          }
          lines.push(cells.join(' | ') + ' |');
        }

        const totals = ['| **' + L.weighted + '** | —'];
        for (let c = 0; c < doc.competitors.length; c += 1) {
          const entry = scoreFor(scores, doc.competitors[c].id);
          totals.push('**' + formatScore(entry ? entry.score : null) + '**');
        }
        lines.push(totals.join(' | ') + ' |');

        const rankCells = ['| ' + L.rank + ' | —'];
        for (let c = 0; c < doc.competitors.length; c += 1) {
          const rank = ranks[doc.competitors[c].id];
          rankCells.push(rank ? String(rank) : '—');
        }
        lines.push(rankCells.join(' | ') + ' |');
        lines.push('');
      }

      lines.push('## ' + L.profileTitle);
      lines.push('');
      if (doc.competitors.length === 0) {
        lines.push(L.none);
        lines.push('');
      } else {
        for (let c = 0; c < doc.competitors.length; c += 1) {
          const competitor = doc.competitors[c];
          lines.push('### ' + (c + 1) + '. ' + ((competitor.name || '').trim() || L.unnamed));
          lines.push('');
          lines.push('- **' + L.positioning + '**: ' + mdInline(competitor.positioning, L.none));
          lines.push('- **' + L.audience + '**: ' + mdInline(competitor.audience, L.none));
          lines.push('- **' + L.price + '**: ' + mdInline(competitor.price, L.none));
          lines.push('- **' + L.strengths + '**:');
          lines.push(mdBullets(competitor.strengths, L.none));
          lines.push('- **' + L.weaknesses + '**:');
          lines.push(mdBullets(competitor.weaknesses, L.none));
          lines.push('');
        }
      }

      lines.push('## ' + L.conclusionTitle);
      lines.push('');
      let wroteInsight = false;
      for (let i = 0; i < INSIGHT_FIELDS.length; i += 1) {
        const field = INSIGHT_FIELDS[i];
        const text = (doc.insights[field.key] || '').trim();
        if (!text) continue;
        wroteInsight = true;
        lines.push('### ' + L[field.key]);
        lines.push('');
        lines.push(text);
        lines.push('');
      }
      if (!wroteInsight) {
        lines.push(L.none);
        lines.push('');
      }

      return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
    }

    /** A complete worked example, so the first run shows what the workbench produces. */
    function sampleDoc(texts) {
      const dimensions = [];
      for (let i = 0; i < texts.dimensionNames.length; i += 1) {
        dimensions.push({ id: 'dim-' + (i + 1), name: texts.dimensionNames[i], weight: DEFAULT_DIMENSIONS[i].weight });
      }
      const first = Object.assign({ id: 'sample-c1' }, texts.competitor1);
      const second = Object.assign({ id: 'sample-c2' }, texts.competitor2);
      return {
        version: DOC_VERSION,
        subject: texts.subject,
        market: texts.market,
        goal: texts.goal,
        brief: texts.brief,
        competitors: [first, second],
        dimensions: dimensions,
        ratings: {
          'sample-c1': { 'dim-1': 5, 'dim-2': 3, 'dim-3': 4, 'dim-4': 5, 'dim-5': 4 },
          'sample-c2': { 'dim-1': 3, 'dim-2': 5, 'dim-3': 5, 'dim-4': 2, 'dim-5': 3 },
        },
        insights: {
          findings: texts.findings,
          opportunities: texts.opportunities,
          risks: texts.risks,
          verdict: texts.verdict,
        },
        updatedAt: 0,
      };
    }

    function loadDoc() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? sanitize(JSON.parse(raw)) : emptyDoc();
      } catch (error) {
        return emptyDoc();
      }
    }

    function saveDoc(doc) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch (error) {
        /* Storage is unavailable; the workbench keeps working for this page. */
      }
    }

    function setTimer(store, key, callback, ms) {
      if (store[key]) clearTimeout(store[key]);
      store[key] = setTimeout(() => {
        store[key] = null;
        callback();
      }, ms);
    }

    function clearTimers(store) {
      const keys = Object.keys(store);
      for (let i = 0; i < keys.length; i += 1) {
        if (store[keys[i]]) {
          clearTimeout(store[keys[i]]);
          store[keys[i]] = null;
        }
      }
    }

    /* ---------------------------------------------------------- artwork */

    /** The comparison-matrix glyph, inherited in `currentColor` so the host colors it. */
    function panelGlyph(size, active) {
      const stroke = active ? 1.6 : 1.4;
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('rect', {
          x: 2.4,
          y: 2.4,
          width: 15.2,
          height: 15.2,
          rx: 2.6,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: stroke,
        }),
        h('path', {
          d: 'M2.4 7.4h15.2M7.4 7.4v10.2M12.6 2.4v15.2',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: stroke,
          strokeLinecap: 'round',
        }),
        h('rect', { x: 13.1, y: 13.1, width: 4, height: 4, rx: 0.8, fill: 'currentColor' }),
      );
    }

    function arrowGlyph(direction) {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: direction === 'up' ? 'M4 9.4l4-4 4 4' : 'M4 6.6l4 4 4-4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    function crossGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 12 12', width: 11, height: 11, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: 'M2.5 2.5l7 7M9.5 2.5l-7 7',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return panelGlyph(size, !!(props && props.active));
    }

    /* ------------------------------------------------------------ styles */

    const CSS = [
      '.dsh-ca-root{display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding-top:var(--dsh-frame-top-clearance,0px)}',
      '.dsh-ca-head{display:flex;flex:none;align-items:center;gap:12px;padding:20px 24px 12px}',
      '.dsh-ca-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-ca-titles{min-width:0}',
      '.dsh-ca-title{margin:0;font-size:16px;font-weight:600;line-height:1.3}',
      '.dsh-ca-meta{margin:2px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-ca-spacer{flex:1}',
      '.dsh-ca-head-actions{display:flex;align-items:center;gap:8px}',
      '.dsh-ca-btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;',
      'cursor:pointer;transition:background .15s ease}',
      '.dsh-ca-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ca-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.dsh-ca-btn.primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}',
      '.dsh-ca-btn.danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ca-btn:focus-visible,.dsh-ca-tab:focus-visible,.dsh-ca-seg-btn:focus-visible,.dsh-ca-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-ca-plus{font-size:15px;line-height:1}',
      '.dsh-ca-tabs{display:flex;flex:none;gap:2px;padding:0 24px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ca-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:13px;',
      'padding:8px 12px;border-bottom:2px solid transparent;cursor:pointer}',
      '.dsh-ca-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.dsh-ca-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary);font-weight:600;border-bottom-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ca-scroll{flex:1;min-height:0;overflow:auto;padding:18px 24px 28px}',
      '.dsh-ca-panel{display:flex;flex-direction:column;gap:16px}',
      '.dsh-ca-grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}',
      '.dsh-ca-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}',
      '.dsh-ca-field{display:flex;flex-direction:column;gap:5px;min-width:0}',
      '.dsh-ca-field-label{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ca-input{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;',
      'background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:1.5;resize:vertical}',
      '.dsh-ca-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}',
      '.dsh-ca-input:focus{border-color:var(--dsw-alias-brand-primary);outline:none}',
      '.dsh-ca-input.compact{padding:5px 7px;font-size:12.5px}',
      '.dsh-ca-stats{display:flex;flex-wrap:wrap;gap:10px}',
      '.dsh-ca-stat{display:flex;flex-direction:column;gap:2px;min-width:104px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);',
      'border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ca-stat-value{font-size:18px;font-weight:600;line-height:1.1}',
      '.dsh-ca-stat-label{font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ca-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px}',
      '.dsh-ca-hint{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ca-h2{margin:0;font-size:14px;font-weight:600}',
      '.dsh-ca-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;align-items:start}',
      '.dsh-ca-card{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ca-card-head{display:flex;align-items:center;gap:8px}',
      '.dsh-ca-badge{display:grid;place-items:center;flex:none;width:22px;height:22px;border-radius:50%;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11.5px;font-weight:600}',
      '.dsh-ca-name{flex:1;min-width:0;padding:5px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13.5px;font-weight:600}',
      '.dsh-ca-name:focus{border-color:var(--dsw-alias-brand-primary);outline:none}',
      '.dsh-ca-card-actions{display:flex;flex:none;align-items:center;gap:2px}',
      '.dsh-ca-icon-btn{display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:13px;cursor:pointer}',
      '.dsh-ca-icon-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-ca-icon-btn:disabled{opacity:.35;cursor:not-allowed}',
      '.dsh-ca-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}',
      '.dsh-ca-table-wrap{overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ca-table{border-collapse:separate;border-spacing:0;width:100%;font-size:13px}',
      '.dsh-ca-table th,.dsh-ca-table td{padding:8px 10px;text-align:left;vertical-align:middle;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ca-table thead th{position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-layer-2);font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ca-table tbody tr:last-child th,.dsh-ca-table tbody tr:last-child td{border-bottom:0}',
      '.dsh-ca-dim-col{position:sticky;left:0;min-width:190px;background:var(--dsw-alias-bg-layer-1)}',
      'thead .dsh-ca-dim-col{z-index:3;background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ca-dim-inner{display:flex;flex-direction:column;gap:6px}',
      '.dsh-ca-weight{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ca-select{height:26px;padding:0 4px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px}',
      '.dsh-ca-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;overflow:hidden}',
      '.dsh-ca-seg-btn{width:26px;height:26px;padding:0;border:0;border-right:1px solid var(--dsw-alias-border-l1);background:transparent;',
      'color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer}',
      '.dsh-ca-seg-btn:last-child{border-right:0}',
      '.dsh-ca-seg-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-ca-seg-btn[aria-pressed="true"]{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}',
      '.dsh-ca-total-row th,.dsh-ca-total-row td{background:var(--dsw-alias-bg-layer-2);font-weight:600}',
      '.dsh-ca-total-cell{font-variant-numeric:tabular-nums}',
      '.dsh-ca-rank{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:11px;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dsh-ca-rank-top{background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-bg-base);font-weight:600}',
      '.dsh-ca-insight-row th,.dsh-ca-insight-row td{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ca-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:200px;',
      'border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dsh-ca-empty-title{font-size:14px;color:var(--dsw-alias-label-primary)}',
      '.dsh-ca-report-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.dsh-ca-preview{width:100%;box-sizing:border-box;min-height:260px;padding:12px;border:1px solid var(--dsw-alias-border-l1);',
      'border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);',
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.6;white-space:pre-wrap;resize:vertical}',
      '.dsh-ca-preview:focus{border-color:var(--dsw-alias-brand-primary);outline:none}',
      '.dsh-ca-status{margin:0;font-size:12.5px;color:var(--dsw-alias-state-success-primary)}',
      '@media (prefers-reduced-motion: reduce){.dsh-ca-btn,.dsh-ca-tab{transition:none}}',
    ].join('');

    /* -------------------------------------------------------- dictionaries */

    const DICT = {
      zh: {
        'panel.title': '竞品分析',
        'count.competitors': '家竞品',
        'count.dimensions': '个维度',
        'tab.overview': '概览',
        'tab.competitors': '竞品档案',
        'tab.matrix': '对比矩阵',
        'tab.report': '结论与报告',
        'overview.subject': '分析对象',
        'overview.subject.ph': '例如：我们的产品名称',
        'overview.market': '赛道',
        'overview.market.ph': '例如：团队协作笔记工具',
        'overview.goal': '分析目标',
        'overview.goal.ph': '例如：找到差异化切入点',
        'overview.brief': '关键结论',
        'overview.brief.ph': '用一两句话写下最重要的结论',
        'stats.competitors': '竞品数量',
        'stats.dimensions': '评估维度',
        'stats.coverage': '评分完成度',
        'competitors.add': '添加竞品',
        'competitors.remove': '删除竞品',
        'competitors.moveUp': '上移',
        'competitors.moveDown': '下移',
        'empty.title': '还没有竞品',
        'empty.hint': '添加竞品，或先载入一组示例数据看看效果',
        'empty.sample': '载入示例',
        'field.name': '竞品名称',
        'field.name.ph': '例如：竞品名称',
        'field.name.unnamed': '未命名竞品',
        'field.positioning': '定位',
        'field.positioning.ph': '一句话定位',
        'field.audience': '目标用户',
        'field.audience.ph': '主要面向谁',
        'field.price': '价格',
        'field.price.ph': '免费 / 订阅 / 报价',
        'field.strengths': '优势',
        'field.strengths.ph': '每行一条',
        'field.weaknesses': '劣势',
        'field.weaknesses.ph': '每行一条',
        'matrix.dimension': '维度',
        'matrix.dimensionName': '维度名称',
        'matrix.dimensionName.ph': '维度名称',
        'matrix.weight': '权重',
        'matrix.total': '加权得分',
        'matrix.rank': '排名',
        'matrix.competitor': '竞品',
        'matrix.addDimension': '添加维度',
        'matrix.removeDimension': '删除维度',
        'matrix.unrated': '未评分',
        'matrix.legend': '1 分最弱，5 分最强；再次点击同一分数可取消',
        'matrix.strongest': '相对领先',
        'matrix.weakest': '相对落后',
        'matrix.empty': '先到「竞品档案」添加竞品，再回来打分',
        'matrix.scoreLabel': '打分',
        'insights.findings': '关键发现',
        'insights.findings.ph': '数据说明了什么',
        'insights.opportunities': '差异化机会',
        'insights.opportunities.ph': '我们可以切入的空白点',
        'insights.risks': '风险与威胁',
        'insights.risks.ph': '对手可能如何反击',
        'insights.verdict': '结论与建议',
        'insights.verdict.ph': '接下来做什么',
        'report.preview': '报告预览',
        'report.copy': '复制 Markdown',
        'report.copied': '已复制',
        'report.copyFailed': '复制失败，请手动选择文本',
        'report.download': '下载 .md',
        'report.downloadFailed': '下载失败',
        'report.empty': '填写分析内容后即可导出',
        'report.untitled': '竞品分析',
        'report.none': '未填写',
        'report.fileSuffix': '竞品分析报告',
        'report.sec.overview': '竞品概览',
        'report.sec.matrix': '加权评分矩阵',
        'report.sec.profiles': '竞品档案',
        'report.sec.conclusion': '结论',
        'actions.sample': '载入示例',
        'actions.reset': '清空全部',
        'actions.resetConfirm': '再次点击确认清空',
        'meta.updated': '更新于',
        'status.sampleLoaded': '已载入示例数据',
        'status.reset': '已清空，维度恢复默认',
        'status.downloaded': '已开始下载',
        'dim.features': '功能完整度',
        'dim.pricing': '价格竞争力',
        'dim.experience': '用户体验',
        'dim.ecosystem': '技术与生态',
        'dim.support': '服务与支持',
        'sample.subject': '云雀笔记',
        'sample.market': '团队协作笔记与知识库',
        'sample.goal': '找到我们在团队知识库赛道的差异化切入点',
        'sample.brief': '头部竞品赢在文档深度与权限体系，轻量团队从记录到结构化沉淀之间仍缺少顺手的路径。',
        'sample.c1.name': '康达文档',
        'sample.c1.positioning': '以文档为中心的团队协作套件',
        'sample.c1.audience': '中大型企业的行政与研发团队',
        'sample.c1.price': '按席位订阅，¥90/人/月',
        'sample.c1.strengths': '文档能力成熟\n生态集成丰富\n企业权限体系完善',
        'sample.c1.weaknesses': '上手成本高\n私有化部署昂贵',
        'sample.c2.name': '云雀清单',
        'sample.c2.positioning': '轻量任务与文档协作',
        'sample.c2.audience': '中小团队与个人用户',
        'sample.c2.price': '免费版 + ¥25/人/月',
        'sample.c2.strengths': '上手快\n价格友好\n移动端体验好',
        'sample.c2.weaknesses': '知识库结构薄弱\n权限模型简单',
        'sample.findings': '竞品在功能深度上明显领先，但轻量团队的迁移与结构化沉淀缺少顺手的方案。',
        'sample.opportunities': '以「零配置结构化」切入：导入即生成可检索的知识库，不做权限与流程的额外负担。',
        'sample.risks': '头部竞品可能通过降价或免费版下探覆盖我们的价格带。',
        'sample.verdict': '聚焦中小团队的结构化沉淀场景，先用导入体验验证留存，再补齐权限模型。',
      },
      en: {
        'panel.title': 'Competitive Analysis',
        'count.competitors': 'competitors',
        'count.dimensions': 'dimensions',
        'tab.overview': 'Overview',
        'tab.competitors': 'Competitors',
        'tab.matrix': 'Matrix',
        'tab.report': 'Report',
        'overview.subject': 'Subject',
        'overview.subject.ph': 'e.g. our product',
        'overview.market': 'Market',
        'overview.market.ph': 'e.g. collaborative note tools',
        'overview.goal': 'Objective',
        'overview.goal.ph': 'e.g. find our differentiation',
        'overview.brief': 'Key findings',
        'overview.brief.ph': 'Sum up the headline conclusion in a sentence or two',
        'stats.competitors': 'Competitors',
        'stats.dimensions': 'Dimensions',
        'stats.coverage': 'Score coverage',
        'competitors.add': 'Add competitor',
        'competitors.remove': 'Remove competitor',
        'competitors.moveUp': 'Move up',
        'competitors.moveDown': 'Move down',
        'empty.title': 'No competitors yet',
        'empty.hint': 'Add a competitor, or load sample data to see how the workbench reads',
        'empty.sample': 'Load sample',
        'field.name': 'Competitor name',
        'field.name.ph': 'e.g. rival product',
        'field.name.unnamed': 'Unnamed competitor',
        'field.positioning': 'Positioning',
        'field.positioning.ph': 'One-line positioning',
        'field.audience': 'Target users',
        'field.audience.ph': 'Who it targets',
        'field.price': 'Pricing',
        'field.price.ph': 'Free / subscription / quote',
        'field.strengths': 'Strengths',
        'field.strengths.ph': 'One per line',
        'field.weaknesses': 'Weaknesses',
        'field.weaknesses.ph': 'One per line',
        'matrix.dimension': 'Dimension',
        'matrix.dimensionName': 'Dimension name',
        'matrix.dimensionName.ph': 'Dimension name',
        'matrix.weight': 'Weight',
        'matrix.total': 'Weighted score',
        'matrix.rank': 'Rank',
        'matrix.competitor': 'Competitor',
        'matrix.addDimension': 'Add dimension',
        'matrix.removeDimension': 'Remove dimension',
        'matrix.unrated': 'n/a',
        'matrix.legend': '1 is weakest, 5 is strongest; click the same score again to clear it',
        'matrix.strongest': 'Relative strength',
        'matrix.weakest': 'Relative weakness',
        'matrix.empty': 'Add competitors on the Competitors tab, then come back to score them',
        'matrix.scoreLabel': 'Score',
        'insights.findings': 'Key findings',
        'insights.findings.ph': 'What the data shows',
        'insights.opportunities': 'Differentiation opportunities',
        'insights.opportunities.ph': 'Gaps we can own',
        'insights.risks': 'Risks and threats',
        'insights.risks.ph': 'How rivals may respond',
        'insights.verdict': 'Conclusion and recommendation',
        'insights.verdict.ph': 'What we should do next',
        'report.preview': 'Report preview',
        'report.copy': 'Copy Markdown',
        'report.copied': 'Copied',
        'report.copyFailed': 'Copy failed — select the text manually',
        'report.download': 'Download .md',
        'report.downloadFailed': 'Download failed',
        'report.empty': 'Fill in the analysis to enable export',
        'report.untitled': 'Competitive analysis',
        'report.none': 'Not provided',
        'report.fileSuffix': 'competitive-analysis',
        'report.sec.overview': 'Competitor overview',
        'report.sec.matrix': 'Weighted scoring matrix',
        'report.sec.profiles': 'Competitor profiles',
        'report.sec.conclusion': 'Conclusion',
        'actions.sample': 'Load sample',
        'actions.reset': 'Reset all',
        'actions.resetConfirm': 'Click again to confirm',
        'meta.updated': 'Updated',
        'status.sampleLoaded': 'Sample data loaded',
        'status.reset': 'Cleared; default dimensions restored',
        'status.downloaded': 'Download started',
        'dim.features': 'Feature coverage',
        'dim.pricing': 'Pricing power',
        'dim.experience': 'User experience',
        'dim.ecosystem': 'Tech and ecosystem',
        'dim.support': 'Service and support',
        'sample.subject': 'LarkNote',
        'sample.market': 'Team notes and knowledge base',
        'sample.goal': 'Find our differentiation in team knowledge tools',
        'sample.brief': 'Leaders win on document depth and permissions, yet lightweight teams still lack an easy path from capture to structured knowledge.',
        'sample.c1.name': 'Kanda Docs',
        'sample.c1.positioning': 'Document-centric team collaboration suite',
        'sample.c1.audience': 'Ops and engineering teams in mid-to-large firms',
        'sample.c1.price': 'Per-seat subscription, ¥90/seat/mo',
        'sample.c1.strengths': 'Mature document engine\nRich ecosystem integrations\nEnterprise-grade permissions',
        'sample.c1.weaknesses': 'Steep learning curve\nExpensive self-hosted deployment',
        'sample.c2.name': 'LarkList',
        'sample.c2.positioning': 'Lightweight tasks plus docs',
        'sample.c2.audience': 'Small teams and individuals',
        'sample.c2.price': 'Free tier + ¥25/seat/mo',
        'sample.c2.strengths': 'Fast onboarding\nFriendly pricing\nStrong mobile experience',
        'sample.c2.weaknesses': 'Thin knowledge-base structure\nSimple permission model',
        'sample.findings': 'Rivals clearly lead on depth, but lightweight teams have no comfortable path from capture to structure.',
        'sample.opportunities': 'Enter through zero-config structure: import once and get a searchable knowledge base, with no permission or workflow overhead.',
        'sample.risks': 'Leaders may move down-market with a cheaper or free tier that covers our price band.',
        'sample.verdict': 'Focus on structured capture for small teams, validate retention with the import experience first, then broaden permissions.',
      },
    };

    /* -------------------------------------------------------------- module */

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'competitive-analysis: dictionaries');

        const t = ctx.locale.bind(NS);

        function defaultDimensions() {
          return DEFAULT_DIMENSIONS.map((item, index) => ({ id: 'dim-' + (index + 1), name: t(item.key), weight: item.weight }));
        }

        function sampleTexts() {
          return {
            subject: t('sample.subject'),
            market: t('sample.market'),
            goal: t('sample.goal'),
            brief: t('sample.brief'),
            dimensionNames: [
              t('dim.features'),
              t('dim.pricing'),
              t('dim.experience'),
              t('dim.ecosystem'),
              t('dim.support'),
            ],
            competitor1: {
              name: t('sample.c1.name'),
              positioning: t('sample.c1.positioning'),
              audience: t('sample.c1.audience'),
              price: t('sample.c1.price'),
              strengths: t('sample.c1.strengths'),
              weaknesses: t('sample.c1.weaknesses'),
            },
            competitor2: {
              name: t('sample.c2.name'),
              positioning: t('sample.c2.positioning'),
              audience: t('sample.c2.audience'),
              price: t('sample.c2.price'),
              strengths: t('sample.c2.strengths'),
              weaknesses: t('sample.c2.weaknesses'),
            },
            findings: t('sample.findings'),
            opportunities: t('sample.opportunities'),
            risks: t('sample.risks'),
            verdict: t('sample.verdict'),
          };
        }

        function reportLabels() {
          return {
            heading: t('panel.title'),
            untitled: t('report.untitled'),
            none: t('report.none'),
            market: t('overview.market'),
            goal: t('overview.goal'),
            updated: t('meta.updated'),
            competitor: t('matrix.competitor'),
            positioning: t('field.positioning'),
            audience: t('field.audience'),
            price: t('field.price'),
            strengths: t('field.strengths'),
            weaknesses: t('field.weaknesses'),
            unnamed: t('field.name.unnamed'),
            dimension: t('matrix.dimension'),
            weight: t('matrix.weight'),
            weighted: t('matrix.total'),
            rank: t('matrix.rank'),
            unrated: t('matrix.unrated'),
            overviewTitle: t('report.sec.overview'),
            matrixTitle: t('report.sec.matrix'),
            profileTitle: t('report.sec.profiles'),
            conclusionTitle: t('report.sec.conclusion'),
            findings: t('insights.findings'),
            opportunities: t('insights.opportunities'),
            risks: t('insights.risks'),
            verdict: t('insights.verdict'),
          };
        }

        function Panel() {
          const activeLocale = ctx.locale.getLocale().active;

          const [doc, setDoc] = React.useState(() => withDefaultDimensions(loadDoc(), defaultDimensions()));
          const [tab, setTab] = React.useState('overview');
          const [status, setStatus] = React.useState('');
          const [copied, setCopied] = React.useState(false);
          const [armed, setArmed] = React.useState(false);

          const previewRef = React.useRef(null);
          const tabRefs = React.useRef({});
          const timers = React.useRef({});

          React.useEffect(() => {
            saveDoc(doc);
          }, [doc]);

          React.useEffect(
            () => () => {
              clearTimers(timers.current);
            },
            [],
          );

          function noteStatus(message, key, ms) {
            setStatus(message);
            setTimer(timers.current, key, () => setStatus(''), ms);
          }

          function patchDoc(partial) {
            setDoc((previous) => Object.assign({}, previous, partial, { updatedAt: Date.now() }));
          }

          function patchInsight(key, value) {
            setDoc((previous) =>
              Object.assign({}, previous, {
                insights: Object.assign({}, previous.insights, { [key]: value }),
                updatedAt: Date.now(),
              }),
            );
          }

          function patchCompetitor(id, partial) {
            setDoc((previous) =>
              Object.assign({}, previous, {
                competitors: previous.competitors.map((item) =>
                  item.id === id ? Object.assign({}, item, partial) : item,
                ),
                updatedAt: Date.now(),
              }),
            );
          }

          function addCompetitor() {
            setDoc((previous) => {
              if (previous.competitors.length >= MAX_COMPETITORS) return previous;
              return Object.assign({}, previous, {
                competitors: previous.competitors.concat([blankCompetitor()]),
                updatedAt: Date.now(),
              });
            });
            setTab('competitors');
          }

          function removeCompetitor(id) {
            setDoc((previous) => {
              const ratings = Object.assign({}, previous.ratings);
              delete ratings[id];
              return Object.assign({}, previous, {
                competitors: previous.competitors.filter((item) => item.id !== id),
                ratings: ratings,
                updatedAt: Date.now(),
              });
            });
          }

          function moveCompetitor(id, delta) {
            setDoc((previous) => {
              const index = previous.competitors.findIndex((item) => item.id === id);
              const target = index + delta;
              if (index < 0 || target < 0 || target >= previous.competitors.length) return previous;
              const competitors = previous.competitors.slice();
              const moved = competitors.splice(index, 1)[0];
              competitors.splice(target, 0, moved);
              return Object.assign({}, previous, { competitors: competitors, updatedAt: Date.now() });
            });
          }

          function setScore(competitorId, dimensionId, value) {
            setDoc((previous) => {
              const row = Object.assign({}, previous.ratings[competitorId] || {});
              if (scoreOf(previous, competitorId, dimensionId) === value) delete row[dimensionId];
              else row[dimensionId] = value;
              return Object.assign({}, previous, {
                ratings: Object.assign({}, previous.ratings, { [competitorId]: row }),
                updatedAt: Date.now(),
              });
            });
          }

          function addDimension() {
            setDoc((previous) => {
              if (previous.dimensions.length >= MAX_DIMENSIONS) return previous;
              return Object.assign({}, previous, {
                dimensions: previous.dimensions.concat([{ id: newId('d'), name: '', weight: 3 }]),
                updatedAt: Date.now(),
              });
            });
          }

          function patchDimension(id, partial) {
            setDoc((previous) =>
              Object.assign({}, previous, {
                dimensions: previous.dimensions.map((item) =>
                  item.id === id ? Object.assign({}, item, partial) : item,
                ),
                updatedAt: Date.now(),
              }),
            );
          }

          function removeDimension(id) {
            setDoc((previous) => {
              const ratings = {};
              for (let c = 0; c < previous.competitors.length; c += 1) {
                const competitorId = previous.competitors[c].id;
                const row = Object.assign({}, previous.ratings[competitorId] || {});
                delete row[id];
                ratings[competitorId] = row;
              }
              return Object.assign({}, previous, {
                dimensions: previous.dimensions.filter((item) => item.id !== id),
                ratings: ratings,
                updatedAt: Date.now(),
              });
            });
          }

          function loadSampleData() {
            const seeded = sampleDoc(sampleTexts());
            setDoc(Object.assign({}, seeded, { updatedAt: Date.now() }));
            noteStatus(t('status.sampleLoaded'), 'status', 2600);
          }

          function resetAll() {
            if (!armed) {
              setArmed(true);
              noteStatus(t('actions.resetConfirm'), 'armed', 4000);
              setTimer(timers.current, 'armedFlag', () => setArmed(false), 4000);
              return;
            }
            setArmed(false);
            setDoc(Object.assign(emptyDoc(), { dimensions: defaultDimensions(), updatedAt: Date.now() }));
            noteStatus(t('status.reset'), 'status', 2600);
          }

          function reportFileName() {
            /* `a/b` and `../x` must not become a path, and a leading dot makes the
             * file hidden, so separators collapse to `-` and edge dots are dropped. */
            const base = ((doc.subject || '').trim() || t('report.untitled'))
              .replace(/[\\/:*?"<>|\s]+/g, '-')
              .replace(/^[-.]+|[-.]+$/g, '')
              .slice(0, 48);
            return (base || 'report') + '-' + t('report.fileSuffix') + '.md';
          }

          function selectReport() {
            const element = previewRef.current;
            if (!element) return;
            element.focus();
            if (typeof element.select === 'function') element.select();
          }

          function copyReport() {
            const failed = () => {
              selectReport();
              setStatus(t('report.copyFailed'));
            };
            const done = () => {
              setCopied(true);
              noteStatus(t('report.copied'), 'copied', 2400);
              setTimer(timers.current, 'copiedFlag', () => setCopied(false), 2400);
            };
            if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(markdown).then(done, failed);
            } else {
              failed();
            }
          }

          function downloadReport() {
            try {
              const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = reportFileName();
              link.rel = 'noopener';
              link.click();
              setTimer(timers.current, 'revoke', () => URL.revokeObjectURL(url), 1000);
              noteStatus(t('status.downloaded'), 'status', 2600);
            } catch (error) {
              setStatus(t('report.downloadFailed'));
            }
          }

          function onTabKeyDown(event, index) {
            const moves = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
            let next = null;
            if (Object.prototype.hasOwnProperty.call(moves, event.key)) {
              next = (index + moves[event.key] + TABS.length) % TABS.length;
            } else if (event.key === 'Home') {
              next = 0;
            } else if (event.key === 'End') {
              next = TABS.length - 1;
            }
            if (next === null) return;
            event.preventDefault();
            setTab(TABS[next].id);
            const element = tabRefs.current[TABS[next].id];
            if (element) element.focus();
          }

          const TABS = [
            { id: 'overview', label: 'tab.overview' },
            { id: 'competitors', label: 'tab.competitors' },
            { id: 'matrix', label: 'tab.matrix' },
            { id: 'report', label: 'tab.report' },
          ];

          const labels = reportLabels();
          const markdown = toMarkdown(doc, labels);
          const scores = weightedScores(doc);
          const ranks = rankMap(scores);

          const hasContent =
            doc.competitors.length > 0 ||
            ['subject', 'market', 'goal', 'brief'].some((key) => (doc[key] || '').trim().length > 0) ||
            INSIGHT_FIELDS.some((field) => (doc.insights[field.key] || '').trim().length > 0);

          function labeledControl(config) {
            const control =
              config.rows > 1
                ? h('textarea', {
                    className: 'dsh-ca-input',
                    value: config.value,
                    placeholder: config.placeholder,
                    rows: config.rows,
                    spellCheck: 'false',
                    onChange: (event) => config.onChange(event.target.value),
                  })
                : h('input', {
                    className: 'dsh-ca-input',
                    type: 'text',
                    value: config.value,
                    placeholder: config.placeholder,
                    spellCheck: 'false',
                    onChange: (event) => config.onChange(event.target.value),
                  });
            return h(
              'label',
              { className: 'dsh-ca-field', key: config.fieldKey },
              h('span', { className: 'dsh-ca-field-label' }, config.text),
              control,
            );
          }

          function renderStat(label, value) {
            return h(
              'div',
              { className: 'dsh-ca-stat', key: label },
              h('span', { className: 'dsh-ca-stat-value' }, value),
              h('span', { className: 'dsh-ca-stat-label' }, label),
            );
          }

          function renderEmpty() {
            return h(
              'div',
              { className: 'dsh-ca-empty' },
              h('div', { className: 'dsh-ca-empty-title' }, t('empty.title')),
              h('p', { className: 'dsh-ca-hint' }, t('empty.hint')),
              h(
                'div',
                { className: 'dsh-ca-toolbar' },
                h('button', { type: 'button', className: 'dsh-ca-btn primary', onClick: addCompetitor }, t('competitors.add')),
                h('button', { type: 'button', className: 'dsh-ca-btn', onClick: loadSampleData }, t('empty.sample')),
              ),
            );
          }

          function renderOverview() {
            let ratedCells = 0;
            for (let i = 0; i < scores.length; i += 1) ratedCells += scores[i].rated;
            const totalCells = doc.competitors.length * doc.dimensions.length;
            const coverage = totalCells > 0 ? Math.round((ratedCells / totalCells) * 100) : 0;
            return h(
              'div',
              { className: 'dsh-ca-panel' },
              h(
                'div',
                { className: 'dsh-ca-grid3' },
                labeledControl({
                  fieldKey: 'subject',
                  text: t('overview.subject'),
                  value: doc.subject,
                  placeholder: t('overview.subject.ph'),
                  rows: 1,
                  onChange: (value) => patchDoc({ subject: value }),
                }),
                labeledControl({
                  fieldKey: 'market',
                  text: t('overview.market'),
                  value: doc.market,
                  placeholder: t('overview.market.ph'),
                  rows: 1,
                  onChange: (value) => patchDoc({ market: value }),
                }),
                labeledControl({
                  fieldKey: 'goal',
                  text: t('overview.goal'),
                  value: doc.goal,
                  placeholder: t('overview.goal.ph'),
                  rows: 1,
                  onChange: (value) => patchDoc({ goal: value }),
                }),
              ),
              h(
                'div',
                { className: 'dsh-ca-stats' },
                renderStat(t('stats.competitors'), String(doc.competitors.length)),
                renderStat(t('stats.dimensions'), String(doc.dimensions.length)),
                renderStat(t('stats.coverage'), coverage + '%'),
              ),
              labeledControl({
                fieldKey: 'brief',
                text: t('overview.brief'),
                value: doc.brief,
                placeholder: t('overview.brief.ph'),
                rows: 4,
                onChange: (value) => patchDoc({ brief: value }),
              }),
            );
          }

          function renderCompetitor(competitor, index) {
            return h(
              'article',
              { className: 'dsh-ca-card', key: competitor.id },
              h(
                'header',
                { className: 'dsh-ca-card-head' },
                h('span', { className: 'dsh-ca-badge', 'aria-hidden': 'true' }, String(index + 1)),
                h('input', {
                  className: 'dsh-ca-name',
                  type: 'text',
                  value: competitor.name,
                  placeholder: t('field.name.ph'),
                  'aria-label': t('field.name'),
                  spellCheck: 'false',
                  onChange: (event) => patchCompetitor(competitor.id, { name: event.target.value }),
                }),
                h(
                  'div',
                  { className: 'dsh-ca-card-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-ca-icon-btn',
                      title: t('competitors.moveUp'),
                      'aria-label': t('competitors.moveUp'),
                      disabled: index === 0,
                      onClick: () => moveCompetitor(competitor.id, -1),
                    },
                    arrowGlyph('up'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-ca-icon-btn',
                      title: t('competitors.moveDown'),
                      'aria-label': t('competitors.moveDown'),
                      disabled: index === doc.competitors.length - 1,
                      onClick: () => moveCompetitor(competitor.id, 1),
                    },
                    arrowGlyph('down'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-ca-icon-btn',
                      title: t('competitors.remove'),
                      'aria-label': t('competitors.remove'),
                      onClick: () => removeCompetitor(competitor.id),
                    },
                    crossGlyph(),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'dsh-ca-fields' },
                PROFILE_FIELDS.map((field) =>
                  labeledControl({
                    fieldKey: field.key,
                    text: t(field.label),
                    value: competitor[field.key],
                    placeholder: t(field.placeholder),
                    rows: field.rows,
                    onChange: (value) => patchCompetitor(competitor.id, { [field.key]: value }),
                  }),
                ),
              ),
            );
          }

          function renderCompetitors() {
            return h(
              'div',
              { className: 'dsh-ca-panel' },
              h(
                'div',
                { className: 'dsh-ca-toolbar' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ca-btn primary',
                    disabled: doc.competitors.length >= MAX_COMPETITORS,
                    onClick: addCompetitor,
                  },
                  h('span', { className: 'dsh-ca-plus', 'aria-hidden': 'true' }, '+'),
                  t('competitors.add'),
                ),
                h('span', { className: 'dsh-ca-spacer' }),
                h('span', { className: 'dsh-ca-hint' }, doc.competitors.length + ' ' + t('count.competitors')),
              ),
              doc.competitors.length === 0
                ? renderEmpty()
                : h('div', { className: 'dsh-ca-cards' }, doc.competitors.map(renderCompetitor)),
            );
          }

          function renderScoreControl(competitor, dimension) {
            const current = scoreOf(doc, competitor.id, dimension.id);
            return h(
              'div',
              {
                className: 'dsh-ca-seg',
                role: 'group',
                'aria-label':
                  (competitor.name || t('field.name.unnamed')) + ' · ' + (dimension.name || t('matrix.dimensionName')),
              },
              WEIGHTS.map((value) =>
                h(
                  'button',
                  {
                    key: value,
                    type: 'button',
                    className: 'dsh-ca-seg-btn',
                    'aria-pressed': current === value ? 'true' : 'false',
                    'aria-label': t('matrix.scoreLabel') + ' ' + value,
                    onClick: () => setScore(competitor.id, dimension.id, value),
                  },
                  String(value),
                ),
              ),
            );
          }

          function renderMatrixToolbar() {
            return h(
              'div',
              { className: 'dsh-ca-toolbar' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-ca-btn',
                  disabled: doc.dimensions.length >= MAX_DIMENSIONS,
                  onClick: addDimension,
                },
                h('span', { className: 'dsh-ca-plus', 'aria-hidden': 'true' }, '+'),
                t('matrix.addDimension'),
              ),
              h('span', { className: 'dsh-ca-hint' }, t('matrix.legend')),
            );
          }

          function renderMatrix() {
            if (doc.competitors.length === 0) {
              return h(
                'div',
                { className: 'dsh-ca-panel' },
                renderMatrixToolbar(),
                h(
                  'div',
                  { className: 'dsh-ca-empty' },
                  h('div', { className: 'dsh-ca-empty-title' }, t('matrix.empty')),
                  h(
                    'button',
                    { type: 'button', className: 'dsh-ca-btn', onClick: () => setTab('competitors') },
                    t('tab.competitors'),
                  ),
                ),
              );
            }

            const head = h(
              'thead',
              null,
              h(
                'tr',
                null,
                h('th', { scope: 'col', className: 'dsh-ca-dim-col' }, t('matrix.dimension')),
                doc.competitors.map((competitor) =>
                  h(
                    'th',
                    { key: competitor.id, scope: 'col' },
                    competitor.name || t('field.name.unnamed'),
                  ),
                ),
              ),
            );

            const rows = doc.dimensions.map((dimension) =>
              h(
                'tr',
                { key: dimension.id },
                h(
                  'th',
                  { scope: 'row', className: 'dsh-ca-dim-col' },
                  h(
                    'div',
                    { className: 'dsh-ca-dim-inner' },
                    h('input', {
                      className: 'dsh-ca-input compact',
                      type: 'text',
                      value: dimension.name,
                      placeholder: t('matrix.dimensionName.ph'),
                      'aria-label': t('matrix.dimensionName'),
                      spellCheck: 'false',
                      onChange: (event) => patchDimension(dimension.id, { name: event.target.value }),
                    }),
                    h(
                      'div',
                      { className: 'dsh-ca-weight' },
                      h('span', { className: 'dsh-ca-weight-label' }, t('matrix.weight')),
                      h(
                        'select',
                        {
                          className: 'dsh-ca-select',
                          value: String(dimension.weight),
                          'aria-label': t('matrix.weight'),
                          onChange: (event) => patchDimension(dimension.id, { weight: Number(event.target.value) }),
                        },
                        WEIGHTS.map((value) => h('option', { key: value, value: String(value) }, String(value))),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-ca-icon-btn',
                          title: t('matrix.removeDimension'),
                          'aria-label': t('matrix.removeDimension'),
                          onClick: () => removeDimension(dimension.id),
                        },
                        crossGlyph(),
                      ),
                    ),
                  ),
                ),
                doc.competitors.map((competitor) =>
                  h('td', { key: competitor.id }, renderScoreControl(competitor, dimension)),
                ),
              ),
            );

            const totalRow = h(
              'tr',
              { className: 'dsh-ca-total-row' },
              h('th', { scope: 'row', className: 'dsh-ca-dim-col' }, t('matrix.total')),
              doc.competitors.map((competitor) => {
                const entry = scoreFor(scores, competitor.id);
                return h(
                  'td',
                  { key: competitor.id, className: 'dsh-ca-total-cell' },
                  formatScore(entry ? entry.score : null),
                );
              }),
            );

            const rankRow = h(
              'tr',
              { className: 'dsh-ca-rank-row' },
              h('th', { scope: 'row', className: 'dsh-ca-dim-col' }, t('matrix.rank')),
              doc.competitors.map((competitor) => {
                const rank = ranks[competitor.id];
                return h(
                  'td',
                  { key: competitor.id },
                  h('span', { className: rank === 1 ? 'dsh-ca-rank dsh-ca-rank-top' : 'dsh-ca-rank' }, rank ? String(rank) : '—'),
                );
              }),
            );

            function extremeRow(key, label, pick) {
              return h(
                'tr',
                { className: 'dsh-ca-insight-row', key: key },
                h('th', { scope: 'row', className: 'dsh-ca-dim-col' }, label),
                doc.competitors.map((competitor) => {
                  const entry = pick(extremeDimensions(doc, competitor.id));
                  return h(
                    'td',
                    { key: competitor.id },
                    entry && entry.name ? entry.name + ' · ' + entry.score : t('matrix.unrated'),
                  );
                }),
              );
            }

            return h(
              'div',
              { className: 'dsh-ca-panel' },
              renderMatrixToolbar(),
              h(
                'div',
                { className: 'dsh-ca-table-wrap' },
                h(
                  'table',
                  { className: 'dsh-ca-table' },
                  head,
                  h(
                    'tbody',
                    null,
                    rows,
                    totalRow,
                    rankRow,
                    extremeRow('strongest', t('matrix.strongest'), (pair) => pair.best),
                    extremeRow('weakest', t('matrix.weakest'), (pair) => pair.worst),
                  ),
                ),
              ),
            );
          }

          function renderReport() {
            return h(
              'div',
              { className: 'dsh-ca-panel' },
              h(
                'div',
                { className: 'dsh-ca-grid2' },
                INSIGHT_FIELDS.map((field) =>
                  labeledControl({
                    fieldKey: field.key,
                    text: t(field.label),
                    value: doc.insights[field.key],
                    placeholder: t(field.placeholder),
                    rows: 4,
                    onChange: (value) => patchInsight(field.key, value),
                  }),
                ),
              ),
              h(
                'div',
                { className: 'dsh-ca-report-head' },
                h('h2', { className: 'dsh-ca-h2' }, t('report.preview')),
                h('span', { className: 'dsh-ca-spacer' }),
                h(
                  'button',
                  { type: 'button', className: 'dsh-ca-btn', disabled: !hasContent, onClick: copyReport },
                  copied ? t('report.copied') : t('report.copy'),
                ),
                h(
                  'button',
                  { type: 'button', className: 'dsh-ca-btn', disabled: !hasContent, onClick: downloadReport },
                  t('report.download'),
                ),
              ),
              hasContent ? null : h('p', { className: 'dsh-ca-hint' }, t('report.empty')),
              h('textarea', {
                className: 'dsh-ca-preview',
                value: markdown,
                readOnly: true,
                spellCheck: 'false',
                ref: previewRef,
                'aria-label': t('report.preview'),
              }),
              status ? h('p', { className: 'dsh-ca-status', role: 'status' }, status) : null,
            );
          }

          function metaLine() {
            const parts = [];
            const subject = (doc.subject || '').trim();
            if (subject) parts.push(subject);
            parts.push(doc.competitors.length + ' ' + t('count.competitors'));
            parts.push(doc.dimensions.length + ' ' + t('count.dimensions'));
            if (isoDate(doc.updatedAt, null)) {
              let stamp = '';
              try {
                stamp = new Date(doc.updatedAt).toLocaleString(activeLocale, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              } catch (error) {
                stamp = new Date(doc.updatedAt).toLocaleString();
              }
              parts.push(t('meta.updated') + ' ' + stamp);
            }
            return parts.join(' · ');
          }

          return h(
            'div',
            { className: 'dsh-ca-root' },
            h('style', { key: 'styles' }, CSS),
            h(
              'header',
              { className: 'dsh-ca-head', key: 'head' },
              h('span', { className: 'dsh-ca-mark', 'aria-hidden': 'true' }, panelGlyph(18, true)),
              h(
                'div',
                { className: 'dsh-ca-titles' },
                h('h1', { className: 'dsh-ca-title' }, t('panel.title')),
                h('p', { className: 'dsh-ca-meta' }, metaLine()),
              ),
              h('span', { className: 'dsh-ca-spacer' }),
              h(
                'div',
                { className: 'dsh-ca-head-actions' },
                h('button', { type: 'button', className: 'dsh-ca-btn', onClick: loadSampleData }, t('actions.sample')),
                h(
                  'button',
                  { type: 'button', className: armed ? 'dsh-ca-btn danger' : 'dsh-ca-btn', onClick: resetAll },
                  armed ? t('actions.resetConfirm') : t('actions.reset'),
                ),
              ),
            ),
            h(
              'div',
              { className: 'dsh-ca-tabs', role: 'tablist', 'aria-label': t('panel.title'), key: 'tabs' },
              TABS.map((item, index) =>
                h(
                  'button',
                  {
                    key: item.id,
                    type: 'button',
                    role: 'tab',
                    id: 'dsh-ca-tab-' + item.id,
                    className: 'dsh-ca-tab',
                    'aria-selected': tab === item.id ? 'true' : 'false',
                    /* Only the mounted tabpanel exists, so a hidden tab must not
                     * point at another tab's id. */
                    'aria-controls': tab === item.id ? 'dsh-ca-panel-' + item.id : undefined,
                    tabIndex: tab === item.id ? 0 : -1,
                    ref: (element) => {
                      tabRefs.current[item.id] = element;
                    },
                    onClick: () => setTab(item.id),
                    onKeyDown: (event) => onTabKeyDown(event, index),
                  },
                  t(item.label),
                ),
              ),
            ),
            h(
              'div',
              { className: 'dsh-ca-scroll', key: 'scroll' },
              h(
                'div',
                {
                  className: 'dsh-ca-tabpanel',
                  role: 'tabpanel',
                  id: 'dsh-ca-panel-' + tab,
                  'aria-labelledby': 'dsh-ca-tab-' + tab,
                },
                tab === 'overview'
                  ? renderOverview()
                  : tab === 'competitors'
                    ? renderCompetitors()
                    : tab === 'matrix'
                      ? renderMatrix()
                      : renderReport(),
              ),
            ),
          );
        }

        /* The panel row: the label doubles as visible text, accessible name and rail tooltip. */
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 30, label: () => t('panel.title') },
            PanelIcon,
          ),
        );

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Panel));
      },

      /**
       * Offline check seam: pure data-in / data-out helpers, so the document
       * model and the Markdown report can be unit-tested without a browser or a
       * React renderer. The Client loader only reads `inject` and `apply`.
       */
      __pure: {
        emptyDoc: emptyDoc,
        blankCompetitor: blankCompetitor,
        sanitize: sanitize,
        scoreOf: scoreOf,
        weightedScores: weightedScores,
        rankMap: rankMap,
        extremeDimensions: extremeDimensions,
        toMarkdown: toMarkdown,
        sampleDoc: sampleDoc,
        withDefaultDimensions: withDefaultDimensions,
      },
    };
  },
});