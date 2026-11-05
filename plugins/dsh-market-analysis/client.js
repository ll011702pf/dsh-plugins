/**
 * Client half of the Market Analysis bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `market-analysis`. The market document — markets, overview figures, history,
 * segments, players, trends and sources — is browser-owned and persists in
 * localStorage; the Host half registers nothing.
 *
 * Plain browser JavaScript loaded by the harness module loader; `require` is
 * only ever called with 'react'.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-market-analysis',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'marketAnalysis';
    const PANEL_ID = 'market-analysis';
    const STORAGE_KEY = 'dsh.market-analysis.doc.v1';
    const DOC_VERSION = 1;
    const TOAST_MS = 2600;

    const MAX_MARKETS = 40;
    const MAX_ROWS = 60;
    const MAX_BULLETS = 20;

    /* ---- artwork ------------------------------------------------------------
     * These six accents and the impact-dot tints are the artwork of this panel,
     * so they carry literal colours. Every piece of chrome around them
     * (surfaces, borders, labels, buttons, bars' tracks, focus rings, empty
     * states) uses host theme tokens. */
    const ACCENTS = ['#2f7d6b', '#3d7bb8', '#c9772f', '#8a5fb0', '#b3543f', '#2f8a52'];
    const IMPACT_ON = '#e0a12a';

    const SECTIONS = [
      { id: 'overview', key: 'tab.overview' },
      { id: 'segments', key: 'tab.segments' },
      { id: 'competition', key: 'tab.competition' },
      { id: 'trends', key: 'tab.trends' },
      { id: 'report', key: 'tab.report' },
    ];

    let seq = 0;

    function nowMs() {
      return Date.now();
    }

    function uid(prefix) {
      seq += 1;
      return prefix + nowMs().toString(36) + seq.toString(36);
    }

    /* ---- scalars ----------------------------------------------------------- */

    function isNum(value) {
      return typeof value === 'number' && isFinite(value);
    }

    /** A finite number from a JSON value, or `fallback`. */
    function num(value, fallback) {
      if (isNum(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (isFinite(parsed)) return parsed;
      }
      return fallback;
    }

    function clampRange(value, min, max, fallback) {
      const parsed = num(value, fallback);
      if (!isFinite(parsed)) return fallback;
      if (parsed < min) return min;
      if (parsed > max) return max;
      return parsed;
    }

    /** Only an absolute http(s) URL may reach an anchor href. */
    function isSafeUrl(value) {
      return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
    }

    /** A trimmed, length-capped string; non-strings become ''. */
    function str(value, limit) {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();
      return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed;
    }

    function roundTo(value, digits) {
      const factor = Math.pow(10, digits);
      return Math.round(value * factor) / factor;
    }

    /** Fixed-point text with trailing zeros stripped; never prints '-0'. */
    function trimNum(value, digits) {
      const places = typeof digits === 'number' ? digits : 1;
      let text = roundTo(isNum(value) ? value : 0, places).toFixed(places);
      text = text.replace(/\.0+$/, '');
      if (text === '-0') text = '0';
      return text;
    }

    /** '1,234' or ' 12 ' -> number, anything else -> null (a user input field). */
    function parseNum(value) {
      if (typeof value !== 'string') return null;
      const text = value.trim().replace(/[,，\s]/g, '');
      if (!text) return null;
      const parsed = Number(text);
      return isFinite(parsed) ? parsed : null;
    }

    /** '24.5' or '24.5%' -> 0.245, anything else -> null (a percent input field). */
    function parsePct(value) {
      if (typeof value !== 'string') return null;
      const text = value.trim().replace(/[,，\s%％]/g, '');
      if (!text) return null;
      const parsed = Number(text);
      return isFinite(parsed) ? parsed / 100 : null;
    }

    /* ---- formatting -------------------------------------------------------- */

    /**
     * Million USD into a short localized label. The large unit differs per
     * language — Chinese 亿 is 10^8 (÷100) while English "B" is 10^9 (÷1000) —
     * so the divisor travels with the localized unit rather than being fixed.
     */
    function formatMoney(value, t) {
      const amount = isNum(value) ? value : 0;
      const large = Math.abs(amount) >= 1000;
      const divisor = large ? Number(t('unit.largeDivisor')) || 100 : 1;
      const text = trimNum(amount / divisor, 1);
      const unit = large ? t('unit.largeUnit') : t('unit.million');
      return t('unit.moneyPattern').replace('{value}', text).replace('{unit}', unit);
    }

    /** A fraction as a percent string, keeping exactly `digits` decimals. */
    function formatPercent(value, digits) {
      const amount = isNum(value) ? value : 0;
      const places = typeof digits === 'number' ? digits : 1;
      let text = roundTo(amount * 100, places).toFixed(places);
      if (/^-0(\.0+)?$/.test(text)) text = text.slice(1);
      return text + '%';
    }

    /* ---- document model ---------------------------------------------------- */

    function defaultDoc() {
      return { version: DOC_VERSION, activeId: '', markets: [] };
    }

    function blankMarket(id) {
      const stamp = nowMs();
      return {
        id: id || uid('m'),
        name: '',
        asOf: String(new Date().getFullYear()),
        overview: {
          size: 0,
          sizeYear: new Date().getFullYear(),
          cagr: 0,
          cagrWindow: '',
          forecastSize: 0,
          forecastYear: new Date().getFullYear() + 5,
          drivers: [],
          risks: [],
        },
        history: [],
        segments: [],
        players: [],
        trends: [],
        sources: [],
        createdAt: stamp,
        updatedAt: stamp,
      };
    }

    function sanitizeStrings(raw, limit) {
      const out = [];
      if (!Array.isArray(raw)) return out;
      for (let i = 0; i < raw.length && out.length < MAX_BULLETS; i += 1) {
        const text = str(raw[i], limit);
        if (text) out.push(text);
      }
      return out;
    }

    function sanitizeHistory(raw) {
      const byYear = {};
      if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 1) {
          const point = raw[i];
          if (!point || typeof point !== 'object') continue;
          const year = Math.round(num(point.year, NaN));
          if (!isFinite(year) || year < 1900 || year > 2200) continue;
          byYear[year] = clampRange(point.size, 0, 1e12, 0);
        }
      }
      const years = Object.keys(byYear)
        .map(Number)
        .sort(function (a, b) {
          return a - b;
        });
      return years.map(function (year) {
        return { year: year, size: byYear[year] };
      });
    }

    function sanitizeSegments(raw) {
      const out = [];
      const seen = {};
      if (!Array.isArray(raw)) return out;
      for (let i = 0; i < raw.length && out.length < MAX_ROWS; i += 1) {
        const entry = raw[i];
        if (!entry || typeof entry !== 'object') continue;
        let id = typeof entry.id === 'string' && entry.id ? entry.id : uid('s');
        if (seen[id]) id = uid('s');
        seen[id] = true;
        out.push({
          id: id,
          name: str(entry.name, 120),
          size: clampRange(entry.size, 0, 1e12, 0),
          yoy: clampRange(entry.yoy, -1, 5, 0),
          margin: clampRange(entry.margin, 0, 1, 0),
          players: Math.round(clampRange(entry.players, 0, 1000000, 0)),
        });
      }
      return out;
    }

    function sanitizePlayers(raw) {
      const out = [];
      const seen = {};
      if (!Array.isArray(raw)) return out;
      for (let i = 0; i < raw.length && out.length < MAX_ROWS; i += 1) {
        const entry = raw[i];
        if (!entry || typeof entry !== 'object') continue;
        let id = typeof entry.id === 'string' && entry.id ? entry.id : uid('p');
        if (seen[id]) id = uid('p');
        seen[id] = true;
        out.push({
          id: id,
          name: str(entry.name, 120),
          hq: str(entry.hq, 60),
          share: clampRange(entry.share, 0, 1, 0),
          revenue: clampRange(entry.revenue, 0, 1e12, 0),
          year: Math.round(clampRange(entry.year, 1900, 2200, new Date().getFullYear())),
          note: str(entry.note, 400),
        });
      }
      return out;
    }

    function sanitizeTrends(raw) {
      const out = [];
      const seen = {};
      if (!Array.isArray(raw)) return out;
      for (let i = 0; i < raw.length && out.length < MAX_ROWS; i += 1) {
        const entry = raw[i];
        if (!entry || typeof entry !== 'object') continue;
        let id = typeof entry.id === 'string' && entry.id ? entry.id : uid('t');
        if (seen[id]) id = uid('t');
        seen[id] = true;
        out.push({
          id: id,
          name: str(entry.name, 120),
          impact: Math.round(clampRange(entry.impact, 1, 5, 3)),
          horizon: str(entry.horizon, 40),
          evidence: str(entry.evidence, 400),
        });
      }
      return out;
    }

    function sanitizeSources(raw) {
      const out = [];
      const seen = {};
      if (!Array.isArray(raw)) return out;
      for (let i = 0; i < raw.length && out.length < MAX_ROWS; i += 1) {
        const entry = raw[i];
        if (!entry || typeof entry !== 'object') continue;
        let id = typeof entry.id === 'string' && entry.id ? entry.id : uid('r');
        if (seen[id]) id = uid('r');
        seen[id] = true;
        out.push({
          id: id,
          title: str(entry.title, 200),
          url: str(entry.url, 300),
          asOf: str(entry.asOf, 24),
        });
      }
      return out;
    }

    function sanitizeMarket(raw, used) {
      const market = blankMarket();
      if (!raw || typeof raw !== 'object') {
        used[market.id] = true;
        return market;
      }
      let id = typeof raw.id === 'string' && raw.id ? raw.id : uid('m');
      if (used[id]) id = uid('m');
      used[id] = true;

      const overview = raw.overview && typeof raw.overview === 'object' ? raw.overview : {};
      market.id = id;
      market.name = str(raw.name, 120);
      market.asOf = str(raw.asOf, 24);
      market.overview = {
        size: clampRange(overview.size, 0, 1e12, 0),
        sizeYear: Math.round(clampRange(overview.sizeYear, 1900, 2200, new Date().getFullYear())),
        cagr: clampRange(overview.cagr, -1, 100, 0),
        cagrWindow: str(overview.cagrWindow, 40),
        forecastSize: clampRange(overview.forecastSize, 0, 1e12, 0),
        forecastYear: Math.round(clampRange(overview.forecastYear, 1900, 2200, new Date().getFullYear())),
        drivers: sanitizeStrings(overview.drivers, 200),
        risks: sanitizeStrings(overview.risks, 200),
      };
      market.history = sanitizeHistory(raw.history);
      market.segments = sanitizeSegments(raw.segments);
      market.players = sanitizePlayers(raw.players);
      market.trends = sanitizeTrends(raw.trends);
      market.sources = sanitizeSources(raw.sources);
      market.createdAt = num(raw.createdAt, nowMs());
      market.updatedAt = num(raw.updatedAt, market.createdAt);
      return market;
    }

    /** Total sanitizer: a malformed document degrades to an empty one, never throws. */
    function sanitizeDoc(raw) {
      if (!raw || typeof raw !== 'object') return defaultDoc();
      const markets = [];
      const used = {};
      const list = Array.isArray(raw.markets) ? raw.markets : [];
      for (let i = 0; i < list.length && markets.length < MAX_MARKETS; i += 1) {
        markets.push(sanitizeMarket(list[i], used));
      }
      if (markets.length === 0) return defaultDoc();
      let activeId = typeof raw.activeId === 'string' ? raw.activeId : '';
      let matched = false;
      for (let i = 0; i < markets.length; i += 1) {
        if (markets[i].id === activeId) {
          matched = true;
          break;
        }
      }
      if (!matched) activeId = markets[0].id;
      return { version: DOC_VERSION, activeId: activeId, markets: markets };
    }

    function activeMarketOf(doc) {
      if (!doc || doc.markets.length === 0) return null;
      for (let i = 0; i < doc.markets.length; i += 1) {
        if (doc.markets[i].id === doc.activeId) return doc.markets[i];
      }
      return doc.markets[0];
    }

    function marketIndex(doc, id) {
      for (let i = 0; i < doc.markets.length; i += 1) {
        if (doc.markets[i].id === id) return i;
      }
      return -1;
    }

    function findRow(list, id) {
      if (!id) return null;
      for (let i = 0; i < list.length; i += 1) {
        if (list[i].id === id) return list[i];
      }
      return null;
    }

    /** Replace the row with `id`, or append `row` when it is not there yet. */
    function upsertRow(list, id, row) {
      if (!id) return list.concat([row]);
      let found = false;
      const next = list.map(function (entry) {
        if (entry.id !== id) return entry;
        found = true;
        return row;
      });
      return found ? next : list.concat([row]);
    }

    /* ---- pure metrics ------------------------------------------------------- */

    function segmentTotal(market) {
      let total = 0;
      for (let i = 0; i < market.segments.length; i += 1) total += market.segments[i].size;
      return total;
    }

    function weightedYoy(market) {
      let total = 0;
      let weighted = 0;
      for (let i = 0; i < market.segments.length; i += 1) {
        const segment = market.segments[i];
        total += segment.size;
        weighted += segment.size * segment.yoy;
      }
      return total > 0 ? weighted / total : 0;
    }

    function segmentShares(market) {
      const total = segmentTotal(market);
      const out = [];
      for (let i = 0; i < market.segments.length; i += 1) {
        const segment = market.segments[i];
        out.push({ id: segment.id, share: total > 0 ? segment.size / total : 0 });
      }
      return out;
    }

    function playerShareSum(market) {
      let sum = 0;
      for (let i = 0; i < market.players.length; i += 1) sum += market.players[i].share;
      return sum;
    }

    /** Sum of the top `n` shares, descending; ties never change the value. */
    function cr(market, n) {
      const shares = market.players.map(function (player) {
        return player.share;
      });
      shares.sort(function (a, b) {
        return b - a;
      });
      let sum = 0;
      for (let i = 0; i < shares.length && i < n; i += 1) sum += shares[i];
      return sum;
    }

    /** Herfindahl-Hirschman index on the 0..10000 scale. */
    function hhi(market) {
      let sum = 0;
      for (let i = 0; i < market.players.length; i += 1) {
        const points = market.players[i].share * 100;
        sum += points * points;
      }
      return sum;
    }

    function concentrationKey(market) {
      const value = hhi(market);
      if (value > 2500) return 'high';
      if (value >= 1500) return 'mid';
      return 'low';
    }

    function historyDelta(market) {
      const out = [];
      for (let i = 1; i < market.history.length; i += 1) {
        const from = market.history[i - 1];
        const to = market.history[i];
        out.push({ from: from.year, to: to.year, growth: from.size > 0 ? (to.size - from.size) / from.size : 0 });
      }
      return out;
    }

    function rankPlayers(market) {
      const list = market.players.slice();
      list.sort(function (a, b) {
        if (b.share !== a.share) return b.share - a.share;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      return list;
    }

    function marketMarkdown(market, t) {
      const lines = [];
      const none = t('report.none');
      const overview = market.overview;
      /* zh uses full-width label punctuation; en keeps the ASCII colon. */
      const colon = t('report.colon');
      const label = function (name, value) {
        return '- ' + name + colon + value;
      };
      const paren = function (text) {
        return t('report.parenOpen') + text + t('report.parenClose');
      };

      lines.push('# ' + (market.name || t('panel.untitled')));
      lines.push('');
      lines.push('> ' + t('report.metaPrefix') + ' ' + (market.asOf || none) + ' · ' + t('report.metaUnit'));
      lines.push('');

      lines.push('## ' + t('overview.title'));
      lines.push(label(t('overview.size'), formatMoney(overview.size, t) + paren(overview.sizeYear)));
      lines.push(label(t('overview.cagr'), formatPercent(overview.cagr) + paren(overview.cagrWindow || none)));
      lines.push(label(t('overview.forecast'), formatMoney(overview.forecastSize, t) + paren(overview.forecastYear)));
      lines.push(label(t('overview.weightedYoy'), formatPercent(weightedYoy(market))));
      lines.push(label(t('overview.playerCount'), String(market.players.length)));
      lines.push('');
      lines.push('### ' + t('overview.drivers'));
      if (overview.drivers.length === 0) lines.push('- ' + none);
      for (let i = 0; i < overview.drivers.length; i += 1) lines.push('- ' + overview.drivers[i]);
      lines.push('');
      lines.push('### ' + t('overview.risks'));
      if (overview.risks.length === 0) lines.push('- ' + none);
      for (let i = 0; i < overview.risks.length; i += 1) lines.push('- ' + overview.risks[i]);
      lines.push('');

      lines.push('## ' + t('segments.title'));
      if (market.segments.length === 0) {
        lines.push(none);
      } else {
        lines.push(
          '| ' +
            t('segments.colName') +
            ' | ' +
            t('segments.size') +
            ' | ' +
            t('segments.share') +
            ' | ' +
            t('segments.yoy') +
            ' | ' +
            t('segments.margin') +
            ' | ' +
            t('segments.players') +
            ' |',
        );
        lines.push('| --- | --- | --- | --- | --- | --- |');
        const shares = segmentShares(market);
        for (let i = 0; i < market.segments.length; i += 1) {
          const segment = market.segments[i];
          lines.push(
            '| ' +
              mdCell(segment.name, t('segments.untitled')) +
              ' | ' +
              formatMoney(segment.size, t) +
              ' | ' +
              formatPercent(shares[i].share) +
              ' | ' +
              formatPercent(segment.yoy) +
              ' | ' +
              formatPercent(segment.margin) +
              ' | ' +
              segment.players +
              ' |',
          );
        }
        lines.push(
          '| **' +
            t('segments.total') +
            '** | ' +
            formatMoney(segmentTotal(market), t) +
            ' | ' +
            formatPercent(segmentTotal(market) > 0 ? 1 : 0) +
            ' | ' +
            formatPercent(weightedYoy(market)) +
            ' | — | — |',
        );
      }
      lines.push('');

      lines.push('## ' + t('competition.title'));
      lines.push(
        '- ' +
          t('report.competitionLine')
            .replace('{cr3}', formatPercent(cr(market, 3)))
            .replace('{cr5}', formatPercent(cr(market, 5)))
            .replace('{hhi}', trimNum(hhi(market), 0))
            .replace('{conc}', t('competition.concentration.' + concentrationKey(market))),
      );
      lines.push('');
      if (market.players.length === 0) {
        lines.push(none);
      } else {
        lines.push(
          '| ' +
            t('competition.player') +
            ' | ' +
            t('competition.share') +
            ' | ' +
            t('competition.revenue') +
            ' | ' +
            t('competition.hq') +
            ' | ' +
            t('competition.note') +
            ' |',
        );
        lines.push('| --- | --- | --- | --- | --- |');
        const ranked = rankPlayers(market);
        for (let i = 0; i < ranked.length; i += 1) {
          const player = ranked[i];
          lines.push(
            '| ' +
              mdCell(player.name, t('competition.untitled')) +
              ' | ' +
              formatPercent(player.share) +
              ' | ' +
              formatMoney(player.revenue, t) +
              ' | ' +
              mdCell(player.hq, '—') +
              ' | ' +
              mdCell(player.note, '—') +
              ' |',
          );
        }
      }
      lines.push('');

      lines.push('## ' + t('trends.title'));
      if (market.trends.length === 0) {
        lines.push(none);
      } else {
        for (let i = 0; i < market.trends.length; i += 1) {
          const trend = market.trends[i];
          lines.push('### ' + (trend.name || t('trends.untitled')));
          lines.push(label(t('trends.impact'), trend.impact + '/5'));
          lines.push(label(t('trends.horizon'), trend.horizon || none));
          lines.push(label(t('trends.evidence'), trend.evidence || none));
          lines.push('');
        }
      }

      lines.push('## ' + t('sources.title'));
      if (market.sources.length === 0) {
        lines.push(none);
      } else {
        for (let i = 0; i < market.sources.length; i += 1) {
          const source = market.sources[i];
          const sourceLabel = source.title || t('sources.untitled');
          lines.push(
            '- ' + sourceLabel + (source.asOf ? paren(source.asOf) : '') + (source.url ? ' ' + source.url : ''),
          );
        }
      }
      lines.push('');

      return lines.join('\n');
    }

    function mdCell(text, fallback) {
      const value = typeof text === 'string' && text ? text : fallback;
      return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    }

    /* ---- built-in sample ---------------------------------------------------
     * One market, fully filled, so the workbench can be explored before any
     * data is entered. Figures and their sources are documented in DELIVERY.md.
     * --------------------------------------------------------------------- */
    /* SAMPLE-START */
    /*
     * Built-in sample: global EV charging infrastructure. Figures come from the
     * sources listed in the market's `sources` array; every derived number is
     * marked '推算' in the note or bullet that carries it. See DELIVERY.md for
     * the provenance table.
     */
    function sampleMarket() {
      const stamp = nowMs();
      return {
        id: uid('m'),
        name: '全球电动汽车充电桩市场',
        asOf: '2025',
        overview: {
          size: 56000,
          sizeYear: 2025,
          cagr: 0.2198,
          cagrWindow: '2024-2033',
          forecastSize: 274490,
          forecastYear: 2033,
          drivers: [
            '公共充电网络加速铺开：2025 年全球新增约 180 万个公共充电桩，同比增长超 33%，存量突破 700 万个（IEA GEVO 2026）',
            '中国以外市场补课式扩张：美国 2025 年新增公共桩创历史新高，快充/超快充桩增至近 7 万个（IEA GEVO 2026）',
            '电动车保有量高速增长：全球电动车市场预计由 2024 年 13,280.8 亿美元增至 2030 年 65,239.7 亿美元，CAGR 32.5%（Grand View Research）',
            '政策与补贴强制部署：欧盟 AFIR 覆盖率要求、美国 NEVI 计划 50 亿美元、英国 OZEV 工作场所充电补贴最高 75%（IEA / GVR / MRFR）',
          ],
          risks: [
            '利用率不足：美国公共快充行业平均利用率约 10–15%，哥伦布、圣路易斯等都会区仅 6.8%–9.3%，回收周期被拉长（Paren Q1 2025）',
            '补贴资金不确定：美国 NEVI 拨款自 2025 年 2 月至 2026 年 1 月暂停，未支出余额前景不明（IEA GEVO 2026）',
            '运营商盈利承压：ChargePoint FY2026 收入 4.11 亿美元、同比 -1%；ABB E-mobility 2025 年二季度仍亏损 4,200 万美元（ChargePoint / ABB）',
            '电网接入与安装成本高企，欧洲许可周期曾被拉长 12–18 个月（GMI / MRFR）',
          ],
        },
        history: [
          { year: 2021, size: 19514 },
          { year: 2022, size: 25758 },
          { year: 2023, size: 34259 },
          { year: 2024, size: 45910 },
          { year: 2025, size: 56000 },
        ],
        segments: [
          { id: uid('s'), name: '公共直流快充', size: 23520, yoy: 0.31, margin: 0.25, players: 40 },
          { id: uid('s'), name: '家用/住宅交流充电', size: 10400, yoy: 0.18, margin: 0.3, players: 60 },
          { id: uid('s'), name: '充电软件与运营服务(CaaS)', size: 8400, yoy: 0.19, margin: 0.55, players: 80 },
          { id: uid('s'), name: '目的地与工作场所交流慢充', size: 7680, yoy: 0.15, margin: 0.28, players: 55 },
          { id: uid('s'), name: '车队与公交场站充电', size: 6000, yoy: 0.28, margin: 0.22, players: 30 },
        ],
        players: [
          {
            id: uid('p'),
            name: 'Tesla (Supercharger)',
            hq: '美国',
            share: 0.08,
            revenue: 3500,
            year: 2025,
            note: '全球最大直流快充网络与 NACS 标准主导者；份额取 MRFR 给出的 7–10% 区间中值，GMI 另估其在充电即服务(CaaS)市场占 19.6%。推算：特斯拉未单独披露超充收入，3,500 百万美元为其「Services and other」收入中归属超充的估算，2025 年该项收入同比增加 20 亿美元、增幅 19%（s13）。',
          },
          {
            id: uid('p'),
            name: 'ChargePoint',
            hq: '美国',
            share: 0.02,
            revenue: 411,
            year: 2025,
            note: '北美最大开放平台充电网络运营商，FY2026（截至 2026-01-31）收入 4.112 亿美元、同比 -1%，其中订阅收入 1.624 亿美元、同比 +13%，GAAP 毛利率 31%。份额 2% 取自 GMI 的 1.7%（CaaS 口径）。',
          },
          {
            id: uid('p'),
            name: 'ABB E-mobility',
            hq: '瑞士',
            share: 0.05,
            revenue: 462,
            year: 2025,
            note: '大功率直流充电技术领先者（Terra 系列最高 360kW），与全球主机厂深度绑定。收入为 ABB 财报中「E-mobility、非核心及已剥离业务」合并口径 4.62 亿美元（非纯 E-mobility 单列），2024 年为 5.58 亿美元。',
          },
          {
            id: uid('p'),
            name: 'TELD 特来电',
            hq: '中国',
            share: 0.19,
            revenue: 680,
            year: 2024,
            note: '中国公共充电桩运营规模第一，2025 年 5 月运营约 77.8 万台公共桩、份额约 19%；2024 年营业收入 48.91 亿元人民币、归母净利润 2.08 亿元。推算：680 百万美元系按 7.2 汇率由人民币折算，非原始披露美元数。',
          },
          {
            id: uid('p'),
            name: '星星充电 Star Charge (万帮数字能源)',
            hq: '中国',
            share: 0.169,
            revenue: 490,
            year: 2024,
            note: '中国第二大公共充电运营商，2025 年 5 月约 68.6 万台公共桩、份额约 16.9%，覆盖 350+ 城市、800+ 国家与地区合作协议为中国运营商中海外足迹最广者。推算：490 百万美元收入为按中国市场规模与份额估算，万帮未在可比口径下公开该数。',
          },
          {
            id: uid('p'),
            name: 'EVgo',
            hq: '美国',
            share: 0.024,
            revenue: 384,
            year: 2025,
            note: '全美最大公共快充网络之一，FY2025 收入 3.841 亿美元、同比 +50%，其中充电网络收入 2.183 亿美元、同比 +40%，年底在运充电位 5,100 个；份额 2.4% 取自 GMI（CaaS 口径）。',
          },
        ],
        trends: [
          {
            id: uid('t'),
            name: '超快充与兆瓦级功率竞赛',
            impact: 4,
            horizon: '1-3 年',
            evidence: 'IEA 数据显示中国快充与超快充桩由 2024 年 150 万个增至 2025 年 220 万个（+40%），全球公共桩平均功率由逾 40kW 升至近 50kW，超快充成本 2022–2024 年下降 20%；2026 年 4 月 BYD 在巴黎正式把兆瓦级「闪充」网络引入欧洲（s9）。',
          },
          {
            id: uid('t'),
            name: 'NACS 成为北美事实标准与即插即充',
            impact: 4,
            horizon: '1-2 年',
            evidence: '福特、通用、现代等主机厂已确认未来车型集成 NACS 接口，行业正从 CCS 向 NACS 统一过渡，运营商同步推出 CCS+NACS 双接口桩以避免适配器依赖（s10）。',
          },
          {
            id: uid('t'),
            name: 'V2G/V2H 双向充电商业化落地',
            impact: 3,
            horizon: '3-5 年',
            evidence: '2026 年双向充电由试点转入商用：宝马与 E.ON 在德国为 iX3 推出首个商用 V2G 产品，福特联合 Octopus Energy 自 2026 年夏在德国上线 V2G 套餐，奔驰亦为纯电 GLC 发布双向充电方案（s9）。',
          },
        ],
        sources: [
          {
            id: uid('r'),
            title: 'IEA Global EV Outlook 2026 — Electric vehicle charging (Ch.6/10)',
            url: 'https://www.iea.org/reports/global-ev-outlook-2026/electric-vehicle-charging-chap-6-and-10',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'Precedence Research — EV Charging Infrastructure Market (USD 45.91bn 2024, USD 274.49bn 2033, CAGR 23.13%)',
            url: 'https://finance.yahoo.com/news/electric-vehicle-charging-infrastructure-market-095700574.html',
            asOf: '2024',
          },
          {
            id: uid('r'),
            title: 'Market Research Future — EV Charging Station Market (USD 25.5bn 2025; DC fast 42% share; residential USD 10.4bn)',
            url: 'https://www.marketresearchfuture.com/reports/electric-vehicle-charging-station-market-5401',
            asOf: '2025',
          },
          {
            id: uid('r'),
            title: 'Global Market Insights — EV Charging as a Service Market (USD 8.4bn 2025, CAGR 18.8%)',
            url: 'https://www.gminsights.com/industry-analysis/ev-charging-as-a-service-market',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'ChargePoint — Q4 & Full Fiscal Year 2026 Results (FY26 revenue USD 411.2M)',
            url: 'https://www.chargepoint.com/about/news/chargepoint-reports-fourth-quarter-and-full-fiscal-year-2026-financial-results',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'EVgo — Full Year 2025 Results (revenue USD 384.1M, +50% YoY)',
            url: 'https://investors.evgo.com/news-releases/news-release-details/evgo-inc-reports-record-fourth-quarter-and-full-year-2025',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: '天下工场研究 — 2026 中国充电基础设施市场竞争格局（EVCIPA 数据：公共桩 471.7 万台；TELD 19%、星星充电 16.9%）',
            url: 'https://faxiangongchang.com/en/reports/china-ev-charger-2026',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'ABB — Financial Report 2025 (E-mobility, non-core and divested revenues USD 462M)',
            url: 'https://library.e.abb.com/public/b32991481e8b4418a5c5261c5ff25440/ABB%20Financial%20Report%202025.pdf',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'Eleport — EV Charging Innovations and Industry Trends in 2026 (BYD Flash Charging, BMW/E.ON V2G)',
            url: 'https://eleport.com/ev-charging-innovations',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'Blink Charging — EV Innovation Trends Shaping 2026 (CCS→NACS transition)',
            url: 'https://blinkcharging.com/blog/ev-market-innovation-trends-shaping-2026',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'Paren — US EV Fast Charging State of the Industry Q1 2025（都会区利用率 6.8%–34.1%）',
            url: 'https://www.paren.app/reports/state-of-the-industry-report-us-ev-fast-charging-q1-2025',
            asOf: '2025',
          },
          {
            id: uid('r'),
            title: 'Ken Research — China EV Charging Infrastructure Market 2026-2031（2025 年 248 亿美元，CAGR 23.83%）',
            url: 'https://www.kenresearch.com/china-electric-vehicle-charging-infrastructure-market',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'Tesla — Form 10-K for fiscal year ended 2025-12-31 (Services and other revenue +USD 2.00bn, +19%)',
            url: 'https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm',
            asOf: '2026',
          },
          {
            id: uid('r'),
            title: 'IMARC — EV Charging Station Market（2025 年 AC 桩占比 88.1%、固定桩 93.2%、亚太 54.5%）',
            url: 'https://www.imarcgroup.com/electric-vehicle-charging-station-market',
            asOf: '2025',
          },
          {
            id: uid('r'),
            title: 'TELD 特来电 — 2024 年营业收入 48.91 亿元、归母净利润 2.08 亿元',
            url: 'https://baike.baidu.com/en/item/TELD%20NEW%20ENERGY%20Co.%2C%20Ltd./20599',
            asOf: '2025',
          },
        ],
        createdAt: stamp,
        updatedAt: stamp,
      };
    }
    /* SAMPLE-END */

    function sampleDoc() {
      const market = sampleMarket();
      return { version: DOC_VERSION, activeId: market.id, markets: [market] };
    }

    /* ---- storage ----------------------------------------------------------- */

    function loadDoc() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return sanitizeDoc(JSON.parse(raw));
      } catch (error) {
        return null;
      }
    }

    function saveDoc(doc) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch (error) {
        /* Storage is unavailable; the panel keeps working for this page. */
      }
    }

    /** A filename-safe stem from the market name; falls back to a literal. */
    function slugOf(name) {
      const source = typeof name === 'string' ? name.trim() : '';
      if (!source) return 'market';
      const slug = source
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      return slug || 'market';
    }

    function dateStamp(date) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return (
        String(date.getFullYear()) + (month < 10 ? '0' : '') + month + (day < 10 ? '0' : '') + day
      );
    }

    /** Blob download; the object URL is always revoked. */
    function downloadText(filename, text, mime) {
      try {
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        anchor.click();
        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        return false;
      }
    }

    /* ---- glyphs ------------------------------------------------------------ */

    /** The market glyph: four ascending bars under a trend line. */
    function panelGlyph(size, active) {
      const edge = active ? 1.8 : 1.5;
      const bars = { fill: 'currentColor', opacity: 0.92, rx: 0.9 };
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('rect', Object.assign({ x: 2.5, y: 11, width: 2.6, height: 6.2 }, bars)),
        h('rect', Object.assign({ x: 6.5, y: 8.6, width: 2.6, height: 8.6 }, bars)),
        h('rect', Object.assign({ x: 10.5, y: 10.2, width: 2.6, height: 7 }, bars)),
        h('rect', Object.assign({ x: 14.5, y: 6.2, width: 2.6, height: 11 }, bars)),
        h('path', {
          d: 'M3 7.4 6.6 5l3.1 1.4L15.9 3',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: edge,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return panelGlyph(size, !!(props && props.active));
    }

    function closeGlyph(size) {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: 'M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
      );
    }

    function chevronGlyph(size) {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: 'M4 6.2 8 10.2l4-4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /* ---- styles ------------------------------------------------------------ */

    const CSS = [
      '.dsh-ma-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px);color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-header{display:flex;flex:none;align-items:center;gap:12px;padding:16px 24px 8px}',
      '.dsh-ma-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-titles{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.dsh-ma-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-subtitle{font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-spacer{flex:1;min-width:0}',
      '.dsh-ma-name{flex:0 1 268px;min-width:140px;height:30px;box-sizing:border-box;padding:0 10px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px}',
      '.dsh-ma-name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-ma-action{display:inline-flex;flex:none;align-items:center;gap:6px;height:30px;padding:0 12px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer;',
      'transition:background .15s ease,border-color .15s ease}',
      '.dsh-ma-action:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ma-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-ma-icon-btn{display:grid;place-items:center;flex:none;width:30px;height:30px;padding:0;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;',
      'color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .15s ease,color .15s ease}',
      '.dsh-ma-icon-btn:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-ma-icon-btn.is-danger:hover{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ma-menu-wrap{position:relative;flex:none}',
      '.dsh-ma-menu{position:absolute;top:calc(100% + 5px);right:0;z-index:20;display:flex;flex-direction:column;',
      'min-width:168px;padding:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;',
      'background:var(--dsw-alias-bg-overlay);box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}',
      '.dsh-ma-menu-item{display:flex;align-items:center;width:100%;box-sizing:border-box;padding:7px 9px;',
      'border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:13px;text-align:left;cursor:pointer;white-space:nowrap}',
      '.dsh-ma-menu-item:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ma-menu-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.dsh-ma-bar{display:flex;flex:none;align-items:center;gap:8px;padding:0 24px 8px;flex-wrap:wrap}',
      '.dsh-ma-tabs{display:flex;align-items:center;gap:4px;min-width:0;overflow-x:auto;padding-bottom:1px}',
      '.dsh-ma-tab{flex:none;max-width:180px;padding:5px 11px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;',
      'font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;',
      'transition:background .15s ease,color .15s ease,border-color .15s ease}',
      '.dsh-ma-tab:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-tab.is-current{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);',
      'border-color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.dsh-ma-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ma-tab-new{flex:none;display:grid;place-items:center;width:26px;height:26px;padding:0;',
      'border:1px dashed var(--dsw-alias-border-l2);border-radius:999px;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:15px;line-height:1;cursor:pointer}',
      '.dsh-ma-tab-new:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ma-tab-new:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ma-sections{display:flex;flex:none;align-items:center;gap:2px;padding:0 24px;',
      'border-bottom:1px solid var(--dsw-alias-border-l1);overflow-x:auto}',
      '.dsh-ma-section-tab{flex:none;position:relative;padding:8px 12px 9px;border:0;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:13px;cursor:pointer;',
      'border-bottom:2px solid transparent;transition:color .15s ease,border-color .15s ease}',
      '.dsh-ma-section-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-section-tab.is-current{color:var(--dsw-alias-label-primary);font-weight:600;',
      'border-bottom-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ma-section-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.dsh-ma-scroll{flex:1;min-height:0;overflow:auto;padding:16px 24px 28px}',
      '.dsh-ma-scroll.is-empty{display:flex;flex-direction:column}',
      '.dsh-ma-section-head{display:flex;align-items:center;gap:10px;margin:0 0 12px}',
      '.dsh-ma-section-title{margin:0;font-size:14px;font-weight:600;line-height:1.35}',
      '.dsh-ma-section-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-btn{display:inline-flex;flex:none;align-items:center;gap:6px;height:30px;padding:0 12px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer}',
      '.dsh-ma-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ma-btn:disabled{opacity:.45;cursor:not-allowed}',
      '.dsh-ma-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-ma-btn.is-small{height:26px;padding:0 10px;font-size:12px}',
      '.dsh-ma-btn.is-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);',
      'color:var(--dsw-alias-bg-base)}',
      '.dsh-ma-btn.is-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ma-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:14px}',
      '.dsh-ma-kpi{position:relative;display:flex;flex-direction:column;gap:3px;box-sizing:border-box;',
      'padding:12px 14px 12px 16px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;',
      'background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
      '.dsh-ma-kpi-rule{position:absolute;left:0;top:0;bottom:0;width:3px}',
      '.dsh-ma-kpi-label{font-size:11.5px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-kpi-value{font-size:21px;font-weight:600;line-height:1.25;letter-spacing:-.2px}',
      '.dsh-ma-kpi-sub{font-size:11.5px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-card{box-sizing:border-box;padding:14px 16px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:10px;background:var(--dsw-alias-bg-layer-1);margin-bottom:14px}',
      '.dsh-ma-card-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}',
      '.dsh-ma-card-title{margin:0;font-size:13px;font-weight:600;line-height:1.35}',
      '.dsh-ma-bars{display:flex;flex-direction:column;gap:7px}',
      '.dsh-ma-bar-row{display:grid;grid-template-columns:52px 1fr 118px;align-items:center;gap:10px}',
      '.dsh-ma-bar-year{font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.dsh-ma-bar-track{height:12px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.dsh-ma-bar-fill{height:100%;border-radius:6px;background:var(--dsw-alias-brand-primary)}',
      '.dsh-ma-bar-value{font-size:12px;text-align:right;font-variant-numeric:tabular-nums;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-lists{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}',
      '.dsh-ma-list{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:5px}',
      '.dsh-ma-bullet{display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:7px;',
      'background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ma-bullet-text{flex:1;min-width:0;font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-bullet-x{display:grid;place-items:center;flex:none;width:20px;height:20px;padding:0;margin-top:1px;',
      'border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dsh-ma-bullet-x:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ma-bullet-x:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ma-empty-line{margin:0 0 8px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-add-row{display:flex;align-items:center;gap:6px}',
      '.dsh-ma-add-input{flex:1;min-width:0;height:28px;box-sizing:border-box;padding:0 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-2);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px}',
      '.dsh-ma-add-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-ma-table{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ma-tr{display:grid;align-items:center;gap:10px;padding:9px 12px;',
      'grid-template-columns:minmax(120px,1.6fr) minmax(88px,1fr) minmax(64px,.7fr) minmax(64px,.7fr) minmax(64px,.7fr) minmax(56px,.6fr) 62px}',
      '.dsh-ma-tr+.dsh-ma-tr{border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ma-tr.is-head{background:var(--dsw-alias-bg-layer-2);padding-top:8px;padding-bottom:8px}',
      '.dsh-ma-tr.is-foot{background:var(--dsw-alias-bg-layer-2);font-weight:600}',
      '.dsh-ma-th{font-size:11.5px;font-weight:500;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-td{font-size:12.5px;line-height:1.45;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ma-td.is-num{text-align:right;font-variant-numeric:tabular-nums}',
      '.dsh-ma-td.is-name{display:flex;align-items:center;gap:7px}',
      '.dsh-ma-name-dot{flex:none;width:7px;height:7px;border-radius:2px}',
      '.dsh-ma-row-actions{display:flex;align-items:center;justify-content:flex-end;gap:2px}',
      '.dsh-ma-mini{display:grid;place-items:center;width:24px;height:24px;padding:0;border:1px solid transparent;',
      'border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dsh-ma-mini:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-ma-mini.is-danger:hover{color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ma-mini:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ma-players{display:flex;flex-direction:column;gap:8px}',
      '.dsh-ma-player{display:grid;grid-template-columns:26px minmax(0,1fr) 86px auto;align-items:center;gap:10px;',
      'padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ma-rank{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;font-size:11px;',
      'font-weight:600;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-player-main{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.dsh-ma-player-top{display:flex;align-items:center;gap:7px;min-width:0}',
      '.dsh-ma-player-name{font-size:13px;font-weight:600;line-height:1.35;overflow:hidden;',
      'text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ma-chip{flex:none;padding:1px 6px;border-radius:5px;font-size:10.5px;line-height:1.6;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-ma-share-track{height:7px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.dsh-ma-share-fill{height:100%;border-radius:4px;background:var(--dsw-alias-brand-primary)}',
      '.dsh-ma-player-note{font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ma-player-figures{display:flex;flex-direction:column;align-items:flex-end;gap:2px}',
      '.dsh-ma-share-value{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}',
      '.dsh-ma-revenue{font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.dsh-ma-trends{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}',
      '.dsh-ma-trend{display:flex;flex-direction:column;gap:7px;box-sizing:border-box;padding:12px 14px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ma-trend-head{display:flex;align-items:flex-start;gap:8px}',
      '.dsh-ma-trend-name{flex:1;min-width:0;font-size:13px;font-weight:600;line-height:1.4}',
      '.dsh-ma-dots{display:flex;align-items:center;gap:3px}',
      '.dsh-ma-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-border-l2)}',
      '.dsh-ma-trend-meta{display:flex;align-items:center;gap:8px;font-size:11.5px;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-trend-evidence{margin:0;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-report-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
      '.dsh-ma-textarea{display:block;width:100%;box-sizing:border-box;min-height:320px;resize:vertical;',
      'padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;',
      'background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);',
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.6}',
      '.dsh-ma-textarea:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ma-sources{display:flex;flex-direction:column;gap:6px}',
      '.dsh-ma-source{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;',
      'background:var(--dsw-alias-bg-layer-2);font-size:12px;line-height:1.45}',
      '.dsh-ma-source-title{flex:none;max-width:52%;font-weight:600;overflow:hidden;text-overflow:ellipsis;',
      'white-space:nowrap}',
      '.dsh-ma-source-link{flex:1;min-width:0;color:var(--dsw-alias-brand-primary);text-decoration:none;',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ma-source-link:hover{text-decoration:underline}',
      '.dsh-ma-source-link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ma-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;',
      'flex:1;min-height:0;padding:48px 24px;text-align:center}',
      '.dsh-ma-empty-title{margin:0;font-size:15px;font-weight:600}',
      '.dsh-ma-empty-hint{margin:0;max-width:420px;font-size:12.5px;line-height:1.6;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-empty-actions{display:flex;align-items:center;gap:8px;margin-top:4px}',
      '.dsh-ma-overlay{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;',
      'padding:24px;background:rgba(0,0,0,.34)}',
      '.dsh-ma-dialog{display:flex;flex-direction:column;gap:12px;width:min(460px,100%);max-height:100%;',
      'box-sizing:border-box;padding:18px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;',
      'background:var(--dsw-alias-bg-overlay);box-shadow:0 24px 48px -24px rgba(0,0,0,.6);overflow:auto}',
      '.dsh-ma-dialog-title{margin:0;font-size:14px;font-weight:600;line-height:1.35}',
      '.dsh-ma-field{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.dsh-ma-field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.dsh-ma-label{font-size:11.5px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-input{width:100%;height:30px;box-sizing:border-box;padding:0 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px}',
      '.dsh-ma-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-ma-hint{font-size:10.5px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ma-dialog-foot{display:flex;align-items:center;gap:8px;padding-top:2px}',
      '.dsh-ma-dialog-foot-spacer{flex:1}',
      '.dsh-ma-toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:70;',
      'padding:7px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;',
      'background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-size:12.5px;',
      'box-shadow:0 8px 20px -12px rgba(0,0,0,.5);white-space:nowrap}',
    ].join('');

    /* ---- dictionaries ------------------------------------------------------ */

    const DICT = {
      zh: {
        'panel.title': '市场分析',
        'panel.subtitle': '规模、结构、竞争与趋势，一页看清市场',
        'panel.newMarket': '新建市场',
        'panel.sample': '载入示例数据',
        'panel.export': '导出',
        'panel.exportMarkdown': '导出 Markdown',
        'panel.exportJson': '导出 JSON',
        'panel.deleteMarket': '删除当前市场',
        'panel.marketName': '市场名称',
        'panel.untitled': '未命名市场',
        'panel.updated': '更新于',

        'tab.overview': '概览',
        'tab.segments': '细分市场',
        'tab.competition': '竞争格局',
        'tab.trends': '趋势',
        'tab.report': '报告',

        'unit.million': '百万美元',
        'unit.largeUnit': '亿美元',
        'unit.largeDivisor': '100',
        'unit.moneyPattern': '{value} {unit}',

        'overview.title': '市场概览',
        'overview.size': '市场规模',
        'overview.cagr': '年复合增速',
        'overview.forecast': '预测规模',
        'overview.weightedYoy': '加权同比',
        'overview.playerCount': '玩家数量',
        'overview.segmentCount': '个细分',
        'overview.playersUnit': '家玩家',
        'overview.edit': '编辑概览',
        'overview.history': '规模演进',
        'overview.historyEmpty': '还没有规模演进数据，可在「编辑概览」里补全金额',
        'overview.drivers': '驱动因素',
        'overview.risks': '风险',
        'overview.addBullet': '添加',
        'overview.removeBullet': '删除这一条',
        'overview.driverPlaceholder': '例如：政策补贴退坡前的抢装',
        'overview.riskPlaceholder': '例如：关键原材料涨价',
        'overview.noDrivers': '暂无驱动因素',
        'overview.noRisks': '暂无风险',

        'segments.title': '细分市场',
        'segments.add': '新增细分',
        'segments.name': '细分',
        'segments.colName': '名称',
        'segments.size': '规模',
        'segments.share': '占比',
        'segments.yoy': '同比',
        'segments.margin': '毛利率',
        'segments.players': '玩家数',
        'segments.total': '合计',
        'segments.weightedYoy': '加权同比',
        'segments.untitled': '未命名细分',
        'segments.empty': '还没有细分市场',
        'segments.emptyHint': '添加 3–5 个细分，就能看清结构占比与增速差异',
        'segments.edit': '编辑细分',
        'segments.delete': '删除细分',

        'competition.title': '竞争格局',
        'competition.add': '新增玩家',
        'competition.cr3': '前三集中度 CR3',
        'competition.cr5': '前五集中度 CR5',
        'competition.hhi': '赫芬达尔指数 HHI',
        'competition.concentration': '集中度',
        'competition.concentration.low': '分散竞争',
        'competition.concentration.mid': '中等集中',
        'competition.concentration.high': '高度集中',
        'competition.player': '玩家',
        'competition.share': '份额',
        'competition.revenue': '营收',
        'competition.hq': '总部',
        'competition.note': '备注',
        'competition.untitled': '未命名玩家',
        'competition.sum': '份额合计',
        'competition.sumMismatch': '份额合计超过 100%，请检查',
        'competition.longTail': '其余为长尾玩家',
        'competition.empty': '还没有玩家数据',
        'competition.emptyHint': '录入主要玩家的份额，CR 与 HHI 会自动算出',
        'competition.edit': '编辑玩家',
        'competition.delete': '删除玩家',

        'trends.title': '趋势',
        'trends.add': '新增趋势',
        'trends.name': '趋势',
        'trends.impact': '影响',
        'trends.horizon': '窗口',
        'trends.evidence': '依据',
        'trends.untitled': '未命名趋势',
        'trends.empty': '还没有趋势判断',
        'trends.emptyHint': '记录影响这个市场的关键变化，标注影响强度与时间窗口',
        'trends.edit': '编辑趋势',
        'trends.delete': '删除趋势',

        'sources.title': '数据来源',
        'sources.add': '添加来源',
        'sources.name': '来源',
        'sources.url': '链接',
        'sources.asOf': '年份',
        'sources.untitled': '未命名来源',
        'sources.empty': '还没有数据来源',
        'sources.edit': '编辑来源',
        'sources.delete': '删除来源',

        'report.title': '分析报告',
        'report.hint': '报告由当前市场的全部数据自动生成，可复制到任意文档',
        'report.copy': '复制 Markdown',
        'report.download': '下载 .md',
        'report.exportJson': '导出 JSON',
        'report.none': '（暂无）',
        'report.colon': '：',
        'report.competitionLine': 'CR3：{cr3}　CR5：{cr5}　HHI：{hhi}（{conc}）',
        'report.parenOpen': '（',
        'report.parenClose': '）',
        'report.metaPrefix': '数据截止',
        'report.metaUnit': '规模单位：百万美元',

        'editor.market': '编辑市场',
        'editor.overview': '编辑概览',
        'editor.segment': '编辑细分',
        'editor.player': '编辑玩家',
        'editor.trend': '编辑趋势',
        'editor.source': '编辑来源',
        'editor.name': '名称',
        'editor.amount': '金额',
        'editor.year': '年份',
        'editor.percent': '百分比',
        'editor.cagrWindow': '增速区间',
        'editor.hq': '总部',
        'editor.share': '市场份额',
        'editor.revenue': '营收',
        'editor.impact': '影响强度',
        'editor.horizon': '时间窗口',
        'editor.evidence': '依据',
        'editor.note': '备注',
        'editor.asOf': '数据截止',
        'editor.save': '保存',
        'editor.cancel': '取消',
        'editor.delete': '删除',
        'editor.required': '请填写名称',

        'empty.title': '还没有市场',
        'empty.hint': '新建一个市场开始分析，或载入示例数据快速了解这个工作台',
        'empty.create': '新建市场',
        'empty.sample': '载入示例数据',

        'toast.copied': '已复制到剪贴板',
        'toast.copyFailed': '复制失败，请手动保存',
        'toast.exported': '已导出',

        'confirm.loadSample': '示例数据会替换当前的全部市场，确定载入吗？',
        'confirm.deleteMarket': '删除后无法恢复。确定删除当前市场吗？',
        'confirm.deleteRow': '删除后无法恢复。确定删除吗？',

        'aria.panel': '市场分析',
        'aria.tabs': '市场切换',
        'aria.sections': '分析板块',
        'aria.dialog': '编辑弹窗',
        'aria.share': '份额',
        'aria.impact': '影响强度',
      },
      en: {
        'panel.title': 'Market Analysis',
        'panel.subtitle': 'Size, structure, competition and trends on one page',
        'panel.newMarket': 'New market',
        'panel.sample': 'Load sample data',
        'panel.export': 'Export',
        'panel.exportMarkdown': 'Export Markdown',
        'panel.exportJson': 'Export JSON',
        'panel.deleteMarket': 'Delete this market',
        'panel.marketName': 'Market name',
        'panel.untitled': 'Untitled market',
        'panel.updated': 'Updated',

        'tab.overview': 'Overview',
        'tab.segments': 'Segments',
        'tab.competition': 'Competition',
        'tab.trends': 'Trends',
        'tab.report': 'Report',

        'unit.million': 'M',
        'unit.largeUnit': 'B',
        'unit.largeDivisor': '1000',
        'unit.moneyPattern': '${value}{unit}',

        'overview.title': 'Market overview',
        'overview.size': 'Market size',
        'overview.cagr': 'CAGR',
        'overview.forecast': 'Forecast size',
        'overview.weightedYoy': 'Weighted YoY',
        'overview.playerCount': 'Players',
        'overview.segmentCount': 'segments',
        'overview.playersUnit': 'players',
        'overview.edit': 'Edit overview',
        'overview.history': 'Size history',
        'overview.historyEmpty': 'No history yet — fill the figures in "Edit overview"',
        'overview.drivers': 'Drivers',
        'overview.risks': 'Risks',
        'overview.addBullet': 'Add',
        'overview.removeBullet': 'Remove this line',
        'overview.driverPlaceholder': 'e.g. subsidy pull-forward before the phase-out',
        'overview.riskPlaceholder': 'e.g. key raw material price rise',
        'overview.noDrivers': 'No drivers yet',
        'overview.noRisks': 'No risks yet',

        'segments.title': 'Market segments',
        'segments.add': 'Add segment',
        'segments.name': 'Segment',
        'segments.colName': 'Name',
        'segments.size': 'Size',
        'segments.share': 'Share',
        'segments.yoy': 'YoY',
        'segments.margin': 'Margin',
        'segments.players': 'Players',
        'segments.total': 'Total',
        'segments.weightedYoy': 'Weighted YoY',
        'segments.untitled': 'Untitled segment',
        'segments.empty': 'No segments yet',
        'segments.emptyHint': 'Add 3–5 segments to see the structure and the growth gap',
        'segments.edit': 'Edit segment',
        'segments.delete': 'Delete segment',

        'competition.title': 'Competitive landscape',
        'competition.add': 'Add player',
        'competition.cr3': 'Concentration CR3',
        'competition.cr5': 'Concentration CR5',
        'competition.hhi': 'Herfindahl index HHI',
        'competition.concentration': 'Concentration',
        'competition.concentration.low': 'Fragmented',
        'competition.concentration.mid': 'Moderately concentrated',
        'competition.concentration.high': 'Highly concentrated',
        'competition.player': 'Player',
        'competition.share': 'Share',
        'competition.revenue': 'Revenue',
        'competition.hq': 'HQ',
        'competition.note': 'Note',
        'competition.untitled': 'Untitled player',
        'competition.sum': 'Share total',
        'competition.sumMismatch': 'Shares add up to more than 100% — please check',
        'competition.longTail': 'remainder is long tail',
        'competition.empty': 'No players yet',
        'competition.emptyHint': 'Enter the main players\u2019 shares and CR / HHI are computed for you',
        'competition.edit': 'Edit player',
        'competition.delete': 'Delete player',

        'trends.title': 'Trends',
        'trends.add': 'Add trend',
        'trends.name': 'Trend',
        'trends.impact': 'Impact',
        'trends.horizon': 'Horizon',
        'trends.evidence': 'Evidence',
        'trends.untitled': 'Untitled trend',
        'trends.empty': 'No trends yet',
        'trends.emptyHint': 'Record the changes that matter, with impact strength and horizon',
        'trends.edit': 'Edit trend',
        'trends.delete': 'Delete trend',

        'sources.title': 'Sources',
        'sources.add': 'Add source',
        'sources.name': 'Source',
        'sources.url': 'Link',
        'sources.asOf': 'Year',
        'sources.untitled': 'Untitled source',
        'sources.empty': 'No sources yet',
        'sources.edit': 'Edit source',
        'sources.delete': 'Delete source',

        'report.title': 'Analysis report',
        'report.hint': 'Generated from every figure in this market; copy it into any document',
        'report.copy': 'Copy Markdown',
        'report.download': 'Download .md',
        'report.exportJson': 'Export JSON',
        'report.none': '(none)',
        'report.colon': ': ',
        'report.competitionLine': 'CR3: {cr3} · CR5: {cr5} · HHI: {hhi} ({conc})',
        'report.parenOpen': ' (',
        'report.parenClose': ')',
        'report.metaPrefix': 'Data as of',
        'report.metaUnit': 'Sizes in M USD',

        'editor.market': 'Edit market',
        'editor.overview': 'Edit overview',
        'editor.segment': 'Edit segment',
        'editor.player': 'Edit player',
        'editor.trend': 'Edit trend',
        'editor.source': 'Edit source',
        'editor.name': 'Name',
        'editor.amount': 'Amount',
        'editor.year': 'Year',
        'editor.percent': 'Percent',
        'editor.cagrWindow': 'Window',
        'editor.hq': 'HQ',
        'editor.share': 'Market share',
        'editor.revenue': 'Revenue',
        'editor.impact': 'Impact',
        'editor.horizon': 'Horizon',
        'editor.evidence': 'Evidence',
        'editor.note': 'Note',
        'editor.asOf': 'Data as of',
        'editor.save': 'Save',
        'editor.cancel': 'Cancel',
        'editor.delete': 'Delete',
        'editor.required': 'A name is required',

        'empty.title': 'No markets yet',
        'empty.hint': 'Create a market to start, or load the sample data to explore this workbench',
        'empty.create': 'New market',
        'empty.sample': 'Load sample data',

        'toast.copied': 'Copied to clipboard',
        'toast.copyFailed': 'Copy failed — save it manually',
        'toast.exported': 'Exported',

        'confirm.loadSample': 'The sample replaces every market in this document. Load it?',
        'confirm.deleteMarket': 'This cannot be undone. Delete the current market?',
        'confirm.deleteRow': 'This cannot be undone. Delete it?',

        'aria.panel': 'Market analysis',
        'aria.tabs': 'Market tabs',
        'aria.sections': 'Analysis sections',
        'aria.dialog': 'Edit dialog',
        'aria.share': 'Share',
        'aria.impact': 'Impact',
      },
    };

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(function () {
          return ctx.locale.register(NS, DICT);
        }, 'market-analysis: dictionaries');

        const t = ctx.locale.bind(NS);

        /* ---- document operations (pure) ----------------------------------- */

        function withActive(doc, mutate) {
          const index = marketIndex(doc, doc.activeId);
          if (index < 0) return doc;
          const market = doc.markets[index];
          const next = mutate(market);
          if (!next || next === market) return doc;
          const markets = doc.markets.slice();
          markets[index] = Object.assign({}, next, { updatedAt: nowMs() });
          return Object.assign({}, doc, { markets: markets });
        }

        function blankSegment() {
          return { id: uid('s'), name: '', size: 0, yoy: 0, margin: 0, players: 0 };
        }

        function blankPlayer() {
          return {
            id: uid('p'),
            name: '',
            hq: '',
            share: 0,
            revenue: 0,
            year: new Date().getFullYear(),
            note: '',
          };
        }

        function blankTrend() {
          return { id: uid('t'), name: '', impact: 3, horizon: '', evidence: '' };
        }

        function blankSource() {
          return { id: uid('r'), title: '', url: '', asOf: String(new Date().getFullYear()) };
        }

        /* Percent fields are edited in percent units and stored as fractions. */
        function pctToInput(fraction) {
          return trimNum((isNum(fraction) ? fraction : 0) * 100, 1);
        }

        function numToInput(value) {
          return trimNum(isNum(value) ? value : 0, 1);
        }

        /* ---- panel --------------------------------------------------------- */

        function MarketAnalysisPanel() {
          const bootRef = React.useRef(null);
          if (!bootRef.current) bootRef.current = loadDoc() || defaultDoc();

          const [doc, setDoc] = React.useState(bootRef.current);
          const [section, setSection] = React.useState('overview');
          const [dialog, setDialog] = React.useState(null);
          const [menuOpen, setMenuOpen] = React.useState(false);
          const [toast, setToast] = React.useState(null);
          const [drafts, setDrafts] = React.useState({ driver: '', risk: '' });
          /* The header name field keeps raw text while typing and only trims on
           * blur/Enter, so a space can never be swallowed mid-word. */
          const [nameDraft, setNameDraft] = React.useState(null);

          const docRef = React.useRef(doc);
          docRef.current = doc;

          const toastTimer = React.useRef(null);
          const reportRef = React.useRef(null);
          const menuRef = React.useRef(null);

          /* Re-render when the locale revision changes, so every projected
           * label follows a language switch without re-registering. */
          const localeTick = React.useState(0);
          const bumpLocale = localeTick[1];
          React.useEffect(function () {
            if (!ctx.locale.subscribe) return undefined;
            return ctx.locale.subscribe(function () {
              bumpLocale(function (n) {
                return n + 1;
              });
            });
          }, []);

          /* Every document change lands in localStorage; a reload restores it. */
          React.useEffect(
            function () {
              saveDoc(doc);
            },
            [doc],
          );

          React.useEffect(function () {
            return function () {
              if (toastTimer.current) clearTimeout(toastTimer.current);
            };
          }, []);

          /* `Esc` closes the dialog without saving. Capture phase, so the host
           * shell does not also act on the key while the dialog is up. */
          const dialogKey = dialog ? dialog.kind + ':' + (dialog.id || 'new') : null;
          React.useEffect(
            function () {
              if (!dialogKey) return undefined;
              function onKeyDown(event) {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setDialog(null);
                }
              }
              document.addEventListener('keydown', onKeyDown, true);
              return function () {
                document.removeEventListener('keydown', onKeyDown, true);
              };
            },
            [dialogKey],
          );

          /* The export menu closes on an outside press. */
          React.useEffect(
            function () {
              if (!menuOpen) return undefined;
              function onDown(event) {
                const node = menuRef.current;
                if (!node || typeof node.contains !== 'function') return;
                if (node.contains(event.target)) return;
                setMenuOpen(false);
              }
              document.addEventListener('mousedown', onDown, true);
              return function () {
                document.removeEventListener('mousedown', onDown, true);
              };
            },
            [menuOpen],
          );

          function flash(message) {
            setToast(message);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(function () {
              setToast(null);
              toastTimer.current = null;
            }, TOAST_MS);
          }

          /* ---- editor ----------------------------------------------------- */

          /** Open the edit dialog for an entity of the active market. */
          function openDialog(kind, id) {
            const market = activeMarketOf(docRef.current);
            if (!market) return;
            if (kind === 'overview') {
              const o = market.overview;
              setDialog({
                kind: 'overview',
                id: null,
                fields: {
                  size: numToInput(o.size),
                  sizeYear: String(o.sizeYear),
                  cagr: pctToInput(o.cagr),
                  cagrWindow: o.cagrWindow,
                  forecastSize: numToInput(o.forecastSize),
                  forecastYear: String(o.forecastYear),
                },
              });
              return;
            }
            const list =
              kind === 'segment'
                ? market.segments
                : kind === 'player'
                  ? market.players
                  : kind === 'trend'
                    ? market.trends
                    : market.sources;
            let entry = null;
            for (let i = 0; i < list.length; i += 1) {
              if (list[i].id === id) {
                entry = list[i];
                break;
              }
            }
            if (!entry) return;
            if (kind === 'segment') {
              setDialog({
                kind: 'segment',
                id: entry.id,
                fields: {
                  name: entry.name,
                  size: numToInput(entry.size),
                  yoy: pctToInput(entry.yoy),
                  margin: pctToInput(entry.margin),
                  players: String(entry.players),
                },
              });
            } else if (kind === 'player') {
              setDialog({
                kind: 'player',
                id: entry.id,
                fields: {
                  name: entry.name,
                  hq: entry.hq,
                  share: pctToInput(entry.share),
                  revenue: numToInput(entry.revenue),
                  year: String(entry.year),
                  note: entry.note,
                },
              });
            } else if (kind === 'trend') {
              setDialog({
                kind: 'trend',
                id: entry.id,
                fields: {
                  name: entry.name,
                  impact: String(entry.impact),
                  horizon: entry.horizon,
                  evidence: entry.evidence,
                },
              });
            } else {
              setDialog({
                kind: 'source',
                id: entry.id,
                fields: { title: entry.title, url: entry.url, asOf: entry.asOf },
              });
            }
          }

          /* ---- document writes ------------------------------------------- */

          function updateActive(mutate) {
            setDoc(function (current) {
              return withActive(current, mutate);
            });
          }

          function addMarket() {
            const market = blankMarket();
            setDoc(function (current) {
              if (current.markets.length >= MAX_MARKETS) return current;
              return {
                version: DOC_VERSION,
                activeId: market.id,
                markets: current.markets.concat([market]),
              };
            });
            setSection('overview');
          }

          function loadSample() {
            /* Replacing a document with real entries is destructive; an empty
             * one just fills in. The button is also the empty-state entry. */
            if (docRef.current.markets.length > 0 && !window.confirm(t('confirm.loadSample'))) return;
            setDoc(function (current) {
              if (current.markets.length === 0) {
                const market = sampleMarket();
                return { version: DOC_VERSION, activeId: market.id, markets: [market] };
              }
              return sampleDoc();
            });
            setSection('overview');
          }

          function deleteMarket() {
            const market = activeMarketOf(docRef.current);
            if (!market) return;
            const ok = window.confirm(t('confirm.deleteMarket'));
            if (!ok) return;
            setDoc(function (current) {
              const index = marketIndex(current, current.activeId);
              if (index < 0) return current;
              const markets = current.markets.slice();
              markets.splice(index, 1);
              const nextIndex = index < markets.length ? index : markets.length - 1;
              return {
                version: DOC_VERSION,
                activeId: markets.length ? markets[nextIndex].id : '',
                markets: markets,
              };
            });
            setDialog(null);
          }

          function selectMarket(id) {
            setDoc(function (current) {
              if (marketIndex(current, id) < 0) return current;
              if (current.activeId === id) return current;
              return Object.assign({}, current, { activeId: id });
            });
          }

          function renameMarket(name, commit) {
            updateActive(function (market) {
              return Object.assign({}, market, { name: commit ? str(name, 120) : String(name).slice(0, 120) });
            });
          }

          /* A new row is staged in the dialog and only joins the document on
           * save, so cancelling never leaves a blank row behind. */

          function addSegment() {
            setDialog({
              kind: 'segment',
              id: null,
              fields: { name: '', size: '0', yoy: '0', margin: '0', players: '0' },
            });
          }

          function addPlayer() {
            setDialog({
              kind: 'player',
              id: null,
              fields: { name: '', hq: '', share: '0', revenue: '0', year: String(new Date().getFullYear()), note: '' },
            });
          }

          function addTrend() {
            setDialog({ kind: 'trend', id: null, fields: { name: '', impact: '3', horizon: '', evidence: '' } });
          }

          function addSource() {
            setDialog({
              kind: 'source',
              id: null,
              fields: { title: '', url: '', asOf: String(new Date().getFullYear()) },
            });
          }

          function addBullet(kind) {
            const text = str(drafts[kind], 200);
            if (!text) return;
            updateActive(function (market) {
              const overview = Object.assign({}, market.overview);
              const list = kind === 'driver' ? overview.drivers : overview.risks;
              if (list.length >= MAX_BULLETS) return null;
              const next = list.concat([text]);
              if (kind === 'driver') overview.drivers = next;
              else overview.risks = next;
              return Object.assign({}, market, { overview: overview });
            });
            setDrafts(function (current) {
              const next = Object.assign({}, current);
              next[kind] = '';
              return next;
            });
          }

          function removeBullet(kind, index) {
            updateActive(function (market) {
              const overview = Object.assign({}, market.overview);
              const list = (kind === 'driver' ? overview.drivers : overview.risks).slice();
              if (index < 0 || index >= list.length) return null;
              list.splice(index, 1);
              if (kind === 'driver') overview.drivers = list;
              else overview.risks = list;
              return Object.assign({}, market, { overview: overview });
            });
          }

          function deleteRow(kind, id) {
            updateActive(function (market) {
              const field =
                kind === 'segment' ? 'segments' : kind === 'player' ? 'players' : kind === 'trend' ? 'trends' : 'sources';
              const list = market[field];
              const next = [];
              let removed = false;
              for (let i = 0; i < list.length; i += 1) {
                if (list[i].id === id) removed = true;
                else next.push(list[i]);
              }
              if (!removed) return null;
              const patch = {};
              patch[field] = next;
              return Object.assign({}, market, patch);
            });
            setDialog(null);
          }

          function setField(key, value) {
            setDialog(function (current) {
              if (!current) return current;
              const fields = Object.assign({}, current.fields);
              fields[key] = value;
              return Object.assign({}, current, { fields: fields });
            });
          }

          function commitDialog() {
            const current = dialog;
            if (!current) return;
            const kind = current.kind;
            const fields = current.fields;

            if (kind === 'overview') {
              updateActive(function (market) {
                return Object.assign({}, market, {
                  overview: {
                    size: clampRange(parseNum(fields.size), 0, 1e12, market.overview.size),
                    sizeYear: Math.round(clampRange(parseNum(fields.sizeYear), 1900, 2200, market.overview.sizeYear)),
                    cagr: clampRange(parsePct(fields.cagr), -1, 100, market.overview.cagr),
                    cagrWindow: str(fields.cagrWindow, 40),
                    forecastSize: clampRange(parseNum(fields.forecastSize), 0, 1e12, market.overview.forecastSize),
                    forecastYear: Math.round(
                      clampRange(parseNum(fields.forecastYear), 1900, 2200, market.overview.forecastYear),
                    ),
                    drivers: market.overview.drivers,
                    risks: market.overview.risks,
                  },
                });
              });
              setDialog(null);
              return;
            }

            if (kind === 'source') {
              updateActive(function (market) {
                const row = {
                  id: current.id || uid('r'),
                  title: str(fields.title, 200),
                  url: str(fields.url, 300),
                  asOf: str(fields.asOf, 24),
                };
                return Object.assign({}, market, { sources: upsertRow(market.sources, current.id, row) });
              });
              setDialog(null);
              return;
            }

            if (kind === 'segment') {
              updateActive(function (market) {
                const existing = findRow(market.segments, current.id) || blankSegment();
                const row = {
                  id: existing.id,
                  name: str(fields.name, 120),
                  size: clampRange(parseNum(fields.size), 0, 1e12, existing.size),
                  yoy: clampRange(parsePct(fields.yoy), -1, 5, existing.yoy),
                  margin: clampRange(parsePct(fields.margin), 0, 1, existing.margin),
                  players: Math.round(clampRange(parseNum(fields.players), 0, 1000000, existing.players)),
                };
                return Object.assign({}, market, { segments: upsertRow(market.segments, current.id, row) });
              });
              setDialog(null);
              return;
            }

            if (kind === 'player') {
              updateActive(function (market) {
                const existing = findRow(market.players, current.id) || blankPlayer();
                const row = {
                  id: existing.id,
                  name: str(fields.name, 120),
                  hq: str(fields.hq, 60),
                  share: clampRange(parsePct(fields.share), 0, 1, existing.share),
                  revenue: clampRange(parseNum(fields.revenue), 0, 1e12, existing.revenue),
                  year: Math.round(clampRange(parseNum(fields.year), 1900, 2200, existing.year)),
                  note: str(fields.note, 400),
                };
                return Object.assign({}, market, { players: upsertRow(market.players, current.id, row) });
              });
              setDialog(null);
              return;
            }

            if (kind === 'trend') {
              updateActive(function (market) {
                const existing = findRow(market.trends, current.id) || blankTrend();
                const row = {
                  id: existing.id,
                  name: str(fields.name, 120),
                  impact: Math.round(clampRange(parseNum(fields.impact), 1, 5, existing.impact)),
                  horizon: str(fields.horizon, 40),
                  evidence: str(fields.evidence, 400),
                };
                return Object.assign({}, market, { trends: upsertRow(market.trends, current.id, row) });
              });
              setDialog(null);
            }
          }

          /* ---- exports ---------------------------------------------------- */

          function copyText(text) {
            const clipboard = window.navigator && window.navigator.clipboard;
            if (clipboard && typeof clipboard.writeText === 'function') {
              Promise.resolve(clipboard.writeText(text)).then(
                function () {
                  flash(t('toast.copied'));
                },
                function () {
                  manualCopy(text);
                },
              );
              return;
            }
            manualCopy(text);
          }

          function manualCopy(text) {
            const node = reportRef.current;
            try {
              if (node && typeof node.select === 'function') {
                node.select();
                if (document.execCommand('copy')) {
                  flash(t('toast.copied'));
                  return;
                }
              }
            } catch (error) {
              /* fall through to the failure message */
            }
            flash(t('toast.copyFailed'));
          }

          function exportMarkdown() {
            const market = activeMarketOf(docRef.current);
            if (!market) return;
            const text = marketMarkdown(market, t);
            if (downloadText(slugOf(market.name) + '-' + dateStamp(new Date()) + '.md', text, 'text/markdown')) {
              flash(t('toast.exported'));
            } else {
              flash(t('toast.copyFailed'));
            }
            setMenuOpen(false);
          }

          function exportJson() {
            const market = activeMarketOf(docRef.current);
            if (!market) return;
            const text = JSON.stringify(market, null, 2);
            if (downloadText(slugOf(market.name) + '-' + dateStamp(new Date()) + '.json', text, 'application/json')) {
              flash(t('toast.exported'));
            } else {
              flash(t('toast.copyFailed'));
            }
            setMenuOpen(false);
          }

          /* ---- shared bits ------------------------------------------------ */

          function textField(key, label, value, onChange, opts) {
            const options = opts || {};
            const input = h('input', {
              className: 'dsh-ma-input',
              type: 'text',
              inputMode: options.numeric ? 'decimal' : undefined,
              placeholder: options.placeholder || '',
              value: value,
              onChange: function (event) {
                onChange(event.target.value);
              },
            });
            return h(
              'label',
              { className: 'dsh-ma-field', key: key },
              h('span', { className: 'dsh-ma-label' }, label),
              input,
              options.hint ? h('span', { className: 'dsh-ma-hint' }, options.hint) : null,
            );
          }

          function sectionHeader(title, hint, action) {
            return h(
              'div',
              { className: 'dsh-ma-section-head', key: 'head' },
              h('h2', { className: 'dsh-ma-section-title' }, title),
              hint ? h('p', { className: 'dsh-ma-section-hint' }, hint) : null,
              h('span', { className: 'dsh-ma-spacer' }),
              action || null,
            );
          }

          function emptySection(title, hint, action) {
            return h(
              'div',
              { className: 'dsh-ma-empty', key: 'empty' },
              h('p', { className: 'dsh-ma-empty-title' }, title),
              h('p', { className: 'dsh-ma-empty-hint' }, hint),
              action ? h('div', { className: 'dsh-ma-empty-actions' }, action) : null,
            );
          }

          /* ---- overview --------------------------------------------------- */

          function renderOverview(market) {
            const shares = segmentShares(market);
            const total = segmentTotal(market);
            const cards = [
              {
                key: 'size',
                label: t('overview.size'),
                value: formatMoney(market.overview.size, t),
                sub: String(market.overview.sizeYear),
                accent: ACCENTS[0],
              },
              {
                key: 'cagr',
                label: t('overview.cagr'),
                value: formatPercent(market.overview.cagr),
                sub: market.overview.cagrWindow || t('report.none'),
                accent: ACCENTS[1],
              },
              {
                key: 'forecast',
                label: t('overview.forecast'),
                value: formatMoney(market.overview.forecastSize, t),
                sub: String(market.overview.forecastYear),
                accent: ACCENTS[2],
              },
              {
                key: 'yoy',
                label: t('overview.weightedYoy'),
                value: formatPercent(weightedYoy(market)),
                sub: market.segments.length + ' ' + t('overview.segmentCount'),
                accent: ACCENTS[3],
              },
            ];

            const kpis = h(
              'div',
              { className: 'dsh-ma-kpis', key: 'kpis' },
              cards.map(function (card) {
                return h(
                  'div',
                  { className: 'dsh-ma-kpi', key: card.key },
                  h('span', { className: 'dsh-ma-kpi-rule', style: { background: card.accent } }),
                  h('span', { className: 'dsh-ma-kpi-label' }, card.label),
                  h('span', { className: 'dsh-ma-kpi-value' }, card.value),
                  h('span', { className: 'dsh-ma-kpi-sub' }, card.sub),
                );
              }),
            );

            const historyMax = market.history.reduce(function (max, point) {
              return point.size > max ? point.size : max;
            }, 0);
            const historyBody =
              market.history.length === 0
                ? h('p', { className: 'dsh-ma-empty-line' }, t('overview.historyEmpty'))
                : h(
                    'div',
                    { className: 'dsh-ma-bars' },
                    market.history.map(function (point, index) {
                      const width = historyMax > 0 ? Math.max(point.size > 0 ? 2 : 0, (point.size / historyMax) * 100) : 0;
                      const previous = index > 0 ? market.history[index - 1].size : 0;
                      const growth = index > 0 && previous > 0 ? (point.size - previous) / previous : null;
                      return h(
                        'div',
                        { className: 'dsh-ma-bar-row', key: 'h' + point.year },
                        h('span', { className: 'dsh-ma-bar-year' }, String(point.year)),
                        h(
                          'div',
                          { className: 'dsh-ma-bar-track' },
                          h('div', { className: 'dsh-ma-bar-fill', style: { width: width + '%' } }),
                        ),
                        h(
                          'span',
                          { className: 'dsh-ma-bar-value' },
                          formatMoney(point.size, t) + (growth === null ? '' : ' · ' + formatPercent(growth)),
                        ),
                      );
                    }),
                  );

            const history = h(
              'section',
              { className: 'dsh-ma-card', key: 'history' },
              h(
                'div',
                { className: 'dsh-ma-card-head' },
                h('h3', { className: 'dsh-ma-card-title' }, t('overview.history')),
                h('span', { className: 'dsh-ma-spacer' }),
                total > 0
                  ? h('span', { className: 'dsh-ma-section-hint' }, t('segments.total') + ' ' + formatMoney(total, t))
                  : null,
              ),
              historyBody,
            );

            function bulletList(kind, title, list) {
              const draftKey = kind;
              const add = function () {
                addBullet(kind);
              };
              return h(
                'section',
                { className: 'dsh-ma-card', key: 'list-' + kind },
                h('div', { className: 'dsh-ma-card-head' }, h('h3', { className: 'dsh-ma-card-title' }, title)),
                list.length === 0
                  ? h('p', { className: 'dsh-ma-empty-line' }, kind === 'driver' ? t('overview.noDrivers') : t('overview.noRisks'))
                  : h(
                      'ul',
                      { className: 'dsh-ma-list' },
                      list.map(function (text, index) {
                        return h(
                          'li',
                          { className: 'dsh-ma-bullet', key: draftKey + index },
                          h('span', { className: 'dsh-ma-bullet-text' }, text),
                          h(
                            'button',
                            {
                              className: 'dsh-ma-bullet-x',
                              type: 'button',
                              'aria-label': t('overview.removeBullet'),
                              onClick: function () {
                                removeBullet(kind, index);
                              },
                            },
                            closeGlyph(12),
                          ),
                        );
                      }),
                    ),
                h(
                  'div',
                  { className: 'dsh-ma-add-row' },
                  h('input', {
                    className: 'dsh-ma-add-input',
                    type: 'text',
                    value: drafts[draftKey],
                    placeholder: kind === 'driver' ? t('overview.driverPlaceholder') : t('overview.riskPlaceholder'),
                    onChange: function (event) {
                      const value = event.target.value;
                      setDrafts(function (current) {
                        const next = Object.assign({}, current);
                        next[draftKey] = value;
                        return next;
                      });
                    },
                    onKeyDown: function (event) {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        add();
                      }
                    },
                  }),
                  h(
                    'button',
                    {
                      className: 'dsh-ma-btn is-small',
                      type: 'button',
                      disabled: !str(drafts[draftKey], 200),
                      onClick: add,
                    },
                    t('overview.addBullet'),
                  ),
                ),
              );
            }

            return h(
              'div',
              { key: 'overview' },
              sectionHeader(
                t('overview.title'),
                String(market.overview.sizeYear),
                h(
                  'button',
                  {
                    className: 'dsh-ma-btn',
                    type: 'button',
                    onClick: function () {
                      openDialog('overview');
                    },
                  },
                  t('overview.edit'),
                ),
              ),
              kpis,
              history,
              h(
                'div',
                { className: 'dsh-ma-lists' },
                bulletList('driver', t('overview.drivers'), market.overview.drivers),
                bulletList('risk', t('overview.risks'), market.overview.risks),
              ),
              h(
                'p',
                { className: 'dsh-ma-section-hint', key: 'segments-hint' },
                t('overview.playersUnit') + ': ' + market.players.length + ' · ' + shares.length + ' ' + t('overview.segmentCount'),
              ),
            );
          }

          /* ---- segments ---------------------------------------------------- */

          function renderSegments(market) {
            const shares = segmentShares(market);
            const shareById = {};
            for (let i = 0; i < shares.length; i += 1) shareById[shares[i].id] = shares[i].share;

            const sorted = market.segments.slice().sort(function (a, b) {
              if (b.size !== a.size) return b.size - a.size;
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            });

            const head = h(
              'div',
              { className: 'dsh-ma-tr is-head', role: 'row', key: 'head' },
              h('span', { className: 'dsh-ma-th', role: 'columnheader' }, t('segments.name')),
              h('span', { className: 'dsh-ma-th is-num', role: 'columnheader' }, t('segments.size')),
              h('span', { className: 'dsh-ma-th is-num', role: 'columnheader' }, t('segments.share')),
              h('span', { className: 'dsh-ma-th is-num', role: 'columnheader' }, t('segments.yoy')),
              h('span', { className: 'dsh-ma-th is-num', role: 'columnheader' }, t('segments.margin')),
              h('span', { className: 'dsh-ma-th is-num', role: 'columnheader' }, t('segments.players')),
              h('span', { className: 'dsh-ma-th', role: 'columnheader' }, ''),
            );

            const body = sorted.map(function (segment, index) {
              const share = shareById[segment.id] || 0;
              return h(
                'div',
                { className: 'dsh-ma-tr', role: 'row', key: segment.id },
                h(
                  'span',
                  { className: 'dsh-ma-td is-name', role: 'cell' },
                  h('span', { className: 'dsh-ma-name-dot', style: { background: ACCENTS[index % ACCENTS.length] } }),
                  segment.name || t('segments.untitled'),
                ),
                h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, formatMoney(segment.size, t)),
                h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, formatPercent(share)),
                h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, formatPercent(segment.yoy)),
                h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, formatPercent(segment.margin)),
                h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, String(segment.players)),
                h(
                  'span',
                  { className: 'dsh-ma-row-actions', role: 'cell' },
                  h(
                    'button',
                    {
                      className: 'dsh-ma-mini',
                      type: 'button',
                      'aria-label': t('segments.edit'),
                      onClick: function () {
                        openDialog('segment', segment.id);
                      },
                    },
                    h('svg', {
                      viewBox: '0 0 16 16',
                      width: 13,
                      height: 13,
                      'aria-hidden': 'true',
                      style: { display: 'block' },
                    }, h('path', {
                      d: 'M10.6 2.6l2.8 2.8L5.7 13.1H2.9v-2.8z',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: 1.4,
                      strokeLinejoin: 'round',
                    })),
                  ),
                  h(
                    'button',
                    {
                      className: 'dsh-ma-mini is-danger',
                      type: 'button',
                      'aria-label': t('segments.delete'),
                      onClick: function () {
                        deleteRow('segment', segment.id);
                      },
                    },
                    closeGlyph(12),
                  ),
                ),
              );
            });

            const foot =
              market.segments.length === 0
                ? null
                : h(
                    'div',
                    { className: 'dsh-ma-tr is-foot', role: 'row', key: 'foot' },
                    h('span', { className: 'dsh-ma-td', role: 'cell' }, t('segments.total')),
                    h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, formatMoney(segmentTotal(market), t)),
                    h(
                      'span',
                      { className: 'dsh-ma-td is-num', role: 'cell' },
                      formatPercent(segmentTotal(market) > 0 ? 1 : 0),
                    ),
                    h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, formatPercent(weightedYoy(market))),
                    h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, '—'),
                    h('span', { className: 'dsh-ma-td is-num', role: 'cell' }, '—'),
                    h('span', { className: 'dsh-ma-td', role: 'cell' }, ''),
                  );

            return h(
              'div',
              { key: 'segments' },
              sectionHeader(
                t('segments.title'),
                t('segments.weightedYoy') + ' ' + formatPercent(weightedYoy(market)),
                h(
                  'button',
                  {
                    className: 'dsh-ma-btn',
                    type: 'button',
                    onClick: addSegment,
                  },
                  '+ ' + t('segments.add'),
                ),
              ),
              market.segments.length === 0
                ? emptySection(
                    t('segments.empty'),
                    t('segments.emptyHint'),
                    h('button', { className: 'dsh-ma-btn is-primary', type: 'button', onClick: addSegment }, t('segments.add')),
                  )
                : h('div', { className: 'dsh-ma-table', role: 'table' }, [head].concat(body).concat(foot ? [foot] : [])),
            );
          }

          /* ---- competition ------------------------------------------------- */

          function renderCompetition(market) {
            const ranked = rankPlayers(market);
            const key = concentrationKey(market);
            const sum = playerShareSum(market);

            const cards = [
              { key: 'cr3', label: t('competition.cr3'), value: formatPercent(cr(market, 3)), sub: t('competition.concentration'), accent: ACCENTS[1] },
              { key: 'cr5', label: t('competition.cr5'), value: formatPercent(cr(market, 5)), sub: t('competition.concentration'), accent: ACCENTS[0] },
              {
                key: 'hhi',
                label: t('competition.hhi'),
                value: trimNum(hhi(market), 0),
                sub: t('competition.concentration.' + key),
                accent: ACCENTS[2],
              },
            ];

            const kpis = h(
              'div',
              { className: 'dsh-ma-kpis', key: 'kpis' },
              cards.map(function (card) {
                return h(
                  'div',
                  { className: 'dsh-ma-kpi', key: card.key },
                  h('span', { className: 'dsh-ma-kpi-rule', style: { background: card.accent } }),
                  h('span', { className: 'dsh-ma-kpi-label' }, card.label),
                  h('span', { className: 'dsh-ma-kpi-value' }, card.value),
                  h('span', { className: 'dsh-ma-kpi-sub' }, card.sub),
                );
              }),
            );

            /* The listed players usually cover only the named leaders, so a sum
             * below 100% is expected; only an overshoot is a real mistake. */
            const mismatch = sum > 1.02;

            const list = h(
              'div',
              { className: 'dsh-ma-players', key: 'players' },
              ranked.map(function (player, index) {
                const width = Math.max(player.share > 0 ? 2 : 0, player.share * 100);
                return h(
                  'div',
                  { className: 'dsh-ma-player', key: player.id },
                  h('span', { className: 'dsh-ma-rank' }, String(index + 1)),
                  h(
                    'div',
                    { className: 'dsh-ma-player-main' },
                    h(
                      'div',
                      { className: 'dsh-ma-player-top' },
                      h('span', { className: 'dsh-ma-player-name' }, player.name || t('competition.untitled')),
                      player.hq ? h('span', { className: 'dsh-ma-chip' }, player.hq) : null,
                      h('span', { className: 'dsh-ma-chip' }, String(player.year)),
                    ),
                    h(
                      'div',
                      {
                        className: 'dsh-ma-share-track',
                        role: 'img',
                        'aria-label': t('aria.share') + ' ' + formatPercent(player.share),
                      },
                      h('div', { className: 'dsh-ma-share-fill', style: { width: width + '%' } }),
                    ),
                    player.note ? h('span', { className: 'dsh-ma-player-note' }, player.note) : null,
                  ),
                  h(
                    'div',
                    { className: 'dsh-ma-player-figures' },
                    h('span', { className: 'dsh-ma-share-value' }, formatPercent(player.share)),
                    h('span', { className: 'dsh-ma-revenue' }, formatMoney(player.revenue, t)),
                  ),
                  h(
                    'span',
                    { className: 'dsh-ma-row-actions' },
                    h(
                      'button',
                      {
                        className: 'dsh-ma-mini',
                        type: 'button',
                        'aria-label': t('competition.edit'),
                        onClick: function () {
                          openDialog('player', player.id);
                        },
                      },
                      h(
                        'svg',
                        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
                        h('path', {
                          d: 'M10.6 2.6l2.8 2.8L5.7 13.1H2.9v-2.8z',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: 1.4,
                          strokeLinejoin: 'round',
                        }),
                      ),
                    ),
                    h(
                      'button',
                      {
                        className: 'dsh-ma-mini is-danger',
                        type: 'button',
                        'aria-label': t('competition.delete'),
                        onClick: function () {
                          deleteRow('player', player.id);
                        },
                      },
                      closeGlyph(12),
                    ),
                  ),
                );
              }),
            );

            return h(
              'div',
              { key: 'competition' },
              sectionHeader(
                t('competition.title'),
                (mismatch ? t('competition.sumMismatch') + ' · ' : '') +
                  t('competition.sum') +
                  ' ' +
                  formatPercent(sum) +
                  (!mismatch && sum < 0.98 && market.players.length > 0 ? ' · ' + t('competition.longTail') : ''),
                h(
                  'button',
                  { className: 'dsh-ma-btn', type: 'button', onClick: addPlayer },
                  '+ ' + t('competition.add'),
                ),
              ),
              kpis,
              market.players.length === 0
                ? emptySection(
                    t('competition.empty'),
                    t('competition.emptyHint'),
                    h('button', { className: 'dsh-ma-btn is-primary', type: 'button', onClick: addPlayer }, t('competition.add')),
                  )
                : list,
            );
          }

          /* ---- trends ------------------------------------------------------ */

          function renderTrends(market) {
            return h(
              'div',
              { key: 'trends' },
              sectionHeader(
                t('trends.title'),
                String(market.trends.length),
                h('button', { className: 'dsh-ma-btn', type: 'button', onClick: addTrend }, '+ ' + t('trends.add')),
              ),
              market.trends.length === 0
                ? emptySection(
                    t('trends.empty'),
                    t('trends.emptyHint'),
                    h('button', { className: 'dsh-ma-btn is-primary', type: 'button', onClick: addTrend }, t('trends.add')),
                  )
                : h(
                    'div',
                    { className: 'dsh-ma-trends' },
                    market.trends.map(function (trend) {
                      return h(
                        'section',
                        { className: 'dsh-ma-trend', key: trend.id },
                        h(
                          'div',
                          { className: 'dsh-ma-trend-head' },
                          h('h3', { className: 'dsh-ma-trend-name' }, trend.name || t('trends.untitled')),
                          h(
                            'div',
                            {
                              className: 'dsh-ma-dots',
                              role: 'img',
                              'aria-label': t('aria.impact') + ' ' + trend.impact + '/5',
                            },
                            [0, 1, 2, 3, 4].map(function (index) {
                              return h('span', {
                                className: 'dsh-ma-dot',
                                key: 'dot' + index,
                                style: index < trend.impact ? { background: IMPACT_ON } : undefined,
                              });
                            }),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'dsh-ma-trend-meta' },
                          h('span', {}, t('trends.impact') + ' ' + trend.impact + '/5'),
                          trend.horizon ? h('span', { className: 'dsh-ma-chip' }, trend.horizon) : null,
                        ),
                        trend.evidence ? h('p', { className: 'dsh-ma-trend-evidence' }, trend.evidence) : null,
                        h(
                          'div',
                          { className: 'dsh-ma-row-actions' },
                          h(
                            'button',
                            {
                              className: 'dsh-ma-mini',
                              type: 'button',
                              'aria-label': t('trends.edit'),
                              onClick: function () {
                                openDialog('trend', trend.id);
                              },
                            },
                            h(
                              'svg',
                              { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
                              h('path', {
                                d: 'M10.6 2.6l2.8 2.8L5.7 13.1H2.9v-2.8z',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: 1.4,
                                strokeLinejoin: 'round',
                              }),
                            ),
                          ),
                          h(
                            'button',
                            {
                              className: 'dsh-ma-mini is-danger',
                              type: 'button',
                              'aria-label': t('trends.delete'),
                              onClick: function () {
                                deleteRow('trend', trend.id);
                              },
                            },
                            closeGlyph(12),
                          ),
                        ),
                      );
                    }),
                  ),
            );
          }

          /* ---- report ------------------------------------------------------ */

          function renderReport(market) {
            const markdown = marketMarkdown(market, t);
            return h(
              'div',
              { key: 'report' },
              sectionHeader(
                t('report.title'),
                t('report.hint'),
                h(
                  'button',
                  {
                    className: 'dsh-ma-btn',
                    type: 'button',
                    onClick: function () {
                      copyText(markdown);
                    },
                  },
                  t('report.copy'),
                ),
              ),
              h(
                'div',
                { className: 'dsh-ma-report-bar' },
                h(
                  'button',
                  {
                    className: 'dsh-ma-btn',
                    type: 'button',
                    onClick: function () {
                      if (downloadText(slugOf(market.name) + '-' + dateStamp(new Date()) + '.md', markdown, 'text/markdown')) {
                        flash(t('toast.exported'));
                      } else {
                        flash(t('toast.copyFailed'));
                      }
                    },
                  },
                  t('report.download'),
                ),
                h('button', { className: 'dsh-ma-btn', type: 'button', onClick: exportJson }, t('report.exportJson')),
                h('span', { className: 'dsh-ma-spacer' }),
                h('span', { className: 'dsh-ma-section-hint' }, market.sources.length + ' / ' + t('sources.title')),
              ),
              h('textarea', {
                className: 'dsh-ma-textarea',
                ref: reportRef,
                readOnly: true,
                spellCheck: false,
                value: markdown,
                'aria-label': t('report.title'),
              }),
              h(
                'section',
                { className: 'dsh-ma-card', key: 'sources', style: { marginTop: '14px' } },
                h(
                  'div',
                  { className: 'dsh-ma-card-head' },
                  h('h3', { className: 'dsh-ma-card-title' }, t('sources.title')),
                  h('span', { className: 'dsh-ma-spacer' }),
                  h(
                    'button',
                    { className: 'dsh-ma-btn is-small', type: 'button', onClick: addSource },
                    '+ ' + t('sources.add'),
                  ),
                ),
                market.sources.length === 0
                  ? h('p', { className: 'dsh-ma-empty-line' }, t('sources.empty'))
                  : h(
                      'div',
                      { className: 'dsh-ma-sources' },
                      market.sources.map(function (source) {
                        return h(
                          'div',
                          { className: 'dsh-ma-source', key: source.id },
                          h('span', { className: 'dsh-ma-source-title' }, source.title || t('sources.untitled')),
                          isSafeUrl(source.url)
                            ? h(
                                'a',
                                {
                                  className: 'dsh-ma-source-link',
                                  href: source.url,
                                  target: '_blank',
                                  rel: 'noreferrer noopener',
                                },
                                source.url,
                              )
                            : h('span', { className: 'dsh-ma-source-link' }, '—'),
                          h('span', { className: 'dsh-ma-chip' }, source.asOf || '—'),
                          h(
                            'span',
                            { className: 'dsh-ma-row-actions' },
                            h(
                              'button',
                              {
                                className: 'dsh-ma-mini',
                                type: 'button',
                                'aria-label': t('sources.edit'),
                                onClick: function () {
                                  openDialog('source', source.id);
                                },
                              },
                              h(
                                'svg',
                                {
                                  viewBox: '0 0 16 16',
                                  width: 13,
                                  height: 13,
                                  'aria-hidden': 'true',
                                  style: { display: 'block' },
                                },
                                h('path', {
                                  d: 'M10.6 2.6l2.8 2.8L5.7 13.1H2.9v-2.8z',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  strokeWidth: 1.4,
                                  strokeLinejoin: 'round',
                                }),
                              ),
                            ),
                            h(
                              'button',
                              {
                                className: 'dsh-ma-mini is-danger',
                                type: 'button',
                                'aria-label': t('sources.delete'),
                                onClick: function () {
                                  deleteRow('source', source.id);
                                },
                              },
                              closeGlyph(12),
                            ),
                          ),
                        );
                      }),
                    ),
              ),
            );
          }

          /* ---- dialogs ----------------------------------------------------- */

          function dialogTitle(dialog) {
            if (dialog.kind === 'overview') return t('editor.overview');
            if (dialog.kind === 'segment') return t('editor.segment');
            if (dialog.kind === 'player') return t('editor.player');
            if (dialog.kind === 'trend') return t('editor.trend');
            return t('editor.source');
          }

          function renderDialogFields(dialog) {
            const fields = dialog.fields;
            if (dialog.kind === 'overview') {
              return [
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row1' },
                  textField('size', t('overview.size'), fields.size, function (v) {
                    setField('size', v);
                  }, { numeric: true, hint: t('unit.million') }),
                  textField('sizeYear', t('editor.year'), fields.sizeYear, function (v) {
                    setField('sizeYear', v);
                  }, { numeric: true }),
                ),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row2' },
                  textField('cagr', t('overview.cagr'), fields.cagr, function (v) {
                    setField('cagr', v);
                  }, { numeric: true, hint: t('editor.percent') }),
                  textField('cagrWindow', t('editor.cagrWindow'), fields.cagrWindow, function (v) {
                    setField('cagrWindow', v);
                  }, { placeholder: '2025-2030' }),
                ),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row3' },
                  textField('forecastSize', t('overview.forecast'), fields.forecastSize, function (v) {
                    setField('forecastSize', v);
                  }, { numeric: true, hint: t('unit.million') }),
                  textField('forecastYear', t('editor.year'), fields.forecastYear, function (v) {
                    setField('forecastYear', v);
                  }, { numeric: true }),
                ),
              ];
            }
            if (dialog.kind === 'segment') {
              return [
                textField('name', t('editor.name'), fields.name, function (v) {
                  setField('name', v);
                }, { placeholder: t('segments.untitled') }),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row1' },
                  textField('size', t('segments.size'), fields.size, function (v) {
                    setField('size', v);
                  }, { numeric: true, hint: t('unit.million') }),
                  textField('players', t('segments.players'), fields.players, function (v) {
                    setField('players', v);
                  }, { numeric: true }),
                ),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row2' },
                  textField('yoy', t('segments.yoy'), fields.yoy, function (v) {
                    setField('yoy', v);
                  }, { numeric: true, hint: t('editor.percent') }),
                  textField('margin', t('segments.margin'), fields.margin, function (v) {
                    setField('margin', v);
                  }, { numeric: true, hint: t('editor.percent') }),
                ),
              ];
            }
            if (dialog.kind === 'player') {
              return [
                textField('name', t('editor.name'), fields.name, function (v) {
                  setField('name', v);
                }, { placeholder: t('competition.untitled') }),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row1' },
                  textField('share', t('competition.share'), fields.share, function (v) {
                    setField('share', v);
                  }, { numeric: true, hint: t('editor.percent') }),
                  textField('revenue', t('competition.revenue'), fields.revenue, function (v) {
                    setField('revenue', v);
                  }, { numeric: true, hint: t('unit.million') }),
                ),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row2' },
                  textField('hq', t('competition.hq'), fields.hq, function (v) {
                    setField('hq', v);
                  }, {}),
                  textField('year', t('editor.year'), fields.year, function (v) {
                    setField('year', v);
                  }, { numeric: true }),
                ),
                textField('note', t('editor.note'), fields.note, function (v) {
                  setField('note', v);
                }, {}),
              ];
            }
            if (dialog.kind === 'trend') {
              return [
                textField('name', t('editor.name'), fields.name, function (v) {
                  setField('name', v);
                }, { placeholder: t('trends.untitled') }),
                h(
                  'div',
                  { className: 'dsh-ma-field-row', key: 'row1' },
                  h(
                    'label',
                    { className: 'dsh-ma-field', key: 'impact' },
                    h('span', { className: 'dsh-ma-label' }, t('editor.impact')),
                    h(
                      'select',
                      {
                        className: 'dsh-ma-input',
                        value: fields.impact,
                        'aria-label': t('editor.impact'),
                        onChange: function (event) {
                          setField('impact', event.target.value);
                        },
                      },
                      [1, 2, 3, 4, 5].map(function (value) {
                        return h('option', { value: String(value), key: 'i' + value }, value + '/5');
                      }),
                    ),
                  ),
                  textField('horizon', t('editor.horizon'), fields.horizon, function (v) {
                    setField('horizon', v);
                  }, { placeholder: '1-3 ' + t('editor.year') }),
                ),
                textField('evidence', t('editor.evidence'), fields.evidence, function (v) {
                  setField('evidence', v);
                }, {}),
              ];
            }
            return [
              textField('title', t('sources.name'), fields.title, function (v) {
                setField('title', v);
              }, { placeholder: t('sources.untitled') }),
              textField('url', t('sources.url'), fields.url, function (v) {
                setField('url', v);
              }, { placeholder: 'https://' }),
              textField('asOf', t('sources.asOf'), fields.asOf, function (v) {
                setField('asOf', v);
              }, { numeric: true }),
            ];
          }

          function renderDialog() {
            if (!dialog) return null;
            const deletable = dialog.kind !== 'overview';
            return h(
              'div',
              {
                className: 'dsh-ma-overlay',
                key: 'overlay',
                onMouseDown: function (event) {
                  if (event.target === event.currentTarget) setDialog(null);
                },
              },
              h(
                'div',
                {
                  className: 'dsh-ma-dialog',
                  role: 'dialog',
                  'aria-modal': 'true',
                  'aria-label': dialogTitle(dialog),
                },
                h('h2', { className: 'dsh-ma-dialog-title' }, dialogTitle(dialog)),
                renderDialogFields(dialog),
                h(
                  'div',
                  { className: 'dsh-ma-dialog-foot' },
                  h(
                    'button',
                    {
                      className: 'dsh-ma-btn is-primary',
                      type: 'button',
                      onClick: commitDialog,
                    },
                    t('editor.save'),
                  ),
                  h(
                    'button',
                    {
                      className: 'dsh-ma-btn',
                      type: 'button',
                      onClick: function () {
                        setDialog(null);
                      },
                    },
                    t('editor.cancel'),
                  ),
                  h('span', { className: 'dsh-ma-dialog-foot-spacer' }),
                  deletable
                    ? h(
                        'button',
                        {
                          className: 'dsh-ma-btn is-danger',
                          type: 'button',
                          onClick: function () {
                            const kind =
                              dialog.kind === 'segment'
                                ? 'segment'
                                : dialog.kind === 'player'
                                  ? 'player'
                                  : dialog.kind === 'trend'
                                    ? 'trend'
                                    : 'source';
                            deleteRow(kind, dialog.id);
                          },
                        },
                        t('editor.delete'),
                      )
                    : null,
                ),
              ),
            );
          }

          /* ---- frame ------------------------------------------------------- */

          const market = activeMarketOf(doc);

          const header = h(
            'div',
            { className: 'dsh-ma-header', key: 'header' },
            h('span', { className: 'dsh-ma-mark' }, panelGlyph(22, false)),
            h(
              'div',
              { className: 'dsh-ma-titles' },
              h('h1', { className: 'dsh-ma-title' }, t('panel.title')),
              h('p', { className: 'dsh-ma-subtitle' }, market ? market.name || t('panel.untitled') : t('panel.subtitle')),
            ),
            h('span', { className: 'dsh-ma-spacer' }),
            market
              ? h('input', {
                  className: 'dsh-ma-name',
                  type: 'text',
                  value: nameDraft === null ? market.name : nameDraft,
                  placeholder: t('panel.marketName'),
                  'aria-label': t('panel.marketName'),
                  onChange: function (event) {
                    setNameDraft(event.target.value);
                    renameMarket(event.target.value, false);
                  },
                  onBlur: function (event) {
                    renameMarket(event.target.value, true);
                    setNameDraft(null);
                  },
                  onKeyDown: function (event) {
                    if (event.key === 'Enter') {
                      renameMarket(event.target.value, true);
                      setNameDraft(null);
                    }
                  },
                })
              : null,
            market
              ? h(
                  'button',
                  {
                    className: 'dsh-ma-icon-btn is-danger',
                    type: 'button',
                    'aria-label': t('panel.deleteMarket'),
                    title: t('panel.deleteMarket'),
                    onClick: deleteMarket,
                  },
                  h(
                    'svg',
                    { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', style: { display: 'block' } },
                    h('path', {
                      d: 'M3 4.6h10M6.4 4.6V3.2h3.2v1.4M4.4 4.6l.6 8.2h6l.6-8.2',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: 1.4,
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    }),
                  ),
                )
              : null,
            h('button', { className: 'dsh-ma-action', type: 'button', onClick: loadSample }, t('panel.sample')),
            market
              ? h(
                  'span',
                  { className: 'dsh-ma-menu-wrap', ref: menuRef },
                  h(
                    'button',
                    {
                      className: 'dsh-ma-action',
                      type: 'button',
                      'aria-expanded': menuOpen ? 'true' : 'false',
                      'aria-haspopup': 'menu',
                      onClick: function () {
                        setMenuOpen(!menuOpen);
                      },
                    },
                    t('panel.export'),
                    chevronGlyph(13),
                  ),
                  menuOpen
                    ? h(
                        'div',
                        { className: 'dsh-ma-menu', role: 'menu' },
                        h(
                          'button',
                          { className: 'dsh-ma-menu-item', type: 'button', role: 'menuitem', onClick: exportMarkdown },
                          t('panel.exportMarkdown'),
                        ),
                        h(
                          'button',
                          { className: 'dsh-ma-menu-item', type: 'button', role: 'menuitem', onClick: exportJson },
                          t('panel.exportJson'),
                        ),
                      )
                    : null,
                )
              : null,
          );

          const markets = doc.markets;
          const bar = markets.length
            ? h(
                'div',
                { className: 'dsh-ma-bar', key: 'bar', role: 'navigation', 'aria-label': t('aria.tabs') },
                h(
                  'div',
                  { className: 'dsh-ma-tabs' },
                  markets.map(function (entry) {
                    const current = entry.id === doc.activeId;
                    return h(
                      'button',
                      {
                        className: 'dsh-ma-tab' + (current ? ' is-current' : ''),
                        key: entry.id,
                        type: 'button',
                        'aria-selected': current ? 'true' : 'false',
                        title: entry.name || t('panel.untitled'),
                        onClick: function () {
                          selectMarket(entry.id);
                        },
                      },
                      entry.name || t('panel.untitled'),
                    );
                  }),
                  h(
                    'button',
                    {
                      className: 'dsh-ma-tab-new',
                      type: 'button',
                      'aria-label': t('panel.newMarket'),
                      title: t('panel.newMarket'),
                      onClick: addMarket,
                    },
                    '+',
                  ),
                ),
              )
            : null;

          const sections = market
            ? h(
                'div',
                { className: 'dsh-ma-sections', key: 'sections', role: 'tablist', 'aria-label': t('aria.sections') },
                SECTIONS.map(function (entry) {
                  const current = entry.id === section;
                  return h(
                    'button',
                    {
                      className: 'dsh-ma-section-tab' + (current ? ' is-current' : ''),
                      key: entry.id,
                      type: 'button',
                      role: 'tab',
                      'aria-selected': current ? 'true' : 'false',
                      onClick: function () {
                        setSection(entry.id);
                      },
                    },
                    t(entry.key),
                  );
                }),
              )
            : null;

          let body;
          if (!market) {
            body = h(
              'div',
              { className: 'dsh-ma-scroll is-empty', key: 'body' },
              emptySection(
                t('empty.title'),
                t('empty.hint'),
                h(
                  'span',
                  { className: 'dsh-ma-empty-actions' },
                  h('button', { className: 'dsh-ma-btn is-primary', type: 'button', onClick: addMarket }, t('empty.create')),
                  h('button', { className: 'dsh-ma-btn', type: 'button', onClick: loadSample }, t('empty.sample')),
                ),
              ),
            );
          } else {
            let content;
            if (section === 'segments') content = renderSegments(market);
            else if (section === 'competition') content = renderCompetition(market);
            else if (section === 'trends') content = renderTrends(market);
            else if (section === 'report') content = renderReport(market);
            else content = renderOverview(market);
            body = h('div', { className: 'dsh-ma-scroll', key: 'body' }, content);
          }

          const toastView = toast ? h('div', { className: 'dsh-ma-toast', role: 'status' }, toast) : null;

          return h(
            'div',
            { className: 'dsh-ma-root', 'aria-label': t('aria.panel') },
            h('style', { key: 'css' }, CSS),
            header,
            bar,
            sections,
            body,
            renderDialog(),
            toastView,
          );
        }

        /* The panel row: the label doubles as visible text, accessible name and rail tooltip. */
        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 40,
              label: function () {
                return t('panel.title');
              },
            },
            PanelIcon,
          );
        });

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: PANEL_ID }, MarketAnalysisPanel);
        });
      },

      /* Pure helpers, exposed for the off-line smoke harness. Nothing in the
       * Host or Client runtime reads this; it keeps the metrics testable. */
      /* The metrics the layout is built from, on the result itself per SPEC.
       * `__pure` keeps the same set grouped for the off-line harness. */
      segmentTotal: segmentTotal,
      weightedYoy: weightedYoy,
      segmentShares: segmentShares,
      cr: cr,
      hhi: hhi,
      concentrationKey: concentrationKey,
      historyDelta: historyDelta,
      rankPlayers: rankPlayers,
      marketMarkdown: marketMarkdown,

      __pure: {
        sanitizeDoc: sanitizeDoc,
        defaultDoc: defaultDoc,
        sampleDoc: sampleDoc,
        segmentTotal: segmentTotal,
        weightedYoy: weightedYoy,
        segmentShares: segmentShares,
        playerShareSum: playerShareSum,
        cr: cr,
        hhi: hhi,
        concentrationKey: concentrationKey,
        historyDelta: historyDelta,
        rankPlayers: rankPlayers,
        marketMarkdown: marketMarkdown,
        formatMoney: formatMoney,
        formatPercent: formatPercent,
        findRow: findRow,
        upsertRow: upsertRow,
      },
    };
  },
});
