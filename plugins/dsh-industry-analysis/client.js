/**
 * Client half of the Industry Analysis bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `industry-analysis`. The analysis document — industries, their overview
 * figures, value chain, five forces, players and sources — is browser-owned and
 * persists in localStorage; the Host half registers nothing.
 *
 * Plain browser JavaScript loaded by the harness module loader; `require` is
 * only ever called with 'react'.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-industry-analysis',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'industryAnalysis';
    const PANEL_ID = 'industry-analysis';
    const STORAGE_KEY = 'dsh.industry-analysis.doc.v1';
    const DOC_VERSION = 1;
    const TOAST_MS = 2600;

    const MAX_INDUSTRIES = 40;
    const MAX_ROWS = 60;
    const MAX_BULLETS = 20;

    /* Stable identifiers; the table and report order depends on these arrays. */
    const STAGES = ['upstream', 'mid', 'downstream'];
    const FIVE = ['rivalry', 'entrant', 'substitute', 'supplier', 'buyer'];

    /* ---- artwork ------------------------------------------------------------
     * These accents are the artwork of this panel, so they carry literal
     * colours. Every piece of chrome around them (surfaces, borders, labels,
     * buttons, tracks, focus rings, empty states) uses host theme tokens. */
    const ACCENTS = ['#2f7d6b', '#3d7bb8', '#c9772f', '#8a5fb0', '#b3543f', '#2f8a52'];
    const STAGE_TINT = { upstream: '#3d7bb8', mid: '#2f7d6b', downstream: '#c9772f' };
    const LEVEL_TINT = {
      low: '#2f8a52',
      moderate: '#c9a227',
      high: '#c9772f',
      extreme: '#b3543f',
    };

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

    /** The one numeric coercion every reader uses (SPEC §2.2). */
    function num(value, fallback) {
      if (isNum(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value.trim());
        if (isFinite(parsed)) return parsed;
      }
      return fallback;
    }

    function clampRange(value, min, max) {
      if (value < min) return min;
      if (value > max) return max;
      return value;
    }

    /** A trimmed, length-capped string; non-strings become ''. */
    function str(value, limit) {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();
      return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed;
    }

    /** Only an absolute http(s) URL may reach an anchor href. */
    function isSafeUrl(value) {
      return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
    }

    function roundTo(value, digits) {
      const factor = Math.pow(10, digits);
      const rounded = Math.round(value * factor) / factor;
      return rounded === 0 ? 0 : rounded;
    }

    /** Fixed-point text with trailing zeros stripped; never prints '-0'. */
    function trimNum(value, digits) {
      const places = typeof digits === 'number' ? digits : 1;
      let text = roundTo(isNum(value) ? value : 0, places).toFixed(places);
      text = text.replace(/\.0+$/, '');
      if (text === '-0') text = '0';
      return text;
    }

    /** '1,234.5' or ' 12 ' -> number, anything else -> null (a user input field). */
    function parseNum(value) {
      if (typeof value !== 'string') return null;
      const text = value.trim().replace(/[,，\s]/g, '');
      if (!text) return null;
      const parsed = Number(text);
      return isFinite(parsed) ? parsed : null;
    }

    /** Percent input ('24.5' or '24.5%') -> fraction 0.245, else null. */
    function parsePercent(value) {
      if (typeof value !== 'string') return null;
      const text = value.trim().replace(/[,，\s%％]/g, '');
      if (!text) return null;
      const parsed = Number(text);
      return isFinite(parsed) ? parsed / 100 : null;
    }

    /** Thousand-separated amount, at most one decimal, trailing zeros stripped. */
    function formatMoney(value) {
      const amount = num(value, 0);
      const rounded = roundTo(amount, 1);
      const negative = rounded < 0;
      const abs = Math.abs(rounded);
      const whole = Math.floor(abs);
      const frac = Math.round((abs - whole) * 10);
      let text = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (frac > 0) text += '.' + frac;
      if (negative && text !== '0') text = '-' + text;
      return text;
    }

    /** A fraction as percent text: 0.245 -> '24.5%'. */
    function formatPercent(fraction, digits) {
      const places = typeof digits === 'number' ? digits : 1;
      const value = num(fraction, 0) * 100;
      return trimNum(value, places) + '%';
    }

    /** A percentage-point number as percent text: 24.5 -> '24.5%'. */
    function formatPoints(points, digits) {
      return trimNum(num(points, 0), typeof digits === 'number' ? digits : 1) + '%';
    }

    function slugOf(name) {
      const source = typeof name === 'string' ? name.trim() : '';
      if (!source) return 'industry';
      const slug = source
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      return slug || 'industry';
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

    /* ---- metrics (pure) ---------------------------------------------------- */

    function asArray(value) {
      return Array.isArray(value) ? value : [];
    }

    /** The first chain entry with this stage, or undefined. */
    function chainOfStage(chain, stage) {
      const rows = asArray(chain);
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (row && typeof row === 'object' && row.stage === stage) return row;
      }
      return undefined;
    }

    function chainShareTotal(chain) {
      const rows = asArray(chain);
      let total = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || typeof row !== 'object') continue;
        total += num(row.share, 0);
      }
      return roundTo(total, 2);
    }

    function weightedMargin(chain) {
      const rows = asArray(chain);
      let weighted = 0;
      let weight = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || typeof row !== 'object') continue;
        const share = num(row.share, 0);
        const margin = num(row.margin, 0);
        weighted += share * margin;
        weight += share;
      }
      if (!(weight > 0)) return 0;
      return roundTo(weighted / weight, 2);
    }

    function playerShareSum(players) {
      const rows = asArray(players);
      let total = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || typeof row !== 'object') continue;
        total += num(row.share, 0);
      }
      return roundTo(total, 2);
    }

    /** A deterministic string compare: no locale collation. */
    function compareText(a, b) {
      const left = typeof a === 'string' ? a : '';
      const right = typeof b === 'string' ? b : '';
      if (left < right) return -1;
      if (left > right) return 1;
      return 0;
    }

    function rankPlayers(players) {
      const rows = asArray(players);
      const copy = [];
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (row && typeof row === 'object') copy.push(row);
      }
      copy.sort(function (a, b) {
        const delta = num(b.share, 0) - num(a.share, 0);
        if (delta !== 0) return delta;
        return compareText(a.name, b.name);
      });
      return copy;
    }

    function cr(players, n) {
      let limit = num(n, 0);
      if (!isFinite(limit)) return 0;
      limit = Math.floor(limit);
      if (limit <= 0) return 0;
      const ranked = rankPlayers(players);
      let total = 0;
      for (let i = 0; i < ranked.length && i < limit; i += 1) {
        total += num(ranked[i].share, 0);
      }
      return roundTo(total, 2);
    }

    function hhi(players) {
      const rows = asArray(players);
      let total = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || typeof row !== 'object') continue;
        const share = num(row.share, 0);
        total += share * share;
      }
      return roundTo(total, 2);
    }

    function concentrationKey(value) {
      const index = num(value, 0);
      if (index < 1500) return 'competitive';
      if (index <= 2500) return 'moderate';
      return 'concentrated';
    }

    function historyDelta(history) {
      const rows = asArray(history);
      const entries = [];
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || typeof row !== 'object') continue;
        entries.push({ year: num(row.year, 0), size: num(row.size, 0) });
      }
      entries.sort(function (a, b) {
        return a.year - b.year;
      });
      const out = [];
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        let growth = null;
        if (i > 0) {
          const previous = entries[i - 1].size;
          if (previous > 0) growth = roundTo((entry.size - previous) / previous, 4);
        }
        out.push({ year: entry.year, size: entry.size, growth: growth });
      }
      return out;
    }

    function historyCagr(history) {
      const series = historyDelta(history);
      if (series.length < 2) return null;
      const first = series[0].size;
      const last = series[series.length - 1].size;
      if (!(first > 0) || !(last > 0)) return null;
      return roundTo(Math.pow(last / first, 1 / (series.length - 1)) - 1, 4);
    }

    /** SPEC §3; the boundary comparisons are all inclusive where stated. */
    function lifecycleStage(overview) {
      const source = overview && typeof overview === 'object' ? overview : {};
      const growth = num(source.yoy, 0);
      const penetration = clampRange(num(source.penetration, 0), 0, 1);
      if (growth < 0) return 'declining';
      if (growth < 0.05) return 'mature';
      const base = growth >= 0.2 ? 'emerging' : 'growth';
      if (base === 'growth' && penetration >= 0.6) return 'mature';
      if (base === 'emerging' && penetration >= 0.4) return 'growth';
      return base;
    }

    /** The 5 forces in FIVE order, each with a clamped 1..5 score (SPEC §2.1). */
    function forcesNormalized(forces) {
      const rows = asArray(forces);
      const out = [];
      for (let i = 0; i < FIVE.length; i += 1) {
        const key = FIVE[i];
        let found = null;
        for (let j = 0; j < rows.length; j += 1) {
          const row = rows[j];
          if (row && typeof row === 'object' && row.key === key) {
            found = row;
            break;
          }
        }
        const raw = found ? num(found.score, 1) : 1;
        out.push({
          key: key,
          score: clampRange(Math.round(raw), 1, 5),
          evidence: found ? str(found.evidence, 400) : '',
          id: found && typeof found.id === 'string' && found.id ? found.id : '',
        });
      }
      return out;
    }

    function forcesAggregate(forces) {
      const rows = forcesNormalized(forces);
      let total = 0;
      for (let i = 0; i < rows.length; i += 1) total += rows[i].score;
      const avg = roundTo(total / 5, 2);
      let level;
      if (avg < 2) level = 'low';
      else if (avg < 3) level = 'moderate';
      else if (avg < 4) level = 'high';
      else level = 'extreme';
      return { avg: avg, level: level };
    }

    function forcesAttractiveness(forces) {
      const avg = forcesAggregate(forces).avg;
      return clampRange(Math.round(((5 - avg) / 4) * 100), 0, 100);
    }

    /* ---- document helpers (pure) ------------------------------------------- */

    function blankOverview() {
      return {
        size: 0,
        yoy: 0,
        cagr: 0,
        forecastSize: 0,
        penetration: 0,
        asOf: String(new Date().getFullYear()),
        history: [],
        drivers: [],
        risks: [],
      };
    }

    function blankForces() {
      return FIVE.map(function (key) {
        return { id: uid('fo-'), key: key, score: 1, evidence: '' };
      });
    }

    function blankIndustry(name) {
      const stamp = nowMs();
      return {
        id: uid('ind-'),
        name: name || '',
        updatedAt: stamp,
        overview: blankOverview(),
        chain: [],
        forces: blankForces(),
        players: [],
        sources: [],
      };
    }

    function defaultDoc() {
      return { version: DOC_VERSION, activeId: '', industries: [] };
    }

    function sanitizeStringList(value, limit, cap) {
      const rows = asArray(value);
      const out = [];
      for (let i = 0; i < rows.length && out.length < cap; i += 1) {
        const item = rows[i];
        if (typeof item !== 'string') continue;
        const text = str(item, limit);
        if (text) out.push(text);
      }
      return out;
    }

    function sanitizeOverview(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      const overview = blankOverview();
      overview.size = num(source.size, 0);
      overview.yoy = num(source.yoy, 0);
      overview.cagr = num(source.cagr, 0);
      overview.forecastSize = num(source.forecastSize, 0);
      overview.penetration = clampRange(num(source.penetration, 0), 0, 1);
      overview.asOf = str(source.asOf, 24) || blankOverview().asOf;
      const history = asArray(source.history);
      const points = [];
      for (let i = 0; i < history.length && points.length < MAX_ROWS; i += 1) {
        const entry = history[i];
        if (!entry || typeof entry !== 'object') continue;
        points.push({ year: Math.round(num(entry.year, 0)), size: num(entry.size, 0) });
      }
      points.sort(function (a, b) {
        return a.year - b.year;
      });
      overview.history = points;
      overview.drivers = sanitizeStringList(source.drivers, 240, MAX_BULLETS);
      overview.risks = sanitizeStringList(source.risks, 240, MAX_BULLETS);
      return overview;
    }

    function sanitizeChain(raw) {
      const rows = asArray(raw);
      const out = [];
      for (let i = 0; i < rows.length && out.length < MAX_ROWS; i += 1) {
        const entry = rows[i];
        if (!entry || typeof entry !== 'object') continue;
        const stage = STAGES.indexOf(entry.stage) >= 0 ? entry.stage : 'mid';
        out.push({
          id: typeof entry.id === 'string' && entry.id ? entry.id : uid('ch-'),
          stage: stage,
          name: str(entry.name, 80),
          share: clampRange(num(entry.share, 0), 0, 100),
          margin: clampRange(num(entry.margin, 0), 0, 100),
          moat: str(entry.moat, 120),
          players: str(entry.players, 160),
        });
      }
      return out;
    }

    function sanitizeForces(raw) {
      const rows = asArray(raw);
      if (!rows.length) return blankForces();
      const out = [];
      const taken = [];
      for (let i = 0; i < FIVE.length; i += 1) {
        const key = FIVE[i];
        let found = null;
        for (let j = 0; j < rows.length; j += 1) {
          const row = rows[j];
          if (row && typeof row === 'object' && row.key === key) {
            found = row;
            break;
          }
        }
        let id = found && typeof found.id === 'string' && found.id ? found.id : '';
        if (!id || taken.indexOf(id) >= 0) id = uid('fo-');
        taken.push(id);
        out.push({
          id: id,
          key: key,
          score: found ? clampRange(Math.round(num(found.score, 1)), 1, 5) : 1,
          evidence: found ? str(found.evidence, 400) : '',
        });
      }
      return out;
    }

    function sanitizePlayers(raw) {
      const rows = asArray(raw);
      const out = [];
      for (let i = 0; i < rows.length && out.length < MAX_ROWS; i += 1) {
        const entry = rows[i];
        if (!entry || typeof entry !== 'object') continue;
        out.push({
          id: typeof entry.id === 'string' && entry.id ? entry.id : uid('pl-'),
          name: str(entry.name, 80),
          share: clampRange(num(entry.share, 0), 0, 100),
          revenue: num(entry.revenue, 0),
          moat: str(entry.moat, 160),
          positioning: str(entry.positioning, 120),
          note: str(entry.note, 240),
        });
      }
      return out;
    }

    function sanitizeSources(raw) {
      const rows = asArray(raw);
      const out = [];
      for (let i = 0; i < rows.length && out.length < MAX_ROWS; i += 1) {
        const entry = rows[i];
        if (!entry || typeof entry !== 'object') continue;
        out.push({
          id: typeof entry.id === 'string' && entry.id ? entry.id : uid('sc-'),
          title: str(entry.title, 160),
          url: str(entry.url, 400),
          asOf: str(entry.asOf, 24),
        });
      }
      return out;
    }

    function sanitizeIndustry(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      return {
        id: typeof source.id === 'string' && source.id ? source.id : uid('ind-'),
        name: str(source.name, 80),
        updatedAt: num(source.updatedAt, nowMs()),
        overview: sanitizeOverview(source.overview),
        chain: sanitizeChain(source.chain),
        forces: sanitizeForces(source.forces),
        players: sanitizePlayers(source.players),
        sources: sanitizeSources(source.sources),
      };
    }

    function sanitizeDoc(raw) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultDoc();
      const rows = raw.industries;
      if (!Array.isArray(rows)) return defaultDoc();
      const industries = [];
      const ids = [];
      for (let i = 0; i < rows.length && industries.length < MAX_INDUSTRIES; i += 1) {
        const entry = rows[i];
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
        const industry = sanitizeIndustry(entry);
        if (ids.indexOf(industry.id) >= 0) industry.id = uid('ind-');
        ids.push(industry.id);
        industries.push(industry);
      }
      let activeId = typeof raw.activeId === 'string' ? raw.activeId : '';
      if (ids.indexOf(activeId) < 0) activeId = ids.length ? ids[0] : '';
      return { version: DOC_VERSION, activeId: activeId, industries: industries };
    }

    /* SAMPLE-START */
    /** The built-in demo: a real industry, every figure traceable in `sources`. */
    function sampleIndustry() {
      const stamp = nowMs();
      return {
        id: 'ind-sample',
        name: "全球工业机器人产业",
        updatedAt: stamp,
        overview: {
          size: 199,
          yoy: 0.112,
          cagr: 0.0752,
          forecastSize: 266,
          penetration: 0.15,
          asOf: "2025",
          history: [
            { year: 2021, size: 171 },
            { year: 2022, size: 182 },
            { year: 2023, size: 179 },
            { year: 2024, size: 179 },
            { year: 2025, size: 199 }
          ],
          drivers: [
            "制造业回流与供应链区域化：高工资经济体重建产能，靠自动化对冲人工成本",
            "劳动力结构性短缺与人口老龄化，尤其在日韩德与北美",
            "AI、机器视觉与力控进步扩大可自动化的工序范围",
            "编程与系统集成门槛下降，自动化向中小企业与新行业扩散（食品、物流、新能源）"
          ],
          risks: [
            "汽车与 3C 两大下游资本开支周期性强，2023–2024 已出现增速回落",
            "中国本土厂商价格战压缩本体与系统集成环节毛利",
            "精密减速器、高端伺服仍依赖少数日欧供应商，供应集中度高",
            "贸易与产业政策变化可能重塑区域装机格局"
          ],
        },
        chain: [
          {
            id: 'ch-sample-1',
            stage: "upstream",
            name: "精密减速器",
            share: 18,
            margin: 35,
            moat: "高",
            players: "哈默纳科、纳博特斯克、双环传动、绿的谐波",
          },
          {
            id: 'ch-sample-2',
            stage: "upstream",
            name: "伺服电机与驱动",
            share: 15,
            margin: 30,
            moat: "中高",
            players: "安川、松下、汇川技术、三菱电机",
          },
          {
            id: 'ch-sample-3',
            stage: "upstream",
            name: "运动控制器",
            share: 8,
            margin: 25,
            moat: "中高",
            players: "发那科、倍福、KEBA、埃斯顿",
          },
          {
            id: 'ch-sample-4',
            stage: "mid",
            name: "本体制造",
            share: 24,
            margin: 20,
            moat: "中",
            players: "发那科、ABB、库卡、安川、埃斯顿",
          },
          {
            id: 'ch-sample-5',
            stage: "downstream",
            name: "系统集成",
            share: 25,
            margin: 15,
            moat: "低",
            players: "各区域系统集成商，集中度极低",
          },
          {
            id: 'ch-sample-6',
            stage: "downstream",
            name: "运维与软件服务",
            share: 10,
            margin: 40,
            moat: "中",
            players: "原厂服务网络、第三方运维平台",
          }
        ],
        forces: [
          { id: 'fo-sample-1', key: "rivalry", score: 4, evidence: "四大传统厂商与中国本土厂商正面竞争，中国本土份额已升至 55%" },
          { id: 'fo-sample-2', key: "entrant", score: 3, evidence: "核心零部件与工艺know-how形成壁垒，但中国新进入者数量多、资本充足" },
          { id: 'fo-sample-3', key: "substitute", score: 2, evidence: "专用机与人工替代能力有限；主要替代来自协作机器人等同类产品内部替代" },
          { id: 'fo-sample-4', key: "supplier", score: 4, evidence: "高端精密减速器与伺服仍集中于日欧少数供应商，议价能力强" },
          { id: 'fo-sample-5', key: "buyer", score: 4, evidence: "汽车与 3C 大客户采购量大、标准化程度高，议价能力强" }
        ],
        players: [
          {
            id: 'pl-sample-1',
            name: "ABB",
            share: 15,
            revenue: 30,
            moat: "全球渠道、软件与系统集成能力",
            positioning: "全品类+数字化平台",
            note: "机器人业务收入为推算，ABB 分部披露口径含自动化",
          },
          {
            id: 'pl-sample-2',
            name: "发那科 FANUC",
            share: 11.5,
            revenue: 22,
            moat: "控制系统与本体垂直一体化，超高利润率",
            positioning: "高端六轴本体与控制系统",
            note: "营收为 FY2024 机器人分部 ¥329,566 百万日元，按 150 日元/美元折算",
          },
          {
            id: 'pl-sample-3',
            name: "安川 Yaskawa",
            share: 10,
            revenue: 20,
            moat: "伺服与运动控制技术积累",
            positioning: "伺服驱动+机器人一体化",
            note: "机器人分部收入为推算",
          },
          {
            id: 'pl-sample-4',
            name: "库卡 KUKA",
            share: 8.5,
            revenue: 17,
            moat: "汽车产线集成经验，被美的收购后中国份额提升",
            positioning: "汽车与重载应用",
            note: "收入为推算",
          },
          {
            id: 'pl-sample-5',
            name: "埃斯顿 Estun",
            share: 4.5,
            revenue: 9,
            moat: "国产替代性价比+伺服自供",
            positioning: "国产中端本体",
            note: "收入为推算",
          }
        ],
        sources: [
          { id: 'sc-sample-1', title: "IFR World Robotics 2026 — Five Million Robots now Operate in Factories Globally", url: "https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally", asOf: "2026" },
          { id: 'sc-sample-2', title: "IFR World Robotics 2024 — Record of 4 Million Robots in Factories Worldwide", url: "https://ifr.org/ifr-press-releases/news/record-of-4-million-robots-working-in-factories-worldwide", asOf: "2024" },
          { id: 'sc-sample-3', title: "IFR — US Robot Industry Returns to Double Digit Growth (preliminary 2025)", url: "https://ifr.org/ifr-press-releases/news/us-robot-industry-returns-to-double-digit-growth", asOf: "2026" },
          { id: 'sc-sample-4', title: "IFR World Robotics — Industrial Robots report scope and market-value methodology", url: "https://ifr.org/wr-industrial-robots/", asOf: "2026" },
          { id: 'sc-sample-5', title: "FANUC — Consolidated Financial Results FY2024 (Robot Division ¥329,566m)", url: "https://www.fanuc.co.jp/en/ir/announce/pdf/2025/financialresult202503_e.pdf", asOf: "2025" },
          { id: 'sc-sample-6', title: "FANUC — Financial Results for the Year Ended March 31, 2026", url: "https://www.fanuc.co.jp/en/ir/announce/pdf/2026/reference202603_e.pdf", asOf: "2026" },
          { id: 'sc-sample-7', title: "GMI Insights — Industrial Robotics Market (USD 17.78bn 2024, 13.3% CAGR)", url: "https://www.gminsights.com/industry-analysis/industrial-robotics-market", asOf: "2025" },
          { id: 'sc-sample-8', title: "Fortune Business Insights — Industrial Robots Market (USD 24.43bn 2026, 15.5% CAGR)", url: "https://www.fortunebusinessinsights.com/industry-reports/industrial-robots-market-100360", asOf: "2026" },
          { id: 'sc-sample-9', title: "Manufacturing Lead Generation — Robotics statistics roundup (Grand View: USD 33.96bn 2024)", url: "https://manufacturingleadgeneration.com/manufacturing-robotics-statistics/", asOf: "2025" },
          { id: 'sc-sample-10', title: "Source by Spec — Harmonic reducer supply chain 2026 (actuation 40–56% of robot BOM)", url: "https://www.sourcebyspec.com/news/harmonic-reducer-supply-chain-2026-tier-map-flexspline-risks-sourcing-gates.html", asOf: "2026" }
        ],
      };
    }

    function sampleDoc() {
      const industry = sampleIndustry();
      return { version: DOC_VERSION, activeId: industry.id, industries: [industry] };
    }
    /* SAMPLE-END */

    function findIndustry(doc, id) {
      const rows = asArray(doc && doc.industries);
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i] && rows[i].id === id) return { index: i, industry: rows[i] };
      }
      return { index: -1, industry: null };
    }

    /* ---- storage ----------------------------------------------------------- */

    function loadDoc() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return sanitizeDoc(parsed);
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

    /* ---- report (pure) ------------------------------------------------------
     * The two-argument call is the frozen SPEC §4 form and always emits the
     * Chinese labels the contract pins down. The panel passes the active locale
     * as a third argument so the same report follows a language switch. */
    const MD_LABELS = {
      zh: {
        asOf: '数据截至',
        lifecycle: '生命周期',
        hhi: 'HHI',
        sectionOverview: '## 一、行业概览',
        sectionChain: '## 二、价值链结构',
        sectionForces: '## 三、波特五力',
        sectionLandscape: '## 四、竞争格局',
        sectionSources: '## 五、数据来源',
        size: '行业规模',
        yoy: '同比增长',
        cagr: '预测 CAGR',
        forecast: '预测规模',
        penetration: '渗透率',
        margin: '加权毛利率',
        drivers: '### 增长驱动',
        risks: '### 主要风险',
        none: '（未填写）',
        stage: '环节类型',
        link: '环节',
        share: '增加值占比',
        marginCol: '毛利率',
        moat: '壁垒',
        reps: '代表企业',
        shareTotal: '合计占比',
        overShare: '⚠ 占比合计超过 100%',
        forceCol: '力量',
        strength: '强度',
        basis: '依据',
        pressure: '综合压力',
        attract: '行业吸引力',
        company: '企业',
        shareCol: '份额',
        revenue: '收入(亿美元)',
        unit: '亿美元',
        life: { emerging: '导入期', growth: '成长期', mature: '成熟期', declining: '衰退期' },
        conc: { competitive: '分散', moderate: '中度集中', concentrated: '高度集中' },
        level: { low: '低', moderate: '中', high: '高', extreme: '极高' },
        stageName: { upstream: '上游', mid: '中游', downstream: '下游' },
        forceName: {
          rivalry: '现有竞争者',
          entrant: '潜在进入者',
          substitute: '替代品',
          supplier: '供应商',
          buyer: '购买者',
        },
      },
      en: {
        asOf: 'Data as of',
        lifecycle: 'Lifecycle',
        hhi: 'HHI',
        sectionOverview: '## 1. Industry Overview',
        sectionChain: '## 2. Value Chain Structure',
        sectionForces: "## 3. Porter's Five Forces",
        sectionLandscape: '## 4. Competitive Landscape',
        sectionSources: '## 5. Sources',
        size: 'Market size',
        yoy: 'Year-over-year',
        cagr: 'Forecast CAGR',
        forecast: 'Forecast size',
        penetration: 'Penetration',
        margin: 'Weighted gross margin',
        drivers: '### Growth drivers',
        risks: '### Key risks',
        none: '(not filled in)',
        stage: 'Stage',
        link: 'Link',
        share: 'Value-added share',
        marginCol: 'Gross margin',
        moat: 'Moat',
        reps: 'Representative players',
        shareTotal: 'Total share',
        overShare: '⚠ Shares total more than 100%',
        forceCol: 'Force',
        strength: 'Strength',
        basis: 'Evidence',
        pressure: 'Overall pressure',
        attract: 'Industry attractiveness',
        company: 'Company',
        shareCol: 'Share',
        revenue: 'Revenue (USD 100m)',
        unit: 'USD 100m',
        life: { emerging: 'Emerging', growth: 'Growth', mature: 'Mature', declining: 'Declining' },
        conc: { competitive: 'Competitive', moderate: 'Moderately concentrated', concentrated: 'Concentrated' },
        level: { low: 'Low', moderate: 'Moderate', high: 'High', extreme: 'Extreme' },
        stageName: { upstream: 'Upstream', mid: 'Midstream', downstream: 'Downstream' },
        forceName: {
          rivalry: 'Competitive rivalry',
          entrant: 'Threat of new entrants',
          substitute: 'Threat of substitutes',
          supplier: 'Bargaining power of suppliers',
          buyer: 'Bargaining power of buyers',
        },
      },
    };

    /** A markdown table cell: pipes and newlines would break the row. */
    function cell(value) {
      return String(value === null || value === undefined ? '' : value)
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ');
    }

    function industryMarkdown(doc, industryId, locale) {
      const found = findIndustry(doc, industryId);
      const industry = found.industry;
      if (!industry) return '';
      const labels = MD_LABELS[locale] || MD_LABELS.zh;
      const overview = sanitizeOverview(industry.overview);
      const chain = sanitizeChain(industry.chain);
      const forces = forcesNormalized(industry.forces);
      const players = rankPlayers(sanitizePlayers(industry.players));
      const sources = sanitizeSources(industry.sources);

      const stage = lifecycleStage(overview);
      const index = hhi(players);
      const lines = [];

      lines.push('# ' + (industry.name || labels.none));
      lines.push('');
      lines.push(
        '> ' +
          labels.asOf +
          ' ' +
          (overview.asOf || '-') +
          '　|　' +
          labels.lifecycle +
          '：' +
          labels.life[stage] +
          '　|　' +
          labels.hhi +
          ' ' +
          trimNum(index, 0) +
          '（' +
          labels.conc[concentrationKey(index)] +
          '）',
      );
      lines.push('');

      lines.push(labels.sectionOverview);
      lines.push('');
      lines.push('- ' + labels.size + '：' + formatMoney(overview.size) + ' ' + labels.unit);
      lines.push('- ' + labels.yoy + '：' + formatPercent(overview.yoy));
      lines.push('- ' + labels.cagr + '：' + formatPercent(overview.cagr));
      lines.push('- ' + labels.forecast + '：' + formatMoney(overview.forecastSize) + ' ' + labels.unit);
      lines.push('- ' + labels.penetration + '：' + formatPercent(overview.penetration));
      lines.push('- ' + labels.margin + '：' + trimNum(weightedMargin(chain), 1) + '%');
      lines.push('');
      lines.push(labels.drivers);
      if (overview.drivers.length) {
        for (let i = 0; i < overview.drivers.length; i += 1) lines.push('- ' + overview.drivers[i]);
      } else {
        lines.push('- ' + labels.none);
      }
      lines.push('');
      lines.push(labels.risks);
      if (overview.risks.length) {
        for (let i = 0; i < overview.risks.length; i += 1) lines.push('- ' + overview.risks[i]);
      } else {
        lines.push('- ' + labels.none);
      }
      lines.push('');

      lines.push(labels.sectionChain);
      lines.push('');
      lines.push(
        '| ' +
          labels.stage +
          ' | ' +
          labels.link +
          ' | ' +
          labels.share +
          ' | ' +
          labels.marginCol +
          ' | ' +
          labels.moat +
          ' | ' +
          labels.reps +
          ' |',
      );
      lines.push('| --- | --- | --- | --- | --- | --- |');
      for (let s = 0; s < STAGES.length; s += 1) {
        const stageKey = STAGES[s];
        for (let i = 0; i < chain.length; i += 1) {
          const row = chain[i];
          if (row.stage !== stageKey) continue;
          lines.push(
            '| ' +
              labels.stageName[row.stage] +
              ' | ' +
              cell(row.name) +
              ' | ' +
              trimNum(row.share, 1) +
              '% | ' +
              trimNum(row.margin, 1) +
              '% | ' +
              cell(row.moat) +
              ' | ' +
              cell(row.players) +
              ' |',
          );
        }
      }
      lines.push('');
      const shareTotal = chainShareTotal(chain);
      lines.push(labels.shareTotal + '：' + trimNum(shareTotal, 1) + '%' + (shareTotal > 100 ? '　' + labels.overShare : ''));
      lines.push('');

      const aggregate = forcesAggregate(forces);
      lines.push(labels.sectionForces);
      lines.push('');
      lines.push('| ' + labels.forceCol + ' | ' + labels.strength + ' | ' + labels.basis + ' |');
      lines.push('| --- | --- | --- |');
      for (let i = 0; i < forces.length; i += 1) {
        const row = forces[i];
        lines.push(
          '| ' +
            labels.forceName[row.key] +
            ' | ' +
            row.score +
            '/5 | ' +
            cell(row.evidence) +
            ' |',
        );
      }
      lines.push('');
      lines.push(
        labels.pressure +
          '：' +
          trimNum(aggregate.avg, 2) +
          '/5（' +
          labels.level[aggregate.level] +
          '）　' +
          labels.attract +
          '：' +
          forcesAttractiveness(forces) +
          '/100',
      );
      lines.push('');

      lines.push(labels.sectionLandscape);
      lines.push('');
      lines.push('| ' + labels.company + ' | ' + labels.shareCol + ' | ' + labels.revenue + ' | ' + labels.moat + ' |');
      lines.push('| --- | --- | --- | --- |');
      for (let i = 0; i < players.length; i += 1) {
        const row = players[i];
        lines.push(
          '| ' +
            cell(row.name) +
            ' | ' +
            trimNum(row.share, 1) +
            '% | ' +
            formatMoney(row.revenue) +
            ' | ' +
            cell(row.moat) +
            ' |',
        );
      }
      lines.push('');
      lines.push(
        'CR3 ' +
          trimNum(cr(players, 3), 2) +
          '%　CR5 ' +
          trimNum(cr(players, 5), 2) +
          '%　' +
          labels.hhi +
          ' ' +
          trimNum(index, 2) +
          '（' +
          labels.conc[concentrationKey(index)] +
          '）',
      );
      lines.push('');

      lines.push(labels.sectionSources);
      lines.push('');
      if (sources.length) {
        for (let i = 0; i < sources.length; i += 1) {
          const row = sources[i];
          const when = row.asOf ? '（' + row.asOf + '）' : '';
          if (isSafeUrl(row.url)) {
            lines.push('- [' + (row.title || row.url) + '](' + row.url.trim() + ')' + when);
          } else {
            lines.push('- ' + (row.title || row.url || labels.none) + when);
          }
        }
      } else {
        lines.push('- ' + labels.none);
      }
      lines.push('');
      return lines.join('\n');
    }

    /* ---- glyphs ------------------------------------------------------------ */

    /** The panel glyph: a value-chain spine with three stage nodes. */
    function panelGlyph(size, active) {
      const edge = active ? 1.9 : 1.6;
      const node = { fill: 'currentColor' };
      return h(
        'svg',
        {
          viewBox: '0 0 20 20',
          width: size,
          height: size,
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
        h('path', {
          d: 'M5 3.6v12.8',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: edge * 0.8,
          strokeLinecap: 'round',
          opacity: 0.5,
        }),
        h('circle', Object.assign({ cx: 5, cy: 3.6, r: 1.9 }, node)),
        h('circle', Object.assign({ cx: 5, cy: 10, r: 1.9 }, node)),
        h('circle', Object.assign({ cx: 5, cy: 16.4, r: 1.9 }, node)),
        h('rect', Object.assign({ x: 8.4, y: 2.2, width: 8.4, height: 3, rx: 1.5 }, node)),
        h('rect', { x: 8.4, y: 8.5, width: 9.6, height: 3, rx: 1.5, fill: 'currentColor', opacity: 1 }),
        h('rect', Object.assign({ x: 8.4, y: 14.8, width: 7, height: 3, rx: 1.5 }, node)),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return panelGlyph(size, !!(props && props.active));
    }

    function closeGlyph(size) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
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
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
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
      '.dsh-ia-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px);color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-header{display:flex;flex:none;align-items:center;gap:12px;padding:16px 24px 8px}',
      '.dsh-ia-mark{display:block;flex:none;color:var(--dsw-alias-label-primary);opacity:.9}',
      '.dsh-ia-headings{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}',
      '.dsh-ia-name{font-size:15px;font-weight:600;line-height:1.3;border:0;background:transparent;color:inherit;',
      'font-family:inherit;padding:2px 6px;margin:-2px -6px;border-radius:6px;min-width:0;width:100%;max-width:420px}',
      '.dsh-ia-name:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ia-name:focus{outline:none;background:var(--dsw-alias-bg-layer-2);box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}',
      '.dsh-ia-sub{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.4}',
      '.dsh-ia-tools{display:flex;flex:none;align-items:center;gap:8px}',
      '.dsh-ia-action{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;',
      'border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);',
      'font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .12s ease,border-color .12s ease}',
      '.dsh-ia-action:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}',
      '.dsh-ia-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ia-action[disabled]{opacity:.5;cursor:not-allowed}',
      '.dsh-ia-action.is-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}',
      '.dsh-ia-action.is-primary:hover{background:var(--dsw-alias-brand-primary);filter:brightness(1.08)}',
      '.dsh-ia-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;',
      'border-radius:7px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dsh-ia-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ia-icon-btn.is-danger:hover{color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ia-menu-wrap{position:relative;display:inline-flex}',
      '.dsh-ia-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:30;min-width:180px;padding:5px;border-radius:10px;',
      'background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);',
      'box-shadow:0 8px 24px rgba(0,0,0,.18)}',
      '.dsh-ia-menu-item{display:flex;width:100%;align-items:center;padding:7px 10px;border:0;border-radius:6px;',
      'background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;text-align:start}',
      '.dsh-ia-menu-item:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ia-bar{display:flex;flex:none;align-items:center;gap:8px;padding:4px 24px 8px;overflow-x:auto}',
      '.dsh-ia-tabs{display:flex;align-items:center;gap:6px;min-width:0}',
      '.dsh-ia-tab{display:inline-flex;align-items:center;max-width:200px;height:28px;padding:0 11px;border-radius:7px;',
      'border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;',
      'cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-ia-tab:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-tab.is-current{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);',
      'border-color:var(--dsw-alias-border-l1);font-weight:500}',
      '.dsh-ia-tab-new{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;',
      'border-radius:7px;border:1px dashed var(--dsw-alias-border-l2);background:transparent;',
      'color:var(--dsw-alias-label-secondary);font:inherit;font-size:16px;line-height:1;cursor:pointer;flex:none}',
      '.dsh-ia-tab-new:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-sections{display:flex;flex:none;align-items:center;gap:2px;padding:0 24px;',
      'border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ia-section-tab{position:relative;height:34px;padding:0 12px;border:0;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}',
      '.dsh-ia-section-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-section-tab.is-current{color:var(--dsw-alias-label-primary);font-weight:600}',
      '.dsh-ia-section-tab.is-current::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;',
      'border-radius:2px 2px 0 0;background:var(--dsw-alias-brand-primary)}',
      '.dsh-ia-section-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-3px}',
      '.dsh-ia-scroll{flex:1;min-height:0;overflow-y:auto;padding:18px 24px 32px}',
      '.dsh-ia-scroll.is-empty{display:flex;align-items:center;justify-content:center}',
      '.dsh-ia-stack{display:flex;flex-direction:column;gap:18px;max-width:1080px}',
      '.dsh-ia-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:12px}',
      '.dsh-ia-kpi{padding:14px 16px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);',
      'background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:5px;min-width:0}',
      '.dsh-ia-kpi-label{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.3}',
      '.dsh-ia-kpi-value{font-size:22px;font-weight:600;line-height:1.2;letter-spacing:-.01em;',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ia-kpi-foot{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.3;',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ia-card{padding:16px 18px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-ia-card-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}',
      '.dsh-ia-card-title{font-size:13px;font-weight:600;flex:1;min-width:0}',
      '.dsh-ia-card-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ia-title{font-size:14px;font-weight:600;margin:0 0 10px}',
      '.dsh-ia-hint{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.5}',
      '.dsh-ia-bars{display:flex;flex-direction:column;gap:9px}',
      '.dsh-ia-bar-row{display:grid;grid-template-columns:56px 1fr 96px;align-items:center;gap:10px;font-size:12px}',
      '.dsh-ia-bar-year{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.dsh-ia-bar-track{height:16px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;position:relative}',
      '.dsh-ia-bar-fill{height:100%;border-radius:5px;transition:width .2s ease;min-width:2px}',
      '.dsh-ia-bar-value{text-align:end;font-variant-numeric:tabular-nums;overflow:hidden;',
      'text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-ia-bullets{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}',
      '.dsh-ia-bullet{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.5}',
      '.dsh-ia-bullet-dot{flex:none;width:6px;height:6px;border-radius:50%;margin-top:7px}',
      '.dsh-ia-bullet-text{flex:1;min-width:0;word-break:break-word}',
      '.dsh-ia-bullet-add{display:flex;gap:8px;margin-top:10px}',
      '.dsh-ia-input{flex:1;min-width:0;height:30px;padding:0 10px;border-radius:7px;font:inherit;font-size:13px;',
      'border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary);',
      'box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsh-ia-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}',
      '.dsh-ia-select{height:30px;padding:0 8px;border-radius:7px;font:inherit;font-size:13px;',
      'border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:pointer}',
      '.dsh-ia-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ia-table-wrap{overflow-x:auto;border-radius:10px;border:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ia-table{width:100%;border-collapse:collapse;font-size:13px}',
      '.dsh-ia-table th{text-align:start;font-weight:500;font-size:12px;color:var(--dsw-alias-label-secondary);',
      'padding:9px 12px;background:var(--dsw-alias-bg-layer-2);white-space:nowrap;',
      'border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ia-table td{padding:9px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);vertical-align:middle}',
      '.dsh-ia-table tr:last-child td{border-bottom:0}',
      '.dsh-ia-table tbody tr:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ia-num{text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.dsh-ia-row-tools{display:flex;gap:2px;justify-content:flex-end}',
      '.dsh-ia-cell-input{width:100%;min-width:64px;height:26px;padding:0 7px;border-radius:6px;font:inherit;font-size:13px;',
      'border:1px solid transparent;background:transparent;color:inherit;box-sizing:border-box}',
      '.dsh-ia-cell-input:hover{border-color:var(--dsw-alias-border-l1)}',
      '.dsh-ia-cell-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base)}',
      '.dsh-ia-table-foot{display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:10px 12px;font-size:12px;',
      'color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:0 0 10px 10px}',
      '.dsh-ia-foot-item{display:inline-flex;align-items:center;gap:5px}',
      '.dsh-ia-foot-strong{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums}',
      '.dsh-ia-warn{color:var(--dsw-alias-state-warn-primary)}',
      '.dsh-ia-badge{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:11px;',
      'font-size:11px;font-weight:500;white-space:nowrap;border:1px solid var(--dsw-alias-border-l1);',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.dsh-ia-badge-dot{width:6px;height:6px;border-radius:50%;flex:none}',
      '.dsh-ia-force{display:flex;flex-direction:column;gap:12px}',
      '.dsh-ia-force-row{display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:14px;align-items:start;',
      'padding:12px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-ia-force-row:last-child{border-bottom:0;padding-bottom:0}',
      '.dsh-ia-force-name{font-size:13px;font-weight:500;line-height:1.4}',
      '.dsh-ia-force-body{display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.dsh-ia-dots{display:flex;align-items:center;gap:5px}',
      '.dsh-ia-dot-btn{width:22px;height:22px;padding:0;border-radius:50%;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);',
      'background:transparent;transition:background .12s ease}',
      '.dsh-ia-dot-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-ia-dot-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-ia-force-score{margin-inline-start:6px;font-size:12px;color:var(--dsw-alias-label-secondary);',
      'font-variant-numeric:tabular-nums}',
      '.dsh-ia-score-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}',
      '.dsh-ia-score{padding:12px 14px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);display:flex;',
      'flex-direction:column;gap:4px}',
      '.dsh-ia-score-label{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ia-score-value{font-size:19px;font-weight:600;font-variant-numeric:tabular-nums}',
      '.dsh-ia-empty{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;',
      'padding:48px 24px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ia-empty-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dsh-ia-empty-hint{font-size:13px;max-width:420px;line-height:1.6}',
      '.dsh-ia-empty-actions{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;justify-content:center}',
      '.dsh-ia-report{width:100%;box-sizing:border-box;min-height:420px;padding:14px 16px;border-radius:10px;',
      'border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);',
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.65;',
      'resize:vertical;white-space:pre-wrap;word-break:break-word}',
      '.dsh-ia-report:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-ia-report-tools{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}',
      '.dsh-ia-sources{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}',
      '.dsh-ia-source{display:flex;align-items:baseline;gap:8px;font-size:13px;line-height:1.5;min-width:0}',
      '.dsh-ia-source a{color:var(--dsw-alias-brand-primary);text-decoration:none;word-break:break-all}',
      '.dsh-ia-source a:hover{text-decoration:underline}',
      '.dsh-ia-source-title{min-width:0;word-break:break-word}',
      '.dsh-ia-scrim{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;',
      'padding:24px;background:rgba(0,0,0,.32)}',
      '.dsh-ia-dialog{width:min(520px,100%);max-height:calc(100% - 20px);display:flex;flex-direction:column;',
      'border-radius:14px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);',
      'box-shadow:0 16px 48px rgba(0,0,0,.28);overflow:hidden}',
      '.dsh-ia-dialog-head{display:flex;align-items:center;gap:10px;padding:16px 18px 12px}',
      '.dsh-ia-dialog-title{font-size:14px;font-weight:600;flex:1;min-width:0}',
      '.dsh-ia-dialog-body{display:flex;flex-direction:column;gap:12px;padding:0 18px 4px;overflow-y:auto;min-height:0}',
      '.dsh-ia-field{display:flex;flex-direction:column;gap:5px}',
      '.dsh-ia-field-label{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-ia-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.dsh-ia-error{font-size:12px;color:var(--dsw-alias-state-error-primary)}',
      '.dsh-ia-dialog-foot{display:flex;align-items:center;gap:8px;padding:14px 18px 16px}',
      '.dsh-ia-dialog-foot .dsh-ia-spacer{flex:1}',
      '.dsh-ia-toast{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:50;',
      'padding:9px 16px;border-radius:9px;background:var(--dsw-alias-bg-overlay);',
      'border:1px solid var(--dsw-alias-border-l1);box-shadow:0 8px 24px rgba(0,0,0,.2);',
      'font-size:13px;color:var(--dsw-alias-label-primary);max-width:min(420px,calc(100% - 32px));text-align:center}',
      '@media (max-width:720px){',
      '.dsh-ia-header{padding:12px 14px 6px;flex-wrap:wrap}',
      '.dsh-ia-bar,.dsh-ia-sections{padding-inline:14px}',
      '.dsh-ia-scroll{padding:14px 14px 28px}',
      '.dsh-ia-force-row{grid-template-columns:1fr}',
      '.dsh-ia-bar-row{grid-template-columns:44px 1fr 76px}',
      '.dsh-ia-field-row{grid-template-columns:1fr}',
      '}',
    ].join('');

    /* ---- dictionaries ------------------------------------------------------
     * One table per locale, keyed identically. Key families the SPEC pins
     * (lifecycle, concentration, pressure) carry a prefix so a key lookup and
     * a composed label can share the table. */
    const DICT = {
      zh: {
        'panel.title': '行业分析',
        'panel.subtitle': '规模、价值链、五力与竞争格局，一页看清一个行业',
        'panel.newIndustry': '新建行业',
        'panel.sample': '载入示例数据',
        'panel.export': '导出',
        'panel.exportMarkdown': '导出 Markdown',
        'panel.exportJson': '导出 JSON',
        'panel.deleteIndustry': '删除当前行业',
        'panel.industryName': '行业名称',
        'panel.untitled': '未命名行业',
        'panel.updated': '更新于',

        'tab.overview': '行业概览',
        'tab.chain': '价值链',
        'tab.forces': '波特五力',
        'tab.landscape': '竞争格局',
        'tab.report': '研究报告',

        'unit.money': '亿美元',
        'unit.score': '分',

        'overview.title': '行业概览',
        'overview.size': '行业规模',
        'overview.yoy': '同比增长',
        'overview.cagr': '预测 CAGR',
        'overview.forecast': '预测规模',
        'overview.penetration': '渗透率',
        'overview.margin': '加权毛利率',
        'overview.lifecycle': '生命周期',
        'overview.asOf': '数据截至',
        'overview.history': '规模演进',
        'overview.drivers': '增长驱动',
        'overview.risks': '主要风险',
        'overview.edit': '编辑概览',
        'overview.driverPlaceholder': '添加一条增长驱动…',
        'overview.riskPlaceholder': '添加一条风险…',
        'overview.addDriver': '添加',
        'overview.addRisk': '添加',
        'overview.historyHint': '按年份升序，单位亿美元',
        'overview.emptyDrivers': '还没有填写增长驱动',
        'overview.emptyRisks': '还没有填写风险',

        'chain.title': '价值链结构',
        'chain.hint': '按环节拆解增加值占比与毛利率，合计占比应接近 100%',
        'chain.add': '添加环节',
        'chain.stage': '环节类型',
        'chain.name': '环节',
        'chain.share': '增加值占比',
        'chain.margin': '毛利率',
        'chain.moat': '壁垒',
        'chain.players': '代表企业',
        'chain.total': '合计占比',
        'chain.weightedMargin': '加权毛利率',
        'chain.overShare': '占比合计超过 100%，请检查',
        'chain.empty': '还没有价值链环节',

        'forces.title': '波特五力',
        'forces.hint': '1 = 几乎无压力，5 = 压力极大',
        'forces.avg': '综合压力',
        'forces.attractiveness': '行业吸引力',
        'forces.evidence': '判断依据',
        'forces.evidencePlaceholder': '支撑这一评分的依据…',
        'forces.reorder': '五力固定为五项，顺序不可调整',

        'landscape.title': '竞争格局',
        'landscape.hint': '列出主要玩家的市场份额与护城河',
        'landscape.cr3': 'CR3',
        'landscape.cr5': 'CR5',
        'landscape.hhi': 'HHI',
        'landscape.shareSum': '份额合计',
        'landscape.add': '添加企业',
        'landscape.company': '企业',
        'landscape.share': '份额',
        'landscape.revenue': '收入（亿美元）',
        'landscape.moat': '护城河',
        'landscape.positioning': '定位',
        'landscape.note': '口径备注',
        'landscape.empty': '还没有企业',
        'landscape.overShare': '份额合计超过 100%，请检查',

        'report.title': '研究报告',
        'report.hint': '由当前行业数据实时生成',
        'report.copy': '复制',
        'report.download': '下载 .md',
        'report.sources': '数据来源',
        'report.emptySources': '还没有来源',

        'lifecycle.emerging': '导入期',
        'lifecycle.growth': '成长期',
        'lifecycle.mature': '成熟期',
        'lifecycle.declining': '衰退期',

        'conc.competitive': '分散竞争',
        'conc.moderate': '中度集中',
        'conc.concentrated': '高度集中',

        'level.low': '低',
        'level.moderate': '中',
        'level.high': '高',
        'level.extreme': '极高',

        'stage.upstream': '上游',
        'stage.mid': '中游',
        'stage.downstream': '下游',

        'force.rivalry': '现有竞争者',
        'force.entrant': '潜在进入者',
        'force.substitute': '替代品威胁',
        'force.supplier': '供应商议价',
        'force.buyer': '购买者议价',

        'editor.overviewTitle': '编辑行业概览',
        'editor.chainTitle': '编辑价值链环节',
        'editor.playerTitle': '编辑企业',
        'editor.size': '行业规模（亿美元）',
        'editor.yoy': '同比增长（%）',
        'editor.cagr': '预测 CAGR（%）',
        'editor.forecastSize': '预测规模（亿美元）',
        'editor.penetration': '渗透率（%）',
        'editor.asOf': '数据截至',
        'editor.save': '保存',
        'editor.cancel': '取消',
        'editor.delete': '删除',
        'editor.required': '名称不能为空',
        'editor.value': '数值',
        'editor.year': '年份',

        'empty.title': '还没有行业',
        'empty.hint': '新建一个行业开始分析，或载入示例数据先看看这个工作台能做什么',
        'empty.create': '新建行业',
        'empty.sample': '载入示例数据',

        'toast.copied': '已复制到剪贴板',
        'toast.copyFailed': '复制失败，请手动保存',
        'toast.exported': '已导出',
        'toast.overShare': '价值链占比合计超过 100%',

        'confirm.loadSample': '示例会替换当前文档中的全部行业。确定载入吗？',
        'confirm.deleteIndustry': '此操作无法撤销。确定删除当前行业吗？',
        'confirm.deleteRow': '此操作无法撤销。确定删除吗？',
        'confirm.reset': '此操作无法撤销。确定清空吗？',

        'aria.panel': '行业分析',
        'aria.tabs': '行业标签',
        'aria.sections': '分析板块',
        'aria.dialog': '编辑弹窗',
        'aria.score': '评分',
        'aria.deleteRow': '删除该行',
        'aria.copyReport': '复制报告',
      },
      en: {
        'panel.title': 'Industry Analysis',
        'panel.subtitle': 'Size, value chain, five forces and competitive landscape on one page',
        'panel.newIndustry': 'New industry',
        'panel.sample': 'Load sample data',
        'panel.export': 'Export',
        'panel.exportMarkdown': 'Export Markdown',
        'panel.exportJson': 'Export JSON',
        'panel.deleteIndustry': 'Delete the current industry',
        'panel.industryName': 'Industry name',
        'panel.untitled': 'Untitled industry',
        'panel.updated': 'Updated',

        'tab.overview': 'Overview',
        'tab.chain': 'Value chain',
        'tab.forces': 'Five forces',
        'tab.landscape': 'Landscape',
        'tab.report': 'Report',

        'unit.money': 'USD 100m',
        'unit.score': 'pts',

        'overview.title': 'Industry overview',
        'overview.size': 'Market size',
        'overview.yoy': 'Year-over-year',
        'overview.cagr': 'Forecast CAGR',
        'overview.forecast': 'Forecast size',
        'overview.penetration': 'Penetration',
        'overview.margin': 'Weighted gross margin',
        'overview.lifecycle': 'Lifecycle',
        'overview.asOf': 'Data as of',
        'overview.history': 'Size over time',
        'overview.drivers': 'Growth drivers',
        'overview.risks': 'Key risks',
        'overview.edit': 'Edit overview',
        'overview.driverPlaceholder': 'Add a growth driver…',
        'overview.riskPlaceholder': 'Add a risk…',
        'overview.addDriver': 'Add',
        'overview.addRisk': 'Add',
        'overview.historyHint': 'Ascending by year, in USD 100m',
        'overview.emptyDrivers': 'No growth drivers yet',
        'overview.emptyRisks': 'No risks yet',

        'chain.title': 'Value chain structure',
        'chain.hint': 'Break value-added share and gross margin down by stage; shares should total about 100%',
        'chain.add': 'Add link',
        'chain.stage': 'Stage',
        'chain.name': 'Link',
        'chain.share': 'Value-added share',
        'chain.margin': 'Gross margin',
        'chain.moat': 'Moat',
        'chain.players': 'Representative players',
        'chain.total': 'Total share',
        'chain.weightedMargin': 'Weighted gross margin',
        'chain.overShare': 'Shares total more than 100% — please check',
        'chain.empty': 'No value-chain links yet',

        'forces.title': "Porter's five forces",
        'forces.hint': '1 = almost no pressure, 5 = extreme pressure',
        'forces.avg': 'Overall pressure',
        'forces.attractiveness': 'Industry attractiveness',
        'forces.evidence': 'Evidence',
        'forces.evidencePlaceholder': 'What supports this score…',
        'forces.reorder': "The five forces are fixed; their order cannot change",

        'landscape.title': 'Competitive landscape',
        'landscape.hint': 'List the main players with their market share and moat',
        'landscape.cr3': 'CR3',
        'landscape.cr5': 'CR5',
        'landscape.hhi': 'HHI',
        'landscape.shareSum': 'Total share',
        'landscape.add': 'Add company',
        'landscape.company': 'Company',
        'landscape.share': 'Share',
        'landscape.revenue': 'Revenue (USD 100m)',
        'landscape.moat': 'Moat',
        'landscape.positioning': 'Positioning',
        'landscape.note': 'Scope note',
        'landscape.empty': 'No companies yet',
        'landscape.overShare': 'Shares total more than 100% — please check',

        'report.title': 'Research report',
        'report.hint': 'Generated live from the current industry data',
        'report.copy': 'Copy',
        'report.download': 'Download .md',
        'report.sources': 'Sources',
        'report.emptySources': 'No sources yet',

        'lifecycle.emerging': 'Emerging',
        'lifecycle.growth': 'Growth',
        'lifecycle.mature': 'Mature',
        'lifecycle.declining': 'Declining',

        'conc.competitive': 'Competitive',
        'conc.moderate': 'Moderately concentrated',
        'conc.concentrated': 'Concentrated',

        'level.low': 'Low',
        'level.moderate': 'Moderate',
        'level.high': 'High',
        'level.extreme': 'Extreme',

        'stage.upstream': 'Upstream',
        'stage.mid': 'Midstream',
        'stage.downstream': 'Downstream',

        'force.rivalry': 'Competitive rivalry',
        'force.entrant': 'Threat of new entrants',
        'force.substitute': 'Threat of substitutes',
        'force.supplier': "Suppliers' bargaining power",
        'force.buyer': "Buyers' bargaining power",

        'editor.overviewTitle': 'Edit industry overview',
        'editor.chainTitle': 'Edit value-chain link',
        'editor.playerTitle': 'Edit company',
        'editor.size': 'Market size (USD 100m)',
        'editor.yoy': 'Year-over-year (%)',
        'editor.cagr': 'Forecast CAGR (%)',
        'editor.forecastSize': 'Forecast size (USD 100m)',
        'editor.penetration': 'Penetration (%)',
        'editor.asOf': 'Data as of',
        'editor.save': 'Save',
        'editor.cancel': 'Cancel',
        'editor.delete': 'Delete',
        'editor.required': 'A name is required',
        'editor.value': 'Value',
        'editor.year': 'Year',

        'empty.title': 'No industries yet',
        'empty.hint': 'Create an industry to start, or load the sample data to explore this workbench',
        'empty.create': 'New industry',
        'empty.sample': 'Load sample data',

        'toast.copied': 'Copied to clipboard',
        'toast.copyFailed': 'Copy failed — save it manually',
        'toast.exported': 'Exported',
        'toast.overShare': 'Value-chain shares total more than 100%',

        'confirm.loadSample': 'The sample replaces every industry in this document. Load it?',
        'confirm.deleteIndustry': 'This cannot be undone. Delete the current industry?',
        'confirm.deleteRow': 'This cannot be undone. Delete it?',
        'confirm.reset': 'This cannot be undone. Clear it?',

        'aria.panel': 'Industry analysis',
        'aria.tabs': 'Industry tabs',
        'aria.sections': 'Analysis sections',
        'aria.dialog': 'Edit dialog',
        'aria.score': 'Score',
        'aria.deleteRow': 'Delete this row',
        'aria.copyReport': 'Copy the report',
      },
    };

    function dictKeys(locale) {
      const table = DICT[locale] || DICT.zh;
      return Object.keys(table).sort();
    }

    /* ---- panel ------------------------------------------------------------- */

    const SECTIONS = [
      { id: 'overview', key: 'tab.overview' },
      { id: 'chain', key: 'tab.chain' },
      { id: 'forces', key: 'tab.forces' },
      { id: 'landscape', key: 'tab.landscape' },
      { id: 'report', key: 'tab.report' },
    ];

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(function () {
          return ctx.locale.register(NS, DICT);
        }, 'industry-analysis: dictionaries');

        const t = ctx.locale.bind(NS);

        /* ---- document operations (pure) ------------------------------------ */

        function withActive(doc, mutate) {
          const found = findIndustry(doc, doc.activeId);
          if (found.index < 0) return doc;
          const industry = found.industry;
          const next = mutate(industry);
          if (!next || next === industry) return doc;
          const industries = doc.industries.slice();
          industries[found.index] = Object.assign({}, next, { updatedAt: nowMs() });
          return Object.assign({}, doc, { industries: industries });
        }

        function blankChainRow(stage) {
          return {
            id: uid('ch-'),
            stage: STAGES.indexOf(stage) >= 0 ? stage : 'mid',
            name: '',
            share: 0,
            margin: 0,
            moat: '',
            players: '',
          };
        }

        function blankPlayer() {
          return {
            id: uid('pl-'),
            name: '',
            share: 0,
            revenue: 0,
            moat: '',
            positioning: '',
            note: '',
          };
        }

        function blankSource() {
          return { id: uid('sc-'), title: '', url: '', asOf: String(new Date().getFullYear()) };
        }

        /* Percent fields are edited in percent units and stored as fractions. */
        function pctToInput(fraction) {
          return trimNum((num(fraction, 0)) * 100, 1);
        }

        function numToInput(value) {
          return trimNum(num(value, 0), 1);
        }

        function IndustryAnalysisPanel() {
          const bootRef = React.useRef(null);
          if (!bootRef.current) bootRef.current = loadDoc() || defaultDoc();

          const [doc, setDoc] = React.useState(bootRef.current);
          const [section, setSection] = React.useState('overview');
          const [dialog, setDialog] = React.useState(null);
          const [menuOpen, setMenuOpen] = React.useState(false);
          const [toast, setToast] = React.useState(null);
          const [driverDraft, setDriverDraft] = React.useState('');
          const [riskDraft, setRiskDraft] = React.useState('');
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

          const localeInfo = ctx.locale.getLocale ? ctx.locale.getLocale() : { active: 'zh' };
          const activeLocale = localeInfo && localeInfo.active === 'en' ? 'en' : 'zh';

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

          function showToast(message) {
            setToast(message);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(function () {
              setToast(null);
              toastTimer.current = null;
            }, TOAST_MS);
          }

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

          /* A click outside the export menu closes it. */
          React.useEffect(
            function () {
              if (!menuOpen) return undefined;
              function onPointerDown(event) {
                const node = menuRef.current;
                if (!node || !node.contains) return;
                if (!node.contains(event.target)) setMenuOpen(false);
              }
              document.addEventListener('mousedown', onPointerDown, true);
              return function () {
                document.removeEventListener('mousedown', onPointerDown, true);
              };
            },
            [menuOpen],
          );

          /* ---- industry operations ---------------------------------------- */

          function setDocument(next) {
            setDoc(next);
          }

          function addIndustry() {
            const industry = blankIndustry('');
            const next = {
              version: DOC_VERSION,
              activeId: industry.id,
              industries: doc.industries.concat([industry]),
            };
            setDocument(next);
            setNameDraft(null);
            setSection('overview');
          }

          function loadSample() {
            const sample = sampleDoc();
            setDocument(sample);
            setNameDraft(null);
            showToast(t('panel.sample'));
          }

          function selectIndustry(id) {
            const found = findIndustry(doc, id);
            if (found.index < 0) return;
            setDocument(Object.assign({}, doc, { activeId: id }));
            setNameDraft(null);
          }

          function renameIndustry(value, commit) {
            const found = findIndustry(doc, doc.activeId);
            if (found.index < 0) return;
            const next = commit ? str(value, 80) : String(value === null || value === undefined ? '' : value);
            if (commit) {
              if (next === found.industry.name) return;
            } else if (next === (nameDraft === null ? found.industry.name : nameDraft)) {
              return;
            }
            setNameDraft(commit ? null : next);
            if (!commit) return;
            setDocument(withActive(doc, function (industry) {
              return Object.assign({}, industry, { name: next });
            }));
          }

          function deleteIndustry() {
            const found = findIndustry(doc, doc.activeId);
            if (found.index < 0) return;
            const confirmed = typeof window.confirm === 'function'
              ? window.confirm(t('confirm.deleteIndustry'))
              : true;
            if (!confirmed) return;
            const industries = doc.industries.filter(function (entry) {
              return entry.id !== found.industry.id;
            });
            const activeId = industries.length
              ? industries[Math.min(found.index, industries.length - 1)].id
              : '';
            setDocument({ version: DOC_VERSION, activeId: activeId, industries: industries });
            setNameDraft(null);
          }

          function mutateActive(mutate) {
            setDocument(withActive(doc, mutate));
          }

          /* ---- overview operations ---------------------------------------- */

          function addBullet(field, raw) {
            const text = str(raw, 240);
            if (!text) return;
            mutateActive(function (industry) {
              const overview = industry.overview;
              const list = overview[field];
              if (!Array.isArray(list) || list.length >= MAX_BULLETS) return industry;
              const nextList = list.concat([text]);
              return Object.assign({}, industry, {
                overview: Object.assign({}, overview, { [field]: nextList }),
              });
            });
            if (field === 'drivers') setDriverDraft('');
            else setRiskDraft('');
          }

          function removeBullet(field, index) {
            mutateActive(function (industry) {
              const overview = industry.overview;
              const list = overview[field];
              if (!Array.isArray(list) || index < 0 || index >= list.length) return industry;
              const nextList = list.slice();
              nextList.splice(index, 1);
              return Object.assign({}, industry, {
                overview: Object.assign({}, overview, { [field]: nextList }),
              });
            });
          }

          /* ---- chain operations ------------------------------------------- */

          function upsertChainRow(row) {
            mutateActive(function (industry) {
              const rows = industry.chain.slice();
              if (row.id) {
                const index = rows.findIndex(function (entry) {
                  return entry.id === row.id;
                });
                if (index < 0) rows.push(row);
                else rows[index] = row;
              } else {
                rows.push(row);
              }
              return Object.assign({}, industry, { chain: rows });
            });
          }

          function removeChainRow(id) {
            const confirmed = typeof window.confirm === 'function'
              ? window.confirm(t('confirm.deleteRow'))
              : true;
            if (!confirmed) return;
            mutateActive(function (industry) {
              return Object.assign({}, industry, {
                chain: industry.chain.filter(function (entry) {
                  return entry.id !== id;
                }),
              });
            });
          }

          /* ---- player operations ------------------------------------------ */

          function upsertPlayer(row) {
            mutateActive(function (industry) {
              const rows = industry.players.slice();
              if (row.id) {
                const index = rows.findIndex(function (entry) {
                  return entry.id === row.id;
                });
                if (index < 0) rows.push(row);
                else rows[index] = row;
              } else {
                rows.push(row);
              }
              return Object.assign({}, industry, { players: rows });
            });
          }

          function removePlayer(id) {
            const confirmed = typeof window.confirm === 'function'
              ? window.confirm(t('confirm.deleteRow'))
              : true;
            if (!confirmed) return;
            mutateActive(function (industry) {
              return Object.assign({}, industry, {
                players: industry.players.filter(function (entry) {
                  return entry.id !== id;
                }),
              });
            });
          }

          /* ---- forces operations ------------------------------------------ */

          function setForceScore(key, score) {
            mutateActive(function (industry) {
              const rows = forcesNormalized(industry.forces);
              const next = rows.map(function (row) {
                if (row.key !== key) return { id: row.id, key: row.key, score: row.score, evidence: row.evidence };
                return { id: row.id, key: row.key, score: score, evidence: row.evidence };
              });
              return Object.assign({}, industry, { forces: next });
            });
          }

          function setForceEvidence(key, evidence) {
            mutateActive(function (industry) {
              const rows = forcesNormalized(industry.forces);
              const next = rows.map(function (row) {
                return {
                  id: row.id,
                  key: row.key,
                  score: row.score,
                  evidence: row.key === key ? str(evidence, 400) : row.evidence,
                };
              });
              return Object.assign({}, industry, { forces: next });
            });
          }

          /* ---- export ------------------------------------------------------ */

          function currentMarkdown() {
            return industryMarkdown(docRef.current, docRef.current.activeId, activeLocale);
          }

          function copyReport() {
            const text = currentMarkdown();
            const done = function () {
              showToast(t('toast.copied'));
            };
            const failed = function () {
              showToast(t('toast.copyFailed'));
            };
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, failed);
                return;
              }
            } catch (error) {
              /* fall through to the manual path */
            }
            try {
              const area = reportRef.current;
              if (area && typeof area.select === 'function') {
                area.focus();
                area.select();
                if (document.execCommand && document.execCommand('copy')) {
                  done();
                  return;
                }
              }
            } catch (error) {
              /* fall through to the failure toast */
            }
            failed();
          }

          function exportMarkdown() {
            const industry = findIndustry(doc, doc.activeId).industry;
            const name = industry && industry.name ? industry.name : t('panel.untitled');
            setMenuOpen(false);
            const ok = downloadText(
              'industry-' + slugOf(name) + '-' + dateStamp(new Date()) + '.md',
              currentMarkdown(),
              'text/markdown;charset=utf-8',
            );
            showToast(ok ? t('toast.exported') : t('toast.copyFailed'));
          }

          function exportJson() {
            const industry = findIndustry(doc, doc.activeId).industry;
            const name = industry && industry.name ? industry.name : t('panel.untitled');
            setMenuOpen(false);
            let text = '';
            try {
              text = JSON.stringify(doc, null, 2);
            } catch (error) {
              text = '';
            }
            const ok = downloadText(
              'industry-' + slugOf(name) + '-' + dateStamp(new Date()) + '.json',
              text,
              'application/json;charset=utf-8',
            );
            showToast(ok ? t('toast.exported') : t('toast.copyFailed'));
          }

          /* ---- renderers --------------------------------------------------- */

          function badge(text, tint) {
            return h(
              'span',
              { className: 'dsh-ia-badge' },
              tint
                ? h('span', { className: 'dsh-ia-badge-dot', style: { background: tint } })
                : null,
              text,
            );
          }

          function emptySection(title, hint, actions) {
            return h(
              'div',
              { className: 'dsh-ia-empty' },
              h('div', { className: 'dsh-ia-empty-title' }, title),
              h('div', { className: 'dsh-ia-empty-hint' }, hint),
              actions ? h('div', { className: 'dsh-ia-empty-actions' }, actions) : null,
            );
          }

          function kpi(label, value, foot) {
            return h(
              'div',
              { className: 'dsh-ia-kpi' },
              h('div', { className: 'dsh-ia-kpi-label' }, label),
              h('div', { className: 'dsh-ia-kpi-value' }, value),
              foot ? h('div', { className: 'dsh-ia-kpi-foot' }, foot) : null,
            );
          }

          function bullets(field, items, draft, setDraft, placeholder, tint) {
            const addLabel = field === 'drivers' ? t('overview.addDriver') : t('overview.addRisk');
            return h(
              'div',
              { className: 'dsh-ia-card' },
              h(
                'div',
                { className: 'dsh-ia-card-head' },
                h('div', { className: 'dsh-ia-card-title' }, t('overview.' + field)),
                h('div', { className: 'dsh-ia-card-hint' }, items.length + ' / ' + MAX_BULLETS),
              ),
              items.length
                ? h(
                    'ul',
                    { className: 'dsh-ia-bullets' },
                    items.map(function (text, index) {
                      return h(
                        'li',
                        { className: 'dsh-ia-bullet', key: field + '-' + index },
                        h('span', { className: 'dsh-ia-bullet-dot', style: { background: tint } }),
                        h('span', { className: 'dsh-ia-bullet-text' }, text),
                        h(
                          'button',
                          {
                            className: 'dsh-ia-icon-btn is-danger',
                            type: 'button',
                            'aria-label': t('aria.deleteRow'),
                            title: t('aria.deleteRow'),
                            onClick: function () {
                              removeBullet(field, index);
                            },
                          },
                          closeGlyph(12),
                        ),
                      );
                    }),
                  )
                : h('div', { className: 'dsh-ia-hint' }, t('overview.empty' + (field === 'drivers' ? 'Drivers' : 'Risks'))),
              h(
                'div',
                { className: 'dsh-ia-bullet-add' },
                h('input', {
                  className: 'dsh-ia-input',
                  type: 'text',
                  value: draft,
                  placeholder: placeholder,
                  onChange: function (event) {
                    setDraft(event.target.value);
                  },
                  onKeyDown: function (event) {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addBullet(field, draft);
                    }
                  },
                }),
                h(
                  'button',
                  {
                    className: 'dsh-ia-action',
                    type: 'button',
                    disabled: items.length >= MAX_BULLETS,
                    onClick: function () {
                      addBullet(field, draft);
                    },
                  },
                  addLabel,
                ),
              ),
            );
          }

          function renderOverview(industry) {
            const overview = industry.overview;
            const chain = industry.chain;
            const stage = lifecycleStage(overview);
            const series = historyDelta(overview.history);
            const peak = series.reduce(function (max, entry) {
              return entry.size > max ? entry.size : max;
            }, 0);

            const kpis = h(
              'div',
              { className: 'dsh-ia-kpis' },
              kpi(t('overview.size'), formatMoney(overview.size), t('unit.money') + ' · ' + t('overview.asOf') + ' ' + (overview.asOf || '-')),
              kpi(t('overview.yoy'), formatPercent(overview.yoy), t('overview.lifecycle') + '：' + t('lifecycle.' + stage)),
              kpi(t('overview.cagr'), formatPercent(overview.cagr), t('overview.forecast') + ' ' + formatMoney(overview.forecastSize)),
              kpi(t('overview.penetration'), formatPercent(overview.penetration), t('overview.margin') + ' ' + trimNum(weightedMargin(chain), 1) + '%'),
            );

            const historyBars = series.length
              ? h(
                  'div',
                  { className: 'dsh-ia-card' },
                  h(
                    'div',
                    { className: 'dsh-ia-card-head' },
                    h('div', { className: 'dsh-ia-card-title' }, t('overview.history')),
                    h('div', { className: 'dsh-ia-card-hint' }, t('overview.historyHint')),
                  ),
                  h(
                    'div',
                    { className: 'dsh-ia-bars' },
                    series.map(function (entry) {
                      const width = peak > 0 ? Math.max(2, Math.round((entry.size / peak) * 100)) : 2;
                      const growthText = entry.growth === null ? '—' : formatPercent(entry.growth);
                      return h(
                        'div',
                        { className: 'dsh-ia-bar-row', key: 'h-' + entry.year },
                        h('div', { className: 'dsh-ia-bar-year' }, String(entry.year)),
                        h(
                          'div',
                          { className: 'dsh-ia-bar-track' },
                          h('div', {
                            className: 'dsh-ia-bar-fill',
                            style: { width: width + '%', background: ACCENTS[0] },
                          }),
                        ),
                        h(
                          'div',
                          { className: 'dsh-ia-bar-value' },
                          formatMoney(entry.size) + ' · ' + growthText,
                        ),
                      );
                    }),
                  ),
                )
              : null;

            const editButton = h(
              'button',
              {
                className: 'dsh-ia-action',
                type: 'button',
                onClick: function () {
                  const current = findIndustry(doc, doc.activeId).industry;
                  const figures = current ? current.overview : blankOverview();
                  setDialog({
                    kind: 'overview',
                    draft: {
                      size: numToInput(figures.size),
                      forecastSize: numToInput(figures.forecastSize),
                      yoy: pctToInput(figures.yoy),
                      cagr: pctToInput(figures.cagr),
                      penetration: pctToInput(figures.penetration),
                      asOf: figures.asOf,
                    },
                  });
                },
              },
              t('overview.edit'),
            );

            return h(
              'div',
              { className: 'dsh-ia-stack' },
              h(
                'div',
                { className: 'dsh-ia-card-head', style: { marginBottom: 0 } },
                h('div', { className: 'dsh-ia-card-title' }, t('overview.title')),
                badge(t('lifecycle.' + stage), LEVEL_TINT.growth),
                badge(t('overview.asOf') + ' ' + (overview.asOf || '-'), null),
                editButton,
              ),
              kpis,
              historyBars,
              h(
                'div',
                { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '18px' } },
                bullets('drivers', overview.drivers, driverDraft, setDriverDraft, t('overview.driverPlaceholder'), ACCENTS[0]),
                bullets('risks', overview.risks, riskDraft, setRiskDraft, t('overview.riskPlaceholder'), ACCENTS[4]),
              ),
            );
          }

          function renderChain(industry) {
            const chain = industry.chain;
            const total = chainShareTotal(chain);
            const margin = weightedMargin(chain);

            const head = h(
              'div',
              { className: 'dsh-ia-card-head', style: { marginBottom: 0 } },
              h('div', { className: 'dsh-ia-card-title' }, t('chain.title')),
              h('div', { className: 'dsh-ia-card-hint' }, t('chain.hint')),
              h(
                'button',
                {
                  className: 'dsh-ia-action',
                  type: 'button',
                  onClick: function () {
                    setDialog({ kind: 'chain', id: null, draft: blankChainRow('mid') });
                  },
                },
                t('chain.add'),
              ),
            );

            if (!chain.length) {
              return h(
                'div',
                { className: 'dsh-ia-stack' },
                head,
                emptySection(
                  t('chain.empty'),
                  t('chain.hint'),
                  h(
                    'button',
                    {
                      className: 'dsh-ia-action is-primary',
                      type: 'button',
                      onClick: function () {
                        setDialog({ kind: 'chain', id: null, draft: blankChainRow('upstream') });
                      },
                    },
                    t('chain.add'),
                  ),
                ),
              );
            }

            const rows = [];
            for (let s = 0; s < STAGES.length; s += 1) {
              const stageKey = STAGES[s];
              for (let i = 0; i < chain.length; i += 1) {
                const row = chain[i];
                if (row.stage !== stageKey) continue;
                rows.push(
                  h(
                    'tr',
                    { key: row.id },
                    h('td', null, badge(t('stage.' + row.stage), STAGE_TINT[row.stage])),
                    h('td', null, row.name || h('span', { className: 'dsh-ia-hint' }, t('panel.untitled'))),
                    h('td', { className: 'dsh-ia-num' }, trimNum(row.share, 1) + '%'),
                    h('td', { className: 'dsh-ia-num' }, trimNum(row.margin, 1) + '%'),
                    h('td', null, row.moat || '—'),
                    h('td', null, row.players || '—'),
                    h(
                      'td',
                      null,
                      h(
                        'div',
                        { className: 'dsh-ia-row-tools' },
                        h(
                          'button',
                          {
                            className: 'dsh-ia-icon-btn',
                            type: 'button',
                            'aria-label': t('overview.edit'),
                            title: t('overview.edit'),
                            onClick: function () {
                              setDialog({ kind: 'chain', id: row.id, draft: Object.assign({}, row) });
                            },
                          },
                          h(
                            'svg',
                            { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
                            h('path', {
                              d: 'M3 12.4l.7-3 6.5-6.5 2.3 2.3-6.5 6.5-3 .7z',
                              fill: 'none',
                              stroke: 'currentColor',
                              strokeWidth: 1.3,
                              strokeLinejoin: 'round',
                            }),
                          ),
                        ),
                        h(
                          'button',
                          {
                            className: 'dsh-ia-icon-btn is-danger',
                            type: 'button',
                            'aria-label': t('aria.deleteRow'),
                            title: t('aria.deleteRow'),
                            onClick: function () {
                              removeChainRow(row.id);
                            },
                          },
                          closeGlyph(12),
                        ),
                      ),
                    ),
                  ),
                );
              }
            }

            const foot = h(
              'div',
              { className: 'dsh-ia-table-foot' },
              h(
                'span',
                { className: 'dsh-ia-foot-item' },
                t('chain.total'),
                h('span', { className: 'dsh-ia-foot-strong' }, trimNum(total, 1) + '%'),
              ),
              h(
                'span',
                { className: 'dsh-ia-foot-item' },
                t('chain.weightedMargin'),
                h('span', { className: 'dsh-ia-foot-strong' }, trimNum(margin, 1) + '%'),
              ),
              total > 100 ? h('span', { className: 'dsh-ia-warn' }, t('chain.overShare')) : null,
            );

            return h(
              'div',
              { className: 'dsh-ia-stack' },
              head,
              h(
                'div',
                { className: 'dsh-ia-table-wrap' },
                h(
                  'table',
                  { className: 'dsh-ia-table' },
                  h(
                    'thead',
                    null,
                    h(
                      'tr',
                      null,
                      h('th', null, t('chain.stage')),
                      h('th', null, t('chain.name')),
                      h('th', { className: 'dsh-ia-num' }, t('chain.share')),
                      h('th', { className: 'dsh-ia-num' }, t('chain.margin')),
                      h('th', null, t('chain.moat')),
                      h('th', null, t('chain.players')),
                      h('th', { 'aria-label': '' }),
                    ),
                  ),
                  h('tbody', null, rows),
                ),
                foot,
              ),
            );
          }

          function renderForces(industry) {
            const forces = forcesNormalized(industry.forces);
            const aggregate = forcesAggregate(forces);
            const attractiveness = forcesAttractiveness(forces);

            const header = h(
              'div',
              { className: 'dsh-ia-card-head', style: { marginBottom: 0 } },
              h('div', { className: 'dsh-ia-card-title' }, t('forces.title')),
              h('div', { className: 'dsh-ia-card-hint' }, t('forces.hint')),
            );

            const summary = h(
              'div',
              { className: 'dsh-ia-score-row' },
              h(
                'div',
                { className: 'dsh-ia-score' },
                h('div', { className: 'dsh-ia-score-label' }, t('forces.avg')),
                h(
                  'div',
                  { className: 'dsh-ia-score-value' },
                  trimNum(aggregate.avg, 2) + ' / 5',
                  h(
                    'span',
                    { style: { marginInlineStart: 8, fontSize: 12, fontWeight: 500 } },
                    badge(t('level.' + aggregate.level), LEVEL_TINT[aggregate.level]),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'dsh-ia-score' },
                h('div', { className: 'dsh-ia-score-label' }, t('forces.attractiveness')),
                h('div', { className: 'dsh-ia-score-value' }, String(attractiveness) + ' / 100'),
              ),
            );

            const rows = forces.map(function (row) {
              const dots = [];
              for (let score = 1; score <= 5; score += 1) {
                const filled = score <= row.score;
                dots.push(
                  h('button', {
                    className: 'dsh-ia-dot-btn',
                    key: row.key + '-dot-' + score,
                    type: 'button',
                    'aria-label': t('aria.score') + ' ' + score,
                    'data-score': score,
                    'data-force': row.key,
                    style: {
                      background: filled ? LEVEL_TINT[aggregate.level === 'low' ? 'low' : 'high'] : 'transparent',
                      borderColor: filled ? 'transparent' : 'var(--dsw-alias-border-l2)',
                    },
                    onClick: function () {
                      setForceScore(row.key, score);
                    },
                  }),
                );
              }
              return h(
                'div',
                { className: 'dsh-ia-force-row', key: row.key },
                h('div', { className: 'dsh-ia-force-name' }, t('force.' + row.key)),
                h(
                  'div',
                  { className: 'dsh-ia-force-body' },
                  h(
                    'div',
                    { className: 'dsh-ia-dots' },
                    dots,
                    h('span', { className: 'dsh-ia-force-score' }, row.score + ' / 5'),
                  ),
                  h('input', {
                    className: 'dsh-ia-input',
                    type: 'text',
                    value: row.evidence,
                    placeholder: t('forces.evidencePlaceholder'),
                    'data-evidence': row.key,
                    onChange: function (event) {
                      setForceEvidence(row.key, event.target.value);
                    },
                  }),
                ),
              );
            });

            return h(
              'div',
              { className: 'dsh-ia-stack' },
              header,
              summary,
              h(
                'div',
                { className: 'dsh-ia-card' },
                h(
                  'div',
                  { className: 'dsh-ia-force' },
                  rows,
                  h('div', { className: 'dsh-ia-hint' }, t('forces.reorder')),
                ),
              ),
            );
          }

          function renderLandscape(industry) {
            const players = rankPlayers(industry.players);
            const index = hhi(players);
            const conc = concentrationKey(index);
            const shareSum = playerShareSum(players);

            const head = h(
              'div',
              { className: 'dsh-ia-card-head', style: { marginBottom: 0 } },
              h('div', { className: 'dsh-ia-card-title' }, t('landscape.title')),
              h('div', { className: 'dsh-ia-card-hint' }, t('landscape.hint')),
              h(
                'button',
                {
                  className: 'dsh-ia-action',
                  type: 'button',
                  onClick: function () {
                    setDialog({ kind: 'player', id: null, draft: blankPlayer() });
                  },
                },
                t('landscape.add'),
              ),
            );

            const scores = h(
              'div',
              { className: 'dsh-ia-score-row' },
              h(
                'div',
                { className: 'dsh-ia-score' },
                h('div', { className: 'dsh-ia-score-label' }, t('landscape.cr3')),
                h('div', { className: 'dsh-ia-score-value' }, trimNum(cr(players, 3), 2) + '%'),
              ),
              h(
                'div',
                { className: 'dsh-ia-score' },
                h('div', { className: 'dsh-ia-score-label' }, t('landscape.cr5')),
                h('div', { className: 'dsh-ia-score-value' }, trimNum(cr(players, 5), 2) + '%'),
              ),
              h(
                'div',
                { className: 'dsh-ia-score' },
                h('div', { className: 'dsh-ia-score-label' }, t('landscape.hhi')),
                h('div', { className: 'dsh-ia-score-value' }, trimNum(index, 2)),
                h('div', { className: 'dsh-ia-score-label' }, badge(t('conc.' + conc), null)),
              ),
              h(
                'div',
                { className: 'dsh-ia-score' },
                h('div', { className: 'dsh-ia-score-label' }, t('landscape.shareSum')),
                h('div', { className: 'dsh-ia-score-value' }, trimNum(shareSum, 1) + '%'),
                shareSum > 100
                  ? h('div', { className: 'dsh-ia-score-label dsh-ia-warn' }, t('landscape.overShare'))
                  : null,
              ),
            );

            if (!players.length) {
              return h(
                'div',
                { className: 'dsh-ia-stack' },
                head,
                scores,
                emptySection(
                  t('landscape.empty'),
                  t('landscape.hint'),
                  h(
                    'button',
                    {
                      className: 'dsh-ia-action is-primary',
                      type: 'button',
                      onClick: function () {
                        setDialog({ kind: 'player', id: null, draft: blankPlayer() });
                      },
                    },
                    t('landscape.add'),
                  ),
                ),
              );
            }

            const peak = players.reduce(function (max, row) {
              return num(row.share, 0) > max ? num(row.share, 0) : max;
            }, 0);

            const rows = players.map(function (row, index2) {
              const share = num(row.share, 0);
              const width = peak > 0 ? Math.max(2, Math.round((share / peak) * 100)) : 2;
              return h(
                'tr',
                { key: row.id },
                h(
                  'td',
                  null,
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 } },
                    h('span', {
                      style: {
                        flex: 'none',
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: ACCENTS[index2 % ACCENTS.length],
                      },
                    }),
                    h(
                      'div',
                      { style: { minWidth: 0 } },
                      h('div', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.name || t('panel.untitled')),
                      row.positioning
                        ? h('div', { className: 'dsh-ia-hint' }, row.positioning)
                        : null,
                    ),
                  ),
                ),
                h(
                  'td',
                  { className: 'dsh-ia-num' },
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' } },
                    h(
                      'div',
                      { style: { flex: 1, minWidth: 40, maxWidth: 90 } },
                      h(
                        'div',
                        { className: 'dsh-ia-bar-track', style: { height: 6 } },
                        h('div', { className: 'dsh-ia-bar-fill', style: { width: width + '%', background: ACCENTS[index2 % ACCENTS.length] } }),
                      ),
                    ),
                    h('span', null, trimNum(share, 1) + '%'),
                  ),
                ),
                h('td', { className: 'dsh-ia-num' }, formatMoney(row.revenue)),
                h('td', null, row.moat || '—'),
                h(
                  'td',
                  null,
                  h(
                    'div',
                    { className: 'dsh-ia-row-tools' },
                    h(
                      'button',
                      {
                        className: 'dsh-ia-icon-btn',
                        type: 'button',
                        'aria-label': t('overview.edit'),
                        title: t('overview.edit'),
                        onClick: function () {
                          setDialog({ kind: 'player', id: row.id, draft: Object.assign({}, row) });
                        },
                      },
                      h(
                        'svg',
                        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
                        h('path', {
                          d: 'M3 12.4l.7-3 6.5-6.5 2.3 2.3-6.5 6.5-3 .7z',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: 1.3,
                          strokeLinejoin: 'round',
                        }),
                      ),
                    ),
                    h(
                      'button',
                      {
                        className: 'dsh-ia-icon-btn is-danger',
                        type: 'button',
                        'aria-label': t('aria.deleteRow'),
                        title: t('aria.deleteRow'),
                        onClick: function () {
                          removePlayer(row.id);
                        },
                      },
                      closeGlyph(12),
                    ),
                  ),
                ),
              );
            });

            return h(
              'div',
              { className: 'dsh-ia-stack' },
              head,
              scores,
              h(
                'div',
                { className: 'dsh-ia-table-wrap' },
                h(
                  'table',
                  { className: 'dsh-ia-table' },
                  h(
                    'thead',
                    null,
                    h(
                      'tr',
                      null,
                      h('th', null, t('landscape.company')),
                      h('th', { className: 'dsh-ia-num' }, t('landscape.share')),
                      h('th', { className: 'dsh-ia-num' }, t('landscape.revenue')),
                      h('th', null, t('landscape.moat')),
                      h('th', { 'aria-label': '' }),
                    ),
                  ),
                  h('tbody', null, rows),
                ),
              ),
            );
          }

          function renderReport(industry) {
            const markdown = industryMarkdown(doc, industry.id, activeLocale);
            const sources = industry.sources;

            const tools = h(
              'div',
              { className: 'dsh-ia-report-tools' },
              h(
                'button',
                { className: 'dsh-ia-action', type: 'button', onClick: copyReport, 'aria-label': t('aria.copyReport') },
                t('report.copy'),
              ),
              h(
                'button',
                { className: 'dsh-ia-action', type: 'button', onClick: exportMarkdown },
                t('report.download'),
              ),
            );

            return h(
              'div',
              { className: 'dsh-ia-stack' },
              h(
                'div',
                { className: 'dsh-ia-card-head', style: { marginBottom: 0 } },
                h('div', { className: 'dsh-ia-card-title' }, t('report.title')),
                h('div', { className: 'dsh-ia-card-hint' }, t('report.hint')),
              ),
              tools,
              h('textarea', {
                className: 'dsh-ia-report',
                ref: reportRef,
                readOnly: true,
                value: markdown,
                'aria-label': t('report.title'),
                spellCheck: false,
              }),
              h(
                'div',
                { className: 'dsh-ia-card' },
                h(
                  'div',
                  { className: 'dsh-ia-card-head' },
                  h('div', { className: 'dsh-ia-card-title' }, t('report.sources')),
                  h('div', { className: 'dsh-ia-card-hint' }, String(sources.length)),
                ),
                sources.length
                  ? h(
                      'ul',
                      { className: 'dsh-ia-sources' },
                      sources.map(function (row) {
                        return h(
                          'li',
                          { className: 'dsh-ia-source', key: row.id },
                          h('span', { className: 'dsh-ia-bullet-dot', style: { background: ACCENTS[1] } }),
                          h(
                            'span',
                            { className: 'dsh-ia-source-title' },
                            isSafeUrl(row.url)
                              ? h('a', { href: row.url, target: '_blank', rel: 'noreferrer noopener' }, row.title || row.url)
                              : row.title || row.url || t('panel.untitled'),
                            row.asOf ? h('span', { className: 'dsh-ia-hint' }, '　' + row.asOf) : null,
                          ),
                        );
                      }),
                    )
                  : h('div', { className: 'dsh-ia-hint' }, t('report.emptySources')),
              ),
            );
          }

          /* ---- dialogs ----------------------------------------------------- */

          function fieldRow(label, node) {
            return h(
              'label',
              { className: 'dsh-ia-field' },
              h('span', { className: 'dsh-ia-field-label' }, label),
              node,
            );
          }

          function textField(label, value, onChange, extra) {
            return fieldRow(
              label,
              h(
                'input',
                Object.assign(
                  {
                    className: 'dsh-ia-input',
                    type: 'text',
                    value: value,
                    onChange: function (event) {
                      onChange(event.target.value);
                    },
                  },
                  extra || {},
                ),
              ),
            );
          }

          function numericField(label, value, onChange, key) {
            return fieldRow(
              label,
              h('input', {
                className: 'dsh-ia-input',
                type: 'text',
                inputMode: 'decimal',
                value: value,
                'data-field': key,
                onChange: function (event) {
                  onChange(event.target.value);
                },
              }),
            );
          }

          function dialogShell(title, body, foot) {
            return h(
              'div',
              {
                className: 'dsh-ia-scrim',
                role: 'presentation',
                onMouseDown: function (event) {
                  if (event.target === event.currentTarget) setDialog(null);
                },
              },
              h(
                'div',
                { className: 'dsh-ia-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
                h(
                  'div',
                  { className: 'dsh-ia-dialog-head' },
                  h('div', { className: 'dsh-ia-dialog-title' }, title),
                  h(
                    'button',
                    {
                      className: 'dsh-ia-icon-btn',
                      type: 'button',
                      'aria-label': t('editor.cancel'),
                      title: t('editor.cancel'),
                      onClick: function () {
                        setDialog(null);
                      },
                    },
                    closeGlyph(13),
                  ),
                ),
                h('div', { className: 'dsh-ia-dialog-body' }, body),
                h('div', { className: 'dsh-ia-dialog-foot' }, foot),
              ),
            );
          }

          function renderOverviewDialog() {
            const draft = dialog.draft && typeof dialog.draft === 'object' ? dialog.draft : {};
            const setField = function (patch) {
              setDialog(Object.assign({}, dialog, { draft: Object.assign({}, draft, patch) }));
            };

            const body = [
              h(
                'div',
                { className: 'dsh-ia-field-row', key: 'r1' },
                numericField(t('editor.size'), draft.size, function (value) {
                  setField({ size: value });
                }, 'size'),
                numericField(t('editor.forecastSize'), draft.forecastSize, function (value) {
                  setField({ forecastSize: value });
                }, 'forecastSize'),
              ),
              h(
                'div',
                { className: 'dsh-ia-field-row', key: 'r2' },
                numericField(t('editor.yoy'), draft.yoy, function (value) {
                  setField({ yoy: value });
                }, 'yoy'),
                numericField(t('editor.cagr'), draft.cagr, function (value) {
                  setField({ cagr: value });
                }, 'cagr'),
              ),
              h(
                'div',
                { className: 'dsh-ia-field-row', key: 'r3' },
                numericField(t('editor.penetration'), draft.penetration, function (value) {
                  setField({ penetration: value });
                }, 'penetration'),
                textField(t('editor.asOf'), draft.asOf, function (value) {
                  setField({ asOf: value });
                }, { 'data-field': 'asOf' }),
              ),
            ];

            const foot = [
              h('button', {
                className: 'dsh-ia-btn dsh-ia-action',
                key: 'save',
                type: 'button',
                onClick: saveOverviewDialog,
              }, t('editor.save')),
              h('button', {
                className: 'dsh-ia-action',
                key: 'cancel',
                type: 'button',
                onClick: function () {
                  setDialog(null);
                },
              }, t('editor.cancel')),
            ];

            return dialogShell(t('editor.overviewTitle'), body, foot);
          }

          function saveOverviewDialog() {
            if (!dialog || dialog.kind !== 'overview') return;
            const draft = dialog.draft || {};
            mutateActive(function (industry) {
              const overview = Object.assign({}, industry.overview);
              const size = parseNum(draft.size);
              if (size !== null) overview.size = size;
              const forecast = parseNum(draft.forecastSize);
              if (forecast !== null) overview.forecastSize = forecast;
              const yoy = parsePercent(draft.yoy);
              if (yoy !== null) overview.yoy = yoy;
              const cagr = parsePercent(draft.cagr);
              if (cagr !== null) overview.cagr = cagr;
              const penetration = parsePercent(draft.penetration);
              if (penetration !== null) overview.penetration = clampRange(penetration, 0, 1);
              if (typeof draft.asOf === 'string') overview.asOf = str(draft.asOf, 24) || overview.asOf;
              return Object.assign({}, industry, { overview: overview });
            });
            setDialog(null);
          }

          function renderChainDialog() {
            const draft = dialog.draft || blankChainRow('mid');
            const setField = function (patch) {
              setDialog(Object.assign({}, dialog, { draft: Object.assign({}, draft, patch) }));
            };

            const stageSelect = fieldRow(
              t('chain.stage'),
              h(
                'select',
                {
                  className: 'dsh-ia-select',
                  value: draft.stage,
                  'data-field': 'stage',
                  onChange: function (event) {
                    setField({ stage: event.target.value });
                  },
                },
                STAGES.map(function (stage) {
                  return h('option', { value: stage, key: stage }, t('stage.' + stage));
                }),
              ),
            );

            const body = [
              stageSelect,
              textField(t('chain.name'), draft.name, function (value) {
                setField({ name: value });
              }, { 'data-field': 'name' }),
              h(
                'div',
                { className: 'dsh-ia-field-row', key: 'r2' },
                numericField(t('chain.share'), draft.share, function (value) {
                  setField({ share: value });
                }, 'share'),
                numericField(t('chain.margin'), draft.margin, function (value) {
                  setField({ margin: value });
                }, 'margin'),
              ),
              textField(t('chain.moat'), draft.moat, function (value) {
                setField({ moat: value });
              }, { 'data-field': 'moat' }),
              textField(t('chain.players'), draft.players, function (value) {
                setField({ players: value });
              }, { 'data-field': 'players' }),
            ];

            const foot = [
              h('button', {
                className: 'dsh-ia-action is-primary',
                key: 'save',
                type: 'button',
                onClick: saveChainDialog,
              }, t('editor.save')),
              h('button', {
                className: 'dsh-ia-action',
                key: 'cancel',
                type: 'button',
                onClick: function () {
                  setDialog(null);
                },
              }, t('editor.cancel')),
            ];

            return dialogShell(t('editor.chainTitle'), body, foot);
          }

          function saveChainDialog() {
            if (!dialog || dialog.kind !== 'chain') return;
            const draft = dialog.draft || blankChainRow('mid');
            const name = str(draft.name, 80);
            if (!name) {
              showToast(t('editor.required'));
              return;
            }
            const row = {
              id: draft.id || uid('ch-'),
              stage: STAGES.indexOf(draft.stage) >= 0 ? draft.stage : 'mid',
              name: name,
              share: clampRange(parseNum(draft.share) === null ? 0 : parseNum(draft.share), 0, 100),
              margin: clampRange(parseNum(draft.margin) === null ? 0 : parseNum(draft.margin), 0, 100),
              moat: str(draft.moat, 120),
              players: str(draft.players, 160),
            };
            upsertChainRow(row);
            setDialog(null);
          }

          function renderPlayerDialog() {
            const draft = dialog.draft || blankPlayer();
            const setField = function (patch) {
              setDialog(Object.assign({}, dialog, { draft: Object.assign({}, draft, patch) }));
            };

            const body = [
              textField(t('landscape.company'), draft.name, function (value) {
                setField({ name: value });
              }, { 'data-field': 'name' }),
              h(
                'div',
                { className: 'dsh-ia-field-row', key: 'r2' },
                numericField(t('landscape.share'), draft.share, function (value) {
                  setField({ share: value });
                }, 'share'),
                numericField(t('landscape.revenue'), draft.revenue, function (value) {
                  setField({ revenue: value });
                }, 'revenue'),
              ),
              textField(t('landscape.moat'), draft.moat, function (value) {
                setField({ moat: value });
              }, { 'data-field': 'moat' }),
              textField(t('landscape.positioning'), draft.positioning, function (value) {
                setField({ positioning: value });
              }, { 'data-field': 'positioning' }),
              textField(t('landscape.note'), draft.note, function (value) {
                setField({ note: value });
              }, { 'data-field': 'note' }),
            ];

            const foot = [
              h('button', {
                className: 'dsh-ia-action is-primary',
                key: 'save',
                type: 'button',
                onClick: savePlayerDialog,
              }, t('editor.save')),
              h('button', {
                className: 'dsh-ia-action',
                key: 'cancel',
                type: 'button',
                onClick: function () {
                  setDialog(null);
                },
              }, t('editor.cancel')),
            ];

            return dialogShell(t('editor.playerTitle'), body, foot);
          }

          function savePlayerDialog() {
            if (!dialog || dialog.kind !== 'player') return;
            const draft = dialog.draft || blankPlayer();
            const name = str(draft.name, 80);
            if (!name) {
              showToast(t('editor.required'));
              return;
            }
            const row = {
              id: draft.id || uid('pl-'),
              name: name,
              share: clampRange(parseNum(draft.share) === null ? 0 : parseNum(draft.share), 0, 100),
              revenue: parseNum(draft.revenue) === null ? 0 : parseNum(draft.revenue),
              moat: str(draft.moat, 160),
              positioning: str(draft.positioning, 120),
              note: str(draft.note, 240),
            };
            upsertPlayer(row);
            setDialog(null);
          }

          function renderDialog() {
            if (!dialog) return null;
            if (dialog.kind === 'overview') return renderOverviewDialog();
            if (dialog.kind === 'chain') return renderChainDialog();
            if (dialog.kind === 'player') return renderPlayerDialog();
            return null;
          }

          /* ---- main render -------------------------------------------------- */

          const found = findIndustry(doc, doc.activeId);
          const industry = found.industry;
          const nameValue = nameDraft === null ? (industry ? industry.name : '') : nameDraft;

          const header = h(
            'div',
            { className: 'dsh-ia-header' },
            h('span', { className: 'dsh-ia-mark' }, panelGlyph(20, false)),
            h(
              'div',
              { className: 'dsh-ia-headings' },
              industry
                ? h('input', {
                    className: 'dsh-ia-name',
                    type: 'text',
                    value: nameValue,
                    placeholder: t('panel.untitled'),
                    'aria-label': t('panel.industryName'),
                    onChange: function (event) {
                      renameIndustry(event.target.value, false);
                    },
                    onBlur: function () {
                      renameIndustry(nameDraft === null ? '' : nameDraft, true);
                    },
                    onKeyDown: function (event) {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        renameIndustry(nameDraft === null ? '' : nameDraft, true);
                      }
                    },
                  })
                : h('div', { className: 'dsh-ia-name', style: { pointerEvents: 'none' } }, t('panel.untitled')),
              h('div', { className: 'dsh-ia-sub' }, t('panel.subtitle')),
            ),
            h(
              'div',
              { className: 'dsh-ia-tools' },
              industry
                ? h(
                    'button',
                    {
                      className: 'dsh-ia-icon-btn is-danger',
                      type: 'button',
                      'aria-label': t('panel.deleteIndustry'),
                      title: t('panel.deleteIndustry'),
                      onClick: deleteIndustry,
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
              h('button', { className: 'dsh-ia-action', type: 'button', onClick: addIndustry }, t('panel.newIndustry')),
              h('button', { className: 'dsh-ia-action', type: 'button', onClick: loadSample }, t('panel.sample')),
              industry
                ? h(
                    'span',
                    { className: 'dsh-ia-menu-wrap', ref: menuRef },
                    h(
                      'button',
                      {
                        className: 'dsh-ia-action',
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
                          { className: 'dsh-ia-menu', role: 'menu' },
                          h(
                            'button',
                            { className: 'dsh-ia-menu-item', type: 'button', role: 'menuitem', onClick: exportMarkdown },
                            t('panel.exportMarkdown'),
                          ),
                          h(
                            'button',
                            { className: 'dsh-ia-menu-item', type: 'button', role: 'menuitem', onClick: exportJson },
                            t('panel.exportJson'),
                          ),
                        )
                      : null,
                  )
                : null,
            ),
          );

          const industries = doc.industries;
          const bar = industries.length
            ? h(
                'div',
                { className: 'dsh-ia-bar', role: 'navigation', 'aria-label': t('aria.tabs') },
                h(
                  'div',
                  { className: 'dsh-ia-tabs' },
                  industries.map(function (entry) {
                    const current = entry.id === doc.activeId;
                    return h(
                      'button',
                      {
                        className: 'dsh-ia-tab' + (current ? ' is-current' : ''),
                        key: entry.id,
                        type: 'button',
                        'aria-selected': current ? 'true' : 'false',
                        title: entry.name || t('panel.untitled'),
                        onClick: function () {
                          selectIndustry(entry.id);
                        },
                      },
                      entry.name || t('panel.untitled'),
                    );
                  }),
                  h(
                    'button',
                    {
                      className: 'dsh-ia-tab-new',
                      type: 'button',
                      'aria-label': t('panel.newIndustry'),
                      title: t('panel.newIndustry'),
                      onClick: addIndustry,
                    },
                    '+',
                  ),
                ),
              )
            : null;

          const sections = industry
            ? h(
                'div',
                { className: 'dsh-ia-sections', role: 'tablist', 'aria-label': t('aria.sections') },
                SECTIONS.map(function (entry) {
                  const current = entry.id === section;
                  return h(
                    'button',
                    {
                      className: 'dsh-ia-section-tab' + (current ? ' is-current' : ''),
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
          if (!industry) {
            body = h(
              'div',
              { className: 'dsh-ia-scroll is-empty', key: 'body' },
              emptySection(
                t('empty.title'),
                t('empty.hint'),
                h(
                  'span',
                  { className: 'dsh-ia-empty-actions' },
                  h('button', { className: 'dsh-ia-action is-primary', type: 'button', onClick: addIndustry }, t('empty.create')),
                  h('button', { className: 'dsh-ia-action', type: 'button', onClick: loadSample }, t('empty.sample')),
                ),
              ),
            );
          } else {
            let content;
            if (section === 'chain') content = renderChain(industry);
            else if (section === 'forces') content = renderForces(industry);
            else if (section === 'landscape') content = renderLandscape(industry);
            else if (section === 'report') content = renderReport(industry);
            else content = renderOverview(industry);
            body = h('div', { className: 'dsh-ia-scroll', key: 'body' }, content);
          }

          const toastView = toast ? h('div', { className: 'dsh-ia-toast', role: 'status' }, toast) : null;

          return h(
            'div',
            { className: 'dsh-ia-root', 'aria-label': t('aria.panel') },
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
              order: 45,
              label: function () {
                return t('panel.title');
              },
            },
            PanelIcon,
          );
        });

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: PANEL_ID }, IndustryAnalysisPanel);
        });
      },

      /* Pure helpers, exposed for the off-line smoke harness. Nothing in the
       * Host or Client runtime reads this; it keeps the metrics testable. */
      chainShareTotal: chainShareTotal,
      weightedMargin: weightedMargin,
      playerShareSum: playerShareSum,
      cr: cr,
      hhi: hhi,
      concentrationKey: concentrationKey,
      historyDelta: historyDelta,
      historyCagr: historyCagr,
      lifecycleStage: lifecycleStage,
      forcesAggregate: forcesAggregate,
      forcesAttractiveness: forcesAttractiveness,
      rankPlayers: rankPlayers,
      industryMarkdown: industryMarkdown,
      formatMoney: formatMoney,
      formatPercent: formatPercent,
      trimNum: trimNum,
      parseNum: parseNum,
      slugOf: slugOf,
      sanitizeDoc: sanitizeDoc,
      defaultDoc: defaultDoc,
      sampleDoc: sampleDoc,

      __pure: {
        chainShareTotal: chainShareTotal,
        weightedMargin: weightedMargin,
        playerShareSum: playerShareSum,
        cr: cr,
        hhi: hhi,
        concentrationKey: concentrationKey,
        historyDelta: historyDelta,
        historyCagr: historyCagr,
        lifecycleStage: lifecycleStage,
        forcesAggregate: forcesAggregate,
        forcesAttractiveness: forcesAttractiveness,
        rankPlayers: rankPlayers,
        industryMarkdown: industryMarkdown,
        formatMoney: formatMoney,
        formatPercent: formatPercent,
        formatPoints: formatPoints,
        trimNum: trimNum,
        parseNum: parseNum,
        parsePercent: parsePercent,
        slugOf: slugOf,
        sanitizeDoc: sanitizeDoc,
        defaultDoc: defaultDoc,
        sampleDoc: sampleDoc,
        findIndustry: findIndustry,
        forcesNormalized: forcesNormalized,
        blankIndustry: blankIndustry,
        blankOverview: blankOverview,
        blankForces: blankForces,
        DICT: DICT,
        STAGES: STAGES,
        FIVE: FIVE,
      },
    };
  },
});
