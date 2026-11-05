/**
 * Client half of the PRD Studio bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `prd-studio`. Documents are browser-owned and persist in localStorage; the
 * Host half registers nothing.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-prd-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'prdStudio';
    const PANEL_ID = 'prd-studio';
    const STORAGE_KEY = 'dsh.prd-studio.docs.v1';
    const TOAST_MS = 2800;

    /* The canonical PRD outline. Order here is the reading order in the panel
     * and the numbering in the exported Markdown. */
    const SECTIONS = [
      { id: 'background' },
      { id: 'objectives' },
      { id: 'users' },
      { id: 'scope' },
      { id: 'requirements' },
      { id: 'experience' },
      { id: 'quality' },
      { id: 'metrics' },
      { id: 'risks' },
      { id: 'milestones' },
      { id: 'open' },
    ];

    const STATUSES = [
      { id: 'draft', tone: 'idle' },
      { id: 'review', tone: 'warn' },
      { id: 'approved', tone: 'success' },
    ];
    const DEFAULT_STATUS = 'draft';

    const CSS = [
      '.dsh-prd-root{display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px)}',
      '.dsh-prd-header{display:flex;flex:none;align-items:center;gap:10px;padding:20px 24px 14px;flex-wrap:wrap}',
      '.dsh-prd-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-prd-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary)}',
      '.dsh-prd-count{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-prd-spacer{flex:1;min-width:8px}',
      '.dsh-prd-btn{display:inline-flex;flex:none;align-items:center;gap:6px;height:30px;padding:0 12px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer;',
      'transition:background .15s ease}',
      '.dsh-prd-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-prd-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-prd-btn[disabled]{opacity:.45;cursor:default}',
      '.dsh-prd-btn[disabled]:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-prd-btn-primary{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);',
      'color:var(--dsw-alias-bg-base);font-weight:600}',
      '.dsh-prd-btn-primary:hover{background:var(--dsw-alias-brand-primary);filter:brightness(1.06)}',
      '.dsh-prd-body{flex:1;display:flex;min-height:0}',
      '.dsh-prd-rail{flex:none;width:250px;box-sizing:border-box;display:flex;flex-direction:column;min-height:0;',
      'border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-prd-rail-head{flex:none;display:flex;align-items:center;gap:8px;padding:12px 14px 8px;',
      'font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-prd-rail-list{flex:1;min-height:0;overflow:auto;padding:0 10px 14px}',
      '.dsh-prd-card{position:relative;margin-bottom:6px}',
      '.dsh-prd-card-main{position:relative;display:flex;flex-direction:column;gap:5px;width:100%;',
      'box-sizing:border-box;text-align:left;padding:9px 11px;border:1px solid transparent;border-radius:9px;',
      'background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;cursor:pointer;',
      'transition:background .14s ease}',
      '.dsh-prd-card-main:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-prd-card-main:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-prd-card-main[aria-current="true"]{background:var(--dsw-alias-bg-layer-2);',
      'border-color:var(--dsw-alias-border-l2)}',
      '.dsh-prd-card-main[aria-current="true"]:before{content:"";position:absolute;left:-1px;top:9px;bottom:9px;',
      'width:3px;border-radius:0 3px 3px 0;background:var(--dsw-alias-brand-primary)}',
      '.dsh-prd-card-name{font-size:13px;font-weight:600;line-height:1.4;overflow:hidden;text-overflow:ellipsis;',
      'white-space:nowrap}',
      '.dsh-prd-card-meta{display:flex;align-items:center;gap:6px;font-size:11px;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-prd-card-time{margin-left:auto;white-space:nowrap;font-size:10.5px}',
      '.dsh-prd-pill{flex:none;padding:1px 6px;border-radius:999px;font-size:10px;line-height:1.6;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.dsh-prd-pill[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}',
      '.dsh-prd-pill[data-tone="success"]{color:var(--dsw-alias-state-success-primary)}',
      '.dsh-prd-pill[data-tone="idle"]{color:var(--dsw-alias-state-idle-primary)}',
      '.dsh-prd-card-del{position:absolute;top:4px;right:4px;display:grid;place-items:center;height:20px;padding:0 6px;',
      'border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);',
      'font-family:inherit;font-size:10.5px;cursor:pointer;opacity:0;transition:opacity .15s ease,background .15s ease}',
      '.dsh-prd-card:hover .dsh-prd-card-del,.dsh-prd-card:focus-within .dsh-prd-card-del{opacity:1}',
      '.dsh-prd-card[aria-current="true"] .dsh-prd-card-del{opacity:1}',
      '.dsh-prd-card-del:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary)}',
      '.dsh-prd-card-del[data-armed="true"]{opacity:1;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-state-error-primary)}',
      '.dsh-prd-card-del:focus-visible{opacity:1;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-prd-editor{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}',
      '.dsh-prd-editor-head{flex:none;padding:16px 24px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-prd-nameline{width:100%;box-sizing:border-box;padding:0;border:0;background:transparent;outline:none;',
      'font-family:inherit;font-size:19px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}',
      '.dsh-prd-nameline::placeholder{color:var(--dsw-alias-label-secondary);font-weight:500}',
      '.dsh-prd-metarow{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:10px}',
      '.dsh-prd-field{display:inline-flex;align-items:center;gap:6px;font-size:12px;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-prd-select,.dsh-prd-owner{height:26px;box-sizing:border-box;padding:0 8px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px}',
      '.dsh-prd-select:focus-visible,.dsh-prd-owner:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);',
      'outline-offset:1px}',
      '.dsh-prd-owner{width:132px}',
      '.dsh-prd-meterwrap{display:flex;align-items:center;gap:8px;margin-left:auto;min-width:150px}',
      '.dsh-prd-meter{flex:1;height:6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.dsh-prd-meter-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);',
      'transition:width .2s ease}',
      '.dsh-prd-meter-text{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-prd-scroll{flex:1;min-height:0;overflow:auto;padding:16px 24px 32px}',
      '.dsh-prd-section{margin-bottom:18px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l1);',
      'border-radius:10px;background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-prd-sec-head{display:flex;align-items:center;gap:9px}',
      '.dsh-prd-sec-no{display:grid;place-items:center;flex:none;width:20px;height:20px;border-radius:6px;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);',
      'font-size:11px;font-variant-numeric:tabular-nums}',
      '.dsh-prd-sec-title{margin:0;font-size:13.5px;font-weight:600;line-height:1.4;',
      'color:var(--dsw-alias-label-primary)}',
      '.dsh-prd-sec-state{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-secondary);',
      'white-space:nowrap}',
      '.dsh-prd-sec-state[data-filled="true"]{color:var(--dsw-alias-state-success-primary)}',
      '.dsh-prd-sec-hint{margin:7px 0 9px;font-size:12px;line-height:1.6;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-prd-textarea{display:block;width:100%;box-sizing:border-box;min-height:96px;padding:9px 11px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:1.6;resize:vertical;',
      'outline:none}',
      '.dsh-prd-textarea::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}',
      '.dsh-prd-textarea:focus-visible{border-color:var(--dsw-alias-brand-primary);',
      'box-shadow:0 0 0 2px var(--dsw-alias-brand-primary)}',
      '.dsh-prd-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;',
      'padding:32px;text-align:center}',
      '.dsh-prd-empty-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dsh-prd-empty-hint{font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary);max-width:380px}',
      '.dsh-prd-toast{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:5;',
      'display:flex;align-items:center;gap:8px;max-width:min(560px,80%);padding:8px 14px;border-radius:9px;',
      'border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);',
      'color:var(--dsw-alias-label-primary);font-size:12.5px}',
      '.dsh-prd-toast-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-brand-primary)}',
      '.dsh-prd-root{position:relative}',
      '@media (max-width:860px){.dsh-prd-body{flex-direction:column}',
      '.dsh-prd-rail{width:auto;max-height:40%;border-right:0;',
      'border-bottom:1px solid var(--dsw-alias-border-l1)}}',
      '@media (prefers-reduced-motion:reduce){.dsh-prd-btn,.dsh-prd-card,.dsh-prd-card-del,.dsh-prd-meter-fill{',
      'transition:none}}',
    ].join('');

    function newId() {
      return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function emptySections() {
      const sections = {};
      for (let i = 0; i < SECTIONS.length; i += 1) sections[SECTIONS[i].id] = '';
      return sections;
    }

    function statusTone(id) {
      for (let i = 0; i < STATUSES.length; i += 1) {
        if (STATUSES[i].id === id) return STATUSES[i].tone;
      }
      return 'idle';
    }

    function isKnownStatus(id) {
      for (let i = 0; i < STATUSES.length; i += 1) {
        if (STATUSES[i].id === id) return true;
      }
      return false;
    }

    function createDoc(title) {
      const now = Date.now();
      return {
        id: newId(),
        title: typeof title === 'string' ? title : '',
        owner: '',
        status: DEFAULT_STATUS,
        sections: emptySections(),
        createdAt: now,
        updatedAt: now,
      };
    }

    /** Keep only well-formed documents so a stale or hand-edited payload cannot break the view. */
    function sanitizeDoc(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const created = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now();
      const sections = emptySections();
      if (raw.sections && typeof raw.sections === 'object') {
        for (let i = 0; i < SECTIONS.length; i += 1) {
          const value = raw.sections[SECTIONS[i].id];
          if (typeof value === 'string') sections[SECTIONS[i].id] = value;
        }
      }
      const status = typeof raw.status === 'string' ? raw.status : DEFAULT_STATUS;
      return {
        id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
        title: typeof raw.title === 'string' ? raw.title : '',
        owner: typeof raw.owner === 'string' ? raw.owner : '',
        status: isKnownStatus(status) ? status : DEFAULT_STATUS,
        sections,
        createdAt: created,
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : created,
      };
    }

    function loadState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { docs: [], selectedId: null };
        const parsed = JSON.parse(raw);
        const docs = [];
        const list = parsed && Array.isArray(parsed.docs) ? parsed.docs : [];
        for (let i = 0; i < list.length; i += 1) {
          const doc = sanitizeDoc(list[i]);
          if (doc) docs.push(doc);
        }
        const selectedId = typeof (parsed && parsed.selectedId) === 'string' ? parsed.selectedId : null;
        return { docs, selectedId };
      } catch (error) {
        return { docs: [], selectedId: null };
      }
    }

    function saveState(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs: state.docs, selectedId: state.selectedId }));
      } catch (error) {
        /* Storage is unavailable; the studio keeps working for this page. */
      }
    }

    function filledCount(doc) {
      let count = 0;
      for (let i = 0; i < SECTIONS.length; i += 1) {
        if ((doc.sections[SECTIONS[i].id] || '').trim()) count += 1;
      }
      return count;
    }

    function progressOf(doc) {
      return Math.round((filledCount(doc) / SECTIONS.length) * 100);
    }

    function totalChars(doc) {
      let total = 0;
      for (let i = 0; i < SECTIONS.length; i += 1) {
        total += (doc.sections[SECTIONS[i].id] || '').length;
      }
      return total;
    }

    function formatTime(timestamp, locale) {
      const date = new Date(timestamp);
      try {
        return date.toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        return date.toLocaleString();
      }
    }

    function displayName(doc, t) {
      const title = (doc.title || '').trim();
      return title || t('doc.untitled');
    }

    /** The panel reads as a document with a folded corner and a compliance tick. */
    function glyph(size, active) {
      const stroke = active ? 1.6 : 1.4;
      const line = { fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinejoin: 'round', strokeLinecap: 'round' };
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', Object.assign({ d: 'M4.2 2.6h7.6l4 4v10.8H4.2z' }, line)),
        h('path', Object.assign({ d: 'M11.8 2.6v4h4' }, line)),
        h('path', { d: 'M7 10.1h6M7 12.9h3.6', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round' }),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return glyph(size, !!(props && props.active));
    }

    function markdownFor(doc, t, locale) {
      const lines = [];
      lines.push('# ' + displayName(doc, t));
      lines.push('');
      const meta = [t('status.' + doc.status)];
      if ((doc.owner || '').trim()) meta.push(t('doc.owner') + ': ' + doc.owner.trim());
      meta.push(t('doc.updated') + ': ' + formatTime(doc.updatedAt, locale));
      lines.push('> ' + meta.join(' · '));
      lines.push('');
      for (let i = 0; i < SECTIONS.length; i += 1) {
        const id = SECTIONS[i].id;
        const body = (doc.sections[id] || '').trim();
        lines.push('## ' + (i + 1) + '. ' + t('section.' + id));
        lines.push('');
        lines.push(body || t('doc.todo'));
        lines.push('');
      }
      return lines.join('\n');
    }

    /** A self-contained brief the user can hand to the assistant; the panel stays model-free. */
    function draftPromptFor(doc, t) {
      const lines = [];
      lines.push(t('prompt.intro'));
      lines.push('');
      lines.push(t('doc.title') + ': ' + displayName(doc, t));
      if ((doc.owner || '').trim()) lines.push(t('doc.owner') + ': ' + doc.owner.trim());
      lines.push('');
      let hasContext = false;
      for (let i = 0; i < SECTIONS.length; i += 1) {
        const id = SECTIONS[i].id;
        const body = (doc.sections[id] || '').trim();
        if (!body) continue;
        hasContext = true;
        lines.push('## ' + t('section.' + id));
        lines.push(body);
        lines.push('');
      }
      lines.push(hasContext ? t('prompt.withContext') : t('prompt.noContext'));
      lines.push('');
      lines.push(t('prompt.outline'));
      for (let i = 0; i < SECTIONS.length; i += 1) {
        lines.push((i + 1) + '. ' + t('section.' + SECTIONS[i].id) + ' — ' + t('hint.' + SECTIONS[i].id));
      }
      return lines.join('\n');
    }

    function copyText(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text);
      }
      return Promise.reject(new Error('clipboard unavailable'));
    }

    function downloadText(filename, text) {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = 'noopener';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function safeFilename(title) {
      const base = (title || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ').slice(0, 60);
      return (base || 'PRD') + '.md';
    }

    const DICT = {
      zh: {
        'panel.title': 'PRD 工作台',
        'panel.unit': '份文档',
        'action.new': '新建 PRD',
        'action.copy': '复制 Markdown',
        'action.export': '导出 .md',
        'action.aiDraft': '复制 AI 提示词',
        'list.heading': '文档',
        'empty.title': '还没有 PRD',
        'empty.hint': '新建一份文档，按引导逐节填写：背景、目标、用户、范围、功能需求、交互、质量、数据、风险、排期与待决问题。',
        'doc.title': '文档标题',
        'doc.titlePlaceholder': '例如：智能客服工作台 2.0',
        'doc.untitled': '未命名 PRD',
        'doc.owner': '负责人',
        'doc.ownerPlaceholder': '姓名',
        'doc.status': '状态',
        'doc.updated': '更新于',
        'doc.unit': '份',
        'doc.chars': '字',
        'doc.complete': '完成度',
        'doc.todo': '_（本节待补充）_',
        'doc.delete': '删除',
        'doc.deleteArm': '确认删除',
        'sec.filled': '已填写',
        'sec.empty': '待填写',
        'status.draft': '草稿',
        'status.review': '评审中',
        'status.approved': '已通过',
        'toast.copied': 'Markdown 已复制到剪贴板',
        'toast.exported': '已导出 {name}',
        'toast.copyFailed': '剪贴板不可用，已改为下载文件',
        'toast.promptCopied': '提示词已复制，粘贴到对话框即可让 AI 起草 PRD',
        'toast.promptFailed': '剪贴板不可用，请手动复制',
        'toast.created': '已新建 PRD',
        'toast.deleted': '已删除该 PRD',
        'section.background': '背景与问题',
        'hint.background': '说明为什么现在要做：现状与痛点、支撑证据（数据／访谈／工单），以及不做会有什么代价。',
        'ph.background': '现状：…\n痛点：…\n证据：…\n不做的代价：…',
        'section.objectives': '目标与成功指标',
        'hint.objectives': '写清业务目标，以及可衡量的成功指标：指标口径、基线值、目标值与达成时间窗。',
        'ph.objectives': '业务目标：…\n北极星指标：…\n辅助指标：从 X 提升到 Y（上线后 N 周）',
        'section.users': '目标用户与场景',
        'hint.users': '谁在使用、在什么场景下使用、他们真正要完成的任务，以及现在的替代做法。',
        'ph.users': '核心用户：…\n典型场景：…\n待完成任务（JTBD）：…\n现有替代方案：…',
        'section.scope': '范围与非目标',
        'hint.scope': '明确本期做什么、明确不做什么，避免范围蔓延；同时写明成立的前提假设。',
        'ph.scope': '本期包含：…\n本期不包含：…\n前提假设：…',
        'section.requirements': '功能需求',
        'hint.requirements': '按优先级列出需求（P0／P1／P2），每条给出用户故事与可验证的验收标准。',
        'ph.requirements': 'P0 作为用户，我希望…，以便…\n验收：…\nP1 …',
        'section.experience': '交互与流程',
        'hint.experience': '关键流程与页面、加载与空态、异常与失败路径，以及需要覆盖的边界情况。',
        'ph.experience': '主流程：…\n空态／加载态：…\n异常与失败：…\n边界情况：…',
        'section.quality': '非功能与质量要求',
        'hint.quality': '性能、稳定性、安全与合规、可访问性、国际化等硬性要求，给出可验收的阈值。',
        'ph.quality': '性能：P95 响应 < …ms\n安全与合规：…\n可访问性：…\n兼容性：…',
        'section.metrics': '数据与埋点',
        'hint.metrics': '需要哪些埋点事件、指标口径如何定义、在哪块看板验证，以及数据何时可用。',
        'ph.metrics': '事件：…\n口径：…\n看板：…\n验证方式：…',
        'section.risks': '风险与依赖',
        'hint.risks': '主要风险及其影响与缓解方案，以及对外部团队、系统或时间窗口的依赖。',
        'ph.risks': '风险：… 影响：… 缓解：…\n依赖：…',
        'section.milestones': '里程碑与排期',
        'hint.milestones': '分阶段计划、关键时间点与负责人，以及上线策略（灰度／AB／回滚方案）。',
        'ph.milestones': '阶段一（时间）：…\n阶段二（时间）：…\n上线策略：…',
        'section.open': '待决问题',
        'hint.open': '尚未定论的决策：问题是什么、需要谁拍板、什么时候必须确定。',
        'ph.open': '问题：… 待定人：… 截止：…',
        'prompt.intro': '请帮我起草一份完整的产品需求文档（PRD）。要求：逐节给出内容，功能需求按 P0／P1／P2 标注优先级并附可验证的验收标准，目标必须可量化；不确定的信息请明确标注为「待确认」，不要编造数据。',
        'prompt.withContext': '以上是我已有的信息，请在此基础上补全并完善整份 PRD。',
        'prompt.noContext': '我还没有填写具体内容。请先向我提出最关键的问题（最多 8 个）来补齐信息，我回答后再输出完整 PRD。',
        'prompt.outline': '请按以下大纲输出：',
      },
      en: {
        'panel.title': 'PRD Studio',
        'panel.unit': 'documents',
        'action.new': 'New PRD',
        'action.copy': 'Copy Markdown',
        'action.export': 'Export .md',
        'action.aiDraft': 'Copy AI brief',
        'list.heading': 'Documents',
        'empty.title': 'No PRDs yet',
        'empty.hint': 'Create a document and fill it in section by section: background, objectives, users, scope, requirements, experience, quality, metrics, risks, milestones, and open questions.',
        'doc.title': 'Title',
        'doc.titlePlaceholder': 'For example: Support Console 2.0',
        'doc.untitled': 'Untitled PRD',
        'doc.owner': 'Owner',
        'doc.ownerPlaceholder': 'Name',
        'doc.status': 'Status',
        'doc.updated': 'Updated',
        'doc.unit': 'documents',
        'doc.chars': 'chars',
        'doc.complete': 'complete',
        'doc.todo': '_(to be written)_',
        'doc.delete': 'Delete',
        'doc.deleteArm': 'Confirm',
        'sec.filled': 'Written',
        'sec.empty': 'Empty',
        'status.draft': 'Draft',
        'status.review': 'In review',
        'status.approved': 'Approved',
        'toast.copied': 'Markdown copied to the clipboard',
        'toast.exported': 'Exported {name}',
        'toast.copyFailed': 'Clipboard unavailable; downloaded the file instead',
        'toast.promptCopied': 'Brief copied. Paste it into the chat to have the assistant draft the PRD.',
        'toast.promptFailed': 'Clipboard unavailable; copy the text manually',
        'toast.created': 'New PRD created',
        'toast.deleted': 'PRD deleted',
        'section.background': 'Background and problem',
        'hint.background': 'Why now: the current situation and its pain, the evidence behind it (data, interviews, tickets), and the cost of doing nothing.',
        'ph.background': 'Current situation: ...\nPain: ...\nEvidence: ...\nCost of doing nothing: ...',
        'section.objectives': 'Objectives and success metrics',
        'hint.objectives': 'State the business objective and measurable success metrics: how each is defined, its baseline, its target, and the window to reach it.',
        'ph.objectives': 'Business objective: ...\nNorth-star metric: ...\nSupporting metric: from X to Y within N weeks',
        'section.users': 'Users and scenarios',
        'hint.users': 'Who uses it, in which situations, the job they are trying to finish, and what they do today instead.',
        'ph.users': 'Primary users: ...\nKey scenarios: ...\nJob to be done: ...\nCurrent alternative: ...',
        'section.scope': 'Scope and non-goals',
        'hint.scope': 'Say what is in this release and, just as clearly, what is not, so scope cannot creep. Note the assumptions you depend on.',
        'ph.scope': 'In scope: ...\nOut of scope: ...\nAssumptions: ...',
        'section.requirements': 'Functional requirements',
        'hint.requirements': 'List requirements by priority (P0, P1, P2), each with a user story and verifiable acceptance criteria.',
        'ph.requirements': 'P0 As a user, I want ... so that ...\nAcceptance: ...\nP1 ...',
        'section.experience': 'Experience and flows',
        'hint.experience': 'The key flows and screens, loading and empty states, error and failure paths, and the edge cases to cover.',
        'ph.experience': 'Main flow: ...\nEmpty and loading states: ...\nErrors and failure: ...\nEdge cases: ...',
        'section.quality': 'Quality and non-functional requirements',
        'hint.quality': 'Hard requirements across performance, reliability, security and compliance, accessibility, and localization, each with a threshold that can be verified.',
        'ph.quality': 'Performance: P95 response under ... ms\nSecurity and compliance: ...\nAccessibility: ...\nCompatibility: ...',
        'section.metrics': 'Data and instrumentation',
        'hint.metrics': 'Which events to instrument, how each metric is defined, where it is verified, and when the data becomes available.',
        'ph.metrics': 'Events: ...\nDefinitions: ...\nDashboard: ...\nHow to verify: ...',
        'section.risks': 'Risks and dependencies',
        'hint.risks': 'The main risks with their impact and mitigation, plus dependencies on other teams, systems, or time windows.',
        'ph.risks': 'Risk: ... Impact: ... Mitigation: ...\nDependency: ...',
        'section.milestones': 'Milestones and rollout',
        'hint.milestones': 'The phased plan with key dates and owners, and the rollout strategy: staged release, experiment, or rollback plan.',
        'ph.milestones': 'Phase 1 (date): ...\nPhase 2 (date): ...\nRollout: ...',
        'section.open': 'Open questions',
        'hint.open': 'Decisions still unmade: what the question is, who decides, and by when it must be settled.',
        'ph.open': 'Question: ... Decider: ... Due: ...',
        'prompt.intro': 'Draft a complete product requirements document (PRD) for me. Write every section, mark each functional requirement P0, P1, or P2 with verifiable acceptance criteria, and make every objective measurable. Mark anything uncertain as "to confirm" rather than inventing data.',
        'prompt.withContext': 'That is the information I already have. Complete and sharpen the full PRD on top of it.',
        'prompt.noContext': 'I have not filled anything in yet. Ask me the most important questions first (at most 8) to gather the missing information, then produce the full PRD after I answer.',
        'prompt.outline': 'Use this outline:',
      },
    };

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'prd-studio: dictionaries');

        const t = ctx.locale.bind(NS);

        function PrdStudioPanel() {
          const activeLocale = ctx.locale.getLocale().active;
          const [state, setState] = React.useState(loadState);
          const [toast, setToast] = React.useState(null);
          const [armedDelete, setArmedDelete] = React.useState(null);
          const toastTimer = React.useRef(null);
          const armTimer = React.useRef(null);

          const docs = state.docs;
          const current = docs.find((doc) => doc.id === state.selectedId) || docs[0] || null;

          React.useEffect(() => {
            saveState(state);
          }, [state]);

          React.useEffect(
            () => () => {
              if (toastTimer.current) window.clearTimeout(toastTimer.current);
              if (armTimer.current) window.clearTimeout(armTimer.current);
            },
            [],
          );

          function flash(message) {
            setToast(message);
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
            toastTimer.current = window.setTimeout(() => {
              toastTimer.current = null;
              setToast(null);
            }, TOAST_MS);
          }

          function flashTemplate(key, values) {
            let message = t(key);
            if (values) {
              Object.keys(values).forEach((name) => {
                message = message.split('{' + name + '}').join(values[name]);
              });
            }
            flash(message);
          }

          function addDoc() {
            const doc = createDoc('');
            setState((previous) => ({ docs: [doc].concat(previous.docs), selectedId: doc.id }));
            setArmedDelete(null);
            flash(t('toast.created'));
          }

          function selectDoc(id) {
            setArmedDelete(null);
            setState((previous) => ({ docs: previous.docs, selectedId: id }));
          }

          function updateCurrent(patch) {
            if (!current) return;
            const now = Date.now();
            setState((previous) => ({
              selectedId: previous.selectedId,
              docs: previous.docs.map((doc) =>
                doc.id === current.id ? Object.assign({}, doc, patch, { updatedAt: now }) : doc,
              ),
            }));
          }

          function updateSection(sectionId, text) {
            if (!current) return;
            const now = Date.now();
            setState((previous) => ({
              selectedId: previous.selectedId,
              docs: previous.docs.map((doc) => {
                if (doc.id !== current.id) return doc;
                const sections = Object.assign({}, doc.sections, { [sectionId]: text });
                return Object.assign({}, doc, { sections, updatedAt: now });
              }),
            }));
          }

          function removeDoc(id) {
            setArmedDelete(null);
            setState((previous) => {
              const next = previous.docs.filter((doc) => doc.id !== id);
              const selectedId = previous.selectedId === id ? (next.length ? next[0].id : null) : previous.selectedId;
              return { docs: next, selectedId };
            });
            flash(t('toast.deleted'));
          }

          function armDelete(id) {
            setArmedDelete(id);
            if (armTimer.current) window.clearTimeout(armTimer.current);
            armTimer.current = window.setTimeout(() => {
              armTimer.current = null;
              setArmedDelete(null);
            }, TOAST_MS);
          }

          function copyMarkdown() {
            if (!current) return;
            const text = markdownFor(current, t, activeLocale);
            copyText(text).then(
              () => flash(t('toast.copied')),
              () => {
                downloadText(safeFilename(current.title), text);
                flash(t('toast.copyFailed'));
              },
            );
          }

          function exportMarkdown() {
            if (!current) return;
            const name = safeFilename(current.title);
            downloadText(name, markdownFor(current, t, activeLocale));
            flashTemplate('toast.exported', { name });
          }

          function copyPrompt() {
            if (!current) return;
            copyText(draftPromptFor(current, t)).then(
              () => flash(t('toast.promptCopied')),
              () => flash(t('toast.promptFailed')),
            );
          }

          function renderCard(doc) {
            const percent = progressOf(doc);
            const armed = armedDelete === doc.id;
            return h(
              'div',
              { key: doc.id, className: 'dsh-prd-card' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-prd-card-main',
                  'aria-current': current && current.id === doc.id ? 'true' : 'false',
                  onClick: () => selectDoc(doc.id),
                },
                h('span', { className: 'dsh-prd-card-name' }, displayName(doc, t)),
                h(
                  'span',
                  { className: 'dsh-prd-card-meta' },
                  h('span', { className: 'dsh-prd-pill', 'data-tone': statusTone(doc.status) }, t('status.' + doc.status)),
                  h('span', null, percent + '%'),
                  h('span', { className: 'dsh-prd-card-time' }, formatTime(doc.updatedAt, activeLocale)),
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-prd-card-del',
                  'data-armed': armed ? 'true' : 'false',
                  title: armed ? t('doc.deleteArm') : t('doc.delete'),
                  'aria-label': (armed ? t('doc.deleteArm') : t('doc.delete')) + ': ' + displayName(doc, t),
                  onClick: () => {
                    if (armed) removeDoc(doc.id);
                    else armDelete(doc.id);
                  },
                },
                armed ? t('doc.deleteArm') : '×',
              ),
            );
          }

          function renderSection(section, index) {
            const value = current.sections[section.id] || '';
            const filled = value.trim().length > 0;
            return h(
              'section',
              { key: section.id, className: 'dsh-prd-section' },
              h(
                'div',
                { className: 'dsh-prd-sec-head' },
                h('span', { className: 'dsh-prd-sec-no', 'aria-hidden': 'true' }, String(index + 1)),
                h('h2', { className: 'dsh-prd-sec-title' }, t('section.' + section.id)),
                h('span', { className: 'dsh-prd-sec-state', 'data-filled': filled ? 'true' : 'false' },
                  filled ? t('sec.filled') : t('sec.empty')),
              ),
              h('p', { className: 'dsh-prd-sec-hint' }, t('hint.' + section.id)),
              h('textarea', {
                className: 'dsh-prd-textarea',
                value,
                placeholder: t('ph.' + section.id),
                'aria-label': t('section.' + section.id),
                spellCheck: 'false',
                onChange: (event) => updateSection(section.id, event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Escape') event.currentTarget.blur();
                },
              }),
            );
          }

          const rail = h(
            'aside',
            { className: 'dsh-prd-rail', key: 'rail' },
            h('div', { className: 'dsh-prd-rail-head' }, t('list.heading')),
            h('div', { className: 'dsh-prd-rail-list' }, docs.map(renderCard)),
          );

          const editor = !current
            ? h(
                'div',
                { className: 'dsh-prd-editor', key: 'editor' },
                h(
                  'div',
                  { className: 'dsh-prd-empty' },
                  h('span', { className: 'dsh-prd-mark', 'aria-hidden': 'true' }, glyph(40, true)),
                  h('div', { className: 'dsh-prd-empty-title' }, t('empty.title')),
                  h('div', { className: 'dsh-prd-empty-hint' }, t('empty.hint')),
                  h('button', { type: 'button', className: 'dsh-prd-btn dsh-prd-btn-primary', onClick: addDoc }, t('action.new')),
                ),
              )
            : (() => {
                const percent = progressOf(current);
                return h(
                  'section',
                  { className: 'dsh-prd-editor', key: 'editor' },
                  h(
                    'div',
                    { className: 'dsh-prd-editor-head' },
                    h('input', {
                      className: 'dsh-prd-nameline',
                      value: current.title,
                      placeholder: t('doc.titlePlaceholder'),
                      'aria-label': t('doc.title'),
                      onChange: (event) => updateCurrent({ title: event.target.value }),
                    }),
                    h(
                      'div',
                      { className: 'dsh-prd-metarow' },
                      h(
                        'label',
                        { className: 'dsh-prd-field' },
                        t('doc.status'),
                        h(
                          'select',
                          {
                            className: 'dsh-prd-select',
                            value: current.status,
                            'aria-label': t('doc.status'),
                            onChange: (event) => updateCurrent({ status: event.target.value }),
                          },
                          STATUSES.map((status) => h('option', { key: status.id, value: status.id }, t('status.' + status.id))),
                        ),
                      ),
                      h(
                        'label',
                        { className: 'dsh-prd-field' },
                        t('doc.owner'),
                        h('input', {
                          className: 'dsh-prd-owner',
                          value: current.owner,
                          placeholder: t('doc.ownerPlaceholder'),
                          'aria-label': t('doc.owner'),
                          onChange: (event) => updateCurrent({ owner: event.target.value }),
                        }),
                      ),
                      h('span', { className: 'dsh-prd-field' },
                        t('doc.updated') + ' ' + formatTime(current.updatedAt, activeLocale)),
                      h('span', { className: 'dsh-prd-field' }, totalChars(current) + ' ' + t('doc.chars')),
                      h(
                        'div',
                        { className: 'dsh-prd-meterwrap' },
                        h(
                          'div',
                          {
                            className: 'dsh-prd-meter',
                            role: 'progressbar',
                            'aria-valuenow': percent,
                            'aria-valuemin': 0,
                            'aria-valuemax': 100,
                            'aria-label': t('doc.complete'),
                          },
                          h('div', { className: 'dsh-prd-meter-fill', style: { width: percent + '%' } }),
                        ),
                        h('span', { className: 'dsh-prd-meter-text' }, percent + '% ' + t('doc.complete')),
                      ),
                    ),
                  ),
                  h('div', { className: 'dsh-prd-scroll' }, SECTIONS.map(renderSection)),
                );
              })();

          const hasDocs = docs.length > 0;

          return h(
            'div',
            { className: 'dsh-prd-root' },
            h('style', { key: 'styles' }, CSS),
            h(
              'header',
              { className: 'dsh-prd-header', key: 'header' },
              h('span', { className: 'dsh-prd-mark', 'aria-hidden': 'true' }, glyph(18, true)),
              h('h1', { className: 'dsh-prd-title' }, t('panel.title')),
              h('span', { className: 'dsh-prd-count' }, docs.length + ' ' + t('panel.unit')),
              h('span', { className: 'dsh-prd-spacer' }),
              h('button', { type: 'button', className: 'dsh-prd-btn', disabled: !hasDocs, onClick: copyPrompt }, t('action.aiDraft')),
              h('button', { type: 'button', className: 'dsh-prd-btn', disabled: !hasDocs, onClick: copyMarkdown }, t('action.copy')),
              h('button', { type: 'button', className: 'dsh-prd-btn', disabled: !hasDocs, onClick: exportMarkdown }, t('action.export')),
              h('button', { type: 'button', className: 'dsh-prd-btn dsh-prd-btn-primary', onClick: addDoc }, t('action.new')),
            ),
            h('div', { className: 'dsh-prd-body', key: 'body' }, hasDocs ? rail : null, editor),
            toast
              ? h(
                  'div',
                  { className: 'dsh-prd-toast', key: 'toast', role: 'status', 'aria-live': 'polite' },
                  h('span', { className: 'dsh-prd-toast-dot', 'aria-hidden': 'true' }),
                  toast,
                )
              : null,
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
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, PrdStudioPanel),
        );
      },
    };
  },
});